import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { kocSor } from "@/lib/coach";
import { profildenHesap } from "@/lib/engine";
import { useFit } from "@/lib/store";

interface Mesaj {
  id: string;
  gonderen: "kullanici" | "koc";
  metin: string;
  zaman: string;
}

const HIZLI_SORULAR = [
  "Bugün antrenmanı kaçırdım, telafi etmeli miyim?",
  "Akşam biraz fazla kaçırdım, yarın ne yapayım?",
  "Antrenman öncesi ne yemeliyim?",
  "Kilo verme sürecim yavaşladı, ne önerirsin?",
];

export function CoachView() {
  const profil = useFit((s) => s.profil);
  const h = profil ? profildenHesap(profil) : null;

  const [mesajlar, setMesajlar] = useState<Mesaj[]>([
    {
      id: "ilk-karsilama",
      gonderen: "koc",
      metin: "Selam! Ben ScoutFit Koçun. Antrenman programın, beslenmen veya günlük hedeflerin hakkında aklına gelen her şeyi sorabilirsin.",
      zaman: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [soru, setSoru] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dinleniyor, setDinleniyor] = useState(false);
  const [kopyalananId, setKopyalananId] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const mesajSonuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mesajSonuRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar, yukleniyor]);

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

    const simdikiZaman = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const yeniKullaniciMesaji: Mesaj = {
      id: Date.now().toString(),
      gonderen: "kullanici",
      metin: s,
      zaman: simdikiZaman,
    };

    setMesajlar((onceki) => [...onceki, yeniKullaniciMesaji]);
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
        const koctanGelen: Mesaj = {
          id: (Date.now() + 1).toString(),
          gonderen: "koc",
          metin: res.metin,
          zaman: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMesajlar((onceki) => [...onceki, koctanGelen]);
      } else {
        setHata("Koç şu an yanıt veremiyor. Lütfen tekrar dene.");
      }
    } catch {
      setHata("Bağlantı hatası oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      soruyuGonder(soru);
    }
  }

  const kopyala = (id: string, metin: string) => {
    navigator.clipboard.writeText(metin);
    setKopyalananId(id);
    setTimeout(() => setKopyalananId(null), 2000);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-3xl flex-col space-y-4">
      {/* Başlık & Durum Kartı */}
      <div className="flex flex-col gap-3 border-b border-line/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Mesaj Akış Alanı */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {mesajlar.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.gonderen === "kullanici" ? "items-end" : "items-start"
            }`}
          >
            <div className="mb-1 flex items-center gap-2 px-1 text-[11px] text-muted">
              <span>{m.gonderen === "kullanici" ? "Sen" : "Scout Koç"}</span>
              <span>•</span>
              <span>{m.zaman}</span>
            </div>

            <div
              className={`relative max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm transition-all whitespace-pre-line ${
                m.gonderen === "kullanici"
                  ? "bg-pine text-cream rounded-br-sm"
                  : "border border-line/80 bg-paper/90 text-ink rounded-bl-sm"
              }`}
            >
              {m.metin}

              {m.gonderen === "koc" && (
                <div className="mt-2 flex justify-end border-t border-line/30 pt-1.5">
                  <button
                    type="button"
                    onClick={() => kopyala(m.id, m.metin)}
                    className="text-[11px] text-muted hover:text-ink transition"
                  >
                    {kopyalananId === m.id ? "✓ Kopyalandı" : "Kopyala"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Yükleniyor Göstergesi */}
        {yukleniyor && (
          <div className="rounded-2xl border border-line/60 bg-paper/40 p-4 space-y-2 animate-pulse max-w-[70%]">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-lg bg-pine/20 flex items-center justify-center text-xs">✨</div>
              <span className="text-xs font-medium text-muted">Koç yanıt hazırlıyor...</span>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-2 w-3/4 rounded-full bg-line/60"></div>
              <div className="h-2 w-1/2 rounded-full bg-line/40"></div>
            </div>
          </div>
        )}

        <div ref={mesajSonuRef} />
      </div>

      {/* Hata Bildirimi */}
      {hata && (
        <div className="flex items-center gap-2 rounded-xl border border-clay/30 bg-clay/10 p-3 text-xs text-clay">
          <span>⚠️</span>
          <span>{hata}</span>
        </div>
      )}

      {/* Önerilen Başlıklar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        {HIZLI_SORULAR.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => soruyuGonder(item)}
            disabled={yukleniyor}
            className="whitespace-nowrap rounded-xl border border-line bg-paper/80 px-3 py-1.5 text-xs text-muted transition hover:border-pine/60 hover:bg-cream hover:text-ink active:scale-95 disabled:opacity-50"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Modern Entegre Soru Alanı */}
      <div className="group relative rounded-2xl border border-line bg-paper/60 p-2 shadow-sm transition-all duration-200 focus-within:border-pine focus-within:ring-2 focus-within:ring-pine/20 hover:border-line/80">
        <textarea
          rows={2}
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
    </div>
  );
}