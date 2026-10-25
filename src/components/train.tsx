import { useState } from "react";
import { PROGRAMLAR } from "@/lib/programs";
import { useFit } from "@/lib/store";
import { Btn, Field, fieldClass, PageTitle, Panel } from "@/components/ui";
import { GpsTracker } from "./gps";

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

export function TrainView() {
  const antrenmanlar = useFit((s) => s.antrenmanlar);
  const ekle = useFit((s) => s.ekleAntrenman);
  const ekleProgram = useFit((s) => s.ekleProgram);
  const sil = useFit((s) => s.silAntrenman);
  const temizle = useFit((s) => s.temizleAntrenman);

  // 3'lü Sekme Durumu: Kayıtlar, Programlar veya GPS
  const [sekme, setSekme] = useState<"kayit" | "program" | "gps">("kayit");
  const [girisTipi, setGirisTipi] = useState<"detayli" | "serbest">("detayli");
  const [bolge, setBolge] = useState("");
  const [sure, setSure] = useState("45");
  const [hareketler, setHareketler] = useState("");
  const [hata, setHata] = useState("");
  const [secili, setSecili] = useState<string | null>(null);
  const [onay, setOnay] = useState(false);
  const [not, setNot] = useState("");

  // Yapılandırılmış Set / Tekrar / Ağırlık Listesi
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

  // Toplam tonaj hesaplama
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
        kaydedilecekHareketler += `\n\n Toplam Antrenman Hacmi: ${toplamHacimKg.toLocaleString()} kg`;
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
    <div>
      <PageTitle
        index="02"
        title="Antrenman & Rota"
        lede="Set, tekrar ve ağırlık takibi yap, hazır programları uygula veya GPS ile rota çiz."
      />

      {/* 3'lü Üst Sekme Butonları */}
      <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-cream p-1">
        {(
          [
            ["kayit", "Kayıtlar"],
            ["program", "Programlar"],
            ["gps", "GPS & Rota"],
          ] as const
        ).map(([id, ad]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSekme(id);
              setNot("");
            }}
            className={`min-h-11 rounded-xl text-xs sm:text-sm font-medium ${
              sekme === id ? "bg-pine text-cream" : "text-muted hover:text-ink"
            }`}
          >
            {ad}
          </button>
        ))}
      </div>

      {not ? <p className="mb-4 text-sm text-muted">{not}</p> : null}

      {/* 1. SEÇENEK: GPS EKRANI */}
      {sekme === "gps" ? (
        <GpsTracker />
      ) : sekme === "kayit" ? (
        /* 2. SEÇENEK: ANTRENMAN KAYIT EKRANI */
        <div className="space-y-6">
          <Panel title="Yeni Antrenman Kaydı">
            <div className="space-y-4 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bölge / Split">
                  <input
                    className={fieldClass}
                    value={bolge}
                    placeholder="Göğüs & Biceps, Bacak, Sırt…"
                    onChange={(e) => setBolge(e.target.value)}
                  />
                </Field>
                <Field label="Süre (dk)">
                  <input
                    className={fieldClass}
                    inputMode="numeric"
                    value={sure}
                    onChange={(e) => setSure(e.target.value)}
                  />
                </Field>
              </div>

              {/* Format Seçici */}
              <div className="flex items-center justify-between border-b border-line pb-2 pt-1">
                <span className="text-xs font-mono uppercase tracking-wider text-muted">
                  Kayıt Formatı
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGirisTipi("detayli")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      girisTipi === "detayli"
                        ? "bg-pine text-cream"
                        : "bg-cream text-muted hover:text-ink"
                    }`}
                  >
                    Set / Tekrar / Kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setGirisTipi("serbest")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      girisTipi === "serbest"
                        ? "bg-pine text-cream"
                        : "bg-cream text-muted hover:text-ink"
                    }`}
                  >
                    Serbest Not
                  </button>
                </div>
              </div>

              {/* Set / Tekrar / Kg Satırları */}
              {girisTipi === "detayli" ? (
                <div className="space-y-3">
                  <div className="space-y-2.5">
                    {setler.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-line bg-cream/30 p-3 flex flex-col sm:flex-row sm:items-center gap-2"
                      >
                        <span className="text-xs font-mono font-bold text-muted w-6">
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          placeholder="Hareket (örn: Bench Press)"
                          value={item.hareketAdi}
                          onChange={(e) => setGuncelle(item.id, "hareketAdi", e.target.value)}
                          className={`${fieldClass} flex-1 text-xs`}
                        />
                        <div className="grid grid-cols-3 gap-2 sm:w-60">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-muted block mb-0.5">
                              Set
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={item.setSayisi}
                              onChange={(e) => setGuncelle(item.id, "setSayisi", e.target.value)}
                              className={`${fieldClass} text-center text-xs`}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-muted block mb-0.5">
                              Tekrar
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={item.tekrarSayisi}
                              onChange={(e) => setGuncelle(item.id, "tekrarSayisi", e.target.value)}
                              className={`${fieldClass} text-center text-xs`}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-muted block mb-0.5">
                              Kg
                            </span>
                            <input
                              type="number"
                              step="0.5"
                              value={item.agirlikKg}
                              onChange={(e) => setGuncelle(item.id, "agirlikKg", e.target.value)}
                              className={`${fieldClass} text-center text-xs`}
                            />
                          </div>
                        </div>
                        {setler.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSil(item.id)}
                            className="text-xs text-muted hover:text-clay px-2 py-1"
                            title="Hareketi Sil"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={yeniSetEkle}
                      className="rounded-xl border border-line bg-cream/50 px-3 py-1.5 text-xs font-semibold text-pine hover:bg-cream transition-colors"
                    >
                      + Hareket Ekle
                    </button>
                    {toplamHacimKg > 0 && (
                      <span className="font-mono text-xs font-bold text-pine">
                        Toplam Hacim: {toplamHacimKg.toLocaleString()} kg
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <Field label="Hareketler">
                  <textarea
                    className={`${fieldClass} min-h-24 py-3`}
                    value={hareketler}
                    placeholder={"Her satıra bir hareket\nBench press 4×8 @ 80kg"}
                    onChange={(e) => setHareketler(e.target.value)}
                  />
                </Field>
              )}

              {hata ? <p className="text-sm text-ink">{hata}</p> : null}
              <Btn onClick={kaydet}>Kaydet</Btn>
            </div>
          </Panel>

          <Panel title="Antrenman Geçmişi">
            {antrenmanlar.length === 0 ? (
              <p className="py-5 text-sm text-muted">Henüz kayıt yok.</p>
            ) : (
              <ul>
                {antrenmanlar.slice(0, 15).map((a) => (
                  <li key={a.id} className="border-b border-line py-4 last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{a.bolge}</p>
                        <p className="mt-1 text-sm text-muted">
                          {tarihKisa(a.tarih)} · {a.sureDk} dk
                        </p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink font-mono text-xs">
                          {a.hareketler}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => sil(a.id)}
                        className="min-h-11 shrink-0 px-2 text-sm text-muted hover:text-clay"
                      >
                        Sil
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {antrenmanlar.length > 0 ? (
              <div className="border-t border-line py-4">
                {onay ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-ink">Tüm kayıtlar silinsin mi?</p>
                    <Btn
                      tone="quiet"
                      onClick={() => {
                        temizle();
                        setOnay(false);
                        setNot("Geçmiş temizlendi.");
                      }}
                    >
                      Sil
                    </Btn>
                    <Btn tone="ghost" onClick={() => setOnay(false)}>
                      Vazgeç
                    </Btn>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOnay(true)}
                    className="min-h-11 text-sm text-muted hover:text-clay"
                  >
                    Tümünü sil
                  </button>
                )}
              </div>
            ) : null}
          </Panel>
        </div>
      ) : (
        /* 3. SEÇENEK: HAZIR PROGRAMLAR */
        <div className="space-y-3">
          {PROGRAMLAR.map((p) => {
            const acik = p.id === secili;
            return (
              <section key={p.id} className="rounded-2xl border border-line bg-cream">
                <button
                  type="button"
                  onClick={() => setSecili(acik ? null : p.id)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                >
                  <span>
                    <span className="block text-sm font-medium text-ink">{p.ad}</span>
                    <span className="mt-1 block text-sm text-muted">{p.ozet}</span>
                  </span>
                  <span className="text-sm text-muted">{acik ? "Açık" : "Seç"}</span>
                </button>
                {acik ? (
                  <div className="border-t border-line px-5 pb-5">
                    <ol className="divide-y divide-line">
                      {p.gunler.map((g) => (
                        <li key={g.bolge} className="py-4">
                          <p className="text-sm font-medium text-ink">{g.bolge}</p>
                          <p className="mt-1 text-sm text-muted">{g.sureDk} dk</p>
                          <ul className="mt-2 space-y-1">
                            {g.hareketler.map((h) => (
                              <li key={h} className="text-sm text-ink">
                                {h}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                    <Btn onClick={programEkle}>Kayıtlara ekle</Btn>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}