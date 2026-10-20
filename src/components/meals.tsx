import { useState, type FormEvent } from "react";
import { useFit } from "@/lib/store";
import { useOgun } from "@/lib/ogun";
import { fmtKcal, profildenHesap } from "@/lib/engine";
import { PageTitle, Panel, Btn } from "@/components/ui";
import { bugunAnahtar, yemekHesapla } from "@/lib/yemek";
import type { Section } from "./shell";

function hataMesaji(kod: string) {
  if (kod === "ayiklanamadi")
    return "Bunu bir yiyecek olarak anlayamadım. Miktarıyla yaz, örneğin: 2 dilim salam.";
  if (kod === "yok") return "API anahtarı bulunamadı. Hızlı besinleri veya manuel girişi kullanabilirsin.";
  if (kod === "ag") return "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.";
  if (kod.startsWith("http-")) return `Servis hata verdi (${kod.slice(5)}). Biraz sonra tekrar dene.`;
  return "Kalori hesaplanamadı. Bir kez daha dene.";
}

// Sık tüketilen temel sporcu besinleri
const HIZLI_BESINLER = [
  { ad: "Tavuk Göğsü (150g)", kcal: 248, icon: "🍗" },
  { ad: "Basmati Pirinç (200g)", kcal: 260, icon: "🍚" },
  { ad: "Haşlanmış Yumurta (2 Adet)", kcal: 155, icon: "🥚" },
  { ad: "Yulaf Ezmesi (60g)", kcal: 220, icon: "🥣" },
  { ad: "Karabuğday / Greçka (180g)", kcal: 210, icon: "🌾" },
  { ad: "Ton Balığı (1 Kutu)", kcal: 190, icon: "🐟" },
  { ad: "Muz (1 Adet)", kcal: 105, icon: "🍌" },
  { ad: "Süzme Yoğurt (200g)", kcal: 130, icon: "🥛" },
];

