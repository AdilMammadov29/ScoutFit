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
  const initialSettings = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;

  if (typeof document !== 'undefined') {
    if (initialSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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

        if (key === 'theme' && typeof document !== 'undefined') {
          if (value === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }

        return { settings: updated };
      });
    },
  };
});