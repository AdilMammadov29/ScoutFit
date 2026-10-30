import { create } from 'zustand';

export interface UserSettings {
  theme: 'dark' | 'light';
  voiceFeedback: boolean;
  haptics: boolean;
  livePolyline: boolean;
  offlineSync: boolean;
}

interface SettingsState {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  voiceFeedback: true,
  haptics: true,
  livePolyline: true,
  offlineSync: true,
};

export const useSettingsStore = create<SettingsState>((set) => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('scoutfit_settings') : null;
  let initialSettings = DEFAULT_SETTINGS;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      initialSettings = { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      /* ignore */
    }
  }

  return {
    settings: initialSettings,
    updateSetting: (key, value) => {
      set((state) => {
        const updated = { ...state.settings, [key]: value };
        if (typeof window !== 'undefined') {
          localStorage.setItem('scoutfit_settings', JSON.stringify(updated));
        }
        return { settings: updated };
      });
    },
  };
});