import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profil } from "@/lib/engine";

export type Antrenman = {
  id: string;
  bolge: string;
  hareketler: string;
  sureDk: number;
  tarih: string;
};

export type Mesaj = {
  id: string;
  rol: "kullanici" | "koc";
  metin: string;
  yerel?: boolean;
};

export type Ogun = {
  id: string;
  isim: string;
  kalori: number;
  tarih: string;
};

type Taslak = {
  bolge: string;
  hareketler: string;
  sureDk: number;
};

type FitState = {
  profil: Profil | null;
  antrenmanlar: Antrenman[];
  sohbet: Mesaj[];
  ogunler: Ogun[];
  kaydetProfil: (profil: Profil) => void;
  ekleAntrenman: (taslak: Taslak) => void;
  ekleProgram: (gunler: Taslak[]) => void;
  silAntrenman: (id: string) => void;
  temizleAntrenman: () => void;
  ekleMesaj: (mesaj: Mesaj) => void;
  temizleSohbet: () => void;
  ekleOgun: (isim: string, kalori: number) => void;
  silOgun: (id: string) => void;
  sifirla: () => void;
};

function damgala(taslak: Taslak): Antrenman {
  return {
    ...taslak,
    id: crypto.randomUUID(),
    tarih: new Date().toISOString(),
  };
}

function storeName(): string {
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (key) {
      const parsed = JSON.parse(localStorage.getItem(key) || "{}");
      const uid = parsed?.user?.id || parsed?.currentSession?.user?.id;
      if (uid) return `scoutfit-store-${uid}`;
    }
  } catch {
    /* ignore */
  }
  try {
    const authData = localStorage.getItem("scoutfit-auth");
    if (authData) {
      const parsed = JSON.parse(authData);
      const id = parsed?.state?.currentUser?.id;
      if (id) return `scoutfit-store-${id}`;
    }
  } catch {
    /* ignore */
  }
  return "scoutfit-store-guest";
}

export const useFit = create<FitState>()(
  persist(
    (set) => ({
      profil: null,
      antrenmanlar: [],
      sohbet: [],
      ogunler: [],
      kaydetProfil: (profil) => set({ profil }),
      ekleAntrenman: (taslak) =>
        set((s) => ({
          antrenmanlar: [damgala(taslak), ...s.antrenmanlar].slice(0, 80),
        })),
      ekleProgram: (gunler) =>
        set((s) => ({
          antrenmanlar: [...gunler.map(damgala), ...s.antrenmanlar].slice(0, 80),
        })),
      silAntrenman: (id) =>
        set((s) => ({
          antrenmanlar: s.antrenmanlar.filter((a) => a.id !== id),
        })),
      temizleAntrenman: () => set({ antrenmanlar: [] }),
      ekleMesaj: (mesaj) =>
        set((s) => ({
          sohbet: [...s.sohbet, mesaj].slice(-40),
        })),
      temizleSohbet: () => set({ sohbet: [] }),
      ekleOgun: (isim, kalori) =>
        set((s) => ({
          ogunler: [
            { id: crypto.randomUUID(), isim, kalori, tarih: new Date().toISOString() },
            ...s.ogunler,
          ],
        })),
      silOgun: (id) =>
        set((s) => ({
          ogunler: s.ogunler.filter((o) => o.id !== id),
        })),
      sifirla: () =>
        set({ profil: null, antrenmanlar: [], sohbet: [], ogunler: [] }),
    }),
    {
      name: storeName(),
    }
  )
);
