import { Capacitor } from "@capacitor/core";

export type AdimGuncellemeCallback = (adimSayisi: number) => void;

let dinleyiciAktif = false;

export async function adimTakibiniBaslat(onGuncelle: AdimGuncellemeCallback): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { CapacitorPedometer } = await import("@capgo/capacitor-pedometer");

    const check: any = await CapacitorPedometer.isAvailable();
    const destekleniyor = check?.value ?? check?.status ?? check?.available ?? check?.isAvailable ?? true;

    if (!destekleniyor) {
      console.warn("[Pedometer] Cihazda adım sayar donanımı bulunamadı.");
      return;
    }

    if (!dinleyiciAktif) {
      dinleyiciAktif = true;
      CapacitorPedometer.addListener("measurement", (event: any) => {
        const adim = event?.numberOfSteps ?? event?.steps ?? 0;
        if (typeof adim === "number" && adim > 0) {
          onGuncelle(adim);
        }
      });
    }
  } catch (err) {
    console.error("[Pedometer] Takip başlatma hatası:", err);
  }
}