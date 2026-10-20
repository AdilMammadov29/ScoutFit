import { useState } from "react";
import { PageTitle, Panel } from "./ui";
import { useFit } from "@/lib/store";
import { useOgun } from "@/lib/ogun";

export function CoachView() {
  const profil = useFit((s) => s.profil);
  const ogunler = useOgun((s) => s.ogunler);

  const [tavsiye, setTavsiye] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const telafiUret = (tip: "kacirma" | "kacamak" | "yorgunluk" | "reset") => {
    setYukleniyor(true);
    setTavsiye(null);

    setTimeout(() => {
      if (tip === "kacirma") {
        setTavsiye(
          "Bir antrenmanı kaçırmak hiçbir şeyi bozmaz. Bugünkü kalori alımını bakım seviyesinde tut. Yarın ana bileşik hareketlerini (Göğüs-Sırt veya Bacak-Omuz) birleştirerek 45 dakikalık, hareket başına 3 setlik yoğun bir telafi antrenmanı yap."
        );
      } else if (tip === "kacamak") {
        setTavsiye(
          "Kaçamak kilo yapmaz, sadece su tutar. Bugün en az 3.5 litre su içerek sodyumu at. Önümüzdeki 2 gün karbonhidratı porsiyon başına 30-40g kıs ve günlük adımlarına 25 dakikalık tempolu yürüyüş ekle."
        );
      } else if (tip === "yorgunluk") {
        setTavsiye(
          "Merkezi sinir sistemi yorgunluğu tespit edildi. Bugün tükenişe (RPE 10) gitme. Ağırlıkları %30 düşürerek kan akışını artıran hafif bir 'deload' seansı yap ve bu gece 8 saat deliksiz uyu."
        );
      } else {
        setTavsiye(
          "Günün dengelendi. Su hedefin 3 litre. Vücut ağırlığının 2 katı protein almaya odaklan, lifli sebzelere öncelik ver ve yarınki antrenmanına sıfırdan odaklan."
        );
      }
      setYukleniyor(false);
    }, 350);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        index="06"
        title="ScoutFit AI Koç"
        lede="Performans, beslenme ve telafi asistanın."
      />

      {/* Koç Durum Rozeti */}
      <div className="flex items-center justify-between rounded-2xl border border-line bg-cream p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 items-center justify-center">
            <span className="absolute h-3 w-3 rounded-full bg-pine opacity-75 animate-ping" />
            <span className="relative h-2 w-2 rounded-full bg-pine" />
          </div>
          <span className="text-xs font-semibold text-ink">Koç hazır, durumunu analiz ediyor</span>
        </div>
        <span className="text-xs font-mono text-muted uppercase">Canlı Analiz</span>
      </div>

      {/* Kaçamak / Telafi Butonları */}
      <Panel>
        <div className="p-6">
          <h3 className="text-sm font-bold text-ink">Hızlı Durum & Kaçamak Bildirimi</h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Hedefinin dışına çıktıysan endişelenme, durumunu seç ve dengeleme planını al:
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => telafiUret("kacirma")}
              disabled={yukleniyor}
              className="rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-pine hover:bg-cream active:scale-95 text-xs font-bold text-ink"
            >
              🏋️‍♂️ Antrenmanı Kaçırdım
            </button>

            <button
              onClick={() => telafiUret("kacamak")}
              disabled={yukleniyor}
              className="rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-pine hover:bg-cream active:scale-95 text-xs font-bold text-ink"
            >
              🍕 Fazla Kalori / Kaçamak Yaptım
            </button>

            <button
              onClick={() => telafiUret("yorgunluk")}
              disabled={yukleniyor}
              className="rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-pine hover:bg-cream active:scale-95 text-xs font-bold text-ink"
            >
              ⚡ Enerjim Düşük / Yorgunum
            </button>

            <button
              onClick={() => telafiUret("reset")}
              disabled={yukleniyor}
              className="rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-pine hover:bg-cream active:scale-95 text-xs font-bold text-ink"
            >
              🔄 Günü Dengele & Sıfırla
            </button>
          </div>
        </div>
      </Panel>

      {/* Tavsiye & Çözüm Kartı */}
      <Panel>
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-pine">
              Koçun Stratejisi & Tavsiyeleri
            </span>
            {yukleniyor && (
              <span className="text-xs font-mono text-muted animate-pulse">
                Koç senin için en iyi stratejiyi hesaplıyor...
              </span>
            )}
          </div>

          <div className="mt-4">
            {tavsiye ? (
              <div className="rounded-2xl border border-pine/30 bg-pine/10 p-5 text-xs leading-relaxed text-ink font-medium animate-fade-in">
                <span className="font-bold text-pine block mb-1">💡 Çözüm Protokolü:</span>
                {tavsiye}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-muted leading-relaxed">
                Yukarıdaki butonlardan bir durum seç, telafi stratejisi hemen oluşturulsun.
              </p>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}