import { useState } from "react";
import { useFit } from "@/lib/store";
import { fmtKcal, profildenHesap } from "@/lib/engine";
import { PageTitle } from "@/components/ui";
import { yemekHesapla } from "@/lib/yemek";
import type { Section } from "./shell";

export function MealsView({ git: _git }: { git?: (s: Section) => void }) {
  const profil = useFit((s: any) => s.profil);
  const store = useFit() as any;

  const [metin, setMetin] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yerelOgunler, setYerelOgunler] = useState<{ id: string; isim: string; kalori: number }[]>([]);

  const ogunler = store?.ogunler || store?.meals || yerelOgunler;
  const h = profil ? profildenHesap(profil) : null;
  const gunlukHedef = h ? h.gunlukKalori : 2100;

  const toplamKalori = Array.isArray(ogunler)
    ? ogunler.reduce((acc: number, curr: any) => acc + (Number(curr.kalori) || Number(curr.kcal) || 0), 0)
    : 0;
  const kalan = gunlukHedef - toplamKalori;

  function kaydaEkle(yeni: { id: string; isim: string; kalori: number }) {
    if (typeof store?.ogunEkle === "function") store.ogunEkle(yeni);
    else if (typeof store?.addMeal === "function") store.addMeal(yeni);
    else setYerelOgunler((onceki) => [...onceki, yeni]);
  }

  async function handleEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!metin.trim() || yukleniyor) return;
    setHata("");
    setYukleniyor(true);
    const sonuc = await yemekHesapla({ data: { metin: metin.trim() } });
    if (!sonuc.ok) {
      setHata("Kalori hesaplanamadı. Bir kez daha dene.");
      setYukleniyor(false);
      return;
    }
    for (const oge of sonuc.ogeler) {
      kaydaEkle({ id: crypto.randomUUID(), isim: oge.ad, kalori: oge.kcal });
    }
    setMetin("");
    setYukleniyor(false);
  }

  return (
    <div className="space-y-6">
      <PageTitle
        index="04"
        title="Beslenme"
        lede={`Günlük hedefin ${fmtKcal(gunlukHedef)} kcal. Yediklerini yaz, kalori hedeften düşer.`}
      />

      <div className="rounded-2xl border border-line bg-cream p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Bugün toplam alınan</span>
          <span className="text-xl font-medium text-ink">{fmtKcal(toplamKalori)} kcal</span>
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
      {hata ? <p className="text-sm text-ink">{hata}</p> : null}

      <div className="space-y-2">
        {Array.isArray(ogunler) && ogunler.length > 0 ? (
          ogunler.map((o: any) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-xl border border-line bg-cream p-4 text-sm"
            >
              <span className="font-medium text-ink">{o.isim || o.ad || o.name}</span>
              <span className="text-muted">{fmtKcal(o.kalori || o.kcal || 0)} kcal</span>
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-muted">Henüz kaydedilmiş öğün yok.</p>
        )}
      </div>
    </div>
  );
}