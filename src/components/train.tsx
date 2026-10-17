import { useState } from "react";
import { PROGRAMLAR } from "@/lib/programs";
import { useFit } from "@/lib/store";
import { Btn, Field, fieldClass, PageTitle, Panel } from "@/components/ui";

function tarihKisa(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function TrainView() {
  const antrenmanlar = useFit((s) => s.antrenmanlar);
  const ekle = useFit((s) => s.ekleAntrenman);
  const ekleProgram = useFit((s) => s.ekleProgram);
  const sil = useFit((s) => s.silAntrenman);
  const temizle = useFit((s) => s.temizleAntrenman);

  const [sekme, setSekme] = useState<"kayit" | "program">("kayit");
  const [bolge, setBolge] = useState("");
  const [sure, setSure] = useState("45");
  const [hareketler, setHareketler] = useState("");
  const [hata, setHata] = useState("");
  const [secili, setSecili] = useState<string | null>(null);
  const [onay, setOnay] = useState(false);
  const [not, setNot] = useState("");
  const program = PROGRAMLAR.find((p) => p.id === secili) ?? null;

  function kaydet() {
    const sureDk = Number(sure);
    if (!bolge.trim() || !hareketler.trim()) {
      setHata("Bölge ve hareket gerekli.");
      return;
    }
    if (!Number.isFinite(sureDk) || sureDk < 5 || sureDk > 240) {
      setHata("Süre 5–240 dakika olmalı.");
      return;
    }
    ekle({ bolge: bolge.trim(), hareketler: hareketler.trim(), sureDk: Math.round(sureDk) });
    setBolge("");
    setHareketler("");
    setSure("45");
    setHata("");
    setNot("Kayıt eklendi.");
  }

  function programEkle() {
    if (!program) return;
    ekleProgram(
      program.gunler.map((g) => ({
        bolge: g.bolge,
        hareketler: g.hareketler.join("\n"),
        sureDk: g.sureDk,
      })),
    );
    setSekme("kayit");
    setNot(`${program.ad} kayıtlara eklendi.`);
  }

  return (
    <div>
      <PageTitle
        index="03"
        title="Antrenman"
        lede="Kayıtların ve hazır programlar ayrı. İkisi bir arada durmaz."
      />

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-cream p-1">
        {(
          [
            ["kayit", "Kayıtlar"],
            ["program", "Programlar"],
          ] as const
        ).map(([id, ad]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSekme(id);
              setNot("");
            }}
            className={`min-h-11 rounded-xl text-sm font-medium ${
              sekme === id ? "bg-pine text-cream" : "text-muted"
            }`}
          >
            {ad}
          </button>
        ))}
      </div>

      {not ? <p className="mb-4 text-sm text-muted">{not}</p> : null}

      {sekme === "kayit" ? (
        <div className="space-y-6">
          <Panel title="Yeni kayıt">
            <div className="space-y-4 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bölge">
                  <input
                    className={fieldClass}
                    value={bolge}
                    placeholder="Göğüs, bacak…"
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
              <Field label="Hareketler">
                <textarea
                  className={`${fieldClass} min-h-24 py-3`}
                  value={hareketler}
                  placeholder={"Her satıra bir hareket\nBench press 4×8"}
                  onChange={(e) => setHareketler(e.target.value)}
                />
              </Field>
              {hata ? <p className="text-sm text-ink">{hata}</p> : null}
              <Btn onClick={kaydet}>Kaydet</Btn>
            </div>
          </Panel>

          <Panel title="Geçmiş">
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
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">
                          {a.hareketler}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => sil(a.id)}
                        className="min-h-11 shrink-0 px-2 text-sm text-muted"
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
                    className="min-h-11 text-sm text-muted"
                  >
                    Tümünü sil
                  </button>
                )}
              </div>
            ) : null}
          </Panel>
        </div>
      ) : (
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