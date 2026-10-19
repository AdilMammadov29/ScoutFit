import { create } from "zustand";

export type SenkronDurumu = "bekliyor" | "kaydedildi" | "hata";

type OturumState = {
  email: string | null;
  senkron: SenkronDurumu;
  setEmail: (email: string | null) => void;
  setSenkron: (durum: SenkronDurumu) => void;
};

export const useOturum = create<OturumState>()((set) => ({
  email: null,
  senkron: "bekliyor",
  setEmail: (email) => set({ email }),
  setSenkron: (senkron) => set({ senkron }),
}));