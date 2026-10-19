import { useState } from "react";
import { useFit } from "@/lib/store";
import { fmtKcal, profildenHesap } from "@/lib/engine";
import { PageTitle } from "@/components/ui";
import { kocSor } from "@/lib/coach";
import type { Section } from "./shell";

// --- GELİŞTİRİLMİŞ YAPAY ZEKA KALORİ MOTORU ---
async function aiKaloriHesapla(metin: string): Promise<{ isim: string; kalori: number }> {
  try {
    const prompt = `Aşağıdaki yemeğin yaklaşık kalorisini hesapla.
Yemek: "${metin}"

Kurallar:
- Sadece tek bir tam sayı yaz (örnek: 370)
- Hiçbir açıklama, birim, kelime veya noktalama ekleme
- Sadece sayı`;

    const sonuc = await kocSor({
      data: {
        soru: prompt,
        baglam: "Sen sadece sayı döndüren bir kalori hesaplama motorusun. Asla kelime kullanma. Sadece tam sayı yaz."
      }
    });

    if (sonuc.ok === true && typeof sonuc.metin === "string") {
      const temiz = sonuc.metin.replace(/[^\d]/g, "");
      const kaloriDegeri = parseInt(temiz, 10);

      if (!isNaN(kaloriDegeri) && kaloriDegeri > 10 && kaloriDegeri < 5000) {
        return {
          isim: metin.charAt(0).toUpperCase() + metin.slice(1),
          kalori: kaloriDegeri
        };
      }
    }
  } catch (error) {
    console.error("AI Kalori hatası:", error);
  }

  return {
    isim: metin.charAt(0).toUpperCase() + metin.slice(1) + " (AI cevap vermedi)",
    kalori: 0
  };
}

export function MealsView({ git }: { git?: (s: Section) => void }) {
  const profil = useFit((s: any) => s.profil);
  const store = useFit() as any;

  const [metin, setMetin] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yerelOgunler, setYerelOgunler] = useState<{ id: string; isim: string; kalori: number }[]>([]);

  const ogunler = store?.ogunler || store?.meals || yerelOgunler;
  const h = profil ? profildenHesap(profil) : null;
  const gunlukHedef = h ? h.gunlukKalori : 2100;

  const toplamKalori = Array.isArray(ogunler)
    ? ogunler.reduce((acc: number, curr: any) => acc + (Number(curr.kalori) || 0), 0)
    : 0;

  async function handleEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!metin.trim() || yukleniyor) return;

    setYukleniyor(true);
    const sonuc = await aiKaloriHesapla(metin.trim());
    const yeniOgun = { id: crypto.randomUUID(), isim: sonuc.isim, kalori: sonuc.kalori };

    if (typeof store?.ogunEkle === "function") {
      store.ogunEkle(yeniOgun);
    } else if (typeof store?.addMeal === "function") {
      store.addMeal(yeniOgun);
    } else {
      setYerelOgunler((onceki) => [...onceki, yeniOgun]);
    }

    setMetin("");
    setYukleniyor(false);
  }

  return (
    <div className="space-y-6">
      <PageTitle
        index="04"
        title="Beslenme"
        lede={`Günlük hedefin ${fmtKcal(gunlukHedef)} kcal. Yediklerini yaz, yapay zeka hesaplasın.`}
      />

      <div className="rounded-2xl border border-line bg-cream p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Bugün Toplam Alınan:</span>
          <span className="text-xl font-medium text-ink">{fmtKcal(toplamKalori)} kcal</span>
        </div>
      </div>

      <form onSubmit={handleEkle} className="flex gap-2">
        <input
          type="text"
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          placeholder="Örn: 75 gram probis, 2 yumurta..."
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