import { create } from "zustand";
import { STORAGE_ARCACON_DATA } from "../core/constants/config";
import { getDatabase, loadData, deleteData, batchSaveData, batchDeleteData } from "./persistent";
import { removeFavoriteItems } from "./favorite";
import { removeMemoItems } from "./memo";

import { GenericTable, getEmoticonId } from "../core/utils";

const arcaconIDBTable = getDatabase(STORAGE_ARCACON_DATA);

const useArcaconStore = create(() => {
  const arcaconPernamentTable = new GenericTable("id", ["id", "emoticonid", "imageUrl", "type", "poster", "orig"]);
  const arcaconTemporaryTable = new GenericTable("id", ["id", "emoticonid", "imageUrl", "type", "poster", "orig"]);

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
  }

  async function deleteArcaconItems(ids) {
    const normalizedIds = ids.map((id) => id?.toString()).filter(Boolean);
    if (normalizedIds.length === 0) return;

    await Promise.all([removeFavoriteItems(normalizedIds), removeMemoItems(normalizedIds)]);
    removeArcaconItemsFromMemory(normalizedIds);
    await batchDeleteData(arcaconIDBTable, normalizedIds);
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

  async function loadArcaconItems() {
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

    await Promise.all(
      Array.from(expiredEmoticonIds).map((emoticonid) => {
        if (emoticonid <= 0) return;
        return fetch(`/api/emoticon2/${emoticonid}`)
          .then((response) => response.json())
          .then((emoticonData) => {
            return refreshArcaconItemsByEmoticonData(emoticonid, emoticonData);
          })
          .catch((error) => {
            console.error("[ArcaconPickerPlus] Failed to refresh arcacon item: ", emoticonid, error);
          });
      }),
    );

    console.log("[ArcaconPickerPlus] Loaded arcacon items: ", data.length, "items loaded.");
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
    loadArcaconItems,
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
