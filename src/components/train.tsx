import { useState, useEffect } from "react";
import { PROGRAMLAR } from "@/lib/programs";
import { useFit } from "@/lib/store";
import { useActivity } from "@/lib/activityStore";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import {
  Dumbbell,
  Footprints,
  BookOpen,
  Plus,
  Trash2,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  X,
  Timer,
  Route,
  Flame, // Kalori ikonu eklendi
} from "lucide-react";

function tarihKisa(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

interface SetSatiri {
  id: string;
  hareketAdi: string;
  setSayisi: string;
  tekrarSayisi: string;
  agirlikKg: string;
}

function TakipEkrani() {
  const isNative = Capacitor.isNativePlatform();
  const { bugunAdim, aktifAntrenman, antrenmanBaslat, antrenmanBitir, antrenmanIptal } = useActivity();
  const ekle = useFit((s) => s.ekleAntrenman);
  const profil = useFit((s) => s.profil);

  const [gecenSaniye, setGecenSaniye] = useState(0);
  const [secilenAktivite, setSecilenAktivite] = useState("Açık Hava Yürüyüşü");

  const adimBoyuMetre = profil?.boy ? (profil.boy / 100) * 0.415 : 0.75;

  useEffect(() => {
    if (!aktifAntrenman?.aktif) {
      setGecenSaniye(0);
      return;
    }

    const saniyeHesapla = () => {
      const farkMs = Date.now() - aktifAntrenman.baslangicZamani;
      setGecenSaniye(Math.max(0, Math.floor(farkMs / 1000)));
    };

    saniyeHesapla();
    const interval = setInterval(saniyeHesapla, 1000);

    const appStateListener = App.addListener("appStateChange", (durum) => {
      if (durum.isActive) {
        saniyeHesapla();
      }
    });

    return () => {
      clearInterval(interval);
      appStateListener.then((handle) => handle.remove()).catch(() => {});
    };
  }, [aktifAntrenman]);

  const formatSure = (toplamSaniye: number) => {
    const saat = Math.floor(toplamSaniye / 3600);
    const dakika = Math.floor((toplamSaniye % 3600) / 60);
    const saniye = toplamSaniye % 60;

    if (saat > 0) {
      return `${saat}:${dakika.toString().padStart(2, "0")}:${saniye.toString().padStart(2, "0")}`;
    }
    return `${dakika.toString().padStart(2, "0")}:${saniye.toString().padStart(2, "0")}`;
  };

  const anlikAdim = aktifAntrenman?.aktif
    ? Math.max(0, bugunAdim - aktifAntrenman.baslangicAdim)
    : 0;

  const anlikMesafeKm = Number(((anlikAdim * adimBoyuMetre) / 1000).toFixed(2));
  
  // Kalori Hesaplaması
  const anlikKalori = profil?.kilo 
    ? Math.round(anlikMesafeKm * profil.kilo) 
    : Math.round(anlikAdim * 0.045);

  const handleBitir = () => {
    if (!aktifAntrenman) return;

    const sureDk = Math.max(1, Math.round((Date.now() - aktifAntrenman.baslangicZamani) / 60000));

    if (sureDk < 5) {
      const onay = window.confirm("Antrenman 5 dakikadan kısa sürdü. Yine de kaydetmek istiyor musunuz?");
      if (!onay) return;
    }

    const sonuc = antrenmanBitir();
    if (sonuc) {
      ekle({
        bolge: sonuc.bolge,
        hareketler: `Pedometre Takibi: ${sonuc.adim.toLocaleString("tr-TR")} adım · ${sonuc.mesafeKm} km · ${anlikKalori} kcal`,
        sureDk: Math.min(240, Math.max(5, sonuc.sureDk)),
      });
    }
  };

  const handleIptal = () => {
    const onay = window.confirm("Devam eden antrenmanı kaydetmeden iptal etmek istediğinize emin misiniz?");
    if (onay) {
      antrenmanIptal();
    }
  };

  return (
    <div className="space-y-4">
      {!isNative && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 text-[13px] text-muted">
          <AlertCircle className="h-5 w-5 shrink-0 text-clay" />
          <span>Donanım adım sayacı yalnızca mobil cihazlarda aktiftir.</span>
        </div>
      )}

      {aktifAntrenman?.aktif ? (
        <div className="rounded-xl border border-line bg-surface p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted block">
                Devam Eden Takip
              </span>
              <h3 className="font-serif text-lg font-bold text-ink">
                {aktifAntrenman.bolge}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine/10 text-pine">
              <Footprints className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-line/60 bg-paper/50 p-3">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted mb-1">
                <Timer className="h-3.5 w-3.5" />
                <span>Süre</span>
              </div>
              <span className="font-mono text-lg font-bold text-ink">
                {formatSure(gecenSaniye)}
              </span>
            </div>

            <div className="rounded-xl border border-line/60 bg-paper/50 p-3">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted mb-1">
                <Footprints className="h-3.5 w-3.5" />
                <span>Adım</span>
              </div>
              <span className="font-mono text-lg font-bold text-ink">
                {anlikAdim.toLocaleString("tr-TR")}
              </span>
            </div>

            <div className="rounded-xl border border-line/60 bg-paper/50 p-3">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted mb-1">
                <Route className="h-3.5 w-3.5" />
                <span>Mesafe</span>
              </div>
              <span className="font-mono text-lg font-bold text-ink">
                {anlikMesafeKm} <span className="text-[11px] font-normal text-muted">km</span>
              </span>
            </div>

            <div className="rounded-xl border border-line/60 bg-paper/50 p-3">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted mb-1">
                <Flame className="h-3.5 w-3.5 text-clay" />
                <span>Kalori</span>
              </div>
              <span className="font-mono text-lg font-bold text-ink">
                {anlikKalori} <span className="text-[11px] font-normal text-muted">kcal</span>
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleIptal}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-[13px] font-medium text-clay hover:bg-clay/5 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>İptal</span>
            </button>
            <button
              type="button"
              onClick={handleBitir}
              className="flex min-h-[44px] flex-2 items-center justify-center gap-2 rounded-xl bg-pine px-4 py-2.5 text-[13px] font-medium text-paper hover:opacity-95 transition-opacity"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Bitir</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface p-5 space-y-5">
          <div>
            <h3 className="font-serif text-base font-bold text-ink">
              Adım Sayar ile Antrenman
            </h3>
            <p className="mt-1 text-[13px] text-muted leading-relaxed">
              Telefonun donanım pedometresi ile arka planda kesintisiz adım ve süre takibi yapın.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-medium text-muted block">
              Aktivite Türü
            </label>
            <select
              value={secilenAktivite}
              onChange={(e) => setSecilenAktivite(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-line bg-paper px-3 text-[14px] text-ink focus:outline-none focus:border-pine"
            >
              <option value="Açık Hava Yürüyüşü">Açık Hava Yürüyüşü</option>
              <option value="Koşu Bandı">Koşu Bandı / Yürüyüş</option>
              <option value="Hafif Tempo Koşu">Hafif Tempo Koşu</option>
              <option value="Doğa Yürüyüşü">Doğa Yürüyüşü</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => antrenmanBaslat(secilenAktivite)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-pine px-4 py-3 text-[14px] font-medium text-paper hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Antrenmanı Başlat</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function TrainView() {
  const antrenmanlar = useFit((s) => s.antrenmanlar);
  const ekle = useFit((s) => s.ekleAntrenman);
  const ekleProgram = useFit((s) => s.ekleProgram);
  const sil = useFit((s) => s.silAntrenman);
  const temizle = useFit((s) => s.temizleAntrenman);
  const aktifAntrenman = useActivity((s) => s.aktifAntrenman);

  const [sekme, setSekme] = useState<"kayit" | "program" | "takip">(() =>
    aktifAntrenman?.aktif ? "takip" : "kayit"
  );
  const [girisTipi, setGirisTipi] = useState<"detayli" | "serbest">("detayli");
  const [bolge, setBolge] = useState("");
  const [sure, setSure] = useState("45");
  const [hareketler, setHareketler] = useState("");
  const [hata, setHata] = useState("");
  const [secili, setSecili] = useState<string | null>(null);
  const [onay, setOnay] = useState(false);
  const [not, setNot] = useState("");

  const [setler, setSetler] = useState<SetSatiri[]>([
    { id: "1", hareketAdi: "", setSayisi: "3", tekrarSayisi: "10", agirlikKg: "50" },
  ]);

  const program = PROGRAMLAR.find((p) => p.id === secili) ?? null;

  const yeniSetEkle = () => {
    setSetler((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        hareketAdi: "",
        setSayisi: "3",
        tekrarSayisi: "10",
        agirlikKg: "20",
      },
    ]);
  };

  const setSil = (id: string) => {
    if (setler.length <= 1) return;
    setSetler((prev) => prev.filter((s) => s.id !== id));
  };

  const setGuncelle = (id: string, alan: keyof SetSatiri, deger: string) => {
    setSetler((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [alan]: deger } : s))
    );
  };

  const toplamHacimKg = setler.reduce((toplam, s) => {
    const sSayi = Number(s.setSayisi) || 0;
    const tSayi = Number(s.tekrarSayisi) || 0;
    const kg = Number(s.agirlikKg) || 0;
    return toplam + sSayi * tSayi * kg;
  }, 0);

  function kaydet() {
    const sureDk = Number(sure);
    if (!bolge.trim()) {
      setHata("Antrenman bölgesi seçilmeli.");
      return;
    }

    let kaydedilecekHareketler = "";

    if (girisTipi === "detayli") {
      const doluSetler = setler.filter((s) => s.hareketAdi.trim().length > 0);
      if (doluSetler.length === 0) {
        setHata("En az 1 hareket adı girmelisin.");
        return;
      }
      kaydedilecekHareketler = doluSetler
        .map((s) => {
          const sSayi = Number(s.setSayisi) || 1;
          const tSayi = Number(s.tekrarSayisi) || 1;
          const kg = Number(s.agirlikKg) || 0;
          const hacim = sSayi * tSayi * kg;
          return `• ${s.hareketAdi.trim()}: ${sSayi} Set × ${tSayi} Tekrar @ ${kg} kg (${hacim.toLocaleString()} kg)`;
        })
        .join("\n");

      if (toplamHacimKg > 0) {
        kaydedilecekHareketler += `\n\nToplam Antrenman Hacmi: ${toplamHacimKg.toLocaleString()} kg`;
      }
    } else {
      if (!hareketler.trim()) {
        setHata("Hareket açıklaması gerekli.");
        return;
      }
      kaydedilecekHareketler = hareketler.trim();
    }

    if (!Number.isFinite(sureDk) || sureDk < 5 || sureDk > 240) {
      setHata("Süre 5–240 dakika olmalı.");
      return;
    }

    ekle({
      bolge: bolge.trim(),
      hareketler: kaydedilecekHareketler,
      sureDk: Math.round(sureDk),
    });

    setBolge("");
    setHareketler("");
    setSetler([
      { id: String(Date.now()), hareketAdi: "", setSayisi: "3", tekrarSayisi: "10", agirlikKg: "50" },
    ]);
    setSure("45");
    setHata("");
    setNot("Antrenman kaydı eklendi.");
  }

  function programEkle() {
    if (!program) return;
    ekleProgram(
      program.gunler.map((g) => ({
        bolge: g.bolge,
        hareketler: g.hareketler.join("\n"),
        sureDk: g.sureDk,
      }))
    );
    setSekme("kayit");
    setNot(`${program.ad} kayıtlara eklendi.`);
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="border-b border-line pb-4">
        <span className="text-[13px] font-medium text-muted block">
          Antrenman & Takip
        </span>
        <h1 className="font-serif text-2xl font-bold text-ink">Antrenman</h1>
        <p className="mt-1 text-[13px] text-muted">
          Set, tekrar ve ağırlık takibi yap, hazır programları uygula veya adım sayar ile antrenman başlat.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1">
        {(
          [
            ["kayit", "Kayıtlar", Dumbbell],
            ["program", "Programlar", BookOpen],
            ["takip", "Takip", Footprints],
          ] as const
        ).map(([id, ad, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSekme(id);
              setNot("");
            }}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-medium transition-colors duration-150 ${
              sekme === id
                ? "bg-pine text-paper"
                : "text-muted hover:text-ink hover:bg-paper/40"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{ad}</span>
          </button>
        ))}
      </div>

      {not && (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-[13px] text-ink">
          <CheckCircle2 className="w-4 h-4 text-pine shrink-0" />
          <span>{not}</span>
        </div>
      )}

      {sekme === "takip" ? (
        <TakipEkrani />
      ) : sekme === "kayit" ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-serif text-lg font-bold text-ink mb-4">Yeni Antrenman Kaydı</h2>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[13px] text-muted block mb-1">Bölge / Split</label>
                  <input
                    className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted/60 transition-colors focus:border-muted/60"
                    value={bolge}
                    placeholder="Göğüs & Biceps, Bacak, Sırt…"
                    onChange={(e) => setBolge(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[13px] text-muted block mb-1">Süre (dk)</label>
                  <input
                    className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted/60 transition-colors focus:border-muted/60"
                    inputMode="numeric"
                    value={sure}
                    onChange={(e) => setSure(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-line pb-2.5 pt-1">
                <span className="text-[13px] font-medium text-muted">
                  Kayıt Formatı
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGirisTipi("detayli")}
                    className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      girisTipi === "detayli"
                        ? "bg-pine text-paper"
                        : "bg-paper text-muted hover:text-ink border border-line"
                    }`}
                  >
                    Set / Tekrar / Kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setGirisTipi("serbest")}
                    className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      girisTipi === "serbest"
                        ? "bg-pine text-paper"
                        : "bg-paper text-muted hover:text-ink border border-line"
                    }`}
                  >
                    Serbest Not
                  </button>
                </div>
              </div>

              {girisTipi === "detayli" ? (
                <div className="space-y-3">
                  <div className="space-y-2.5">
                    {setler.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-line bg-paper/60 p-3 flex flex-col sm:flex-row sm:items-center gap-2.5"
                      >
                        <span className="text-[12px] font-medium text-muted w-6">
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          placeholder="Hareket (örn: Bench Press)"
                          value={item.hareketAdi}
                          onChange={(e) => setGuncelle(item.id, "hareketAdi", e.target.value)}
                          className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-[13px] text-ink outline-none placeholder:text-muted/60 focus:border-muted/60"
                        />
                        <div className="grid grid-cols-3 gap-2 sm:w-60">
                          <div>
                            <span className="text-[11px] text-muted block mb-0.5">
                              Set
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={item.setSayisi}
                              onChange={(e) => setGuncelle(item.id, "setSayisi", e.target.value)}
                              className="w-full rounded-lg border border-line bg-paper p-2 text-center text-[13px] text-ink outline-none focus:border-muted/60"
                            />
                          </div>
                          <div>
                            <span className="text-[11px] text-muted block mb-0.5">
                              Tekrar
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={item.tekrarSayisi}
                              onChange={(e) => setGuncelle(item.id, "tekrarSayisi", e.target.value)}
                              className="w-full rounded-lg border border-line bg-paper p-2 text-center text-[13px] text-ink outline-none focus:border-muted/60"
                            />
                          </div>
                          <div>
                            <span className="text-[11px] text-muted block mb-0.5">
                              Kg
                            </span>
                            <input
                              type="number"
                              step="0.5"
                              value={item.agirlikKg}
                              onChange={(e) => setGuncelle(item.id, "agirlikKg", e.target.value)}
                              className="w-full rounded-lg border border-line bg-paper p-2 text-center text-[13px] text-ink outline-none focus:border-muted/60"
                            />
                          </div>
                        </div>
                        {setler.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSil(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-clay hover:bg-paper transition-colors"
                            title="Hareketi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={yeniSetEkle}
                      className="flex items-center gap-1 text-[13px] font-medium text-pine hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Hareket Ekle</span>
                    </button>
                    {toplamHacimKg > 0 && (
                      <span className="font-serif text-sm font-semibold text-pine">
                        Toplam Hacim: {toplamHacimKg.toLocaleString()} kg
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[13px] text-muted block mb-1">Hareketler</label>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted/60 focus:border-muted/60"
                    value={hareketler}
                    placeholder={"Her satıra bir hareket\nBench press 4×8 @ 80kg"}
                    onChange={(e) => setHareketler(e.target.value)}
                  />
                </div>
              )}

              {hata && (
                <div className="flex items-center gap-2 rounded-xl border border-clay/30 bg-clay/5 p-3 text-[13px] text-clay">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{hata}</span>
                </div>
              )}

              <button
                type="button"
                onClick={kaydet}
                className="w-full min-h-[44px] rounded-xl bg-pine py-3 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 active:scale-95"
              >
                Kaydet
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-serif text-lg font-bold text-ink mb-3">Antrenman Geçmişi</h2>
            {antrenmanlar.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted">Henüz kayıt yok.</p>
            ) : (
              <ul className="divide-y divide-line">
                {antrenmanlar.slice(0, 15).map((a) => (
                  <li key={a.id} className="py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-ink">{a.bolge}</p>
                        <p className="mt-0.5 text-[12px] text-muted flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{tarihKisa(a.tarih)} · {a.sureDk} dk</span>
                        </p>
                        <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink/90">
                          {a.hareketler}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => sil(a.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-clay hover:bg-paper transition-colors shrink-0"
                        title="Kaydı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {antrenmanlar.length > 0 && (
              <div className="border-t border-line mt-3 pt-3">
                {onay ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper/60 p-3 border border-line">
                    <p className="text-[13px] text-ink">Tüm kayıtlar silinsin mi?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          temizle();
                          setOnay(false);
                          setNot("Geçmiş temizlendi.");
                        }}
                        className="rounded-lg bg-clay px-3 py-1.5 text-[12px] font-medium text-paper"
                      >
                        Sil
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnay(false)}
                        className="rounded-lg border border-line bg-paper px-3 py-1.5 text-[12px] font-medium text-ink"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOnay(true)}
                    className="text-[12px] text-muted hover:text-clay transition-colors"
                  >
                    Tümünü sil
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {PROGRAMLAR.map((p) => {
            const acik = p.id === secili;
            return (
              <section key={p.id} className="rounded-xl border border-line bg-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSecili(acik ? null : p.id)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-paper/40 transition-colors"
                >
                  <div>
                    <span className="block font-serif text-base font-bold text-ink">{p.ad}</span>
                    <span className="mt-1 block text-[13px] text-muted">{p.ozet}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[13px] text-muted shrink-0 pt-0.5">
                    <span>{acik ? "Kapat" : "İncele"}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${acik ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {acik && (
                  <div className="border-t border-line px-5 pb-5 pt-2 bg-paper/40">
                    <ol className="divide-y divide-line mb-4">
                      {p.gunler.map((g) => (
                        <li key={g.bolge} className="py-3">
                          <p className="text-[14px] font-semibold text-ink">{g.bolge}</p>
                          <p className="mt-0.5 text-[12px] text-muted">{g.sureDk} dk</p>
                          <ul className="mt-2 space-y-1">
                            {g.hareketler.map((h) => (
                              <li key={h} className="text-[13px] text-ink/90 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-pine shrink-0" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                    <button
                      type="button"
                      onClick={programEkle}
                      className="w-full min-h-[44px] rounded-xl bg-pine py-2.5 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 active:scale-95"
                    >
                      Kayıtlara ekle
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}