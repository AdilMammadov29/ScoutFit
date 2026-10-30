import { useState } from "react";
import { useDiet, type GunDurumu, type KacamakNedeni } from "../lib/nutritionStore";
import {
  Users,
  Moon,
  Brain,
  Utensils,
  CheckCircle2,
  Scale,
  Cookie,
  ShieldAlert,
  Flame,
  X,
  Sparkles,
} from "lucide-react";

const NEDEN_LISTESI: { id: KacamakNedeni; baslik: string; Icon: any; aciklama: string }[] = [
  { id: "sosyal", baslik: "Sosyal Etkinlik / Dışarıda Yemek", Icon: Users, aciklama: "Arkadaş buluşması, kutlama veya dışarıda kontrolsüz menü" },
  { id: "tatli_gece", baslik: "Gece / Tatlı İsteği", Icon: Moon, aciklama: "Geç saatte atıştırma veya tatlı isteği" },
  { id: "stres_yorgunluk", baslik: "Stres / Yorgunluk", Icon: Brain, aciklama: "Yoğun gün, uykusuzluk veya duygusal yeme" },
  { id: "porsiyon", baslik: "Porsiyon Aşımı", Icon: Utensils, aciklama: "Yemek dengeliydi fakat porsiyon hedefin üzerine çıktı" },
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
    Icon: any;
  }[] = [
    {
      id: "temiz",
      baslik: "Plana Sadık",
      aciklama: "Kalori & makro korundu",
      Icon: CheckCircle2,
    },
    {
      id: "dengeli",
      baslik: "Dengeli",
      aciklama: "Ufak sapma oldu",
      Icon: Scale,
    },
    {
      id: "kacamak",
      baslik: "Kaçamak",
      aciklama: "Ağır öğün / fazla kalori",
      Icon: Cookie,
    },
  ];

  return (
    <>
      <div className="rounded-xl border border-line bg-surface p-5 font-sans">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <span className="text-[13px] text-muted block leading-none">
              Beslenme Disiplini
            </span>
            <h2 className="font-serif text-lg font-bold text-ink mt-0.5">Günün Değerlendirmesi</h2>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-ink">
            <Flame className="w-4 h-4 text-pine" />
            <span className="font-serif text-sm font-bold tabular-nums text-pine">{seri}</span>
            <span className="text-[12px] text-muted">gün seri</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {secenekler.map((item) => {
            const secili = bugunkuDurum === item.id;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSecim(item.id)}
                className={`flex min-h-[44px] flex-col rounded-xl border p-3.5 text-left transition-colors duration-150 active:scale-95 ${
                  secili
                    ? "border-pine bg-pine/10 text-ink shadow-sm"
                    : "border-line bg-paper/60 hover:border-muted/40 text-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${secili ? "bg-pine text-paper" : "bg-paper text-muted border border-line"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {secili && <span className="h-2 w-2 rounded-full bg-pine" />}
                </div>
                <div className="mt-2.5 font-serif text-[14px] font-bold text-ink">{item.baslik}</div>
                <p className="mt-0.5 text-[12px] text-muted leading-snug">
                  {item.aciklama}
                </p>
              </button>
            );
          })}
        </div>

        {/* Telafi Protokolü Kartı */}
        {bugunkuDurum === "kacamak" && telafiPlani && (
          <div className="mt-4 rounded-xl border border-clay/30 bg-clay/5 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-clay">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Telafi Planı</span>
              </span>
              <button
                type="button"
                onClick={() => setModalAcik(true)}
                className="text-[12px] text-muted hover:text-ink underline transition-colors"
              >
                Nedeni Güncelle
              </button>
            </div>
            {kacamakNotu && (
              <p className="mt-1.5 text-[12px] italic text-muted">
                "{kacamakNotu}"
              </p>
            )}
            <p className="mt-2 text-[13px] leading-relaxed text-ink/90">
              {telafiPlani}
            </p>
          </div>
        )}
      </div>

      {/* Kaçamak Detay & Telafi Modalı */}
      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm font-sans">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-ink">
                  Kaçamak Detayı & Telafi
                </h3>
                <p className="text-[12px] text-muted mt-0.5">
                  Sebebi belirleyip sonraki öğünlerde dengeliyoruz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAcik(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-paper border border-line text-muted hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Neden Seçenekleri */}
            <div className="mt-4 space-y-2">
              <span className="text-[12px] font-medium text-muted block">
                Neden Kaçamak Oldu?
              </span>
              <div className="grid grid-cols-1 gap-2">
                {NEDEN_LISTESI.map((n) => {
                  const aktif = secilenNeden === n.id;
                  const Icon = n.Icon;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setSecilenNeden(n.id)}
                      className={`flex min-h-[44px] items-start gap-3 rounded-xl border p-3 text-left transition-colors duration-150 ${
                        aktif
                          ? "border-pine bg-pine/10 text-ink shadow-sm"
                          : "border-line bg-paper/60 hover:border-muted/40 text-muted"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${aktif ? "bg-pine text-paper" : "bg-paper text-muted border border-line"}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-ink">{n.baslik}</div>
                        <div className="text-[12px] text-muted leading-tight mt-0.5">{n.aciklama}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kısa Not */}
            <div className="mt-4">
              <label className="block text-[12px] font-medium text-muted mb-1.5">
                Kısa Not (İsteğe bağlı)
              </label>
              <input
                type="text"
                placeholder="Örn: 2 dilim pizza ve asitli içecek"
                value={not}
                onChange={(e) => setNot(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted/60 focus:border-muted/60"
              />
            </div>

            {/* Butonlar */}
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-3.5">
              <button
                type="button"
                onClick={() => setModalAcik(false)}
                className="min-h-[44px] rounded-xl border border-line bg-paper px-4 py-2 text-[13px] font-medium text-muted hover:text-ink transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleKacamakOnayla}
                className="min-h-[44px] rounded-xl bg-pine px-4 py-2 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 active:scale-95"
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