import { create } from "zustand";
import { STORAGE_FAVORITE_DATA } from "../core/constants/config";
import { batchDeleteData, batchSaveData, deleteData, getDatabase, loadData, saveData } from "./persistent";

import GenericTable from "../core/utils/GenericTable";
import { removeArcaconIfUnreferenced } from "./arcaconRelations";

const favoriteIDBTable = getDatabase(STORAGE_FAVORITE_DATA);
const favoriteTable = new GenericTable("id", ["id", "order"]);

let isFavoriteStoreLoaded = false;

function getOrderedFavoriteItems() {
  return favoriteTable
    .getAll()
    .sort((left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER));
}

function syncFavoriteState() {
  if (isFavoriteStoreLoaded) {
    useFavoriteStore.setState({ favorites: getOrderedFavoriteItems() });
  }
}

function normalizeFavoriteOrder(items) {
  return items.map((item, index) => ({ id: item.id?.toString(), order: index })).filter((item) => item.id);
}

async function saveFavoriteOrder(items) {
  const normalizedItems = normalizeFavoriteOrder(items);

  favoriteTable.clear();
  normalizedItems.forEach((item) => {
    favoriteTable.insert(item);
  });

  await batchSaveData(favoriteIDBTable, normalizedItems);
  syncFavoriteState();
}

export async function removeFavoriteItems(ids) {
  const normalizedIds = ids.map((id) => id?.toString()).filter(Boolean);
  if (normalizedIds.length === 0) return;

  const remainingItems = getOrderedFavoriteItems().filter((item) => !normalizedIds.includes(item.id));

  await batchDeleteData(favoriteIDBTable, normalizedIds);
  await saveFavoriteOrder(remainingItems);
}

const useFavoriteStore = create((set) => {
  async function loadFavoriteItems() {
    const data = (await loadData(favoriteIDBTable)) || [];
    const normalizedItems = data
      .map((item, index) => ({
        id: item.id?.toString(),
        order: Number.isFinite(item.order) ? item.order : index,
      }))
      .filter((item) => item.id)
      .sort((left, right) => left.order - right.order)
      .map((item, index) => ({ ...item, order: index }));

    favoriteTable.clear();
    normalizedItems.forEach((item) => {
      favoriteTable.insert(item);
    });

    set({ favorites: normalizedItems });
    isFavoriteStoreLoaded = true;

    if (
      normalizedItems.length !== data.length ||
      normalizedItems.some(
        (item, index) => item.order !== data[index]?.order || item.id !== data[index]?.id?.toString(),
      )
    ) {
      await batchSaveData(favoriteIDBTable, normalizedItems);
    }

    console.log("[ArcaconPickerPlus] Loaded favorite items: ", normalizedItems.length, "items loaded.");
  }

  async function addFavoriteItem(id) {
    const normalizedId = id?.toString();
    if (!normalizedId || favoriteTable.get(normalizedId)) return;

    const orderedItems = getOrderedFavoriteItems();
    const nextOrder = orderedItems.length;
    const favoriteItem = { id: normalizedId, order: nextOrder };

    favoriteTable.insert(favoriteItem);
    await saveData(favoriteIDBTable, favoriteItem);
    set({ favorites: getOrderedFavoriteItems() });

    console.log("[ArcaconPickerPlus] Added favorite: ", normalizedId);
  }

  async function removeFavoriteItem(id) {
    const normalizedId = id?.toString();
    if (!normalizedId) return;

    await deleteData(favoriteIDBTable, normalizedId);
    await saveFavoriteOrder(getOrderedFavoriteItems().filter((item) => item.id !== normalizedId));
    set({ favorites: getOrderedFavoriteItems() });
    await removeArcaconIfUnreferenced(normalizedId);

    console.log("[ArcaconPickerPlus] Removed favorite: ", normalizedId);
  }

  async function reorderFavoriteItems(sourceId, targetId) {
    const normalizedSourceId = sourceId?.toString();
    const normalizedTargetId = targetId?.toString();
    if (!normalizedSourceId || !normalizedTargetId || normalizedSourceId === normalizedTargetId) return;

    const orderedItems = getOrderedFavoriteItems();
    const sourceIndex = orderedItems.findIndex((item) => item.id === normalizedSourceId);
    const targetIndex = orderedItems.findIndex((item) => item.id === normalizedTargetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const nextItems = [...orderedItems];
    const [movedItem] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(targetIndex, 0, movedItem);

    await saveFavoriteOrder(nextItems);

    console.log("[ArcaconPickerPlus] Reordered favorite: ", normalizedSourceId, "->", normalizedTargetId);
  }

  return {
    favorites: [],
    loadFavoriteItems,
    addFavoriteItem,
    removeFavoriteItem,
    reorderFavoriteItems,
    isFavorite: (id) => favoriteTable.get(id) !== null,
  };
});

export default useFavoriteStore;
