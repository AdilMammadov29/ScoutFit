import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export type AdimGuncellemeCallback = (adimSayisi: number) => void;

const STORAGE_KEY = "scoutfit_pedometer_state_v2";

interface Durum {
  gun: string;      // Yerel tarih (YYYY-MM-DD)
  baz: number;      // Günün başlangıç sayaç değeri
  tasinan: number;  // Telefon yeniden başlamadan önce biriken adımlar
  sonHam: number;   // Son okunan ham sayaç değeri
}

let dinleyiciAktif = false;
let aktifCallback: AdimGuncellemeCallback | null = null;
let appDinleyici: { remove: () => Promise<void> } | null = null;

// Yerel saate göre tarih (toISOString UTC verir, Türkiye'de gün 03:00'te değişirdi)
function tarihKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${g}`;
}

function bugunKey(): string {
  return tarihKey(new Date());
}

function dunKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return tarihKey(d);
}

function durumOku(): Durum | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Durum) : null;
  } catch {
    return null;
  }
}

function durumYaz(d: Durum) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* depolama dolu olabilir, sessiz geç */
  }
}

function netAdimHesapla(d: Durum, ham: number): number {
  return d.tasinan + Math.max(0, ham - d.baz);
}

function hamAdimiIsle(ham: number) {
  if (!Number.isFinite(ham) || ham < 0) return;

  const bugun = bugunKey();
  const eski = durumOku();
  let d: Durum;

  if (!eski) {
    // İlk kurulum: bugünü sıfırdan başlat
    d = { gun: bugun, baz: ham, tasinan: 0, sonHam: ham };
  } else if (eski.gun !== bugun) {
    // Yeni gün
    const yenidenBaslamis = ham < eski.sonHam;
    let baz: number;
    if (yenidenBaslamis) {
      baz = 0; // sayaç sıfırlanmış, tüm değer bugüne ait
    } else if (eski.gun === dunKey()) {
      baz = eski.sonHam; // son görülen andan beri olan adımlar bugüne yazılır
    } else {
      baz = ham; // uzun süre açılmamış, eski adımları bugüne yazma
    }
    d = { gun: bugun, baz, tasinan: 0, sonHam: ham };
  } else if (ham < eski.sonHam) {
    // Aynı gün telefon yeniden başladı: o ana kadarki adımları taşı
    d = {
      gun: eski.gun,
      baz: 0,
      tasinan: netAdimHesapla(eski, eski.sonHam),
      sonHam: ham,
    };
  } else {
    d = { ...eski, sonHam: ham };
  }

  durumYaz(d);
  aktifCallback?.(netAdimHesapla(d, ham));
}

async function anlikOlcumAl() {
  try {
    const { CapacitorPedometer } = await import("@capgo/capacitor-pedometer");
    const anlik = await CapacitorPedometer.getMeasurement();
    if (anlik?.numberOfSteps != null) {
      hamAdimiIsle(Number(anlik.numberOfSteps));
    }
  } catch (e) {
    console.warn("[Pedometer] Anlık ölçüm alınamadı:", e);
  }
}

export async function adimTakibiniBaslat(onGuncelle: AdimGuncellemeCallback): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Her çağrıda en güncel callback kullanılsın
  aktifCallback = onGuncelle;

  try {
    const { CapacitorPedometer } = await import("@capgo/capacitor-pedometer");

    const check = await CapacitorPedometer.isAvailable();
    if (!check.stepCounting) {
      console.warn("[Pedometer] Cihazda adım sayma donanımı bulunamadı.");
      return;
    }

    const stat = await CapacitorPedometer.checkPermissions();
    if (stat.activityRecognition !== "granted") {
      const req = await CapacitorPedometer.requestPermissions();
      if (req.activityRecognition !== "granted") {
        console.warn("[Pedometer] Fiziksel aktivite izni verilmedi.");
        return;
      }
    }

    // Kayıtlı bugünkü adımı hemen göster
    const kayitli = durumOku();
    if (kayitli && kayitli.gun === bugunKey()) {
      onGuncelle(netAdimHesapla(kayitli, kayitli.sonHam));
    }

    // Donanımdaki güncel değeri oku
    await anlikOlcumAl();

    if (!dinleyiciAktif) {
      await CapacitorPedometer.addListener("measurement", (event) => {
        hamAdimiIsle(Number(event?.numberOfSteps ?? 0));
      });
      await CapacitorPedometer.startMeasurementUpdates();
      dinleyiciAktif = true;
    }

    // Uygulama arka plandan dönünce sayacı yeniden oku.
    // Donanım sayacı arka planda da çalışır, burada eksik kalanı yakalıyoruz.
    if (!appDinleyici) {
      appDinleyici = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) anlikOlcumAl();
      });
    }
  } catch (err) {
    dinleyiciAktif = false;
    console.error("[Pedometer] Takip başlatma hatası:", err);
  }
}

export async function adimTakibiniDurdur(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { CapacitorPedometer } = await import("@capgo/capacitor-pedometer");
    await CapacitorPedometer.stopMeasurementUpdates();
    await CapacitorPedometer.removeAllListeners();
  } catch (e) {
    console.warn("[Pedometer] Durdurma hatası:", e);
  } finally {
    dinleyiciAktif = false;
    aktifCallback = null;
    if (appDinleyici) {
      await appDinleyici.remove();
      appDinleyici = null;
    }
  }
}