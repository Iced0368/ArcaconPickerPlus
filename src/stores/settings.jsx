import { create } from "zustand";

// 설정은 작고 기기별 값이라 IndexedDB 대신 localStorage에 저장
const SETTINGS_STORAGE_KEY = "arcacon-picker-plus-settings";

const DEFAULT_SETTINGS = {
  showFavoritePackage: true,
  showFrequentPackage: true,
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

const useSettingsStore = create((set, get) => ({
  settings: loadSettings(),
  setSetting: (key, value) => {
    const settings = { ...get().settings, [key]: value };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("[ArcaconPickerPlus] Failed to save settings: ", error);
    }
    set({ settings });
  },
}));

export default useSettingsStore;
