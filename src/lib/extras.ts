import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KiloKaydi = { id: string; tarih: string; kilo: number };
export type Birim = "kg" | "lb";
export type Tema = "acik" | "koyu";

type Ekstra = {
  ad: string;
  birim: Birim;
  tema: Tema;
  kiloKayitlari: KiloKaydi[];
  setAd: (ad: string) => void;
  setBirim: (birim: Birim) => void;
  setTema: (tema: Tema) => void;
  ekleKilo: (kilo: number) => void;
  silKilo: (id: string) => void;
  temizleKilo: () => void;
};

function temaUygula(tema: Tema) {
  if (typeof document === "undefined") return;
  if (tema === "koyu") document.documentElement.dataset.tema = "koyu";
  else delete document.documentElement.dataset.tema;
}

function bugun() {
  const d = new Date();
  const ay = String(d.getMonth() + 1).padStart(2, "0");
  const gun = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${ay}-${gun}`;
}

export const useEkstra = create<Ekstra>()(
  persist(
    (set) => ({
      ad: "",
      birim: "kg",
      tema: "acik",
      kiloKayitlari: [],
      setAd: (ad) => set({ ad }),
      setBirim: (birim) => set({ birim }),
      setTema: (tema) => {
        temaUygula(tema);
        set({ tema });
      },
      ekleKilo: (kilo) =>
        set((s) => {
          const tarih = bugun();
          return {
            kiloKayitlari: [
              ...s.kiloKayitlari.filter((k) => k.tarih !== tarih),
              { id: crypto.randomUUID(), tarih, kilo },
            ].sort((a, b) => a.tarih.localeCompare(b.tarih)),
          };
        }),
      silKilo: (id) =>
        set((s) => ({ kiloKayitlari: s.kiloKayitlari.filter((k) => k.id !== id) })),
      temizleKilo: () => set({ kiloKayitlari: [] }),
    }),
    {
      name: "scoutfit-ekstra",
      onRehydrateStorage: () => (state) => {
        if (state) temaUygula(state.tema);
      },
    },
  ),
);