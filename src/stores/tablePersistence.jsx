import { deleteData, loadData, saveData } from "./persistent";

export async function loadTableItems({ dbTable, table, set, stateKey, logLabel }) {
  const data = (await loadData(dbTable)) || [];
  table.load(data);
  set({ [stateKey]: table.getAll() });

  if (logLabel) {
    console.log(`[ArcaconPickerPlus] Loaded ${logLabel}: `, data.length, "items loaded.");
  }
}

export function upsertTableItem({ dbTable, table, item, set, stateKey, logLabel }) {
  table.insert(item);
  saveData(dbTable, item);
  set({ [stateKey]: table.getAll() });

  if (logLabel) {
    console.log(`[ArcaconPickerPlus] ${logLabel}: `, item.id);
  }
}

export function removeTableItem({ dbTable, table, id, set, stateKey, afterDelete, logLabel }) {
  table.delete(id);
  deleteData(dbTable, id).then(() => {
    afterDelete?.(id);
  });
  set({ [stateKey]: table.getAll() });

  if (logLabel) {
    console.log(`[ArcaconPickerPlus] ${logLabel}: `, id);
  }
}
