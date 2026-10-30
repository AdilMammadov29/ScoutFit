import { create } from "zustand";
import { adimTakibiniBaslat } from "./pedometer";
import { useNotifications } from "./notificationStore";

export interface GunlukAktivite {
  tarih: string;
  adim: number;
  suMl: number;
  uykuSaat?: number | null;
}

export interface AktifAntrenman {
  aktif: boolean;
  baslangicZamani: number;
  baslangicAdim: number;
  bolge: string;
}

export interface ActivityState {
  bugunAdim: number;
  hedefAdim: number;
  bugunSuMl: number;
  hedefSuMl: number;
  bugunUykuSaat: number | null;
  favoriKaplar: number[];
  haftalikGecmis: GunlukAktivite[];
  aktifAntrenman: AktifAntrenman | null;

  suEkle: (ml: number) => void;
  suSifirla: () => void;
  favoriKapEkle: (ml: number) => void;
  favoriKapSil: (ml: number) => void;
  adimGuncelle: (adim: number) => void;
  uykuGuncelle: (saat: number) => void;
  antrenmanBaslat: (bolge: string) => void;
  antrenmanBitir: () => { sureDk: number; adim: number; mesafeKm: number; bolge: string } | null;
  antrenmanIptal: () => void;
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
  const baslangicAntrenman = yuklenen?.aktifAntrenman ?? null;

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
        aktifAntrenman: yeni.aktifAntrenman !== undefined ? yeni.aktifAntrenman : s.aktifAntrenman,
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
    aktifAntrenman: baslangicAntrenman,

    suEkle: (ml: number) => {
      const oncekiSu = get().bugunSuMl;
      const yeniSu = oncekiSu + ml;
      const hedef = get().hedefSuMl;

      set({ bugunSuMl: yeniSu });
      kaydetLocal({ bugunSuMl: yeniSu });

      if (yeniSu >= hedef && oncekiSu < hedef) {
        useNotifications.getState().bildirimEkle(
          "Su Hedefi Tamamlandı",
          `Tebrikler! Günlük ${hedef} ml su hedefine ulaştın.`,
          "su"
        );
      }
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
      const oncekiAdim = get().bugunAdim;
      const hedef = get().hedefAdim;

      set({ bugunAdim: adim });
      kaydetLocal({ bugunAdim: adim });

      if (adim >= hedef && oncekiAdim < hedef) {
        useNotifications.getState().bildirimEkle(
          "Adım Hedefi Tamamlandı",
          `Harika tempo! Günlük ${hedef.toLocaleString()} adım hedefine ulaştın.`,
          "adim"
        );
      }
    },

    uykuGuncelle: (saat: number) => {
      set({ bugunUykuSaat: saat });
      kaydetLocal({ bugunUykuSaat: saat });
    },

    antrenmanBaslat: (bolge: string) => {
      const baslangicAdim = get().bugunAdim;
      const yeniAntrenman: AktifAntrenman = {
        aktif: true,
        baslangicZamani: Date.now(),
        baslangicAdim,
        bolge,
      };
      set({ aktifAntrenman: yeniAntrenman });
      kaydetLocal({ aktifAntrenman: yeniAntrenman });
    },

    antrenmanBitir: () => {
      const { aktifAntrenman, bugunAdim } = get();
      if (!aktifAntrenman || !aktifAntrenman.aktif) return null;

      const suAn = Date.now();
      const sureMs = Math.max(0, suAn - aktifAntrenman.baslangicZamani);
      const sureDk = Math.max(1, Math.round(sureMs / 60000));

      let netAdim = bugunAdim - aktifAntrenman.baslangicAdim;
      if (netAdim < 0) netAdim = bugunAdim; // Gece yarısı gün devri veya sıfırlanma toleransı

      const mesafeKm = Number(((netAdim * 0.75) / 1000).toFixed(2));
      const sonuc = {
        sureDk,
        adim: netAdim,
        mesafeKm,
        bolge: aktifAntrenman.bolge,
      };

      set({ aktifAntrenman: null });
      kaydetLocal({ aktifAntrenman: null });
      return sonuc;
    },

    antrenmanIptal: () => {
      set({ aktifAntrenman: null });
      kaydetLocal({ aktifAntrenman: null });
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

// Cihaz adım sensörünü dinler ve doğrudan bugunAdim'e yansıtır
adimTakibiniBaslat((gelenAdim: number) => {
  const store = useActivity.getState();
  store.adimGuncelle(gelenAdim);
});