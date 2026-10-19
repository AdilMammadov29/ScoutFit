import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Ogun = { id: string; tarih: string; isim: string; kalori: number };

type OgunState = {
  ogunler: Ogun[];
  ekleOgunler: (liste: Omit<Ogun, "id">[]) => void;
  silOgun: (id: string) => void;
};

export const useOgun = create<OgunState>()(
  persist(
    (set) => ({
      ogunler: [],
      ekleOgunler: (liste) =>
        set((s) => ({
          ogunler: [...s.ogunler, ...liste.map((o) => ({ ...o, id: crypto.randomUUID() }))],
        })),
      silOgun: (id) => set((s) => ({ ogunler: s.ogunler.filter((o) => o.id !== id) })),
    }),
    { name: "scoutfit-ogunler" },
  ),
);