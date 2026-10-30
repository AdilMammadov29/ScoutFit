import { useState, useEffect, useRef, useMemo } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { yemekAnalizEt } from "@/lib/yemek";
import { useOgun } from "@/lib/ogun";
import type { Section } from "./shell";
import {
  Camera,
  Plus,
  X,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Utensils,
} from "lucide-react";

interface BesinOgun {
  id: string;
  ad: string;
  kalori: number;
  protein: number;
  karb: number;
  yag: number;
  ogunTipi: "Kahvaltı" | "Öğle" | "Akşam" | "Ara Öğün";
}

interface TarananUrunBilgi {
  ad: string;
  cal100: number;
  prot100: number;
  carb100: number;
  fat100: number;
}

export function MealsView({ git: _git }: { git?: (s: Section) => void }) {
  const hamOgunler = useOgun((s) => s.ogunler);
  const ekleOgunler = useOgun((s) => s.ekleOgunler);
  const silOgun = useOgun((s) => s.silOgun);

  // useOgun formatını UI formatına çevir
  const ogunler: BesinOgun[] = useMemo(
    () =>
      hamOgunler.map((o) => ({
        id: o.id,
        ad: o.isim,
        kalori: o.kalori,
        protein: o.protein ?? 0,
        karb: o.karb ?? 0,
        yag: o.yag ?? 0,
        ogunTipi: o.ogunTipi ?? "Ara Öğün",
      })),
    [hamOgunler]
  );

  const ogunEkle = (item: Omit<BesinOgun, "id">) => {
    ekleOgunler([
      {
        tarih: new Date().toISOString(),
        isim: item.ad,
        kalori: item.kalori,
        protein: item.protein,
        karb: item.karb,
        yag: item.yag,
        ogunTipi: item.ogunTipi,
      },
    ]);
  };

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

  // Barkod Porsiyon Doğrulama Modalı
  const [tarananUrun, setTarananUrun] = useState<TarananUrunBilgi | null>(null);
  const [girilenGram, setGirilenGram] = useState<number>(100);


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

        let varsayilanGram = 100;
        if (prod.product_quantity && !isNaN(Number(prod.product_quantity))) {
          varsayilanGram = Number(prod.product_quantity);
        }

        setTarananUrun({
          ad,
          cal100: cal,
          prot100: prot,
          carb100: carb,
          fat100: fat,
        });
        setGirilenGram(varsayilanGram);
      } else {
        setKameraHata(`Barkod (${barkod}) bulundu ancak ürün listesinde yok.`);
      }
    } catch {
      setKameraHata("Ürün aranırken ağ hatası oluştu.");
    } finally {
      setBarkodYukleniyor(false);
    }
  };

  const tarananUrunuOnaylaVeEkle = () => {
    if (!tarananUrun) return;

    const oran = (girilenGram || 100) / 100;
    const hesaplananCal = Math.round(tarananUrun.cal100 * oran);
    const hesaplananProt = Math.round(tarananUrun.prot100 * oran);
    const hesaplananCarb = Math.round(tarananUrun.carb100 * oran);
    const hesaplananFat = Math.round(tarananUrun.fat100 * oran);

    const yeniOgun: Omit<BesinOgun, "id"> = {
      ad: `${tarananUrun.ad} (${girilenGram}g)`,
      kalori: hesaplananCal,
      protein: hesaplananProt,
      karb: hesaplananCarb,
      yag: hesaplananFat,
      ogunTipi,
    };

    ogunEkle(yeniOgun);
    setAiMesaj(`Eklendi: ${yeniOgun.ad} · ${hesaplananCal} kcal`);
    setTarananUrun(null);
  };

  const handleAiAnalizVeKaydet = async () => {
    if (!aiGirdi.trim() || aiYukleniyor) return;

    const yemekMetni = aiGirdi.trim();
    setAiYukleniyor(true);
    setAiMesaj(null);

    try {
      const sonuc = await yemekAnalizEt(yemekMetni);

      const yeniOgun: Omit<BesinOgun, "id"> = {
        ad: sonuc.ad || yemekMetni,
        kalori: Number(sonuc.kalori) || 0,
        protein: Number(sonuc.protein) || 0,
        karb: Number(sonuc.karbonhidrat) || 0,
        yag: Number(sonuc.yag) || 0,
        ogunTipi,
      };

      ogunEkle(yeniOgun);
      setAiGirdi("");
      setAiMesaj(
        `Eklendi: ${yeniOgun.ad} (${yeniOgun.kalori} kcal · P ${yeniOgun.protein}g · K ${yeniOgun.karb}g · Y ${yeniOgun.yag}g)`
      );
    } catch (err: any) {
      setAiMesaj("Bağlantı hatası: " + (err?.message || "Bilinmeyen hata"));
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

    const yeni: Omit<BesinOgun, "id"> = {
      ad: yeniAd.trim(),
      kalori: Number(yeniKalori) || 0,
      protein: Number(yeniProtein) || 0,
      karb: Number(yeniKarb) || 0,
      yag: Number(yeniYag) || 0,
      ogunTipi,
    };

    ogunEkle(yeni);
    setYeniAd("");
    setYeniKalori("");
    setYeniProtein("");
    setYeniKarb("");
    setYeniYag("");
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Üst Başlık & Barkod Butonu */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="text-[13px] font-medium text-muted block">
            Beslenme & Makro
          </span>
          <h1 className="font-serif text-2xl font-bold text-ink">Öğün Günlüğü</h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setKameraHata(null);
            setKameraAcik(true);
          }}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:border-muted/40 transition-colors duration-150 active:scale-95"
        >
          <Camera className="w-4 h-4 text-muted" />
          <span>Barkod Tara</span>
        </button>
      </div>

      {/* Günlük Makro Özeti */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <span className="text-[13px] text-muted block leading-none">Bugün Alınan</span>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <span className="font-serif text-3xl font-bold text-ink">
              {toplamKalori.toLocaleString()}
            </span>
            <span className="text-[13px] text-muted"> kcal</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-line bg-paper/60 p-3">
            <span className="text-[12px] text-muted block">Protein</span>
            <div className="mt-1 font-serif text-base font-bold text-ink">
              {toplamProtein} g
            </div>
          </div>
          <div className="rounded-xl border border-line bg-paper/60 p-3">
            <span className="text-[12px] text-muted block">Karb</span>
            <div className="mt-1 font-serif text-base font-bold text-ink">
              {toplamKarb} g
            </div>
          </div>
          <div className="rounded-xl border border-line bg-paper/60 p-3">
            <span className="text-[12px] text-muted block">Yağ</span>
            <div className="mt-1 font-serif text-base font-bold text-ink">
              {toplamYag} g
            </div>
          </div>
        </div>
      </div>

      {/* Yemek Ekle Alanı */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-base font-bold text-ink">Yemek Ekle</h2>
          <select
            value={ogunTipi}
            onChange={(e) => setOgunTipi(e.target.value as any)}
            className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors focus:border-muted/60"
          >
            <option value="Kahvaltı">Kahvaltı</option>
            <option value="Öğle">Öğle</option>
            <option value="Akşam">Akşam</option>
            <option value="Ara Öğün">Ara Öğün</option>
          </select>
        </div>
        <p className="text-[13px] text-muted leading-relaxed mb-4">
          Tükettiğin besini porsiyonuyla yaz; besin değerleri hesaplanarak listene kaydedilsin:
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Örn: 200g tavuk göğsü, 1 porsiyon bulgur pilavı ve ayran"
            value={aiGirdi}
            onChange={(e) => setAiGirdi(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiAnalizVeKaydet()}
            className="flex-1 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted/60 transition-colors focus:border-muted/60"
          />
          <button
            type="button"
            onClick={handleAiAnalizVeKaydet}
            disabled={aiYukleniyor || !aiGirdi.trim()}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-pine px-4 py-2.5 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 disabled:opacity-40 active:scale-95 whitespace-nowrap"
          >
            {aiYukleniyor ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Hesaplanıyor...</span>
              </>
            ) : (
              <span>Ekle</span>
            )}
          </button>
        </div>

        {aiMesaj && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-paper/60 p-3 text-[13px] text-ink">
            {aiMesaj.startsWith("Bağlantı hatası") ? (
              <AlertCircle className="w-4 h-4 text-clay shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-pine shrink-0 mt-0.5" />
            )}
            <span className="leading-snug">{aiMesaj}</span>
          </div>
        )}
      </div>

      {/* Manuel Ekleme (Akordeon) */}
      <details className="group rounded-xl border border-line bg-surface p-4">
        <summary className="cursor-pointer text-[13px] font-medium text-muted list-none flex items-center justify-between">
          <span>İsteğe Bağlı: Elle Manuel Değer Girmek İstersen</span>
          <ChevronDown className="w-4 h-4 text-muted transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <form onSubmit={manuelOgunEkle} className="mt-4 space-y-3 pt-3 border-t border-line">
          <input
            type="text"
            placeholder="Besin Adı"
            value={yeniAd}
            onChange={(e) => setYeniAd(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-muted/60"
          />
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              placeholder="kcal"
              value={yeniKalori}
              onChange={(e) => setYeniKalori(e.target.value)}
              className="rounded-xl border border-line bg-paper p-2.5 text-center text-[13px] text-ink outline-none focus:border-muted/60"
            />
            <input
              type="number"
              placeholder="Prot (g)"
              value={yeniProtein}
              onChange={(e) => setYeniProtein(e.target.value)}
              className="rounded-xl border border-line bg-paper p-2.5 text-center text-[13px] text-ink outline-none focus:border-muted/60"
            />
            <input
              type="number"
              placeholder="Karb (g)"
              value={yeniKarb}
              onChange={(e) => setYeniKarb(e.target.value)}
              className="rounded-xl border border-line bg-paper p-2.5 text-center text-[13px] text-ink outline-none focus:border-muted/60"
            />
            <input
              type="number"
              placeholder="Yağ (g)"
              value={yeniYag}
              onChange={(e) => setYeniYag(e.target.value)}
              className="rounded-xl border border-line bg-paper p-2.5 text-center text-[13px] text-ink outline-none focus:border-muted/60"
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl border border-line bg-paper py-2.5 text-[13px] font-medium text-ink hover:border-muted/40 transition-colors"
          >
            Manuel Ekle
          </button>
        </form>
      </details>

      {/* Öğün Listesi */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <h2 className="font-serif text-base font-bold text-ink mb-3">Bugünkü Öğünler</h2>
        {ogunler.length === 0 ? (
          <p className="text-[13px] text-muted py-6 text-center">
            Henüz kayıt yok. Yukarıya ne yediğini yazıp ekleyebilirsin.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {ogunler.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-muted">
                      {item.ogunTipi}
                    </span>
                    <span className="text-[14px] font-semibold text-ink">{item.ad}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[12px] text-muted">
                    <span className="font-medium text-ink">{item.kalori} kcal</span>
                    <span>·</span>
                    <span>P: {item.protein}g</span>
                    <span>·</span>
                    <span>K: {item.karb}g</span>
                    <span>·</span>
                    <span>Y: {item.yag}g</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => silOgun(item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-clay hover:bg-paper transition-colors"
                  aria-label="Öğünü sil"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barkod Gramaj Ayar Modalı */}
      {tarananUrun && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[12px] text-muted block">Barkod Bulundu</span>
                <h3 className="font-serif text-base font-bold text-ink mt-0.5">{tarananUrun.ad}</h3>
              </div>
              <button
                type="button"
                onClick={() => setTarananUrun(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-paper border border-line text-muted hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[13px] text-muted block mb-1.5">Tükettiğin Miktar (Gram):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={girilenGram}
                    onChange={(e) => setGirilenGram(Math.max(1, Number(e.target.value) || 0))}
                    className="flex-1 rounded-xl border border-line bg-paper p-2.5 text-center font-serif text-lg font-bold text-ink outline-none focus:border-muted/60"
                  />
                  <span className="text-[13px] text-muted">gram</span>
                </div>
              </div>

              {/* Anlık Hesaplanan Değerler */}
              <div className="grid grid-cols-4 gap-2 rounded-xl border border-line bg-paper/60 p-3 text-center">
                <div>
                  <span className="text-[11px] text-muted block">Kalori</span>
                  <span className="font-serif text-xs font-bold text-ink">
                    {Math.round(tarananUrun.cal100 * ((girilenGram || 0) / 100))}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted block">Prot</span>
                  <span className="font-serif text-xs font-bold text-ink">
                    {Math.round(tarananUrun.prot100 * ((girilenGram || 0) / 100))}g
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted block">Karb</span>
                  <span className="font-serif text-xs font-bold text-ink">
                    {Math.round(tarananUrun.carb100 * ((girilenGram || 0) / 100))}g
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted block">Yağ</span>
                  <span className="font-serif text-xs font-bold text-ink">
                    {Math.round(tarananUrun.fat100 * ((girilenGram || 0) / 100))}g
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={tarananUrunuOnaylaVeEkle}
                className="w-full min-h-[44px] rounded-xl bg-pine py-3 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 active:scale-95"
              >
                {girilenGram}g Olarak Listeme Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kamera Modalı */}
      {kameraAcik && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-ink">Barkodu Hizala</h3>
                <p className="text-[12px] text-muted">Kamerayı ürün barkoduna tutun</p>
              </div>
              <button
                type="button"
                onClick={kamerayiDurdur}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-paper border border-line text-muted hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl bg-black relative">
              <div
                id="kamera-okuyucu-alani"
                className="w-full"
                style={{ height: "280px", minHeight: "280px" }}
              />
              {barkodYukleniyor && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-paper text-[13px] font-medium">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Ürün aranıyor...
                </div>
              )}
            </div>

            {kameraHata && (
              <p className="mt-3 text-center text-[12px] text-clay">{kameraHata}</p>
            )}

            <button
              type="button"
              onClick={kamerayiDurdur}
              className="mt-4 w-full min-h-[44px] rounded-xl border border-line bg-paper py-2.5 text-[13px] font-medium text-muted hover:text-ink transition-colors"
            >
              Taramayı İptal Et
            </button>
          </div>
        </div>
      )}
    </div>
  );
}