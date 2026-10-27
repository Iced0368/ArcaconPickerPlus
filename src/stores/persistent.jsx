import Dexie from "dexie";
import {
  STORAGE_ARCACON_DATA,
  STORAGE_FAVORITE_DATA,
  STORAGE_MEMO_DATA,
  STORAGE_USAGE_DATA,
} from "../core/constants/config";

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
db.version(3).stores({
  [STORAGE_USAGE_DATA]: "id,score",
});

const BACKUP_TABLES = [STORAGE_ARCACON_DATA, STORAGE_FAVORITE_DATA, STORAGE_MEMO_DATA, STORAGE_USAGE_DATA];

// 전체 데이터를 백업 객체로 내보내기 (콘솔 백업 스크립트와 같은 형식)
export async function exportAllData() {
  const stores = {};
  for (const tableName of BACKUP_TABLES) {
    stores[tableName] = await db[tableName].toArray();
  }
  return { name: db.name, version: db.verno, exportedAt: new Date().toISOString(), stores };
}

function normalizeBackupItems(items) {
  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({ ...item, id: item.id?.toString() }))
    .filter((item) => item.id);
}

// mode: "merge" = 없는 항목만 추가, "overwrite" = 기존 데이터를 지우고 교체
export async function importAllData(dump, mode = "merge") {
  if (!dump || typeof dump.stores !== "object" || dump.stores === null) {
    throw new Error("올바른 백업 파일이 아닙니다.");
  }

  const incoming = {};
  for (const tableName of BACKUP_TABLES) {
    const items = dump.stores[tableName] ?? [];
    if (!Array.isArray(items)) throw new Error(`백업 파일의 ${tableName} 형식이 올바르지 않습니다.`);
    incoming[tableName] = normalizeBackupItems(items);
  }

  const added = {};
  await db.transaction(
    "rw",
    BACKUP_TABLES.map((tableName) => db[tableName]),
    async () => {
      if (mode === "overwrite") {
        for (const tableName of BACKUP_TABLES) {
          // 백업 파일에 없는 테이블(이전 버전 백업)은 기존 데이터 유지
          if (!(tableName in dump.stores)) {
            added[tableName] = 0;
            continue;
          }
          await db[tableName].clear();
          await db[tableName].bulkPut(incoming[tableName]);
          added[tableName] = incoming[tableName].length;
        }
        return;
      }

      for (const tableName of BACKUP_TABLES) {
        const existingKeys = new Set((await db[tableName].toCollection().primaryKeys()).map(String));
        let newItems = incoming[tableName].filter((item) => !existingKeys.has(item.id));

        // 즐겨찾기는 기존 순서 뒤에 백업 순서대로 이어 붙임
        if (tableName === STORAGE_FAVORITE_DATA) {
          const existingOrders = (await db[tableName].toArray()).map((item) => item.order).filter(Number.isFinite);
          const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0;
          newItems = newItems
            .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
            .map((item, index) => ({ id: item.id, order: nextOrder + index }));
        }

        await db[tableName].bulkAdd(newItems);
        added[tableName] = newItems.length;
      }
    },
  );

  return added;
}

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
