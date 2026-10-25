import { useState } from "react";
import { useDiet, type GunDurumu, type KacamakNedeni } from "../lib/nutritionStore";

const NEDEN_LISTESI: { id: KacamakNedeni; baslik: string; icon: string; aciklama: string }[] = [
  { id: "sosyal", baslik: "Sosyal Etkinlik / Dışarıda Yemek", icon: "👥", aciklama: "Arkadaş buluşması, kutlama veya dışarıda kontrolsüz menü" },
  { id: "tatli_gece", baslik: "Gece / Tatlı Krizi", icon: "🍫", aciklama: "Geç saatte atıştırma veya tatlı isteğine yenik düşme" },
  { id: "stres_yorgunluk", baslik: "Stres / Yorgunluk", icon: "🧠", aciklama: "Yoğun gün, uykusuzluk veya duygusal yeme" },
  { id: "porsiyon", baslik: "Porsiyon Aşımı", icon: "🍛", aciklama: "Yemek sağlıklıydı ama porsiyon hedefin çok üzerine çıktı" },
];

export function DietStreakCard() {
  const { seri, bugunkuDurum, telafiPlani, kacamakNotu, durumSec } = useDiet();

  const [modalAcik, setModalAcik] = useState(false);
  const [secilenNeden, setSecilenNeden] = useState<KacamakNedeni>("sosyal");
  const [not, setNot] = useState("");

  const handleSecim = (durum: GunDurumu) => {
    if (durum === "kacamak") {
      setModalAcik(true);
    } else {
      durumSec(durum);
    }
  };

  const handleKacamakOnayla = () => {
    durumSec("kacamak", { neden: secilenNeden, not: not.trim() || undefined });
    setModalAcik(false);
    setNot("");
  };

  const secenekler: {
    id: GunDurumu;
    baslik: string;
    aciklama: string;
    emoji: string;
  }[] = [
    {
      id: "temiz",
      baslik: "Plana Sadık",
      aciklama: "Kalori & makro korundu",
      emoji: "Diyet",
    },
    {
      id: "dengeli",
      baslik: "Dengeli",
      aciklama: "Ufak sapma oldu",
      emoji: "⚖️",
    },
    {
      id: "kacamak",
      baslik: "Kaçamak",
      aciklama: "Ağır öğün / fazla kalori",
      emoji: "🍕",
    },
  ];

  return (
    <>
      <div className="rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
              Beslenme Disiplini
            </span>
            <h3 className="font-display text-lg font-bold text-ink">Günün Değerlendirmesi</h3>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-ink">
            <span className="text-sm"></span>
            <span className="font-mono text-sm font-bold tabular-nums">{seri}</span>
            <span className="text-[11px] text-muted">gün seri</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {secenekler.map((item) => {
            const secili = bugunkuDurum === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSecim(item.id)}
                className={`flex flex-col rounded-xl border p-3 text-left transition-all active:scale-95 ${
                  secili
                    ? "border-pine bg-pine/10 text-ink shadow-sm"
                    : "border-line bg-cream/30 hover:bg-cream/60 text-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{item.emoji}</span>
                  {secili && <span className="h-2 w-2 rounded-full bg-pine" />}
                </div>
                <div className="mt-2 text-xs font-bold text-ink">{item.baslik}</div>
                <p className="mt-0.5 text-[10px] text-muted leading-tight">
                  {item.aciklama}
                </p>
              </button>
            );
          })}
        </div>

        {/* Telafi Protokolü Kartı */}
        {bugunkuDurum === "kacamak" && telafiPlani && (
          <div className="mt-4 rounded-xl border border-clay/30 bg-clay/10 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-clay">
                <span>🛡️</span>
                <span>Telafi Protokolü</span>
              </span>
              <button
                type="button"
                onClick={() => setModalAcik(true)}
                className="text-[10px] text-muted hover:text-ink underline"
              >
                Nedeni Güncelle
              </button>
            </div>
            {kacamakNotu && (
              <p className="mt-1 text-[11px] italic text-muted">
                "{kacamakNotu}"
              </p>
            )}
            <p className="mt-2 text-xs leading-relaxed text-ink">
              {telafiPlani}
            </p>
          </div>
        )}
      </div>

      {/* Kaçamak Detay & Telafi Modalı */}
      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h4 className="font-display text-base font-bold text-ink">
                  Kaçamak Detayı & Telafi
                </h4>
                <p className="text-[11px] text-muted">
                  Moral bozmak yok; sebebi belirleyip yarın dengeliyoruz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAcik(false)}
                className="text-lg text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            {/* Neden Seçenekleri */}
            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                Neden Kaçamak Oldu?
              </span>
              <div className="grid grid-cols-1 gap-2">
                {NEDEN_LISTESI.map((n) => {
                  const aktif = secilenNeden === n.id;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setSecilenNeden(n.id)}
                      className={`flex items-start gap-3 rounded-xl border p-2.5 text-left transition-all ${
                        aktif
                          ? "border-pine bg-pine/10 text-ink shadow-sm"
                          : "border-line bg-cream/30 hover:bg-cream/60 text-muted"
                      }`}
                    >
                      <span className="text-xl">{n.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-ink">{n.baslik}</div>
                        <div className="text-[10px] text-muted leading-tight">{n.aciklama}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kısa Not */}
            <div className="mt-4">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-muted mb-1">
                Kısa Not (İsteğe bağlı)
              </label>
              <input
                type="text"
                placeholder="Örn: 2 dilim pizza ve kola"
                value={not}
                onChange={(e) => setNot(e.target.value)}
                className="w-full rounded-xl border border-line bg-cream/40 px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-pine focus:outline-none"
              />
            </div>

            {/* Butonlar */}
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-line/60 pt-3">
              <button
                type="button"
                onClick={() => setModalAcik(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-muted hover:bg-cream"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleKacamakOnayla}
                className="rounded-xl bg-pine px-4 py-2 text-xs font-semibold text-white shadow-sm transition-transform active:scale-95"
              >
                Telafi Planı Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}