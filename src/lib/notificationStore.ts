import { create } from "zustand";

export interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  zaman: string;
  okundu: boolean;
  tip?: "su" | "adim" | "hedef" | "sistem";
}

interface NotificationState {
  bildirimler: Bildirim[];
  panelAcik: boolean;
  paneliAcKapat: () => void;
  bildirimEkle: (baslik: string, mesaj: string, tip?: Bildirim["tip"]) => void;
  okunduOlarakIsaretle: (id: string) => void;
  tumunuOkunduYap: () => void;
  bildirimSil: (id: string) => void;
  tumunuTemizle: () => void;
}

const STORAGE_KEY = "scoutfit_notifications_v1";

function kayitliBildirimleriYukle(): Bildirim[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useNotifications = create<NotificationState>((set, get) => ({
  panelAcik: false,
  bildirimler: kayitliBildirimleriYukle(),

  paneliAcKapat: () => set((s) => ({ panelAcik: !s.panelAcik })),

  bildirimEkle: (baslik, mesaj, tip = "sistem") => {
    const yeniBildirim: Bildirim = {
      id: Date.now().toString(),
      baslik,
      mesaj,
      zaman: "Şimdi",
      okundu: false,
      tip,
    };

    set((state) => {
      const guncel = [yeniBildirim, ...state.bildirimler].slice(0, 20); // Son 20 bildirimi tut
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guncel));
      return { bildirimler: guncel };
    });
  },

  okunduOlarakIsaretle: (id) =>
    set((state) => {
      const guncel = state.bildirimler.map((b) =>
        b.id === id ? { ...b, okundu: true } : b
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guncel));
      return { bildirimler: guncel };
    }),

  tumunuOkunduYap: () =>
    set((state) => {
      const guncel = state.bildirimler.map((b) => ({ ...b, okundu: true }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guncel));
      return { bildirimler: guncel };
    }),

  bildirimSil: (id) =>
    set((state) => {
      const guncel = state.bildirimler.filter((b) => b.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guncel));
      return { bildirimler: guncel };
    }),

  tumunuTemizle: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ bildirimler: [] });
  },
}));