export function MealsView({ git: _git }: { git?: (s: Section) => void }) {
  const profil = useFit((s) => s.profil);
  const tumOgunler = useOgun((s) => s.ogunler);
  const ekleOgunler = useOgun((s) => s.ekleOgunler);
  const silOgun = useOgun((s) => s.silOgun);

  const [metin, setMetin] = useState("");
  const [manuelAd, setManuelAd] = useState("");
  const [manuelKcal, setManuelKcal] = useState("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const bugun = bugunAnahtar();
  const ogunler = tumOgunler.filter((o) => o.tarih === bugun);
  const h = profil ? profildenHesap(profil) : null;
  const gunlukHedef = h ? h.gunlukKalori : 2500;
  const toplam = ogunler.reduce((acc, o) => acc + o.kalori, 0);
  const kalan = gunlukHedef - toplam;

  // Akıllı/AI Arama ile Ekleme
  async function handleEkle(e: FormEvent) {
    e.preventDefault();
    const girdi = metin.trim();
    if (!girdi || yukleniyor) return;
    setHata("");
    setBilgi("");
    setYukleniyor(true);
    try {
      const sonuc = await yemekHesapla({ data: { metin: girdi } });
      if (!sonuc.ok) {
        setHata(hataMesaji(sonuc.hata));
        return;
      }
      ekleOgunler(
        sonuc.ogeler.map((o) => ({ tarih: bugunAnahtar(), isim: o.ad, kalori: o.kcal }))
      );
      setMetin("");
      setBilgi("Öğün başarıyla eklendi.");
    } catch {
      setHata("Bir sorun oluştu. Manuel eklemeyi deneyebilirsin.");
    } finally {
      setYukleniyor(false);
    }
  }

  // Hazır Butonla Tek Tıkla Ekleme
  function hizliEkle(ad: string, kcal: number) {
    setHata("");
    ekleOgunler([{ tarih: bugun, isim: ad, kalori: kcal }]);
    setBilgi(`${ad} eklendi (+${kcal} kcal).`);
  }

  // Manuel İsim + Kalori Ekleme
  function handleManuelEkle(e: FormEvent) {
    e.preventDefault();
    const ad = manuelAd.trim();
    const kcal = parseInt(manuelKcal, 10);
    if (!ad || isNaN(kcal) || kcal <= 0) {
      setHata("Lütfen geçerli bir öğün adı ve pozitif kalori değeri gir.");
      return;
    }
    setHata("");
    ekleOgunler([{ tarih: bugun, isim: ad, kalori: kcal }]);
    setManuelAd("");
    setManuelKcal("");
    setBilgi(`${ad} günlüğe eklendi (+${kcal} kcal).`);
  }

  return (
    <div className="space-y-6">
      <PageTitle
        index="04"
        title="Beslenme & Öğün Takibi"
        lede="Günlük kalori bütçeni kontrol et, pratik butonlarla veya serbestçe öğünlerini kaydet."
      />
      {/* Günlük Kalori Durum Özeti */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-line bg-cream p-4 text-center">
        <div>
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">Hedef Bütçe</div>
          <div className="mt-1 font-display text-xl font-bold text-ink">{fmtKcal(gunlukHedef)} <span className="text-xs font-normal">kcal</span></div>
        </div>
        <div className="border-x border-line/60">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">Alınan</div>
          <div className="mt-1 font-display text-xl font-bold text-pine">{fmtKcal(toplam)} <span className="text-xs font-normal">kcal</span></div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">Kalan</div>
          <div className={`mt-1 font-display text-xl font-bold ${kalan < 0 ? "text-clay" : "text-ink"}`}>
            {fmtKcal(kalan)} <span className="text-xs font-normal">kcal</span>
          </div>
        </div>
      </div>

      {/* 1. Sık Tüketilenler (Tek Tıkla Hızlı Ekle) */}
      <Panel>
        <div className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line/60">
            <span className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <span>⚡</span> Sık Tüketilen Besinler (Hızlı Ekle)
            </span>
            <span className="text-[11px] text-muted">Tek dokunuş</span>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {HIZLI_BESINLER.map((b) => (
              <button
                key={b.ad}
                type="button"
                onClick={() => hizliEkle(b.ad, b.kcal)}
                className="flex flex-col items-start rounded-xl border border-line bg-paper/60 p-3 text-left transition hover:border-pine hover:bg-cream active:scale-95"
              >
                <span className="text-lg">{b.icon}</span>
                <span className="mt-1.5 text-xs font-semibold text-ink line-clamp-1">{b.ad}</span>
                <span className="mt-0.5 text-[11px] font-mono font-bold text-pine">+{b.kcal} kcal</span>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* 2. Serbest / AI Öğün Arama ve Manuel Giriş */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Metinle Arama */}
        <Panel>
          <form onSubmit={handleEkle} className="p-5 flex flex-col justify-between h-full">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                Akıllı Öğün Girişi
              </label>
              <p className="text-xs text-muted mb-3">Miktar ve yiyecek yaz (örn: 2 dilim tam buğday ekmeği):</p>
              <input
                type="text"
                value={metin}
                onChange={(e) => setMetin(e.target.value)}
                placeholder="Örn: 1 kase mercimek çorbası"
                className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-ink outline-none focus:border-pine"
              />
            </div>
            <div className="mt-4">
              <Btn type="submit" disabled={yukleniyor}>
                {yukleniyor ? "Hesaplanıyor..." : "Hesapla ve Ekle"}
              </Btn>
            </div>
          </form>
        </Panel>

        {/* Manuel Kalori Girişi */}
        <Panel>
          <form onSubmit={handleManuelEkle} className="p-5 flex flex-col justify-between h-full">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                Hızlı Manuel Giriş
              </label>
              <p className="text-xs text-muted mb-3">Paket üzerindeki kaloriye göre hızlı ekle:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manuelAd}
                  onChange={(e) => setManuelAd(e.target.value)}
                  placeholder="Yemek adı"
                  className="w-2/3 rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-ink outline-none focus:border-pine"
                />
                <input
                  type="number"
                  value={manuelKcal}
                  onChange={(e) => setManuelKcal(e.target.value)}
                  placeholder="kcal"
                  className="w-1/3 rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-ink outline-none focus:border-pine font-mono"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 text-xs font-bold text-ink hover:border-pine transition active:scale-95"
              >
                + Manuel Ekle
              </button>
            </div>
          </form>
        </Panel>
      </div>

      {/* Bildirimler */}
      {bilgi && <div className="rounded-xl border border-pine/30 bg-pine/10 p-3 text-xs text-pine">{bilgi}</div>}
      {hata && <div className="rounded-xl border border-clay/30 bg-clay/10 p-3 text-xs text-clay">{hata}</div>}

      {/* Bugün Eklenen Öğünler Listesi */}
      <Panel>
        <div className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line/60">
            <span className="text-xs font-bold uppercase tracking-wider text-ink">Bugün Tüketilenler</span>
            <span className="text-xs font-mono font-bold text-pine">{toplam} kcal</span>
          </div>

          {ogunler.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">Bugün henüz bir öğün girmedin. Yukarıdaki butonlardan hızlıca ekleyebilirsin.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line/40">
              {ogunler.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5 text-xs">
                  <span className="text-ink font-medium">{o.isim}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-ink">{o.kalori} kcal</span>
                    <button
                      type="button"
                      onClick={() => silOgun(o.id)}
                      className="text-muted hover:text-clay transition"
                      title="Sil"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );
}