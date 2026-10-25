import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Ogun = { id: string; tarih: string; isim: string; kalori: number };

type OgunState = {
  ogunler: Ogun[];
  ekleOgunler: (liste: Omit<Ogun, "id">[]) => void;
  silOgun: (id: string) => void;
};

function benzersizId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useOgun = create<OgunState>()(
  persist(
    (set) => ({
      ogunler: [],
      ekleOgunler: (liste) =>
        set((s) => ({
          ogunler: [...s.ogunler, ...liste.map((o) => ({ ...o, id: benzersizId() }))],
        })),
      silOgun: (id) => set((s) => ({ ogunler: s.ogunler.filter((o) => o.id !== id) })),
    }),
    { name: "scoutfit-ogunler" },
  ),
);