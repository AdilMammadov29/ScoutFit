import { useEffect } from "react";
import * as PedometerPlugin from "@capgo/capacitor-pedometer";
const Pedometer: any = (PedometerPlugin as any).Pedometer || (PedometerPlugin as any).default || PedometerPlugin;
import { useActivity } from "@/lib/activityStore";
import { useNotifications } from "@/lib/notificationStore";
import { DietStreakCard } from "./dietStreakCard";
import type { Section } from "@/components/shell";

export function TodayView({ git }: { git: (s: Section) => void }) {
  const {
    bugunSuMl,
    hedefSuMl,
    suEkle,
    suSifirla,
    adimEkle,
    adimSifirla,
    istatistikleriGetir,
  } = useActivity();
  const { bildirimler, panelAcik, paneliAcKapat, okunduOlarakIsaretle } =
    useNotifications();
  const okunmamisSayisi = bildirimler.filter((b) => !b.okundu).length;

  const istatistik = istatistikleriGetir();
  const suYuzdesi = Math.min(100, Math.round((bugunSuMl / hedefSuMl) * 100));
  const maxAdim = Math.max(...istatistik.haftalikGunler.map((g) => g.adim), 10000);

  // Telefonun adım sensörünü otomatik dinle
  useEffect(() => {
    let dinleyiciId: any = null;

    async function baslat() {
      try {
        const pedo = Pedometer as any;
        if (!pedo) return;

        if (typeof pedo.checkPermissions === "function") {
          const check = await pedo.checkPermissions();
          if (
            check?.activityRecognition !== "granted" &&
            typeof pedo.requestPermissions === "function"
          ) {
            await pedo.requestPermissions();
          }
        }

        // Sensörü dinlemeye al
        if (typeof pedo.startPedometerUpdates === "function") {
          dinleyiciId = await pedo.startPedometerUpdates({
            update: (data: any) => {
              if (data?.numberOfSteps && data.numberOfSteps > 0) {
                adimEkle(Number(data.numberOfSteps));
              }
            },
          });
        }
      } catch (err) {
        console.log("Adım sensörü başlatılamadı:", err);
      }
    }

    baslat();

    return () => {
      try {
        const pedo = Pedometer as any;
        if (dinleyiciId && typeof pedo?.stopPedometerUpdates === "function") {
          pedo.stopPedometerUpdates().catch(() => {});
        }
      } catch {
        // cleanup sessizce geçsin
      }
    };
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Üst Bar: Başlık, Tarih ve Bildirim Butonu */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
            01 · Günlük Akış
          </span>
          <h2 className="font-display text-2xl font-bold text-ink">Bugün</h2>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={paneliAcKapat}
            className="relative rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink transition-all hover:bg-cream active:scale-95"
          >
            Bildirimler
            {okunmamisSayisi > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-clay px-1 text-[10px] font-bold text-white">
                {okunmamisSayisi}
              </span>
            )}
          </button>

          {/* Bildirim Paneli */}
          {panelAcik && (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-line bg-paper p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                <span className="text-xs font-bold text-ink">Sistem Bildirimleri</span>
                <button
                  type="button"
                  onClick={paneliAcKapat}
                  className="text-xs text-muted hover:text-ink"
                >
                  Kapat
                </button>
              </div>
              <div className="space-y-2">
                {bildirimler.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => okunduOlarakIsaretle(b.id)}
                    className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                      b.okundu
                        ? "border-line/40 bg-cream/20 text-muted"
                        : "border-pine/30 bg-pine/5 text-ink"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{b.baslik}</span>
                      <span className="text-[10px] text-muted">{b.zaman}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug">{b.mesaj}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidrasyon / Su Sayacı Kartı */}
      <div className="rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
              Hidrasyon
            </span>
            <h3 className="font-display text-lg font-bold text-ink">Günlük Su Takibi</h3>
          </div>
          <div className="text-right">
            <span className="font-mono text-xl font-bold tabular-nums text-pine">
              {bugunSuMl}
            </span>
            <span className="text-xs text-muted"> / {hedefSuMl} ml</span>
          </div>
        </div>

        {/* Dolum Çubuğu */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
            <div
              className="h-full bg-pine transition-all duration-300"
              style={{ width: `${suYuzdesi}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted">
            <span>Hedef: %{suYuzdesi}</span>
            <button
              type="button"
              onClick={suSifirla}
              className="hover:text-clay"
            >
              Sıfırla
            </button>
          </div>
        </div>

        {/* Su Ekleme Butonları */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => suEkle(250)}
            className="rounded-xl border border-line bg-cream/40 py-2.5 text-xs font-bold text-ink transition-all hover:bg-cream active:scale-95"
          >
            +250 ml (1 Bardak)
          </button>
          <button
            type="button"
            onClick={() => suEkle(500)}
            className="rounded-xl border border-line bg-cream/40 py-2.5 text-xs font-bold text-ink transition-all hover:bg-cream active:scale-95"
          >
            +500 ml (1 Şişe)
          </button>
        </div>
      </div>

      {/* Adım ve Mesafe İstatistikleri */}
      <div className="rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
              Aktivite Hacmi
            </span>
            <h3 className="font-display text-lg font-bold text-ink">Adım ve Mesafe</h3>
          </div>
          <button
            type="button"
            onClick={adimSifirla}
            className="text-[11px] font-mono text-muted hover:text-clay"
          >
            Sıfırla
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-line bg-cream/30 p-3">
            <span className="text-[10px] font-mono uppercase text-muted">Bugün</span>
            <div className="mt-1 font-mono text-base font-bold text-ink">
              {istatistik.gunlukAdim.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted">{istatistik.gunlukKm} km</span>
          </div>

          <div className="rounded-xl border border-line bg-cream/30 p-3">
            <span className="text-[10px] font-mono uppercase text-muted">Bu Hafta</span>
            <div className="mt-1 font-mono text-base font-bold text-ink">
              {istatistik.haftalikAdim.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted">{istatistik.haftalikKm} km</span>
          </div>

          <div className="rounded-xl border border-line bg-cream/30 p-3">
            <span className="text-[10px] font-mono uppercase text-muted">Bu Ay</span>
            <div className="mt-1 font-mono text-base font-bold text-ink">
              {istatistik.aylikAdim.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted">{istatistik.aylikKm} km</span>
          </div>
        </div>

        {/* Manuel Test & Ekleme Butonları */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => adimEkle(500)}
            className="rounded-xl border border-line bg-cream/40 py-2 text-xs font-bold text-ink transition-all hover:bg-cream active:scale-95"
          >
            +500 Adım
          </button>
          <button
            type="button"
            onClick={() => adimEkle(1000)}
            className="rounded-xl border border-line bg-cream/40 py-2 text-xs font-bold text-ink transition-all hover:bg-cream active:scale-95"
          >
            +1.000 Adım
          </button>
          <button
            type="button"
            onClick={() => adimEkle(5000)}
            className="rounded-xl border border-line bg-cream/40 py-2 text-xs font-bold text-ink transition-all hover:bg-cream active:scale-95"
          >
            +5.000 Adım
          </button>
        </div>

        {/* Haftalık Mini Bar Grafiği */}
        <div className="mt-5 border-t border-line/60 pt-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
            Haftalık Ritim
          </span>
          <div className="mt-3 flex items-end justify-between gap-1.5 h-16">
            {istatistik.haftalikGunler.map((g, idx) => {
              const yukseklik = Math.round((g.adim / maxAdim) * 100);
              return (
                <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-12 w-full items-end justify-center rounded-sm bg-cream">
                    <div
                      className="w-full rounded-sm bg-pine transition-all"
                      style={{ height: `${Math.max(8, yukseklik)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted">{g.gun}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Beslenme Disiplini ve Seri Takip Kartı */}
      <DietStreakCard />
    </div>
  );
}