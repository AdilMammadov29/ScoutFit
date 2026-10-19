import { useState, type ReactNode } from "react";
import { fmtKcal, profildenHesap, tempoCumlesi } from "../lib/engine";
import { useFit } from "../lib/store";
import { useAuth } from "../lib/authStore";
import { useEkstra, type Birim, type KiloKaydi } from "../lib/extras";
import type { Section } from "./shell";
import { Btn, PageTitle, Panel, Row } from "./ui";
import { tumVeriyiSifirla } from "@/lib/sync";
// Eğer bu tipleri Grok dosyalarında (store.ts ve extras.ts) "export" ederek tanımladıysa:
const LB = 2.20462;
const alanClass =
  "min-h-11 w-full rounded-xl border border-line bg-cream px-3 text-sm text-ink outline-none focus:border-pine";

function sayiOku(metin: string): number | null {
  const n = Number(metin.replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function sayiYaz(n: number) {
  return n.toFixed(1).replace(".", ",");
}

function kiloYaz(kg: number, birim: Birim) {
  return `${sayiYaz(birim === "lb" ? kg * LB : kg)} ${birim}`;
}

function tarihKisa(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

function Alan({ etiket, children }: { etiket: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{etiket}</span>
      {children}
    </label>
  );
}

function KisiselPanel() {
  const profil = useFit((s) => s.profil);
  const kaydetProfil = useFit((s) => s.kaydetProfil);
  const ad = useEkstra((s:any) => s.ad);
  const setAd = useEkstra((s:any) => s.setAd);
  const ekleKilo = useEkstra((s:any) => s.ekleKilo);
  const [adForm, setAdForm] = useState(ad);
  const [boy, setBoy] = useState(String(profil?.boy ?? ""));
  const [kilo, setKilo] = useState(String(profil?.kilo ?? ""));
  const [yas, setYas] = useState(String(profil?.yas ?? ""));
  const [not, setNot] = useState("");

  if (!profil) return null;

  const kaydet = () => {
    const b = sayiOku(boy);
    const k = sayiOku(kilo);
    const y = sayiOku(yas);
    if (!b || b < 100 || b > 250) return setNot("Boy 100–250 cm arasında olmalı.");
    if (!k || k < 30 || k > 300) return setNot("Kilo 30–300 kg arasında olmalı.");
    if (!y || y < 12 || y > 100) return setNot("Yaş 12–100 arasında olmalı.");
    kaydetProfil({ ...profil, boy: b, kilo: k, yas: Math.round(y) });
    setAd(adForm.trim().slice(0, 40));
    if (k !== profil.kilo) ekleKilo(k);
    setNot("Kaydedildi.");
  };

  return (
    <Panel title="Kişisel bilgiler">
      <div className="grid gap-4 py-5 sm:grid-cols-2">
        <Alan etiket="Ad">
          <input
            className={alanClass}
            value={adForm}
            placeholder="Adın"
            onChange={(e) => setAdForm(e.target.value)}
          />
        </Alan>
        <Alan etiket="Yaş">
          <input
            className={alanClass}
            value={yas}
            inputMode="numeric"
            onChange={(e) => setYas(e.target.value)}
          />
        </Alan>
        <Alan etiket="Boy (cm)">
          <input
            className={alanClass}
            value={boy}
            inputMode="decimal"
            onChange={(e) => setBoy(e.target.value)}
          />
        </Alan>
        <Alan etiket="Kilo (kg)">
          <input
            className={alanClass}
            value={kilo}
            inputMode="decimal"
            onChange={(e) => setKilo(e.target.value)}
          />
        </Alan>
      </div>
      <div className="flex items-center gap-4 pb-5">
        <Btn onClick={kaydet}>Kaydet</Btn>
        {not ? <p className="text-sm text-muted">{not}</p> : null}
      </div>
    </Panel>
  );
}

function HesapPanel() {
  const currentUser = useAuth((s: any) => s.currentUser);
  const accounts = useAuth((s: any) => s.accounts);
  const logout = useAuth((s: any) => s.logout);
  const switchAccount = useAuth((s: any) => s.switchAccount);
  const removeAccount = useAuth((s: any) => s.removeAccount);

  if (!currentUser) return null;

  return (
    <Panel title="Hesap Yönetimi">
      <div className="space-y-4 py-5">
        <p className="text-sm text-muted">
          Aktif Hesap: <span className="font-medium text-ink">{currentUser.name}</span>
        </p>
        
        {accounts.length > 1 && (
          <div>
            <p className="mb-2 text-sm text-muted">Diğer Hesaplar</p>
            <div className="flex flex-col gap-2">
              {accounts.filter((a: any) => a.id !== currentUser.id).map((acc: any) => (
                <div key={acc.id} className="flex items-center justify-between rounded-xl border border-line bg-cream px-3 py-2">
                  <span className="text-sm text-ink">{acc.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => switchAccount(acc.id)} className="text-xs font-medium text-pine">Geçiş Yap</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Btn tone="quiet" onClick={() => logout()}>Çıkış Yap / Yeni Hesap</Btn>
          <Btn tone="quiet" onClick={() => {
  if (window.confirm(`"${currentUser.name}" adlı bu hesabı cihazdan kalıcı olarak silmek istediğine emin misin?`)) {
    removeAccount(currentUser.id); // Aktif olan hesabın ID'sini siliyoruz
  }
}}>Hesabı Sil</Btn>
        </div>
      </div>
    </Panel>
  );
}
function KiloGrafik({
  kayitlar,
  hedef,
  birim,
}: {
  kayitlar: KiloKaydi[];
  hedef?: number;
  birim: Birim;
}) {
  if (kayitlar.length < 2) {
    return <p className="py-4 text-sm text-muted">Grafik için en az iki günlük kayıt gerekir.</p>;
  }
  const W = 560;
  const H = 200;
  const P = 32;
  const dono = (kg: number) => (birim === "lb" ? kg * LB : kg);
  const degerler = kayitlar.map((k) => dono(k.kilo));
  const hedefD = hedef !== undefined ? dono(hedef) : undefined;
  const tum = hedefD !== undefined ? [...degerler, hedefD] : degerler;
  const min = Math.min(...tum) - 1;
  const max = Math.max(...tum) + 1;
  const x = (i: number) => P + (i * (W - 2 * P)) / (kayitlar.length - 1);
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - 2 * P);
  const nokta = degerler.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full py-2" role="img" aria-label="Kilo grafiği">
      {hedefD !== undefined ? (
        <line
          x1={P}
          x2={W - P}
          y1={y(hedefD)}
          y2={y(hedefD)}
          stroke="currentColor"
          strokeDasharray="4 4"
          className="text-clay"
        />
      ) : null}
      <polyline
        points={nokta}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-pine"
      />
      {degerler.map((v, i) => (
        <circle
          key={kayitlar[i].id}
          cx={x(i)}
          cy={y(v)}
          r={3.5}
          fill="currentColor"
          className="text-pine"
        />
      ))}
      <text x={P} y={H - 8} className="fill-muted text-[10px]">
        {tarihKisa(kayitlar[0].tarih)}
      </text>
      <text x={W - P} y={H - 8} textAnchor="end" className="fill-muted text-[10px]">
        {tarihKisa(kayitlar[kayitlar.length - 1].tarih)}
      </text>
      <text x={P} y={14} className="fill-muted text-[10px]">
        {sayiYaz(max)} {birim}
      </text>
    </svg>
  );
}

function KiloPanel() {
  const profil = useFit((s) => s.profil);
  const kayitlar = useEkstra((s: any) => s.kiloKayitlari);
  const birim = useEkstra((s :any) => s.birim);
  const ekleKilo = useEkstra((s:any) => s.ekleKilo);
  const silKilo = useEkstra((s:any) => s.silKilo);
  const [giris, setGiris] = useState("");
  const [not, setNot] = useState("");

  const ekle = () => {
    const n = sayiOku(giris);
    if (!n) return setNot("Geçerli bir sayı yaz.");
    const kg = birim === "lb" ? n / LB : n;
    if (kg < 30 || kg > 300) return setNot("Değer 30–300 kg arasında olmalı.");
    ekleKilo(Math.round(kg * 10) / 10);
    setGiris("");
    setNot("");
  };

  const ilk = kayitlar[0];
  const son = kayitlar[kayitlar.length - 1];
  const fark = ilk && son ? (birim === "lb" ? (son.kilo - ilk.kilo) * LB : son.kilo - ilk.kilo) : 0;
  const sonBes = kayitlar.slice(-5).reverse();

  return (
    <Panel title="Kilo takibi">
      <KiloGrafik kayitlar={kayitlar} hedef={profil?.hedefKilo} birim={birim} />
      {kayitlar.length >= 2 ? (
        <Row label="Toplam değişim" value={`${fark > 0 ? "+" : ""}${sayiYaz(fark)} ${birim}`} />
      ) : null}
      <div className="flex items-end gap-3 py-5">
        <div className="flex-1">
          <Alan etiket={`Bugünkü kilo (${birim})`}>
            <input
              className={alanClass}
              value={giris}
              inputMode="decimal"
              placeholder={birim === "lb" ? "örn. 165" : "örn. 75,4"}
              onChange={(e) => setGiris(e.target.value)}
            />
          </Alan>
        </div>
        <Btn onClick={ekle}>Ekle</Btn>
      </div>
      {not ? <p className="pb-4 text-sm text-muted">{not}</p> : null}
      {sonBes.length > 0 ? (
        <ul className="divide-y divide-line border-t border-line">
          {sonBes.map((k: any) => (
            <li key={k.id} className="flex items-center justify-between py-3 text-sm">
              <span className="text-muted">{tarihKisa(k.tarih)}</span>
              <span className="flex items-center gap-4">
                <span className="text-ink">{kiloYaz(k.kilo, birim)}</span>
                <button
                  type="button"
                  onClick={() => silKilo(k.id)}
                  className="text-muted hover:text-clay"
                  aria-label="Kaydı sil"
                >
                  Sil
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pb-5 text-sm text-muted">Henüz kayıt yok. İlk kilonu ekle.</p>
      )}
    </Panel>
  );
}

function AyarPanel() {
  const birim = useEkstra((s: any) => s.birim);
  const setBirim = useEkstra((s: any) => s.setBirim);
  const tema = useEkstra((s: any) => s.tema);
  const setTema = useEkstra((s: any) => s.setTema);
  const temizleKilo = useEkstra((s: any) => s.temizleKilo);
  const temizleAntrenman = useFit((s: any) => s.temizleAntrenman);
  const temizleSohbet = useFit((s: any) => s.temizleSohbet);

  const sor = (mesaj: string, islem: () => void) => () => {
    if (window.confirm(mesaj)) islem();
  };

    const hepsiniSifirla = sor(
    "Profil, antrenmanlar, sohbet, öğünler ve kilo kayıtları dahil hesabındaki tüm veriler silinecek. Emin misin?",
    tumVeriyiSifirla,
  );

  return (
    <Panel title="Ayarlar">
      <div className="space-y-5 py-5">
        <div>
          <p className="mb-2 text-sm text-muted">Birim (kilo takibi ve hedef özeti)</p>
          <div className="flex gap-3">
            <Btn tone={birim === "kg" ? "primary" : "quiet"} onClick={() => setBirim("kg")}>
              kg
            </Btn>
            <Btn tone={birim === "lb" ? "primary" : "quiet"} onClick={() => setBirim("lb")}>
              lb
            </Btn>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm text-muted">Tema</p>
          <div className="flex gap-3">
            <Btn tone={tema === "acik" ? "primary" : "quiet"} onClick={() => setTema("acik")}>
              Açık
            </Btn>
            <Btn tone={tema === "koyu" ? "primary" : "quiet"} onClick={() => setTema("koyu")}>
              Koyu
            </Btn>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm text-muted">Verileri sıfırla</p>
          <div className="flex flex-wrap gap-3">
            <Btn
              tone="quiet"
              onClick={sor("Tüm antrenmanlar silinsin mi?", temizleAntrenman)}
            >
              Antrenmanları sil
            </Btn>
            <Btn tone="quiet" onClick={sor("Koç sohbeti silinsin mi?", temizleSohbet)}>
              Sohbeti temizle
            </Btn>
            <Btn tone="quiet" onClick={sor("Tüm kilo kayıtları silinsin mi?", temizleKilo)}>
              Kilo kayıtlarını sil
            </Btn>
            <Btn tone="quiet" onClick={hepsiniSifirla}>
              Her şeyi sıfırla
            </Btn>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function ProfilView({ git }: { git: (s: Section) => void }) {
  const profil = useFit((s:any) => s.profil);
  const ad = useEkstra((s:any) => s.ad);

  return (
    <div>
      <PageTitle
        index="06"
        title={ad ? ad : "Profil"}
        lede="Bilgilerin, kilo geçmişin ve ayarların tek yerde."
      />
      <div className="space-y-6">
        
        {/* HESAP PANELİ BURAYA EKLENDİ */}
       <HesapPanel />

        {!profil ? (
          <Panel>
            <div className="py-6">
              <p className="text-sm text-muted">Önce ölçülerini kaydet.</p>
              <div className="mt-5">
                <Btn onClick={() => git("goal")}>Hedefe git</Btn>
              </div>
            </div>
          </Panel>
        ) : (
          <>
            <KisiselPanel />
            <KiloPanel />
          </>
        )}
                <HesapPanel />
        <AyarPanel />
        <AyarPanel />
      </div>
    </div>
  );
}