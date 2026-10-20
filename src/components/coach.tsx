import { useState, useRef, type FormEvent } from "react";
import { kocSor } from "@/lib/coach";
import { profildenHesap } from "@/lib/engine";
import { useFit } from "@/lib/store";
import { Btn, PageTitle, Panel } from "@/components/ui";

export function CoachView() {
  const profil = useFit((s) => s.profil);
  const h = profil ? profildenHesap(profil) : null;

  const [soru, setSoru] = useState("");
  const [cevap, setCevap] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dinleniyor, setDinleniyor] = useState(false);
  const recognitionRef = useRef<any>(null);

  const sesleDinle = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHata("Tarayıcın ses tanıma özelliğini desteklemiyor.");
      return;
    }

    if (dinleniyor) {
      recognitionRef.current?.stop();
      setDinleniyor(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "tr-TR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setDinleniyor(true);
        setHata(null);
      };

      recognition.onresult = (event: any) => {
        const metin = event.results[0][0].transcript;
        setSoru(metin);
        soruyuGonder(metin);
      };

      recognition.onerror = () => {
        setDinleniyor(false);
        setHata("Ses algılanamadı, mikrofon iznini kontrol et.");
      };

      recognition.onend = () => {
        setDinleniyor(false);
      };

      recognition.start();
    } catch {
      setDinleniyor(false);
    }
  };

  async function soruyuGonder(metin: string) {
    const s = metin.trim();
    if (!s || yukleniyor) return;

    setYukleniyor(true);
    setHata(null);

    const baglam =
      profil && h
        ? `Kullanıcı Kilosu: ${profil.kilo}kg, Hedef Kilosu: ${profil.hedefKilo}kg, Boy: ${profil.boy}cm, Günlük Kalori: ${h.gunlukKalori} kcal`
        : "";

    try {
      const res = await kocSor({ data: { soru: s, baglam } });
      if (res.ok && res.metin) {
        setCevap(res.metin);
      } else {
        setHata("Koç şu an yanıt veremiyor. Tekrar dene.");
      }
    } catch {
      setHata("Bağlantı hatası oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    soruyuGonder(soru);
  }

  return (
    <div className="space-y-6">
      <PageTitle
        index="06"
        title="Koç"
        lede="Antrenman, beslenme veya aklına gelen herhangi bir şeyi özgürce sor."
      />

      <Panel>
        <form onSubmit={handleSubmit} className="p-2 space-y-4">
          <div>
            <textarea
              rows={4}
              value={soru}
              onChange={(e) => setSoru(e.target.value)}
              placeholder="Aklına takılan her şeyi yazabilirsin (örn: Göğüs çalışırken ön omuzum ağrıyor, ne yapmalıyım?)..."
              className="w-full resize-none rounded-2xl border border-line bg-cream p-4 text-sm text-ink outline-none transition focus:border-pine placeholder:text-muted"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={sesleDinle}
              className={`flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-xs font-semibold transition active:scale-95 ${
                dinleniyor
                  ? "bg-clay text-cream animate-pulse border-clay"
                  : "bg-paper text-ink hover:border-pine"
              }`}
            >
              <span>{dinleniyor ? "🔴 Dinleniyor..." : "🎙️ Sesle Sor"}</span>
            </button>

            <Btn type="submit" disabled={yukleniyor || !soru.trim()}>
              {yukleniyor ? "Koç Düşünüyor..." : "Sor"}
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
          <div className="whitespace-pre-line text-sm leading-relaxed text-ink p-2">
            {cevap}
          </div>
        </Panel>
      )}
    </div>
  );
}