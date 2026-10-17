import { useState } from "react";
import { useFit } from "@/lib/store";
import { profildenHesap } from "@/lib/engine";
import { PageTitle } from "@/components/ui";
import { kocSor } from "@/lib/coach";

// --- GERÇEK YAPAY ZEKA KALORİ MOTORU (KURŞUN GEÇİRMEZ MOD) ---
async function aiKaloriHesapla(metin: string): Promise<{ isim: string; kalori: number }> {
  try {
    const prompt = `Görev: "${metin}" besininin/yemeğinin belirtilen porsiyondaki veya gramajdaki toplam kalorisini bul.
    Kurallar:
    1. ASLA açıklama yapma.
    2. ASLA matematik formülü veya "kaloridir" gibi kelimeler yazma.
    3. SADECE VE SADECE nihai kalori değerini tam sayı olarak yaz.
    Örnek girdi: "75 gram probis"
    Örnek çıktı: 370`;
    
    const sonuc = await kocSor({ data: { soru: prompt, baglam: "Sen sadece sayı döndüren bir API sunucususun. Kelime kullanman kesinlikle yasaktır." } });
    
    if (sonuc.ok) {
      const sayilar = sonuc.metin.match(/\d+/g); 
      if (sayilar && sayilar.length > 0) {
        const nihaiRakam = sayilar[sayilar.length - 1];
        const kaloriDegeri = parseInt(nihaiRakam, 10);
        if (!isNaN(kaloriDegeri) && kaloriDegeri > 0) {
          return {
            isim: metin.charAt(0).toUpperCase() + metin.slice(1),
            kalori: kaloriDegeri
          };
        }
      }
    }
  } catch (error) {
    console.error("AI Kalori hesaplama hatası:", error);
  }
  
  return { 
    isim: metin.charAt(0).toUpperCase() + metin.slice(1) + " (Sistem Yanıt Vermedi)", 
    kalori: 250 
  };
}

export function MealsView({ git }: { git?: any }) {
  const profil = useFit((s) => s.profil);
  const ogunler = useFit((s) => s.ogunler || []);
  const ekleOgun = useFit((s) => s.ekleOgun);
  const silOgun = useFit((s) => s.silOgun);

  const [taslak, setTaslak] = useState("");
  const [hesaplaniyor, setHesaplaniyor] = useState(false);

  const hedefKalori = profil ? profildenHesap(profil).gunlukKalori : 2100;
  const alinanKalori = ogunler.reduce((toplam: number, o: any) => toplam + o.kalori, 0);
  const kalanKalori = hedefKalori - alinanKalori;
  const yuzde = Math.min((alinanKalori / hedefKalori) * 100, 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taslak.trim()) return;

    setHesaplaniyor(true);
    
    const sonuc = await aiKaloriHesapla(taslak.trim());
    ekleOgun(sonuc.isim, sonuc.kalori);
    
    setTaslak("");
    setHesaplaniyor(false);
  };

  return (
    <div className="pb-16 px-2 md:px-0">
      <PageTitle 
        index="04" 
        title="Akıllı Öğün" 
        lede="Ne yediğini serbestçe yaz, yapay zeka gerçek kalorisini bulup bütçenden düşsün." 
      />

      <div className="mb-8 md:mb-10 relative overflow-hidden rounded-3xl border border-line/60 bg-gradient-to-br from-cream to-paper p-6 md:p-8 shadow-sm">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pine/10 blur-3xl"></div>
        
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between relative z-10 gap-4 md:gap-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Kalan Bütçe</p>
            {/* MOBİL İÇİN KÜÇÜLTÜLDÜ: text-4xl, bilgisayarda text-6xl */}
            <h2 className={`font-display text-4xl md:text-6xl font-black tracking-tight ${kalanKalori < 0 ? "text-clay" : "text-pine"}`}>
              {kalanKalori} <span className="text-xl md:text-2xl font-medium text-muted">kcal</span>
            </h2>
            {kalanKalori < 0 && (
              <p className="text-xs font-medium text-clay mt-2 flex items-center gap-1">
                <span>⚠️</span> Günlük kalori sınırını aştın!
              </p>
            )}
          </div>
          <div className="text-left md:text-right flex flex-row md:flex-col gap-4 md:gap-0">
            <p className="text-sm font-medium text-muted mb-1">Hedef: <strong className="text-ink">{hedefKalori}</strong></p>
            <p className="text-sm font-medium text-muted">Alınan: <strong className="text-ink">{alinanKalori}</strong></p>
          </div>
        </div>
        
        <div className="h-4 md:h-5 w-full overflow-hidden rounded-full bg-line/40 shadow-inner relative z-10">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${kalanKalori < 0 ? "bg-clay" : "bg-pine"}`} 
            style={{ width: `${yuzde}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 md:mb-10 relative group">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-pine/30 to-pine/10 blur opacity-25 group-focus-within:opacity-100 transition duration-500"></div>
        <div className="relative flex flex-col md:flex-row items-center bg-cream border border-line rounded-2xl shadow-sm p-2 gap-2 focus-within:border-pine/50 transition-colors">
          <div className="hidden md:block pl-4 pr-2 text-xl">✨</div>
          <input
            type="text"
            value={taslak}
            onChange={(e) => setTaslak(e.target.value)}
            placeholder="Örn: 75 gram probis, 1 iskender..."
            className="w-full flex-1 min-h-[50px] bg-transparent px-4 md:px-2 py-2 md:py-0 text-sm text-ink outline-none placeholder:text-muted/60"
            disabled={hesaplaniyor}
          />
          <button 
            type="submit" 
            disabled={!taslak.trim() || hesaplaniyor}
            className="w-full md:w-auto rounded-xl bg-pine px-6 py-3 md:py-3 text-sm font-bold text-paper shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {hesaplaniyor ? "Hesaplanıyor..." : "Kaydet"}
          </button>
        </div>
      </form>

      <div>
        <h3 className="font-display text-lg font-bold text-ink mb-4 pl-1">Bugün Yediklerin</h3>
        <div className="space-y-3">
          {ogunler.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-6 md:p-8 text-center">
              <p className="text-sm font-medium text-muted">Bugün henüz bir şey kaydetmedin.</p>
            </div>
          ) : (
            ogunler.map((ogun: any) => (
              <div key={ogun.id} className="group flex items-center justify-between rounded-2xl border border-line/60 bg-cream/50 p-4 transition-all hover:bg-cream hover:shadow-sm">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine font-bold">
                    🍽️
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-ink capitalize truncate max-w-[120px] md:max-w-xs">{ogun.isim}</p>
                    <p className="text-xs font-medium text-muted mt-0.5">
                      {new Date(ogun.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-5">
                  <span className="font-display text-lg md:text-xl font-bold text-pine">{ogun.kalori} <span className="text-xs md:text-sm font-medium text-muted">kcal</span></span>
                  <button 
                    onClick={() => silOgun(ogun.id)} 
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-clay/10 hover:text-clay transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}