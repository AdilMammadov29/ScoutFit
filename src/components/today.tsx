import { useEffect, useState, useRef } from "react";
import { useActivity } from "@/lib/activityStore";
import { useNotifications } from "@/lib/notificationStore";
import { DietStreakCard } from "./dietStreakCard";
import type { Section } from "@/components/shell";

function mesafeMetre(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function kapEtiketi(ml: number): string {
  if (ml === 250) return "1 Bardak";
  if (ml === 330) return "Kutu/Şişe";
  if (ml === 500) return "Pet Şişe";
  if (ml === 750) return "Matara";
  if (ml === 1000) return "1L Şişe";
  return "Özel Kap";
}

export function TodayView({ git: _git }: { git?: (s: Section) => void }) {
  const {
    bugunSuMl,
    hedefSuMl,
    suEkle,
    suSifirla,
    favoriKaplar = [250, 330, 500, 750],
    favoriKapEkle,
    favoriKapSil,
    bugunAdim,
    adimGuncelle,
    bugunUykuSaat,
    uykuGuncelle,
    istatistikleriGetir,
  } = useActivity();

  const { bildirimler, panelAcik, paneliAcKapat, okunduOlarakIsaretle } = useNotifications();
  const okunmamisSayisi = bildirimler.filter((b) => !b.okundu).length;

  const [sensorDurumu, setSensorDurumu] = useState<string>("GPS başlatılıyor...");
  const [kapEkleAcik, setKapEkleAcik] = useState(false);
  const [yeniKapMl, setYeniKapMl] = useState("");
  const oncekiKonum = useRef<{ lat: number; lon: number } | null>(null);
  const adimRef = useRef<number>(bugunAdim);

  useEffect(() => {
    adimRef.current = bugunAdim;
  }, [bugunAdim]);

  const istatistik = istatistikleriGetir();
  const suYuzdesi = Math.min(100, Math.round((bugunSuMl / hedefSuMl) * 100));
  const maxAdim = Math.max(...istatistik.haftalikGunler.map((g) => g.adim), 10000);

  const handleYeniKapEkle = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(yeniKapMl, 10);
    if (parsed > 0 && favoriKapEkle) {
      favoriKapEkle(parsed);
      setYeniKapMl("");
      setKapEkleAcik(false);
    }
  };

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setSensorDurumu("Konum servisi yok");
      return;
    }
    setSensorDurumu("GPS Aktif · Canlı Takip");

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        if (accuracy > 35) return;
        if (speed !== null && speed > 5.5) return;

        if (oncekiKonum.current) {
          const farkMetre = mesafeMetre(
            oncekiKonum.current.lat,
            oncekiKonum.current.lon,
            latitude,
            longitude
          );
          if (farkMetre >= 4 && farkMetre < 100) {
            const atilanAdim = Math.round(farkMetre / 0.75);
            adimGuncelle(adimRef.current + atilanAdim);
            oncekiKonum.current = { lat: latitude, lon: longitude };
          }
        } else {
          oncekiKonum.current = { lat: latitude, lon: longitude };
        }
      },
      (err) => {
        if (err.code === 1) setSensorDurumu("Konum izni gerekli");
        else setSensorDurumu("GPS aranıyor...");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [adimGuncelle]);

  return (
    <div className="space-y-6 pb-12">
      {/* Üst Bar */}
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
            className="relative rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink hover:bg-cream"
          >
            Bildirimler
            {okunmamisSayisi > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-clay px-1 text-[10px] font-bold text-white">
                {okunmamisSayisi}
              </span>
            )}
          </button>

          {panelAcik && (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-line bg-paper p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                <span className="text-xs font-bold text-ink">Sistem Bildirimleri</span>
                <button type="button" onClick={paneliAcKapat} className="text-xs text-muted hover:text-ink">
                  Kapat
                </button>
              </div>
              <div className="space-y-2">
                {bildirimler.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => okunduOlarakIsaretle(b.id)}
                    className={`cursor-pointer rounded-xl border p-2.5 ${
                      b.okundu ? "border-line/40 bg-cream/20 text-muted" : "border-pine/30 bg-pine/5 text-ink"
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

      {/* Akıllı Su Takibi */}
      <div className="rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Hidrasyon</span>
            <h3 className="font-display text-lg font-bold text-ink">Akıllı Su Takibi</h3>
          </div>
          <div className="text-right">
            <span className="font-mono text-xl font-bold tabular-nums text-pine">{bugunSuMl}</span>
            <span className="text-xs text-muted"> / {hedefSuMl} ml</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
            <div className="h-full bg-pine transition-all duration-300" style={{ width: `${suYuzdesi}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted">
            <span>Hedef: %{suYuzdesi}</span>
            <button type="button" onClick={suSifirla} className="hover:text-clay">Sıfırla</button>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted">Favori Kaplarım</span>
            <button
              type="button"
              onClick={() => setKapEkleAcik((p) => !p)}
              className="text-xs font-semibold text-pine hover:underline"
            >
              {kapEkleAcik ? "İptal" : "+ Yeni Kap Ekle"}
            </button>
          </div>

          {kapEkleAcik && (
            <form onSubmit={handleYeniKapEkle} className="mb-3 flex items-center gap-2">
              <input
                type="number"
                placeholder="Örn: 650"
                value={yeniKapMl}
                onChange={(e) => setYeniKapMl(e.target.value)}
                className="w-32 rounded-xl border border-line bg-cream/40 px-3 py-1.5 text-xs text-ink outline-none focus:border-pine"
                autoFocus
              />
              <span className="text-xs text-muted">ml</span>
              <button type="submit" className="rounded-xl bg-pine px-3 py-1.5 text-xs font-semibold text-white">
                Kaydet
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {favoriKaplar.map((ml) => (
              <div key={ml} className="relative group">
                <button
                  type="button"
                  onClick={() => suEkle(ml)}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-line bg-cream/40 py-2.5 px-2 hover:bg-cream"
                >
                  <span className="font-mono text-xs font-bold text-ink">+{ml} ml</span>
                  <span className="mt-0.5 text-[10px] text-muted truncate max-w-full">{kapEtiketi(ml)}</span>
                </button>
                {favoriKapSil && favoriKaplar.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      favoriKapSil(ml);
                    }}
                    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-line/80 text-[10px] text-muted hover:bg-clay hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uyku & Toparlanma Kartı */}
      <div className="rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Toparlanma & Rejenerasyon</span>
            <h3 className="font-display text-lg font-bold text-ink">Dün Gece Uyku</h3>
          </div>
          <div className="text-right">
            <span className="font-mono text-xl font-bold tabular-nums text-pine">
              {bugunUykuSaat ? `${bugunUykuSaat} Saat` : "Girilmedi"}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-2">
            Kaç saat uyudun?
          </span>
          <div className="grid grid-cols-5 gap-2">
            {[5, 6, 7, 8, 9].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => uykuGuncelle(s)}
                className={`flex flex-col items-center justify-center rounded-xl border py-2.5 text-xs font-bold transition-all active:scale-95 ${
                  bugunUykuSaat === s
                    ? "border-pine bg-pine text-cream shadow-sm"
                    : "border-line bg-cream/30 text-ink hover:bg-cream"
                }`}
              >
                <span>{s === 9 ? "9+" : s}</span>
                <span className="text-[9px] font-normal opacity-80">saat</span>
              </button>
            ))}
          </div>
          {bugunUykuSaat && (
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              {bugunUykuSaat < 7
                ? "⚠️ Yetersiz uyku: Kortizol seviyesi yüksek olabilir; açlık ataklarına dikkat et ve hafif antrenman seç."
                : "✅ İdeal toparlanma: Merkezi sinir sistemi ve kas dokusu tamamen dinlendi."}
            </p>
          )}
        </div>
      </div>

      {/* Aktivite Hacmi */}
      <div className="rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Aktivite Hacmi</span>
            <h3 className="font-display text-lg font-bold text-ink">Adım ve Mesafe</h3>
          </div>
          <span className="rounded-full bg-pine/10 px-2.5 py-1 text-[10px] font-medium text-pine">
            {sensorDurumu}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-line bg-cream/30 p-3">
            <span className="text-[10px] font-mono uppercase text-muted">Bugün</span>
            <div className="mt-1 font-mono text-base font-bold text-ink">{istatistik.gunlukAdim.toLocaleString()}</div>
            <span className="text-[11px] text-muted">{istatistik.gunlukKm} km</span>
          </div>

          <div className="rounded-xl border border-line bg-cream/30 p-3">
            <span className="text-[10px] font-mono uppercase text-muted">Bu Hafta</span>
            <div className="mt-1 font-mono text-base font-bold text-ink">{istatistik.haftalikAdim.toLocaleString()}</div>
            <span className="text-[11px] text-muted">{istatistik.haftalikKm} km</span>
          </div>

          <div className="rounded-xl border border-line bg-cream/30 p-3">
            <span className="text-[10px] font-mono uppercase text-muted">Bu Ay</span>
            <div className="mt-1 font-mono text-base font-bold text-ink">{istatistik.aylikAdim.toLocaleString()}</div>
            <span className="text-[11px] text-muted">{istatistik.aylikKm} km</span>
          </div>
        </div>

        <div className="mt-5 border-t border-line/60 pt-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted">Haftalık Ritim</span>
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

      <DietStreakCard />
    </div>
  );
}