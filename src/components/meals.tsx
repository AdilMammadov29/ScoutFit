import { useState, type FormEvent } from "react";
import { useFit } from "@/lib/store";
import { useOgun } from "@/lib/ogun";
import { fmtKcal, profildenHesap } from "@/lib/engine";
import { PageTitle } from "@/components/ui";
import { bugunAnahtar, yemekHesapla } from "@/lib/yemek";
import type { Section } from "./shell";

function hataMesaji(kod: string) {
  if (kod === "ayiklanamadi")
    return "Bunu bir yiyecek olarak anlayamadım. Miktarıyla yaz, örneğin: 2 dilim salam.";
  if (kod === "yok") return "API anahtarı bulunamadı. Öğün hesabı için anahtarı ayarlaman gerekiyor.";
  if (kod === "ag") return "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.";
  if (kod.startsWith("http-")) return `Servis hata verdi (${kod.slice(5)}). Biraz sonra tekrar dene.`;
  return "Kalori hesaplanamadı. Bir kez daha dene.";
}

export function MealsView({ git: _git }: { git?: (s: Section) => void }) {
  const profil = useFit((s) => s.profil);
  const tumOgunler = useOgun((s) => s.ogunler);
  const ekleOgunler = useOgun((s) => s.ekleOgunler);
  const silOgun = useOgun((s) => s.silOgun);

  const [metin, setMetin] = useState("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const bugun = bugunAnahtar();
  const ogunler = tumOgunler.filter((o) => o.tarih === bugun);
  const h = profil ? profildenHesap(profil) : null;
  const gunlukHedef = h ? h.gunlukKalori : 2100;
  const toplam = ogunler.reduce((acc, o) => acc + o.kalori, 0);
  const kalan = gunlukHedef - toplam;

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
        sonuc.ogeler.map((o) => ({ tarih: bugunAnahtar(), isim: o.ad, kalori: o.kcal })),
      );
      const eklenen = sonuc.ogeler.reduce((a, o) => a + o.kcal, 0);
      setBilgi(`${sonuc.ogeler.map((o) => o.ad).join(", ")} eklendi (+${fmtKcal(eklenen)} kcal).`);
      setMetin("");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        index="04"
        title="Beslenme"
        lede={`Günlük hedefin ${fmtKcal(gunlukHedef)} kcal. Yediklerini yaz, kalori hedeften düşer.`}
      />

      <div className="space-y-2 rounded-2xl border border-line bg-cream p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Bugün toplam alınan</span>
          <span className="text-xl font-medium text-ink">{fmtKcal(toplam)} kcal</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Kalan</span>
          <span className="text-sm font-medium text-ink">{fmtKcal(kalan)} kcal</span>
        </div>
      </div>

      <form onSubmit={handleEkle} className="flex gap-2">
        <input
          type="text"
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          placeholder="Örn: 75 gram probis, 2 yumurta"
          className="min-h-11 flex-1 rounded-xl border border-line bg-cream px-4 text-sm text-ink outline-none focus:border-pine"
          disabled={yukleniyor}
        />
        <button
          type="submit"
          disabled={yukleniyor || !metin.trim()}
          className="inline-flex min-h-11 items-center rounded-xl bg-pine px-5 text-sm font-medium text-cream disabled:opacity-40"
        >
          {yukleniyor ? "Hesaplanıyor..." : "Kaydet"}
        </button>
      </form>
      {hata ? <p className="text-sm text-clay">{hata}</p> : null}
      {bilgi ? <p className="text-sm text-pine">{bilgi}</p> : null}

      <div className="space-y-2">
        {ogunler.length > 0 ? (
          ogunler.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-xl border border-line bg-cream p-4 text-sm"
            >
              <span className="font-medium text-ink">{o.isim}</span>
              <span className="flex items-center gap-4">
                <span className="text-muted">{fmtKcal(o.kalori)} kcal</span>
                <button
                  type="button"
                  onClick={() => silOgun(o.id)}
                  className="text-muted hover:text-clay"
                  aria-label="Öğünü sil"
                >
                  Sil
                </button>
              </span>
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-muted">Bugün henüz öğün eklemedin.</p>
        )}
      </div>
    </div>
  );
}