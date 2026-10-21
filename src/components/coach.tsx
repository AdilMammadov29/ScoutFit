import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { kocSor } from "@/lib/coach";
import { profildenHesap } from "@/lib/engine";
import { useFit } from "@/lib/store";

const HIZLI_SORULAR = [
  "Bugün antrenmanı kaçırdım, telafi etmeli miyim?",
  "Akşam biraz fazla kaçırdım, yarın ne yapayım?",
  "Antrenman öncesi ne yemeliyim?",
  "Kilo verme sürecim yavaşladı, ne önerirsin?",
];

export function CoachView() {
  const profil = useFit((s) => s.profil);
  const h = profil ? profildenHesap(profil) : null;

  const [soru, setSoru] = useState("");
  const [sonSoru, setSonSoru] = useState<string | null>(null);
  const [cevap, setCevap] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dinleniyor, setDinleniyor] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
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

    setSonSoru(s);
    setSoru("");
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
        setHata("Koç şu an yanıt veremiyor. Lütfen tekrar dene.");
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

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      soruyuGonder(soru);
    }
  }

  const kopyala = () => {
    if (!cevap) return;
    navigator.clipboard.writeText(cevap);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Başlık & Durum Kartı */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">06</span>
            <span className="text-muted/40">•</span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">ScoutFit AI Koç</h1>
          </div>
          <p className="mt-1 text-xs text-muted">
            Antrenman, beslenme veya hedeflerin hakkında aklına gelen her şeyi sor.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-pine/30 bg-pine/10 px-3 py-1 text-xs font-medium text-pine">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pine"></span>
          </span>
          Groq AI Aktif
        </div>
      </div>

      {/* Modern Entegre Soru Alanı */}
      <div className="group relative rounded-2xl border border-line bg-paper/60 p-2 shadow-sm transition-all duration-200 focus-within:border-pine focus-within:ring-2 focus-within:ring-pine/20 hover:border-line/80">
        <textarea
          rows={3}
          value={soru}
          onChange={(e) => setSoru(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Koça bir şey sor... (Enter ile gönder, Shift + Enter ile alt satır)"
          className="w-full resize-none bg-transparent px-3 pt-2 text-sm text-ink outline-none placeholder:text-muted/70"
        />

        <div className="mt-2 flex items-center justify-between border-t border-line/40 px-2 pt-2">
          {/* Mikrofon Butonu */}
          <button
            type="button"
            onClick={sesleDinle}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              dinleniyor
                ? "bg-clay/20 text-clay ring-1 ring-clay animate-pulse"
                : "text-muted hover:bg-cream hover:text-ink"
            }`}
          >
            <span>{dinleniyor ? "🔴" : "🎙️"}</span>
            <span>{dinleniyor ? "Dinleniyor..." : "Sesle Sor"}</span>
          </button>

          {/* Gönder Butonu */}
          <button
            type="button"
            onClick={() => soruyuGonder(soru)}
            disabled={yukleniyor || !soru.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-pine px-4 py-1.5 text-xs font-semibold text-cream shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
          >
            {yukleniyor ? (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cream [animation-delay:-0.3s]"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cream [animation-delay:-0.15s]"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cream"></span>
              </span>
            ) : (
              <>
                <span>Gönder</span>
                <span className="text-xs">↗</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hızlı Öneri Hapları */}
      {!cevap && !yukleniyor && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Önerilen Başlıklar</p>
          <div className="flex flex-wrap gap-2">
            {HIZLI_SORULAR.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSoru(item);
                  soruyuGonder(item);
                }}
                className="rounded-xl border border-line bg-paper/80 px-3 py-1.5 text-xs text-muted transition hover:border-pine/60 hover:bg-cream hover:text-ink active:scale-95"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hata Bildirimi */}
      {hata && (
        <div className="flex items-center gap-2 rounded-xl border border-clay/30 bg-clay/10 p-3 text-xs text-clay">
          <span>⚠️</span>
          <span>{hata}</span>
        </div>
      )}

      {/* Yükleniyor Göstergesi */}
      {yukleniyor && (
        <div className="rounded-2xl border border-line/60 bg-paper/40 p-5 space-y-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-pine/20 flex items-center justify-center text-xs">✨</div>
            <span className="text-xs font-medium text-muted">Koç stratejini hazırlıyor...</span>
          </div>
          <div className="space-y-2 pt-1">
            <div className="h-2.5 w-3/4 rounded-full bg-line/60"></div>
            <div className="h-2.5 w-1/2 rounded-full bg-line/40"></div>
          </div>
        </div>
      )}

      {/* Yapay Zeka Yanıt Kartı */}
      {cevap && !yukleniyor && (
        <div className="relative overflow-hidden rounded-2xl border border-line/80 bg-paper/90 shadow-sm backdrop-blur transition-all">
          {/* Üst Bilgi Satırı */}
          <div className="flex items-center justify-between border-b border-line/40 bg-cream/30 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pine text-cream text-xs font-bold shadow-sm">
                ✦
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Koçun Tavsiyesi</p>
                {sonSoru && (
                  <p className="line-clamp-1 text-[11px] text-muted italic">"{sonSoru}"</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={kopyala}
              className="rounded-lg border border-line/60 bg-paper px-2.5 py-1 text-[11px] font-medium text-muted hover:border-pine hover:text-ink transition active:scale-95"
            >
              {kopyalandi ? "✓ Kopyalandı" : "Kopyala"}
            </button>
          </div>

          {/* Yanıt İçeriği */}
          <div className="p-5 text-sm leading-relaxed text-ink whitespace-pre-line">
            {cevap}
          </div>
        </div>
      )}
    </div>
  );
}