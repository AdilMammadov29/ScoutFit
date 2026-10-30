import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { kocSor } from "../lib/coach";
import { profildenHesap } from "../lib/engine";
import { useFit } from "../lib/store";
import { useActivity } from "../lib/activityStore";
import { useDiet } from "../lib/nutritionStore";
import {
  Mic,
  ArrowUp,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface Mesaj {
  id: string;
  gonderen: "kullanici" | "koc";
  metin: string;
  zaman: string;
}

const HIZLI_SORULAR = [
  "Son 7 güne göre genel performansım nasıl?",
  "Dün kaçamak yaptım, bugünkü planım ne olmalı?",
  "Su tüketimim ve adımlarım hedefe uygun mu?",
  "Antrenman hacmimi artırmalı mıyım?",
];

export function CoachView() {
  const profil = useFit((s) => s.profil);
  const antrenmanlar = useFit((s) => s.antrenmanlar);
  const h = profil ? profildenHesap(profil) : null;

  const { bugunSuMl, hedefSuMl, bugunAdim, istatistikleriGetir } = useActivity();
  const { kayitlar, seri, kacamakNedeni, kacamakNotu } = useDiet();

  const [mesajlar, setMesajlar] = useState<Mesaj[]>([
    {
      id: "ilk-karsilama",
      gonderen: "koc",
      metin: "Selam! Ben ScoutFit Koçun. Antrenmanların, beslenme disiplinin ve haftalık verilerin aklımda. Aklına gelen her şeyi sorabilirsin.",
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

    // İlk statik karşılama mesajını hariç tutarak geçmişi hazırla
    const apiGecmis = mesajlar
      .filter((m) => m.id !== "ilk-karsilama")
      .slice(-6)
      .map((m) => ({
        role: m.gonderen === "kullanici" ? ("user" as const) : ("assistant" as const),
        content: m.metin,
      }));

    setMesajlar((onceki) => [...onceki, yeniKullaniciMesaji]);
    setSoru("");
    setYukleniyor(true);
    setHata(null);

    const sonKayitDegerleri = Object.values(kayitlar).slice(-7);
    const kacamakSayisi = sonKayitDegerleri.filter((k) => k === "kacamak").length;
    const temizGunSayisi = sonKayitDegerleri.filter((k) => k === "temiz").length;

    const sonAntrenman = antrenmanlar[0]
      ? `Son Antrenman: ${antrenmanlar[0].bolge} (${antrenmanlar[0].sureDk} dk)`
      : "Kayıtlı antrenman yok";

    const aktiviteIstatistik = istatistikleriGetir();

    const baglam = [
      profil && h ? `Kilo: ${profil.kilo}kg, Hedef: ${profil.hedef}, Günlük Kalori: ${h.gunlukKalori}kcal` : "",
      `Bugün: Su ${bugunSuMl}/${hedefSuMl}ml, Adım ${bugunAdim}`,
      `Haftalık: ${aktiviteIstatistik.haftalikAdim} adım, ${seri} gün seri, ${kacamakSayisi} kaçamak, ${temizGunSayisi} temiz gün`,
      kacamakNedeni ? `Son kaçamak nedeni: ${kacamakNedeni}` : "",
      sonAntrenman,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      const res = await kocSor({
        data: {
          soru: s,
          baglam,
          gecmis: apiGecmis,
        },
      });

      if (res.ok && res.metin) {
        const koctanGelen: Mesaj = {
          id: (Date.now() + 1).toString(),
          gonderen: "koc",
          metin: res.metin,
          zaman: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMesajlar((onceki) => [...onceki, koctanGelen]);
      } else {
        setHata(res.hata || "Koç şu an yanıt veremiyor.");
      }
    } catch (err: any) {
      setHata("Bağlantı hatası: " + (err?.message || "Sunucuya ulaşılamadı."));
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

  const sadeceKarsilamaVar = mesajlar.length === 1 && mesajlar[0].id === "ilk-karsilama";

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-3xl flex-col space-y-4 font-sans">
      {/* Üst Başlık */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <h1 className="font-serif text-xl font-bold text-ink">Koç</h1>
          <p className="text-[13px] text-muted">
            Haftalık antrenman, su ve beslenme verilerin bağlama eklendi.
          </p>
        </div>
      </div>

      {/* Mesaj Akışı */}
      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        {mesajlar.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.gonderen === "kullanici" ? "items-end" : "items-start"
            }`}
          >
            <div className="mb-1 flex items-center gap-1.5 px-1 text-[12px] text-muted">
              <span>{m.gonderen === "kullanici" ? "Sen" : "Koç"}</span>
              <span>·</span>
              <span>{m.zaman}</span>
            </div>

            {m.gonderen === "kullanici" ? (
              // Kullanıcı Mesajı: Pine Dolgulu Balon
              <div className="relative max-w-[85%] rounded-xl bg-pine px-4 py-3 text-[15px] leading-relaxed text-paper shadow-sm whitespace-pre-line">
                {m.metin}
              </div>
            ) : (
              // Koç Mesajı: Balonsuz, Düz ve Ferah Editoryal Akış
              <div className="group relative max-w-[92%] py-1 text-[15px] leading-relaxed text-ink whitespace-pre-line">
                <p className="text-ink">{m.metin}</p>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => kopyala(m.id, m.metin)}
                    className="inline-flex items-center gap-1 text-[12px] text-muted opacity-60 hover:opacity-100 hover:text-ink transition-opacity duration-150"
                  >
                    {kopyalananId === m.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-pine" />
                        <span className="text-pine">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Yükleniyor Göstergesi: Sessiz 3 Nokta */}
        {yukleniyor && (
          <div className="flex items-center gap-1.5 py-2 px-1 text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-muted/60 animate-pulse [animation-delay:-0.3s]"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-muted/60 animate-pulse [animation-delay:-0.15s]"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-muted/60 animate-pulse"></span>
            <span className="ml-2 text-[13px] text-muted">Koç düşünüyor...</span>
          </div>
        )}

        <div ref={mesajSonuRef} />
      </div>

      {/* Hata Bildirimi */}
      {hata && (
        <div className="flex items-center gap-2 rounded-xl border border-clay/30 bg-clay/5 p-3 text-[13px] text-clay">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="leading-snug">{hata}</span>
        </div>
      )}

      {/* Hızlı Sorular: Boşken Dikey Liste, Konuşma Başlayınca Yatay Şerit */}
      {sadeceKarsilamaVar ? (
        <div className="space-y-2 py-1">
          <span className="text-[12px] font-medium text-muted block mb-1">
            Önerilen Sorular:
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {HIZLI_SORULAR.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => soruyuGonder(item)}
                disabled={yukleniyor}
                className="flex min-h-[44px] items-center rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-[13px] text-ink hover:border-muted/40 transition-colors duration-150 disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {HIZLI_SORULAR.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => soruyuGonder(item)}
              disabled={yukleniyor}
              className="whitespace-nowrap rounded-xl border border-line bg-surface px-3 py-1.5 text-[13px] text-muted hover:border-muted/40 hover:text-ink transition-colors duration-150 active:scale-95 disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Giriş Alanı: Tek Parça, Sol Mic, Orta Textarea, Sağ ArrowUp */}
      <div className="relative flex items-center gap-2 rounded-xl border border-line bg-surface p-2 focus-within:border-muted/60 transition-colors duration-150">
        <button
          type="button"
          onClick={sesleDinle}
          aria-label={dinleniyor ? "Dinleniyor" : "Sesle sor"}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
            dinleniyor
              ? "bg-clay/10 text-clay"
              : "text-muted hover:text-ink hover:bg-paper"
          }`}
        >
          <Mic className={`w-5 h-5 ${dinleniyor ? "animate-pulse" : ""}`} />
        </button>

        <textarea
          rows={1}
          value={soru}
          onChange={(e) => setSoru(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dinleniyor ? "Dinleniyor..." : "Bir şey sor..."}
          className="flex-1 resize-none bg-transparent py-2 px-1 text-[15px] leading-normal text-ink outline-none placeholder:text-muted/60 max-h-32"
        />

        <button
          type="button"
          onClick={() => soruyuGonder(soru)}
          disabled={yukleniyor || !soru.trim()}
          aria-label="Gönder"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine text-paper transition-opacity duration-150 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}