import { useState, type FormEvent } from "react";
import { kocSor } from "@/lib/coach";
import { profildenHesap } from "@/lib/engine";
import { useFit } from "@/lib/store";
import { Btn, PageTitle, Panel } from "@/components/ui";

const ONERILER = [
  "Bugün antrenmanı kaçırdım, ne yapayım?",
  "Akşam biraz fazla kaçırdım, telafisi var mı?",
  "Göğüs gününde hangi hareketleri yapayım?",
  "Kilo vermem durdu, neyi değiştireyim?",
];

export function CoachView() {
  const profil = useFit((s) => s.profil);
  const h = profil ? profildenHesap(profil) : null;

  const [soru, setSoru] = useState("");
  const [cevap, setCevap] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function sor(metin: string) {
    const s = metin.trim();
    if (!s || yukleniyor) return;

    setYukleniyor(true);
    setHata(null);

    const baglam = profil && h
      ? `Kilo: ${profil.kilo}kg, Hedef Kilo: ${profil.hedefKilo}kg, Günlük Kalori: ${h.gunlukKalori} kcal`
      : "";

    try {
      const res = await kocSor({ data: { soru: s, baglam } });
      if (res.ok) {
        setCevap(res.metin);
      } else {
        setHata("Koç şu an yanıt veremiyor. Lütfen tekrar dene.");
      }
    } catch {
      setHata("Bağlantı kurulamadı.");
    } finally {
      setYukleniyor(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sor(soru);
  }

  return (
    <div className="space-y-6">
      <PageTitle
        index="06"
        title="Koç"
        lede="Antrenman, beslenme veya tempo hakkında aklına takılanı sor."
      />

      <Panel>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
              Koça Sor
            </label>
            <textarea
              rows={3}
              value={soru}
              onChange={(e) => setSoru(e.target.value)}
              placeholder="Örn: Bacak çalışırken dizim hafif ağrıyor, ne yapmalıyım?"
              className="w-full resize-none rounded-2xl border border-line bg-cream p-4 text-sm text-ink outline-none transition focus:border-pine"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {ONERILER.map((oneri) => (
              <button
                key={oneri}
                type="button"
                onClick={() => {
                  setSoru(oneri);
                  sor(oneri);
                }}
                className="rounded-xl border border-line bg-paper px-3 py-1.5 text-xs text-muted transition hover:border-pine hover:text-ink active:scale-95"
              >
                {oneri}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Btn type="submit" disabled={yukleniyor || !soru.trim()}>
              {yukleniyor ? "Koç Yanıtlıyor..." : "Sor"}
            </Btn>
          </div>
        </form>
      </Panel>

      {hata && (
        <div className="rounded-2xl border border-clay/30 bg-clay/10 p-4 text-xs text-clay">
          {hata}
        </div>
      )}

      {cevap && (
        <Panel title="Koçun Yanıtı">
          <div className="whitespace-pre-line text-sm leading-relaxed text-ink py-2">
            {cevap}
          </div>
        </Panel>
      )}
    </div>
  );
}