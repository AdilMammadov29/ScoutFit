import { create } from "zustand";

export type GunDurumu = "temiz" | "dengeli" | "kacamak";

export interface DietState {
  seri: number;
  sonGuncellemeTarihi: string | null;
  bugunkuDurum: GunDurumu | null;
  telafiPlani: string | null;
  durumSec: (durum: GunDurumu) => void;
  sifirla: () => void;
}

const TELAFILER = [
  "Yarın öğle yemeğinde ekmek ve pirinci çıkarıp tabağı yeşillik ve proteinle doldur.",
  "Yarın gün boyu fazladan 2.000 adım at veya 20 dakika tempolu yürü.",
  "Yarın ilk öğününü her zamankinden 1.5 saat daha geç tüket (kısa aralık bırak).",
  "Yarın akşam yemeğini saat 19:00'dan önce tamamla ve hafif bir çorba tercih et."
];

function bugununTarihi(): string {
  return new Date().toISOString().split("T")[0];
}

function dununTarihi(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

const STORAGE_KEY = "scoutfit_diet_streak_v1";

function kayitYukle() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { seri: 0, sonGuncellemeTarihi: null, bugunkuDurum: null, telafiPlani: null };
    const parsed = JSON.parse(raw);
    const bugun = bugununTarihi();

    if (parsed.sonGuncellemeTarihi !== bugun) {
      const dun = dununTarihi();
      const seriBozuldu = parsed.sonGuncellemeTarihi && parsed.sonGuncellemeTarihi !== dun;
      return {
        seri: seriBozuldu ? 0 : parsed.seri,
        sonGuncellemeTarihi: parsed.sonGuncellemeTarihi,
        bugunkuDurum: null,
        telafiPlani: parsed.telafiPlani,
      };
    }
    return parsed;
  } catch {
    return { seri: 0, sonGuncellemeTarihi: null, bugunkuDurum: null, telafiPlani: null };
  }
}

export const useDiet = create<DietState>((set, get) => {
  const baslangic = kayitYukle();

  const kaydetLocal = (yeniVeri: Partial<DietState>) => {
    const guncel = { ...get(), ...yeniVeri };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        seri: guncel.seri,
        sonGuncellemeTarihi: guncel.sonGuncellemeTarihi,
        bugunkuDurum: guncel.bugunkuDurum,
        telafiPlani: guncel.telafiPlani,
      })
    );
  };

  return {
    seri: baslangic.seri,
    sonGuncellemeTarihi: baslangic.sonGuncellemeTarihi,
    bugunkuDurum: baslangic.bugunkuDurum,
    telafiPlani: baslangic.telafiPlani,

    durumSec: (durum: GunDurumu) => {
      const bugun = bugununTarihi();
      const oncekiDurum = get().bugunkuDurum;
      let yeniSeri = get().seri;
      let yeniTelafi: string | null = null;

      if (durum === "temiz") {
        if (oncekiDurum !== "temiz") yeniSeri += 1;
        yeniTelafi = null;
      } else if (durum === "dengeli") {
        if (oncekiDurum === "temiz" && yeniSeri > 0) yeniSeri -= 1;
        yeniTelafi = null;
      } else if (durum === "kacamak") {
        if (oncekiDurum === "temiz" && yeniSeri > 0) yeniSeri -= 1;
        yeniTelafi = TELAFILER[Math.floor(Math.random() * TELAFILER.length)];
      }

      set({
        bugunkuDurum: durum,
        seri: yeniSeri,
        sonGuncellemeTarihi: bugun,
        telafiPlani: yeniTelafi,
      });

      kaydetLocal({
        bugunkuDurum: durum,
        seri: yeniSeri,
        sonGuncellemeTarihi: bugun,
        telafiPlani: yeniTelafi,
      });
    },

    sifirla: () => {
      set({ seri: 0, bugunkuDurum: null, telafiPlani: null, sonGuncellemeTarihi: null });
      localStorage.removeItem(STORAGE_KEY);
    },
  };
});