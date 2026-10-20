import { useState, type FormEvent } from "react";
import { PageTitle, Panel, Btn } from "./ui";
import { useFit } from "@/lib/store";
import { profildenHesap } from "@/lib/engine";
import { kocSor, yerelKoc } from "@/lib/coach";

interface Mesaj {
  id: string;
  gonderen: "kullanici" | "koc";
  metin: string;
}

export function CoachView() {
  const profil = useFit((s) => s.profil);
  const h = profil ? profildenHesap(profil) : null;
  const gunlukKalori = h ? h.gunlukKalori : 2500;

  const [mesajlar, setMesajlar] = useState<Mesaj[]>([
    {
      id: "1",
      gonderen: "koc",
      metin: "Selam! Ben ScoutFit Koçun. Antrenman programın, beslenmen, kaçamakların veya form durumun hakkında bana dilediğini sorabilirsin.",
    },
  ]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  // Kullanıcı profiline göre yapay zekaya bağlam metni hazırlar
  const baglamOlustur = () => {
    if (!profil || !h) return "Kilo: 75kg, Hedef: Kas kazanımı ve fit kalma";
    return `Mevcut kilo: ${profil.kilo}kg, Hedef kilo: ${profil.hedefKilo}kg, Boy: ${profil.boy}cm, Günlük kalori bütçesi: ${h.gunlukKalori} kcal`;
  };

  const handleGonder = async (e: FormEvent) => {
    e.preventDefault();
    const soruMetni = girdi.trim();
    if (!soruMetni || yukleniyor) return;

    const yeniKullaniciMesaji: Mesaj = {
      id: Date.now().toString(),
      gonderen: "kullanici",
      metin: soruMetni,
    };

    setMesajlar((prev) => [...prev, yeniKullaniciMesaji]);
    setGirdi("");
    setYukleniyor(true);

    try {
      // 1. Gerçek Yapay Zekaya (Groq API) Sor
      const sonuc = await kocSor({
        data: {
          soru: soruMetni,
          baglam: baglamOlustur(),
        },
      });

      let cevap = "";
      if (sonuc.ok && sonuc.metin) {
        cevap = sonuc.metin;
      } else {
        // API anahtarı yoksa veya hata verirse yerel akıllı motordan cevap al
        cevap = yerelKoc(soruMetni, gunlukKalori);
      }

      setMesajlar((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          gonderen: "koc",
          metin: cevap,
        },
      ]);
    } catch {
      setMesajlar((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          gonderen: "koc",
          metin: yerelKoc(soruMetni, gunlukKalori),
        },
      ]);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle
        index="06"
        title="ScoutFit AI Koç"
        lede="Aklına takılan her şeyi yaz; antrenman, kaçamak telafisi ve beslenme tavsiyelerini gerçek yapay zeka ile al."
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
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
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
                  Koç düşünüyor ve hazırlıyor...
                </div>
              </div>
            )}
          </div>

          {/* Soru Yazma Alanı */}
          <form
            onSubmit={handleGonder}
            className="border-t border-line p-3 flex gap-2 bg-paper"
          >
            <input
              type="text"
              value={girdi}
              onChange={(e) => setGirdi(e.target.value)}
              placeholder="Koça sor (örn: Dün gece 1 büyük pizza yedim, bugünü nasıl telafi edeyim?)"
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