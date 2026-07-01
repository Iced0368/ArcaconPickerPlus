import { create } from "zustand";
import { ARCACON_INTERNAL_REFRESH_REQUEST_FLAG, STORAGE_ARCACON_DATA } from "../core/constants/config";
import { getDatabase, loadData, deleteData, batchSaveData, batchDeleteData } from "./persistent";
import { removeFavoriteItems } from "./favorite";
import { removeMemoItems } from "./memo";

import { GenericTable, getEmoticonId } from "../core/utils";

const arcaconIDBTable = getDatabase(STORAGE_ARCACON_DATA);
const EXPIRED_ITEM_REFRESH_INTERVAL_MS = 300;
const BROKEN_ITEM_REFRESH_COOLDOWN_MS = 5000;

const useArcaconStore = create((set, get) => {
  const arcaconPernamentTable = new GenericTable("id", ["id", "emoticonid", "imageUrl", "type", "poster", "orig"]);
  const arcaconTemporaryTable = new GenericTable("id", ["id", "emoticonid", "imageUrl", "type", "poster", "orig"]);
  const refreshInFlightByEmoticonId = new Map();
  const refreshRequestedAtByEmoticonId = new Map();

  function notifyArcaconItemsChanged() {
    set((state) => ({ revision: state.revision + 1 }));
  }

  function normalizeArcaconItem({ id, emoticonid, imageUrl, type, poster, orig }) {
    return {
      id: id?.toString(),
      emoticonid: emoticonid?.toString(),
      imageUrl,
      type,
      poster,
      orig,
    };
  }

  function syncArcaconItemToMemory(item, permanent = false) {
    if (permanent) {
      arcaconPernamentTable.insert(item);
      if (arcaconTemporaryTable.has(item.id)) {
        arcaconTemporaryTable.insert(item);
      }
      return;
    }

    arcaconTemporaryTable.insert(item);
  }

  function removeArcaconItemsFromMemory(ids) {
    ids.forEach((id) => {
      arcaconPernamentTable.delete(id);
      arcaconTemporaryTable.delete(id);
    });
  }

  async function setArcaconItems(items, permanent = false) {
    const normalizedItems = items.map(normalizeArcaconItem).filter((item) => item.id);
    if (normalizedItems.length === 0) return;

    if (!permanent) {
      normalizedItems.forEach((item) => syncArcaconItemToMemory(item, false));
      notifyArcaconItemsChanged();
      return;
    }

    const resolvedItems = await Promise.all(
      normalizedItems.map(async (item) => {
        if (item.emoticonid <= 0) {
          return {
            ...item,
            emoticonid: (await getEmoticonId(item.id))?.toString(),
          };
        }
        return item;
      }),
    );

    resolvedItems.forEach((item) => syncArcaconItemToMemory(item, true));
    await batchSaveData(arcaconIDBTable, resolvedItems);
    notifyArcaconItemsChanged();
  }

  async function deleteArcaconItems(ids) {
    const normalizedIds = ids.map((id) => id?.toString()).filter(Boolean);
    if (normalizedIds.length === 0) return;

    await Promise.all([removeFavoriteItems(normalizedIds), removeMemoItems(normalizedIds)]);
    removeArcaconItemsFromMemory(normalizedIds);
    await batchDeleteData(arcaconIDBTable, normalizedIds);
    notifyArcaconItemsChanged();
  }

  async function refreshArcaconItemsByEmoticonId(emoticonid, { force = false } = {}) {
    const normalizedEmoticonId = emoticonid?.toString();
    if (!normalizedEmoticonId || Number(normalizedEmoticonId) <= 0) return;

    if (refreshInFlightByEmoticonId.has(normalizedEmoticonId)) {
      return refreshInFlightByEmoticonId.get(normalizedEmoticonId);
    }

    const lastRequestedAt = refreshRequestedAtByEmoticonId.get(normalizedEmoticonId) || 0;
    const nowMs = Date.now();

    if (!force && nowMs - lastRequestedAt < BROKEN_ITEM_REFRESH_COOLDOWN_MS) {
      return;
    }

    refreshRequestedAtByEmoticonId.set(normalizedEmoticonId, nowMs);

    const refreshTask = (async () => {
      try {
        const response = await fetch(`/api/emoticon2/${normalizedEmoticonId}`, {
          [ARCACON_INTERNAL_REFRESH_REQUEST_FLAG]: true,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const responseData = await response.clone().json();
        await refreshArcaconItemsByEmoticonData(normalizedEmoticonId, responseData);
      } catch (error) {
        console.error("[ArcaconPickerPlus] Failed to refresh arcacon item: ", normalizedEmoticonId, error);
      } finally {
        refreshInFlightByEmoticonId.delete(normalizedEmoticonId);
      }
    })();

    refreshInFlightByEmoticonId.set(normalizedEmoticonId, refreshTask);
    return refreshTask;
  }

  async function refreshArcaconItemsByEmoticonData(emoticonid, arcaconItems) {
    if (Number(emoticonid) <= 0) return;
    if (!Array.isArray(arcaconItems) || arcaconItems.length === 0) return;

    const requestedEmoticonId = emoticonid?.toString();
    const apiItemIds = arcaconItems.map((item) => item?.id?.toString()).filter(Boolean);
    if (apiItemIds.length === 0) return;

    const currentPackageItems = (await loadData(arcaconIDBTable)).filter(
      (item) => item?.emoticonid?.toString() === requestedEmoticonId,
    );
    const removedItemIds = currentPackageItems
      .map((item) => item.id?.toString())
      .filter((id) => id && !apiItemIds.includes(id));

    if (removedItemIds.length > 0) {
      await deleteArcaconItems(removedItemIds);
    }

    const existingItems = await arcaconIDBTable.bulkGet(apiItemIds);
    const itemsToRefresh = arcaconItems.reduce((acc, arcacon, index) => {
      const existingItem = existingItems[index];
      if (!existingItem) return acc;

      acc.push({
        ...existingItem,
        ...arcacon,
        id: arcacon.id.toString(),
        emoticonid: requestedEmoticonId,
      });
      return acc;
    }, []);

    if (itemsToRefresh.length === 0) return;

    await setArcaconItems(itemsToRefresh, true);

    console.log(
      "[ArcaconPickerPlus] Refreshed arcacon items from emoticon API: ",
      itemsToRefresh.length,
      "updated,",
      removedItemIds.length,
      "removed.",
    );
  }

  async function cleanupInvalidData() {
    const allData = await loadData(arcaconIDBTable);

    const invalidItems = allData.filter(
      (item) => !item.id || typeof item.id !== "string" || typeof item.emoticonid !== "string",
    );
    if (invalidItems.length === 0) return;

    // 기존 키(정수 등)로 삭제
    await batchDeleteData(
      arcaconIDBTable,
      invalidItems.map((item) => item.id),
    );

    // string으로 정규화 후 재저장 (id가 없는 항목은 버림)
    const toResave = invalidItems
      .map((item) => ({
        ...item,
        id: item.id?.toString(),
        emoticonid: item.emoticonid?.toString(),
      }))
      .filter((item) => item.id);

    if (toResave.length > 0) {
      await batchSaveData(arcaconIDBTable, toResave);
    }

    console.log("[ArcaconPickerPlus] Cleaned up invalid data: ", invalidItems.length, "items normalized.");
  }

  async function loadArcaconItems() {
    await cleanupInvalidData();

    let data = (await loadData(arcaconIDBTable)) || [];

    arcaconPernamentTable.load(data);

    // 만료된 아카콘 아이템을 확인하고 갱신 요청
    // expires 파라미터 추출용 정규식
    const expiresRegex = /[?&]expires=(\d+)/;
    const now = Math.floor(Date.now() / 1000);
    const expiredEmoticonIds = new Set();

    data.forEach((item) => {
      const urls = [item.imageUrl, item.orig, item.poster];
      for (const url of urls) {
        if (typeof url === "string") {
          const match = url.match(expiresRegex);
          if (match) {
            const expires = parseInt(match[1], 10);
            if (expires < now) {
              if (item.emoticonid) expiredEmoticonIds.add(item.emoticonid);
              break; // 하나라도 만료면 체크
            }
          }
        }
      }
    });

    console.log("[ArcaconPickerPlus] Found expired arcacon items: ", expiredEmoticonIds.size, "items need refresh.");

    const expiredEmoticonIdList = Array.from(expiredEmoticonIds).filter((emoticonid) => emoticonid > 0);

    for (const [index, emoticonid] of expiredEmoticonIdList.entries()) {
      await refreshArcaconItemsByEmoticonId(emoticonid, { force: true });

      if (index < expiredEmoticonIdList.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, EXPIRED_ITEM_REFRESH_INTERVAL_MS));
      }
    }

    console.log("[ArcaconPickerPlus] Loaded arcacon items: ", data.length, "items loaded.");
    notifyArcaconItemsChanged();
  }

  async function setArcaconItem({ id, emoticonid, imageUrl, type, poster, orig }, permanent = false) {
    await setArcaconItems([{ id, emoticonid, imageUrl, type, poster, orig }], permanent);
  }

  function deleteArcaconItem(id) {
    deleteArcaconItems([id]);
  }

  async function setPermanent(id) {
    const item = arcaconTemporaryTable.get(id);
    if (item) {
      console.log("[ArcaconPickerPlus] Setting arcacon item as permanent: ", id);
      setArcaconItem(item, true);
    }
  }

  const getArcaconById = (id, permanentOnly = false) => {
    return permanentOnly
      ? arcaconPernamentTable.get(id)
      : arcaconPernamentTable.get(id) || arcaconTemporaryTable.get(id);
  };

  const getArcaconItemsByIds = (ids, permanentOnly = false) => {
    return ids.map((id) => getArcaconById(id, permanentOnly)).filter(Boolean);
  };

  return {
    revision: 0,
    loadArcaconItems,
    refreshArcaconItemsByEmoticonId,
    refreshArcaconItemsByEmoticonData,
    getArcaconById,
    getArcaconItemsByIds,
    setArcaconItem,
    setArcaconItems,
    deleteArcaconItems,
    setPermanent,
  };
});

export default useArcaconStore;
