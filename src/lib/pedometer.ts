import { Capacitor } from "@capacitor/core";

export type AdimGuncellemeCallback = (adimSayisi: number) => void;

let dinleyiciAktif = false;

function bugunKey(): string {
  return new Date().toISOString().split("T")[0];
}

const STORAGE_KEY_BASE = "scoutfit_pedometer_base";
const STORAGE_KEY_DATE = "scoutfit_pedometer_date";
const STORAGE_KEY_DAILY_STEPS = "scoutfit_pedometer_daily_steps";

function hamAdimiIsle(hamAdim: number, onGuncelle: AdimGuncellemeCallback) {
  if (isNaN(hamAdim) || hamAdim <= 0) return;

  const bugun = bugunKey();
  const sonTarih = localStorage.getItem(STORAGE_KEY_DATE);
  let bazAdim = Number(localStorage.getItem(STORAGE_KEY_BASE) || "0");

  // Gün değiştiyse, ilk kez açılıyorsa veya telefon yeniden başlatıldıysa baz değeri güncelle
  if (sonTarih !== bugun || bazAdim <= 0 || hamAdim < bazAdim) {
    bazAdim = hamAdim;
    localStorage.setItem(STORAGE_KEY_DATE, bugun);
    localStorage.setItem(STORAGE_KEY_BASE, bazAdim.toString());
  }

  const netAdim = Math.max(0, hamAdim - bazAdim);
  localStorage.setItem(STORAGE_KEY_DAILY_STEPS, netAdim.toString());
  onGuncelle(netAdim);
}

export async function adimTakibiniBaslat(onGuncelle: AdimGuncellemeCallback): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { CapacitorPedometer } = await import("@capgo/capacitor-pedometer");

    // 1. Donanım Kontrolü
    const check = await CapacitorPedometer.isAvailable();
    if (!check.stepCounting) {
      console.warn("[Pedometer] Cihazda adım sayma donanımı bulunamadı.");
      return;
    }

    // 2. İzin Kontrolü ve İstemi (Android 10+ için zorunlu)
    const stat = await CapacitorPedometer.checkPermissions();
    if (stat.activityRecognition !== "granted") {
      const req = await CapacitorPedometer.requestPermissions();
      if (req.activityRecognition !== "granted") {
        console.warn("[Pedometer] Fiziksel aktivite izni verilmedi.");
        return;
      }
    }

    // 3. Hafızadaki mevcut adımı hemen ekrana ver
    const kayitliAdim = Number(localStorage.getItem(STORAGE_KEY_DAILY_STEPS) || "0");
    if (kayitliAdim > 0) {
      onGuncelle(kayitliAdim);
    }

    // 4. Donanımdan anlık tek seferlik ölçüm çek
    try {
      const anlik = await CapacitorPedometer.getMeasurement();
      if (anlik?.numberOfSteps) {
        hamAdimiIsle(anlik.numberOfSteps, onGuncelle);
      }
    } catch (e) {
      console.warn("[Pedometer] Anlık ölçüm alınamadı:", e);
    }

    // 5. Dinleyiciyi bağla ve resmi başlatma fonksiyonunu tetikle
    if (!dinleyiciAktif) {
      dinleyiciAktif = true;

      await CapacitorPedometer.addListener("measurement", (event) => {
        const hamAdim = Number(event?.numberOfSteps ?? 0);
        hamAdimiIsle(hamAdim, onGuncelle);
      });

      // Eklentinin dokümantasyonundaki resmi başlatma komutu
      await CapacitorPedometer.startMeasurementUpdates();
    }
  } catch (err) {
    console.error("[Pedometer] Takip başlatma hatası:", err);
  }
}

export async function adimTakibiniDurdur(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { CapacitorPedometer } = await import("@capgo/capacitor-pedometer");
    await CapacitorPedometer.stopMeasurementUpdates();
    await CapacitorPedometer.removeAllListeners();
    dinleyiciAktif = false;
  } catch (e) {
    console.warn("[Pedometer] Durdurma hatası:", e);
  }
}