import { useState, type FormEvent } from "react";
import { PageTitle, Panel, Btn } from "./ui";
import { useFit } from "@/lib/store";
import { profildenHesap } from "@/lib/engine";

interface Mesaj {
  id: string;
  gonderen: "kullanici" | "koc";
  metin: string;
}

export function CoachView() {
  const profil = useFit((s) => s.profil);
  const h = profil ? profildenHesap(profil) : null;

  const [mesajlar, setMesajlar] = useState<Mesaj[]>([
    {
      id: "1",
      gonderen: "koc",
      metin: "Selam! Ben ScoutFit Koçun. Antrenmanların, beslenmen, kaçamakların veya yorgunluk durumun hakkında bana dilediğini sorabilirsin.",
    },
  ]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  // Gelen soruya göre yanıt üreten mantık
  const cevapUret = (soru: string): string => {
    const s = soru.toLowerCase();

    if (s.includes("pizza") || s.includes("hamburger") || s.includes("tatlı") || s.includes("kaçamak") || s.includes("fazla yedim")) {
      return "Kaçamak yaptığın için moralini bozma, tek bir öğünle form kaybolmaz. Bugün bol su iç (en az 3-3.5L) ve sodyumu dengele. Yarın ve sonraki gün karbonhidratı biraz kısıp 20-30 dakika tempolu yürüyüş eklersen tamamen dengelenir.";
    }

    if (s.includes("antrenman") && (s.includes("kaçtı") || s.includes("gidemedim") || s.includes("yapamadım"))) {
      return "Sorun değil. Dinlenme günü gibi düşün. Bugün kalorilerini aşmamaya çalış. Bir sonraki gün ana hareketleri birleştirerek (örneğin Göğüs + Sırt veya Bacak + Omuz) 45 dakikalık bileşik bir telafi seansı çıkarabilirsin.";
    }

    if (s.includes("yorgun") || s.includes("ağrı") || s.includes("uyku") || s.includes("enerjim yok")) {
      return "Merkezi sinir sistemin sinyal veriyor olabilir. Bugün ağır kilolara girmek yerine ağırlıkları %30 düşür, esnemeye odaklan veya direkt dinlen. En az 8 saat uyku ve iyi beslenme toparlanmanı hızlandıracaktır.";
    }

    if (s.includes("kilo") || s.includes("hedef") || s.includes("kalori")) {
      const hedefKcal = h ? h.gunlukKalori : 2400;
      return `Mevcut verilerine göre günlük kalori hedefin yaklaşık ${hedefKcal} kcal. Haftalık kilo takibinde ani iniş çıkışlara takılma; su dengesi, tuz ve sindirim kilo değişimlerini dalgalandırabilir. Haftalık ortalamaya odaklan.`;
    }

    if (s.includes("protein") || s.includes("tavuk") || s.includes("beslenme")) {
      return "Kas kütlesini korumak ve geliştirmek için kilo başına 1.6 - 2.2 gram protein hedeflemek idealdir. Öğünlerini gün içine dengeli dağıtıp tavuk, yumurta, lor veya balık gibi temiz kaynaklara öncelik ver.";
    }

    return "Sorunu aldım. Hedefine sadık kalmak için tutarlılık en kritik faktördür. Beslenmende günlük kalori sınırını koru, antrenmanlarında ise tükenişe 1-2 tekrar kala (RPE 8-9) kontrollü çalışmaya devam et. Başka bir detay varsa sorabilirsin.";
  };

  const handleGonder = (e: FormEvent) => {
    e.preventDefault();
    const metin = girdi.trim();
    if (!metin || yukleniyor) return;

    const yeniKullaniciMesaji: Mesaj = {
      id: Date.now().toString(),
      gonderen: "kullanici",
      metin,
    };

    setMesajlar((onceki) => [...onceki, yeniKullaniciMesaji]);
    setGirdi("");
    setYukleniyor(true);

    setTimeout(() => {
      const yanit = cevapUret(metin);
      const yeniKocMesaji: Mesaj = {
        id: (Date.now() + 1).toString(),
        gonderen: "koc",
        metin: yanit,
      };
      setMesajlar((onceki) => [...onceki, yeniKocMesaji]);
      setYukleniyor(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        index="06"
        title="ScoutFit AI Koç"
        lede="Aklına takılan her şeyi yaz, antrenman ve beslenme tavsiyelerini anında al."
      />

      <Panel>
        <div className="flex flex-col h-[520px]">
          {/* Mesaj Akışı */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mesajlar.map((m) => {
              const kullaniciMi = m.gonderen === "kullanici";
              return (
                <div
                  key={m.id}
                  className={`flex ${kullaniciMi ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      kullaniciMi
                        ? "bg-pine text-cream font-medium"
                        : "border border-line bg-cream text-ink"
                    }`}
                  >
                    {!kullaniciMi && (
                      <span className="block font-bold text-pine mb-1">Scout Koç</span>
                    )}
                    {m.metin}
                  </div>
                </div>
              );
            })}

            {yukleniyor && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-line bg-cream px-4 py-3 text-xs text-muted animate-pulse">
                  Koç düşünüyor...
                </div>
              </div>
            )}
          </div>

          {/* Soru Yazma Kutusu */}
          <form
            onSubmit={handleGonder}
            className="border-t border-line p-3 flex gap-2 bg-paper"
          >
            <input
              type="text"
              value={girdi}
              onChange={(e) => setGirdi(e.target.value)}
              placeholder="Koça bir şey sor (örn: Dün akşam tatlı yedim ne yapayım?)"
              className="flex-1 rounded-xl border border-line bg-cream px-4 py-2.5 text-xs text-ink outline-none focus:border-pine"
            />
            <Btn type="submit" disabled={yukleniyor || !girdi.trim()}>
              Gönder
            </Btn>
          </form>
        </div>
      </Panel>
    </div>
  );
}