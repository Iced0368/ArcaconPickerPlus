import { create } from "zustand";
import { STORAGE_MEMO_DATA } from "../core/constants/config";
import { batchDeleteData, getDatabase } from "./persistent";
import { loadTableItems, upsertTableItem, removeTableItem } from "./tablePersistence";

import GenericTable from "../core/utils/GenericTable";
import { removeArcaconIfUnreferenced } from "./arcaconRelations";

const memoIDBTable = getDatabase(STORAGE_MEMO_DATA);
const memoTable = new GenericTable("id", ["id", "text"]);

let isMemoStoreLoaded = false;

export async function removeMemoItems(ids) {
  const normalizedIds = ids.map((id) => id?.toString()).filter(Boolean);
  if (normalizedIds.length === 0) return;

  normalizedIds.forEach((id) => {
    memoTable.delete(id);
  });
  await batchDeleteData(memoIDBTable, normalizedIds);

  if (isMemoStoreLoaded) {
    useMemoStore.setState({ memoItems: memoTable.getAll() });
  }
}

const useMemoStore = create((set) => {
  async function loadMemoItems() {
    await loadTableItems({
      dbTable: memoIDBTable,
      table: memoTable,
      set,
      stateKey: "memoItems",
      logLabel: "memo items",
    });
    isMemoStoreLoaded = true;
  }

  function setMemoItem(id, text) {
    upsertTableItem({
      dbTable: memoIDBTable,
      table: memoTable,
      item: { id, text },
      set,
      stateKey: "memoItems",
    });
  }

  function deleteMemoItem(id) {
    removeTableItem({
      dbTable: memoIDBTable,
      table: memoTable,
      id,
      set,
      stateKey: "memoItems",
      afterDelete: removeArcaconIfUnreferenced,
    });
  }

  return {
    memoItems: [],
    loadMemoItems,
    setMemoItem,
    deleteMemoItem,
    getMemoById: (id) => memoTable.get(id),
  };
});

export default useMemoStore;
