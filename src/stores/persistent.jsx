import Dexie from "dexie";
import { STORAGE_ARCACON_DATA, STORAGE_FAVORITE_DATA, STORAGE_MEMO_DATA } from "../core/constants/config";

const db = new Dexie("ArcaconPickerPlusDB");
db.version(1).stores({
  [STORAGE_ARCACON_DATA]: "id,emoticonid,imageUrl,type,poster,orig",
  [STORAGE_FAVORITE_DATA]: "id",
  [STORAGE_MEMO_DATA]: "id,text",
});
db.version(2)
  .stores({
    [STORAGE_ARCACON_DATA]: "id,emoticonid,imageUrl,type,poster,orig",
    [STORAGE_FAVORITE_DATA]: "id,order",
    [STORAGE_MEMO_DATA]: "id,text",
  })
  .upgrade(async (tx) => {
    const favoriteTable = tx.table(STORAGE_FAVORITE_DATA);
    const favorites = await favoriteTable.toArray();

    await Promise.all(
      favorites.map((favorite, index) =>
        favoriteTable.put({
          ...favorite,
          id: favorite.id?.toString(),
          order: Number.isFinite(favorite.order) ? favorite.order : index,
        }),
      ),
    );
  });

export function getDatabase(tableName) {
  return db[tableName];
}

export async function saveData(dbTable, item) {
  await dbTable.put(item);
}

export async function batchSaveData(dbTable, items) {
  if (!Array.isArray(items)) throw new Error("items must be an array");
  await dbTable.bulkPut(items);
}

export async function batchDeleteData(dbTable, keys) {
  if (!Array.isArray(keys)) throw new Error("keys must be an array");
  await dbTable.bulkDelete(keys);
}

export async function loadData(dbTable) {
  return await dbTable.toArray();
}

export async function deleteData(dbTable, key) {
  await dbTable.delete(key);
}
