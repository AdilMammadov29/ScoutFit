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
  gunKontrol: () => void;
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

const GUN_ADLARI = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export const useActivity = create<ActivityState>((set, get) => {
  const yuklenen = verileriYukle();
  let bugunStr = yerelTarih();

  // Gün değiştiyse önceki günü arşivle
  let baslangicSu = 0;
  let baslangicAdim = 0;
  let baslangicUyku: number | null = null;
  let gecmis: GunlukAktivite[] = yuklenen?.haftalikGecmis ?? [];

  if (yuklenen) {
    if (yuklenen.sonTarih === bugunStr) {
      baslangicSu = yuklenen.bugunSuMl ?? 0;
      baslangicAdim = yuklenen.bugunAdim ?? 0;
      baslangicUyku = yuklenen.bugunUykuSaat ?? null;
    } else if (yuklenen.sonTarih) {
      // Dünün verisini geçmişe ekle
      const eskiKayit: GunlukAktivite = {
        tarih: yuklenen.sonTarih,
        adim: yuklenen.bugunAdim ?? 0,
        suMl: yuklenen.bugunSuMl ?? 0,
        uykuSaat: yuklenen.bugunUykuSaat ?? null,
      };
      gecmis = [eskiKayit, ...gecmis.filter((g: GunlukAktivite) => g.tarih !== yuklenen.sonTarih)].slice(0, 60);
    }
  }

  const favoriler = yuklenen?.favoriKaplar ?? [250, 330, 500, 750];
  const baslangicAntrenman = yuklenen?.aktifAntrenman ?? null;

  const kaydetLocal = (yeni: Partial<ActivityState> & { sonTarih?: string }) => {
    const s = get();
    const tarih = yerelTarih();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sonTarih: tarih,
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
    haftalikGecmis: gecmis,
    aktifAntrenman: baslangicAntrenman,

    gunKontrol: () => {
      const yeniTarih = yerelTarih();
      const s = get();
      // localStorage'dan son tarihi oku
      const raw = verileriYukle();
      const sonTarih = raw?.sonTarih;
      if (sonTarih && sonTarih !== yeniTarih) {
        const eskiKayit: GunlukAktivite = {
          tarih: sonTarih,
          adim: s.bugunAdim,
          suMl: s.bugunSuMl,
          uykuSaat: s.bugunUykuSaat,
        };
        const yeniGecmis = [eskiKayit, ...s.haftalikGecmis.filter((g) => g.tarih !== sonTarih)].slice(0, 60);
        set({
          bugunAdim: 0,
          bugunSuMl: 0,
          bugunUykuSaat: null,
          haftalikGecmis: yeniGecmis,
        });
        kaydetLocal({ bugunAdim: 0, bugunSuMl: 0, bugunUykuSaat: null });
      }
    },

    suEkle: (ml: number) => {
      get().gunKontrol();
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
      get().gunKontrol();
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
      get().gunKontrol();
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
      // 1 dakikadan kısa antrenmanları gerçek süreyle kaydet (en az 1 dk değil)
      const sureDk = Math.max(1, Math.round(sureMs / 60000));

      let netAdim = bugunAdim - aktifAntrenman.baslangicAdim;
      if (netAdim < 0) netAdim = 0; // Gece yarısı sıfırlanmasında antrenman adımını 0 say

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
      const { bugunAdim, haftalikGecmis } = get();
      const bugun = yerelTarih();
      const gunlukKm = ((bugunAdim * 0.75) / 1000).toFixed(1);

      // Son 7 gün (bugün dahil)
      const yediGunOnce = new Date();
      yediGunOnce.setDate(yediGunOnce.getDate() - 6);
      const yediGunStr = `${yediGunOnce.getFullYear()}-${String(yediGunOnce.getMonth() + 1).padStart(2, "0")}-${String(yediGunOnce.getDate()).padStart(2, "0")}`;

      const gecmisMap = new Map(haftalikGecmis.map((g) => [g.tarih, g.adim]));
      gecmisMap.set(bugun, bugunAdim);

      let haftalikAdim = 0;
      const haftalikGunler: { gun: string; adim: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const adim = gecmisMap.get(t) ?? 0;
        haftalikAdim += adim;
        haftalikGunler.push({ gun: GUN_ADLARI[d.getDay()], adim });
      }

      // Son 30 gün
      let aylikAdim = bugunAdim;
      for (const g of haftalikGecmis) {
        const d = new Date(g.tarih + "T12:00:00");
        const fark = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
        if (fark <= 30 && g.tarih !== bugun) aylikAdim += g.adim;
      }

      return {
        gunlukAdim: bugunAdim,
        gunlukKm,
        haftalikAdim,
        haftalikKm: ((haftalikAdim * 0.75) / 1000).toFixed(1),
        aylikAdim,
        aylikKm: ((aylikAdim * 0.75) / 1000).toFixed(1),
        haftalikGunler,
      };
    },
  };
});

// Cihaz adım sensörünü dinler ve doğrudan bugunAdim'e yansıtır
adimTakibiniBaslat((gelenAdim: number) => {
  const store = useActivity.getState();
  store.adimGuncelle(gelenAdim);
});
