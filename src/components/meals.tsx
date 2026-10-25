import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { yemekAnalizEt } from "@/lib/yemek";
import type { Section } from "./shell";

interface BesinOgun {
  id: string;
  ad: string;
  kalori: number;
  protein: number;
  karb: number;
  yag: number;
  ogunTipi: "Kahvaltı" | "Öğle" | "Akşam" | "Ara Öğün";
}

const STORAGE_KEY = "scoutfit_meals_v2";

export function MealsView({ git: _git }: { git?: (s: Section) => void }) {
  const [ogunler, setOgunler] = useState<BesinOgun[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [yeniAd, setYeniAd] = useState("");
  const [yeniKalori, setYeniKalori] = useState("");
  const [yeniProtein, setYeniProtein] = useState("");
  const [yeniKarb, setYeniKarb] = useState("");
  const [yeniYag, setYeniYag] = useState("");
  const [ogunTipi, setOgunTipi] = useState<"Kahvaltı" | "Öğle" | "Akşam" | "Ara Öğün">("Kahvaltı");

  // AI Analiz Durumu
  const [aiGirdi, setAiGirdi] = useState("");
  const [aiYukleniyor, setAiYukleniyor] = useState(false);
  const [aiMesaj, setAiMesaj] = useState<string | null>(null);

  // Kamera & Barkod Durumu
  const [kameraAcik, setKameraAcik] = useState(false);
  const [barkodYukleniyor, setBarkodYukleniyor] = useState(false);
  const [kameraHata, setKameraHata] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ogunler));
  }, [ogunler]);

  // Kamerayı güvenli şekilde kapat
  const kamerayiDurdur = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Kamera kapatma:", e);
      }
      scannerRef.current = null;
    }
    setKameraAcik(false);
  };

  // Kamera Başlatma
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (kameraAcik) {
      setKameraHata(null);

      timer = setTimeout(async () => {
        try {
          const container = document.getElementById("kamera-okuyucu-alani");
          if (!container) {
            setKameraHata("Kamera alanı bulunamadı.");
            return;
          }

          // Eski instance varsa temizle
          if (scannerRef.current) {
            try {
              if (scannerRef.current.isScanning) {
                await scannerRef.current.stop();
              }
              scannerRef.current.clear();
            } catch {}
          }

          const qrScanner = new Html5Qrcode("kamera-okuyucu-alani");
          scannerRef.current = qrScanner;

          // 1. Önce facingMode dene
          try {
            await qrScanner.start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: { width: 250, height: 180 },
                aspectRatio: 1.777,
              },
              (barkodMetni) => {
                barkodlaUrunGetir(barkodMetni);
                kamerayiDurdur();
              },
              () => {}
            );
            return;
          } catch (e1) {
            console.warn("facingMode başarısız:", e1);
          }

          // 2. Olmazsa kamera listesinden seç
          const kameralar = await Html5Qrcode.getCameras();
          if (!kameralar || kameralar.length === 0) {
            setKameraHata("Kamera bulunamadı. İzinleri kontrol et.");
            return;
          }

          const arka =
            kameralar.find((c) => {
              const l = (c.label || "").toLowerCase();
              return l.includes("back") || l.includes("rear") || l.includes("arka");
            }) || kameralar[kameralar.length - 1];

          await qrScanner.start(
            arka.id,
            {
              fps: 10,
              qrbox: { width: 250, height: 180 },
              aspectRatio: 1.777,
            },
            (barkodMetni) => {
              barkodlaUrunGetir(barkodMetni);
              kamerayiDurdur();
            },
            () => {}
          );
        } catch (err: any) {
          console.error("Kamera hatası:", err);
          setKameraHata(
            err?.message ||
              "Kamera açılamadı. Ayarlar → ScoutFit → İzinler → Kamera açık olsun."
          );
        }
      }, 600);
    }

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
    };
  }, [kameraAcik]);

  // OpenFoodFacts API
  const barkodlaUrunGetir = async (barkod: string) => {
    setBarkodYukleniyor(true);
    setKameraHata(null);

    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barkod}.json`
      );
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const prod = data.product;
        const n = prod.nutriments || {};

        const ad = prod.product_name_tr || prod.product_name || "Barkodlu Ürün";
        const cal = Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0);
        const prot = Math.round(n.proteins_100g || n.proteins || 0);
        const carb = Math.round(n.carbohydrates_100g || n.carbohydrates || 0);
        const fat = Math.round(n.fat_100g || n.fat || 0);

        const yeniOgun: BesinOgun = {
          id: Date.now().toString(),
          ad: `${ad} (100g)`,
          kalori: cal,
          protein: prot,
          karb: carb,
          yag: fat,
          ogunTipi,
        };

        setOgunler((prev) => [yeniOgun, ...prev]);
        setAiMesaj(`✅ Barkod okundu ve eklendi: ${ad} (${cal} kcal)`);
      } else {
        setKameraHata(`Barkod (${barkod}) bulundu ancak ürün listesinde yok.`);
      }
    } catch {
      setKameraHata("Ürün aranırken ağ hatası oluştu.");
    } finally {
      setBarkodYukleniyor(false);
    }
  };
  const handleAiAnalizVeKaydet = async () => {
    if (!aiGirdi.trim() || aiYukleniyor) return;

    const yemekMetni = aiGirdi.trim();
    setAiYukleniyor(true);
    setAiMesaj(null);

    try {
      const sonuc = await yemekAnalizEt(yemekMetni);

      const yeniOgun: BesinOgun = {
        id: Date.now().toString(),
        ad: sonuc.ad || yemekMetni,
        kalori: Number(sonuc.kalori) || 0,
        protein: Number(sonuc.protein) || 0,
        karb: Number(sonuc.karbonhidrat) || 0,
        yag: Number(sonuc.yag) || 0,
        ogunTipi,
      };

      setOgunler((prev) => [yeniOgun, ...prev]);
      setAiGirdi("");
      setAiMesaj(
        `Eklendi: ${yeniOgun.ad} (${yeniOgun.kalori} kcal · P ${yeniOgun.protein}g · K ${yeniOgun.karb}g · Y ${yeniOgun.yag}g)`
      );
    } catch (err: any) {
      setAiMesaj("AI bağlantı hatası: " + (err?.message || "Bilinmeyen hata"));
    } finally {
      setAiYukleniyor(false);
    }
  };
  const toplamKalori = ogunler.reduce((acc, o) => acc + o.kalori, 0);
  const toplamProtein = ogunler.reduce((acc, o) => acc + o.protein, 0);
  const toplamKarb = ogunler.reduce((acc, o) => acc + o.karb, 0);
  const toplamYag = ogunler.reduce((acc, o) => acc + o.yag, 0);

  const manuelOgunEkle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yeniAd.trim() || !yeniKalori) return;

    const yeni: BesinOgun = {
      id: Date.now().toString(),
      ad: yeniAd.trim(),
      kalori: Number(yeniKalori) || 0,
      protein: Number(yeniProtein) || 0,
      karb: Number(yeniKarb) || 0,
      yag: Number(yeniYag) || 0,
      ogunTipi,
    };

    setOgunler([yeni, ...ogunler]);
    setYeniAd("");
    setYeniKalori("");
    setYeniProtein("");
    setYeniKarb("");
    setYeniYag("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Üst Bar */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
            03 · Beslenme & Makro
          </span>
          <h2 className="font-display text-2xl font-bold text-ink">Öğün Günlüğü</h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setKameraHata(null);
            setKameraAcik(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-pine px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95"
        >
          <span>📷</span>
          <span>Kamerayla Barkod Tara</span>
        </button>
      </div>

      {/* Günlük Makro */}
      <div className="rounded-2xl border border-line bg-paper p-5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
          Bugün Alınan
        </span>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <span className="font-mono text-3xl font-extrabold text-pine">
              {toplamKalori.toLocaleString()}
            </span>
            <span className="text-xs text-muted"> kcal</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-line bg-cream/30 p-2.5">
            <span className="text-[10px] font-mono uppercase text-muted">Protein</span>
            <div className="mt-0.5 font-mono text-sm font-bold text-ink">
              {toplamProtein} g
            </div>
          </div>
          <div className="rounded-xl border border-line bg-cream/30 p-2.5">
            <span className="text-[10px] font-mono uppercase text-muted">Karb</span>
            <div className="mt-0.5 font-mono text-sm font-bold text-ink">
              {toplamKarb} g
            </div>
          </div>
          <div className="rounded-xl border border-line bg-cream/30 p-2.5">
            <span className="text-[10px] font-mono uppercase text-muted">Yağ</span>
            <div className="mt-0.5 font-mono text-sm font-bold text-ink">
              {toplamYag} g
            </div>
          </div>
        </div>
      </div>

      {/* AI Alanı */}
      <div className="rounded-2xl border border-pine/30 bg-pine/5 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <h3 className="font-display text-sm font-bold text-ink">
              Yapay Zeka ile Otomatik Ekle
            </h3>
          </div>
          <select
            value={ogunTipi}
            onChange={(e) => setOgunTipi(e.target.value as any)}
            className="rounded-lg border border-line bg-paper px-2 py-1 text-[11px] text-ink outline-none"
          >
            <option value="Kahvaltı">Kahvaltı</option>
            <option value="Öğle">Öğle</option>
            <option value="Akşam">Akşam</option>
            <option value="Ara Öğün">Ara Öğün</option>
          </select>
        </div>
        <p className="text-[11px] text-muted leading-relaxed mb-3">
          Yediğin yemeği yaz; yapay zeka kaloriyi ve makroları çıkarıp{" "}
          <strong>doğrudan listene eklesin</strong>:
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Örn: 200g tavuk göğsü, 1 porsiyon bulgur pilavı ve ayran"
            value={aiGirdi}
            onChange={(e) => setAiGirdi(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiAnalizVeKaydet()}
            className="flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink outline-none focus:border-pine"
          />
          <button
            type="button"
            onClick={handleAiAnalizVeKaydet}
            disabled={aiYukleniyor || !aiGirdi.trim()}
            className="rounded-xl bg-pine px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 active:scale-95"
          >
            {aiYukleniyor ? "Hesaplanıyor..." : "Analiz Et & Ekle 🥗"}
          </button>
        </div>

        {aiMesaj && (
          <p className="mt-2 text-xs font-medium text-ink bg-paper/80 p-2 rounded-lg border border-line">
            {aiMesaj}
          </p>
        )}
      </div>

      {/* Manuel Ekleme */}
      <details className="group rounded-2xl border border-line bg-paper p-4">
        <summary className="cursor-pointer text-xs font-bold text-muted list-none flex items-center justify-between">
          <span>İsteğe Bağlı: Elle Manuel Değer Girmek İstersen</span>
          <span className="transition-transform group-open:rotate-180 text-[10px]">▼</span>
        </summary>
        <form onSubmit={manuelOgunEkle} className="mt-4 space-y-3 pt-3 border-t border-line">
          <input
            type="text"
            placeholder="Besin Adı"
            value={yeniAd}
            onChange={(e) => setYeniAd(e.target.value)}
            className="w-full rounded-xl border border-line bg-cream/40 px-3 py-2 text-xs text-ink outline-none"
          />
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              placeholder="kcal"
              value={yeniKalori}
              onChange={(e) => setYeniKalori(e.target.value)}
              className="rounded-xl border border-line bg-cream/40 p-2 text-center text-xs"
            />
            <input
              type="number"
              placeholder="Prot (g)"
              value={yeniProtein}
              onChange={(e) => setYeniProtein(e.target.value)}
              className="rounded-xl border border-line bg-cream/40 p-2 text-center text-xs"
            />
            <input
              type="number"
              placeholder="Karb (g)"
              value={yeniKarb}
              onChange={(e) => setYeniKarb(e.target.value)}
              className="rounded-xl border border-line bg-cream/40 p-2 text-center text-xs"
            />
            <input
              type="number"
              placeholder="Yağ (g)"
              value={yeniYag}
              onChange={(e) => setYeniYag(e.target.value)}
              className="rounded-xl border border-line bg-cream/40 p-2 text-center text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-cream py-2 text-xs font-semibold text-ink"
          >
            Manuel Ekle
          </button>
        </form>
      </details>

      {/* Öğün Listesi */}
      <div className="rounded-2xl border border-line bg-paper p-5">
        <h3 className="font-display text-base font-bold text-ink mb-3">Bugünkü Öğünler</h3>
        {ogunler.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">
            Henüz kayıt yok. Yukarıya ne yediğini yazıp "Analiz Et & Ekle"ye basabilirsin.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {ogunler.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-cream px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted">
                      {item.ogunTipi}
                    </span>
                    <span className="text-xs font-bold text-ink">{item.ad}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                    <span className="font-semibold text-pine">{item.kalori} kcal</span>
                    <span>•</span>
                    <span>P: {item.protein}g</span>
                    <span>K: {item.karb}g</span>
                    <span>Y: {item.yag}g</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOgunler(ogunler.filter((o) => o.id !== item.id))}
                  className="text-xs text-muted hover:text-clay px-2 py-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kamera Modalı */}
      {kameraAcik && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-line bg-paper p-5 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
              <div>
                <h4 className="font-display text-base font-bold text-ink">Barkodu Hizala</h4>
                <p className="text-[11px] text-muted">Kamerayı ürün barkoduna tutun</p>
              </div>
              <button
                type="button"
                onClick={kamerayiDurdur}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-sm text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-black relative">
              <div
                id="kamera-okuyucu-alani"
                className="w-full"
                style={{ height: "280px", minHeight: "280px" }}
              />
              {barkodYukleniyor && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
                  Ürün aranıyor...
                </div>
              )}
            </div>

            {kameraHata && (
              <p className="mt-3 text-center text-xs text-red-500">{kameraHata}</p>
            )}

            <button
              type="button"
              onClick={kamerayiDurdur}
              className="mt-4 w-full rounded-xl bg-cream py-2.5 text-xs font-semibold text-muted hover:text-ink"
            >
              Taramayı İptal Et
            </button>
          </div>
        </div>
      )}
    </div>
  );
}