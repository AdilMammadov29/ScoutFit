import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Ogun = {
  id: string;
  tarih: string;
  isim: string;
  kalori: number;
  protein?: number;
  karb?: number;
  yag?: number;
  ogunTipi?: "Kahvaltı" | "Öğle" | "Akşam" | "Ara Öğün";
};

type OgunState = {
  ogunler: Ogun[];
  ekleOgunler: (liste: Omit<Ogun, "id">[]) => void;
  silOgun: (id: string) => void;
  setOgunler: (liste: Ogun[]) => void;
  sifirla: () => void;
};

function benzersizId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function storeName(): string {
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (key) {
      const parsed = JSON.parse(localStorage.getItem(key) || "{}");
      const uid = parsed?.user?.id || parsed?.currentSession?.user?.id;
      if (uid) return `scoutfit-ogunler-${uid}`;
    }
  } catch {
    /* ignore */
  }
  try {
    const authData = localStorage.getItem("scoutfit-auth");
    if (authData) {
      const parsed = JSON.parse(authData);
      const id = parsed?.state?.currentUser?.id;
      if (id) return `scoutfit-ogunler-${id}`;
    }
  } catch {
    /* ignore */
  }
  return "scoutfit-ogunler-guest";
}

export const useOgun = create<OgunState>()(
  persist(
    (set) => ({
      ogunler: [],
      ekleOgunler: (liste) =>
        set((s) => ({
          ogunler: [
            ...liste.map((o) => ({ ...o, id: benzersizId() })),
            ...s.ogunler,
          ],
        })),
      silOgun: (id) => set((s) => ({ ogunler: s.ogunler.filter((o) => o.id !== id) })),
      setOgunler: (liste) => set({ ogunler: liste }),
      sifirla: () => set({ ogunler: [] }),
    }),
    { name: storeName() }
  )
);
