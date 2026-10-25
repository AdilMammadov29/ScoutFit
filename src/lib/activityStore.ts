import { create } from "zustand";

export interface GunlukAktivite {
  tarih: string;
  adim: number;
  suMl: number;
  uykuSaat?: number | null;
}

export interface ActivityState {
  bugunAdim: number;
  hedefAdim: number;
  bugunSuMl: number;
  hedefSuMl: number;
  bugunUykuSaat: number | null;
  favoriKaplar: number[];
  haftalikGecmis: GunlukAktivite[];
  
  suEkle: (ml: number) => void;
  suSifirla: () => void;
  favoriKapEkle: (ml: number) => void;
  favoriKapSil: (ml: number) => void;
  adimGuncelle: (adim: number) => void;
  uykuGuncelle: (saat: number) => void;
  istatistikleriGetir: () => {
    gunlukAdim: number;
    gunlukKm: string;
    haftalikAdim: number;
    haftalikKm: string;
    aylikAdim: number;
    aylikKm: string;
    haftalikGunler: { gun: string; adim: number }[];
  };
}

const STORAGE_KEY = "scoutfit_activity_v3";

function yerelTarih(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function verileriYukle() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const useActivity = create<ActivityState>((set, get) => {
  const yuklenen = verileriYukle();
  const bugunStr = yerelTarih();

  const baslangicSu = yuklenen?.sonTarih === bugunStr ? (yuklenen.bugunSuMl ?? 0) : 0;
  const baslangicAdim = yuklenen?.sonTarih === bugunStr ? (yuklenen.bugunAdim ?? 0) : 0;
  const baslangicUyku = yuklenen?.sonTarih === bugunStr ? (yuklenen.bugunUykuSaat ?? null) : null;
  const favoriler = yuklenen?.favoriKaplar ?? [250, 330, 500, 750];

  const kaydetLocal = (yeni: Partial<ActivityState>) => {
    const s = get();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sonTarih: bugunStr,
        bugunSuMl: yeni.bugunSuMl ?? s.bugunSuMl,
        bugunAdim: yeni.bugunAdim ?? s.bugunAdim,
        bugunUykuSaat: yeni.bugunUykuSaat !== undefined ? yeni.bugunUykuSaat : s.bugunUykuSaat,
        favoriKaplar: yeni.favoriKaplar ?? s.favoriKaplar,
        haftalikGecmis: s.haftalikGecmis,
      })
    );
  };

  return {
    bugunAdim: baslangicAdim,
    hedefAdim: 10000,
    bugunSuMl: baslangicSu,
    hedefSuMl: 2500,
    bugunUykuSaat: baslangicUyku,
    favoriKaplar: favoriler,
    haftalikGecmis: yuklenen?.haftalikGecmis ?? [],

    suEkle: (ml: number) => {
      const yeniSu = get().bugunSuMl + ml;
      set({ bugunSuMl: yeniSu });
      kaydetLocal({ bugunSuMl: yeniSu });
    },

    suSifirla: () => {
      set({ bugunSuMl: 0 });
      kaydetLocal({ bugunSuMl: 0 });
    },

    favoriKapEkle: (ml: number) => {
      if (ml <= 0 || get().favoriKaplar.includes(ml)) return;
      const yeniListe = [...get().favoriKaplar, ml].sort((a, b) => a - b);
      set({ favoriKaplar: yeniListe });
      kaydetLocal({ favoriKaplar: yeniListe });
    },

    favoriKapSil: (ml: number) => {
      const yeniListe = get().favoriKaplar.filter((k) => k !== ml);
      set({ favoriKaplar: yeniListe });
      kaydetLocal({ favoriKaplar: yeniListe });
    },

    adimGuncelle: (adim: number) => {
      set({ bugunAdim: adim });
      kaydetLocal({ bugunAdim: adim });
    },

    uykuGuncelle: (saat: number) => {
      set({ bugunUykuSaat: saat });
      kaydetLocal({ bugunUykuSaat: saat });
    },

    istatistikleriGetir: () => {
      const { bugunAdim } = get();
      const gunlukKm = ((bugunAdim * 0.75) / 1000).toFixed(1);
      return {
        gunlukAdim: bugunAdim,
        gunlukKm,
        haftalikAdim: bugunAdim,
        haftalikKm: gunlukKm,
        aylikAdim: bugunAdim,
        aylikKm: gunlukKm,
        haftalikGunler: [
          { gun: "Pzt", adim: 6500 },
          { gun: "Sal", adim: 8200 },
          { gun: "Çar", adim: 7100 },
          { gun: "Per", adim: 9400 },
          { gun: "Cum", adim: bugunAdim },
          { gun: "Cmt", adim: 0 },
          { gun: "Paz", adim: 0 },
        ],
      };
    },
  };
});