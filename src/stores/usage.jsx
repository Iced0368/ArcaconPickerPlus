import { create } from "zustand";
import { STORAGE_USAGE_DATA } from "../core/constants/config";
import { batchDeleteData, batchSaveData, getDatabase, loadData } from "./persistent";

import GenericTable from "../core/utils/GenericTable";
import { removeArcaconIfUnreferenced } from "./arcaconRelations";

const usageIDBTable = getDatabase(STORAGE_USAGE_DATA);
const usageTable = new GenericTable("id", ["id", "score", "updatedAt"]);

// 사용 점수는 30일마다 절반으로 감소 (최근 사용에 가중치)
const USAGE_HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000;
// 보관할 최대 사용 기록 수 (초과분은 점수 낮은 순으로 삭제)
const USAGE_MAX_RECORDS = 200;

let isUsageStoreLoaded = false;

function getDecayedScore(item, now) {
  const elapsed = Math.max(now - (item.updatedAt ?? now), 0);
  return (item.score || 0) * Math.pow(0.5, elapsed / USAGE_HALF_LIFE_MS);
}

function getRankedUsageItems(now = Date.now()) {
  return usageTable
    .getAll()
    .map((item) => ({ ...item, currentScore: getDecayedScore(item, now) }))
    .sort((left, right) => right.currentScore - left.currentScore);
}

export async function removeUsageItems(ids) {
  const normalizedIds = ids.map((id) => id?.toString()).filter(Boolean);
  if (normalizedIds.length === 0) return;

  normalizedIds.forEach((id) => {
    usageTable.delete(id);
  });
  await batchDeleteData(usageIDBTable, normalizedIds);

  if (isUsageStoreLoaded) {
    useUsageStore.setState({ usageItems: getRankedUsageItems() });
  }
}

const useUsageStore = create((set) => {
  async function loadUsageItems() {
    const data = (await loadData(usageIDBTable)) || [];

    usageTable.clear();
    data
      .map((item) => ({ ...item, id: item.id?.toString() }))
      .filter((item) => item.id)
      .forEach((item) => usageTable.insert(item));

    isUsageStoreLoaded = true;
    set({ usageItems: getRankedUsageItems() });

    console.log("[ArcaconPickerPlus] Loaded usage items: ", data.length, "items loaded.");
  }

  async function recordUsage(ids) {
    const normalizedIds = ids.map((id) => id?.toString()).filter(Boolean);
    if (normalizedIds.length === 0) return;

    const now = Date.now();
    const updatedItems = new Map();

    // 콤보콘에 같은 아카콘이 여러 번 들어가면 그만큼 집계
    normalizedIds.forEach((id) => {
      const previous = updatedItems.get(id) || usageTable.get(id);
      const item = { id, score: (previous ? getDecayedScore(previous, now) : 0) + 1, updatedAt: now };
      updatedItems.set(id, item);
      usageTable.insert(item);
    });
    await batchSaveData(usageIDBTable, Array.from(updatedItems.values()));

    const prunedIds = getRankedUsageItems(now)
      .slice(USAGE_MAX_RECORDS)
      .map((item) => item.id);
    if (prunedIds.length > 0) {
      prunedIds.forEach((id) => usageTable.delete(id));
      await batchDeleteData(usageIDBTable, prunedIds);
      await Promise.all(prunedIds.map(removeArcaconIfUnreferenced));
    }

    set({ usageItems: getRankedUsageItems(now) });

    console.log("[ArcaconPickerPlus] Recorded usage: ", normalizedIds);
  }

  return {
    usageItems: [],
    loadUsageItems,
    recordUsage,
  };
});

export default useUsageStore;
