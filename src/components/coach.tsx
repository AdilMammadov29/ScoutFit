import { useState } from "react";
import { fmtKcal, profildenHesap } from "@/lib/engine";
import { kocSor, yerelKoc } from "@/lib/coach";
import { useFit } from "@/lib/store";
import { useAuth } from "@/lib/authStore";
import { PageTitle } from "@/components/ui";

const HAZIR = [
  "Göğüs antrenmanı nasıl olmalı?",
  "Bu kaloriyle ne yemeliyim?",
  "Haftalık tempo gerçekçi mi?",
];

export function CoachView() {
  const profil = useFit((s) => s.profil);
  const antrenmanlar = useFit((s) => s.antrenmanlar);
  const sohbet = useFit((s) => s.sohbet);
  const ekleMesaj = useFit((s) => s.ekleMesaj);
  const temizle = useFit((s) => s.temizleSohbet);

  const currentUser = useAuth((s) => s.currentUser);
  const kullaniciAdi = currentUser?.name || "Sporcu";

  const [taslak, setTaslak] = useState("");
  const [yaziyor, setYaziyor] = useState(false);

  const kalori = profil ? profildenHesap(profil).gunlukKalori : 2100;

  function baglam() {
    const temelBilgi = `Kullanıcının adı: ${kullaniciAdi}.`;
    if (!profil) return `${temelBilgi} Profil henüz kaydedilmedi.`;
    const h = profildenHesap(profil);
    const son = antrenmanlar
      .slice(0, 3)
      .map((a) => a.bolge)
      .join(", ");
    return `${temelBilgi} Kilo ${profil.kilo} kg, hedef ${profil.hedefKilo} kg, ${h.gunlukKalori} kcal, protein ${h.proteinG} g, karb ${h.karbonhidratG} g, yağ ${h.yagG} g. Son antrenmanlar: ${son || "yok"}.`;
  }

  async function gonder(metin: string) {
    const soru = metin.trim();
    if (!soru || yaziyor) return;
    setTaslak("");
    ekleMesaj({ id: crypto.randomUUID(), rol: "kullanici", metin: soru });
    setYaziyor(true);
    let yanit = "";
    let yerel = false;
    try {
      const sonuc = await kocSor({ data: { soru, baglam: baglam() } });
      if (sonuc.ok) yanit = sonuc.metin;
      else {
        yanit = yerelKoc(soru, kalori);
        yerel = true;
      }
    } catch {
      yanit = yerelKoc(soru, kalori);
      yerel = true;
    }
    ekleMesaj({ id: crypto.randomUUID(), rol: "koc", metin: yanit, yerel });
    setYaziyor(false);
  }

  return (
    <div>
      <PageTitle
        index="05"
        title="Koç"
        lede={`Merhaba ${kullaniciAdi}, kısa sor. Cevap tek balonda durur.`}
      />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{profil ? `${fmtKcal(kalori)} kcal hedefi bağlı` : "Hedef kaydı yok"}</p>
        {sohbet.length > 0 ? (
          <button type="button" onClick={temizle} className="min-h-11 text-sm text-muted">
            Sohbeti sil
          </button>
        ) : null}
      </div>

      {sohbet.length === 0 && !yaziyor ? (
        <div className="mb-6 flex flex-col gap-2">
          {HAZIR.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => gonder(s)}
              className="min-h-11 rounded-xl border border-line bg-cream px-4 text-left text-sm text-ink"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <ol className="space-y-3">
        {sohbet.map((m) => (
          <li key={m.id} className={m.rol === "kullanici" ? "ml-10" : "mr-10"}>
            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.rol === "kullanici" ? "bg-pine text-cream" : "border border-line bg-cream text-ink"
              }`}
            >
              <Metin metin={m.metin} />
            </div>
            {m.yerel ? <p className="mt-1 text-xs text-muted">Yerel yanıt</p> : null}
          </li>
        ))}
        {yaziyor ? (
          <li className="mr-10">
            <div className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-muted">
              Yazıyor...
            </div>
          </li>
        ) : null}
      </ol>

      <form
        className="mt-6 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void gonder(taslak);
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Sorun</span>
          <textarea
            value={taslak}
            rows={2}
            onChange={(e) => setTaslak(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void gonder(taslak);
              }
            }}
            placeholder="Sorunu yaz"
            className="min-h-11 w-full resize-none rounded-xl border border-line bg-cream px-3 py-3 text-sm text-ink outline-none focus:border-pine"
          />
        </label>
        <button
          type="submit"
          disabled={yaziyor || !taslak.trim()}
          className="inline-flex min-h-11 items-center rounded-xl bg-pine px-4 text-sm font-medium text-cream disabled:opacity-40"
        >
          Gönder
        </button>
      </form>
    </div>
  );
}

function Metin({ metin }: { metin: string }) {
  const satirlar = metin
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return (
    <div className="space-y-1">
      {satirlar.map((satir, i) => (
        <p key={`${i}-${satir}`}>{parcala(satir)}</p>
      ))}
    </div>
  );
}

function parcala(satir: string) {
  const parcalar = satir.split(/(\*\*[^*]+\*\*)/g);
  return parcalar.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-medium">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}