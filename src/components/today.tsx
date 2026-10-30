import React, { useEffect, useState } from "react";
import { useActivity } from "@/lib/activityStore";
import { useNotifications } from "@/lib/notificationStore";
import { DietStreakCard } from "./dietStreakCard";
import type { Section } from "./shell";
import { Capacitor } from "@capacitor/core";
import {
  Bell,
  Droplets,
  Moon,
  Footprints,
  Plus,
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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
    bugunUykuSaat,
    uykuGuncelle,
    istatistikleriGetir,
  } = useActivity();

  const { bildirimler, panelAcik, paneliAcKapat, okunduOlarakIsaretle } = useNotifications();
  const okunmamisSayisi = bildirimler.filter((b: any) => !b.okundu).length;

  const [sensorDurumu, setSensorDurumu] = useState<string>("Sensör Hazırlanıyor...");
  const [kapEkleAcik, setKapEkleAcik] = useState(false);
  const [yeniKapMl, setYeniKapMl] = useState("");

  const isNative = Capacitor.isNativePlatform();

  const istatistik = istatistikleriGetir();
  const suYuzdesi = Math.min(100, Math.round((bugunSuMl / hedefSuMl) * 100));
  const maxAdim = Math.max(...istatistik.haftalikGunler.map((g: any) => g.adim), 10000);

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
    if (isNative) {
      setSensorDurumu("Donanım Sayacı Aktif");
    } else {
      setSensorDurumu("Tarayıcı Simülasyonu");
    }
  }, [isNative]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Üst Başlık & Bildirim Alanı */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="text-[13px] font-medium text-muted block">
            Günlük Akış
          </span>
          <h1 className="font-serif text-2xl font-bold text-ink">Bugün</h1>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={paneliAcKapat}
            className="relative flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink hover:border-muted/40 transition-colors duration-150"
          >
            <Bell className="w-4 h-4 text-muted" />
            <span>Bildirimler</span>
            {okunmamisSayisi > 0 && (
              <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-clay px-1 text-[11px] font-semibold text-paper">
                {okunmamisSayisi}
              </span>
            )}
          </button>

          {panelAcik && (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-line bg-surface p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
                <span className="text-[13px] font-semibold text-ink">Sistem Bildirimleri</span>
                <button
                  type="button"
                  onClick={paneliAcKapat}
                  className="rounded-full p-1 text-muted hover:text-ink hover:bg-paper transition-colors duration-150"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {bildirimler.map((b: any) => (
                  <div
                    key={b.id}
                    onClick={() => okunduOlarakIsaretle(b.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors duration-150 ${
                      b.okundu
                        ? "border-line/60 bg-paper/40 text-muted"
                        : "border-pine/30 bg-pine/5 text-ink"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold">{b.baslik}</span>
                      <span className="text-[11px] text-muted">{b.zaman}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{b.mesaj}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Su Takibi Kartı */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine/10 text-pine">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[13px] text-muted block leading-none">Hidrasyon</span>
              <h2 className="font-serif text-lg font-bold text-ink mt-0.5">Su Takibi</h2>
            </div>
          </div>
          <div className="text-right">
            <span className="font-serif text-2xl font-bold tabular-nums text-pine">{bugunSuMl}</span>
            <span className="text-[13px] text-muted"> / {hedefSuMl} ml</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
            <div
              className="h-full bg-pine transition-all duration-300 rounded-full"
              style={{ width: `${suYuzdesi}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[13px] text-muted">
            <span>Hedef: %{suYuzdesi}</span>
            <button
              type="button"
              onClick={suSifirla}
              className="flex items-center gap-1 hover:text-clay transition-colors duration-150"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sıfırla</span>
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-line/60 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-muted">Kayıtlı Kaplar</span>
            <button
              type="button"
              onClick={() => setKapEkleAcik((p) => !p)}
              className="flex items-center gap-1 text-[13px] font-medium text-pine hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{kapEkleAcik ? "İptal" : "Yeni Kap"}</span>
            </button>
          </div>

          {kapEkleAcik && (
            <form onSubmit={handleYeniKapEkle} className="mb-3 flex items-center gap-2">
              <input
                type="number"
                placeholder="Örn: 650"
                value={yeniKapMl}
                onChange={(e) => setYeniKapMl(e.target.value)}
                className="w-32 rounded-xl border border-line bg-paper px-3 py-2 text-[14px] text-ink outline-none focus:border-pine"
                autoFocus
              />
              <span className="text-[13px] text-muted">ml</span>
              <button
                type="submit"
                className="rounded-lg bg-pine px-3 py-2 text-[13px] font-medium text-paper transition-opacity hover:opacity-95"
              >
                Kaydet
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {favoriKaplar.map((ml: number) => (
              <div key={ml} className="relative group">
                <button
                  type="button"
                  onClick={() => suEkle(ml)}
                  className="flex min-h-[44px] w-full flex-col items-center justify-center rounded-xl border border-line bg-paper/60 py-2 px-3 hover:border-muted/40 transition-colors duration-150"
                >
                  <span className="font-serif text-sm font-semibold text-ink">+{ml} ml</span>
                  <span className="text-[12px] text-muted truncate max-w-full">{kapEtiketi(ml)}</span>
                </button>
                {favoriKapSil && favoriKaplar.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      favoriKapSil(ml);
                    }}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-paper border border-line text-muted hover:border-clay hover:text-clay transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uyku Kartı */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine/10 text-pine">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[13px] text-muted block leading-none">Toparlanma</span>
              <h2 className="font-serif text-lg font-bold text-ink mt-0.5">Dün Gece Uyku</h2>
            </div>
          </div>
          <div className="text-right">
            <span className="font-serif text-2xl font-bold tabular-nums text-pine">
              {bugunUykuSaat ? `${bugunUykuSaat} Saat` : "Girilmedi"}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-[13px] text-muted block mb-2.5">
            Kaç saat uyudun?
          </span>
          <div className="grid grid-cols-5 gap-2">
            {[5, 6, 7, 8, 9].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => uykuGuncelle(s)}
                className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border text-[13px] font-semibold transition-all duration-150 active:scale-95 ${
                  bugunUykuSaat === s
                    ? "border-pine bg-pine text-paper"
                    : "border-line bg-paper/60 text-ink hover:border-muted/40"
                }`}
              >
                <span>{s === 9 ? "9+" : s}</span>
                <span className="text-[11px] font-normal opacity-80">saat</span>
              </button>
            ))}
          </div>
          {bugunUykuSaat && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-paper/50 p-3 border border-line/60">
              {bugunUykuSaat < 7 ? (
                <>
                  <AlertCircle className="w-4 h-4 text-clay shrink-0 mt-0.5" />
                  <p className="text-[13px] leading-relaxed text-muted">
                    Yetersiz uyku: Kortizol seviyesi yüksek olabilir; açlık ataklarına dikkat et ve hafif antrenman seç.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-pine shrink-0 mt-0.5" />
                  <p className="text-[13px] leading-relaxed text-muted">
                    İdeal toparlanma: Merkezi sinir sistemi ve kas dokusu tamamen dinlendi.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Adım ve Aktivite Hacmi Kartı */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine/10 text-pine">
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[13px] text-muted block leading-none">Aktivite</span>
              <h2 className="font-serif text-lg font-bold text-ink mt-0.5">Adım ve Mesafe</h2>
            </div>
          </div>
          <span className="rounded-lg border border-pine/30 bg-pine/10 px-2.5 py-1 text-[12px] font-medium text-pine">
            {sensorDurumu}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-line bg-paper/60 p-3">
            <span className="text-[12px] text-muted block">Bugün</span>
            <div className="mt-1 font-serif text-lg font-bold text-ink">
              {istatistik.gunlukAdim.toLocaleString()}
            </div>
            <span className="text-[12px] text-muted mt-0.5 block">{istatistik.gunlukKm} km</span>
          </div>

          <div className="rounded-xl border border-line bg-paper/60 p-3">
            <span className="text-[12px] text-muted block">Bu Hafta</span>
            <div className="mt-1 font-serif text-lg font-bold text-ink">
              {istatistik.haftalikAdim.toLocaleString()}
            </div>
            <span className="text-[12px] text-muted mt-0.5 block">{istatistik.haftalikKm} km</span>
          </div>

          <div className="rounded-xl border border-line bg-paper/60 p-3">
            <span className="text-[12px] text-muted block">Bu Ay</span>
            <div className="mt-1 font-serif text-lg font-bold text-ink">
              {istatistik.aylikAdim.toLocaleString()}
            </div>
            <span className="text-[12px] text-muted mt-0.5 block">{istatistik.aylikKm} km</span>
          </div>
        </div>

        <div className="mt-5 border-t border-line/60 pt-4">
          <span className="text-[13px] font-medium text-muted block mb-3">Haftalık Ritim</span>
          <div className="flex items-end justify-between gap-2 h-20 pt-2">
            {istatistik.haftalikGunler.map((g: any, idx: number) => {
              const yukseklik = Math.round((g.adim / maxAdim) * 100);
              return (
                <div key={idx} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-14 w-full items-end justify-center rounded-lg bg-paper">
                    <div
                      className="w-full rounded-lg bg-pine transition-all duration-300"
                      style={{ height: `${Math.max(8, yukseklik)}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-muted">{g.gun}</span>
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