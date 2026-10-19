import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseHazir } from "@/lib/supabase";
import { useOturum } from "@/lib/auth";
import { bulutaBaglan, bulutuDurdur, cikisYap } from "@/lib/sync";

const alanClass =
  "min-h-11 w-full rounded-xl border border-line bg-cream px-3 text-sm text-ink outline-none focus:border-pine";
const dugmeClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-pine px-5 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-40";

type Mesaj = { tur: "hata" | "bilgi"; metin: string } | null;

function hataCevir(err: unknown): string {
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (m.includes("invalid login credentials")) return "E-posta ya da şifre hatalı.";
  if (m.includes("email not confirmed"))
    return "E-postanı henüz doğrulamadın. Gelen kutundaki bağlantıya tıkla.";
  if (m.includes("already registered"))
    return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Bağlantı kurulamadı. İnternetini kontrol et.";
  if (m.includes("valid email") || m.includes("invalid email"))
    return "Geçerli bir e-posta adresi yaz.";
  if (m.includes("password")) return "Şifre kabul edilmedi. Daha uzun ve farklı bir şifre dene.";
  return "Bir sorun oluştu. Biraz sonra tekrar dene.";
}

function Ortala({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
      {children}
    </div>
  );
}

function MesajSatiri({ mesaj }: { mesaj: Mesaj }) {
  if (!mesaj) return null;
  return (
    <p
      role={mesaj.tur === "hata" ? "alert" : "status"}
      className={`text-sm ${mesaj.tur === "hata" ? "text-clay" : "text-pine"}`}
    >
      {mesaj.metin}
    </p>
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

const OZELLIKLER = [
  "Hedef kilonu ve günlük kalorini hesapla",
  "Antrenmanlarını ve öğünlerini kaydet",
  "Kilo ilerlemeni grafikte takip et",
  "Koça soru sor",
];

function GirisEkrani() {
  const [mod, setMod] = useState<"giris" | "kayit" | "unuttum">("giris");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifre2, setSifre2] = useState("");
  const [mesaj, setMesaj] = useState<Mesaj>(null);
  const [bekle, setBekle] = useState(false);

  const modDegistir = (yeni: "giris" | "kayit" | "unuttum") => {
    setMod(yeni);
    setMesaj(null);
    setSifre("");
    setSifre2("");
  };

  async function gonder(e: FormEvent) {
    e.preventDefault();
    if (bekle) return;
    const posta = email.trim();
    if (!posta) return setMesaj({ tur: "hata", metin: "E-posta adresini yaz." });
    setBekle(true);
    setMesaj(null);
    try {
      if (mod === "unuttum") {
        const { error } = await supabase.auth.resetPasswordForEmail(posta, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMesaj({
          tur: "bilgi",
          metin: "Bu adres kayıtlıysa şifre sıfırlama bağlantısını e-postana gönderdik.",
        });
      } else if (mod === "kayit") {
        if (sifre.length < 8)
          return setMesaj({ tur: "hata", metin: "Şifre en az 8 karakter olmalı." });
        if (sifre !== sifre2) return setMesaj({ tur: "hata", metin: "Şifreler aynı değil." });
        const { data, error } = await supabase.auth.signUp({
          email: posta,
          password: sifre,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setMesaj({
            tur: "bilgi",
            metin:
              "Hesabı oluşturduk. E-postana gelen doğrulama bağlantısına tıkla, sonra giriş yap.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: posta, password: sifre });
        if (error) throw error;
      }
    } catch (err) {
      setMesaj({ tur: "hata", metin: hataCevir(err) });
    } finally {
      setBekle(false);
    }
  }

  const baslik =
    mod === "kayit" ? "Hesap oluştur" : mod === "unuttum" ? "Şifreni sıfırla" : "Giriş yap";

  return (
    <div className="grid min-h-screen bg-paper text-ink lg:grid-cols-2">
      <div className="flex flex-col justify-center px-8 py-12 lg:px-16">
        <h1 className="font-display text-5xl leading-tight">ScoutFit</h1>
        <p className="mt-3 max-w-md text-muted">Kişisel antrenman defteri.</p>
        <ul className="mt-8 space-y-3 text-sm">
          {OZELLIKLER.map((o) => (
            <li key={o} className="flex gap-3">
              <span className="text-pine" aria-hidden="true">
                ✓
              </span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-md text-sm text-muted">
          Verilerin hesabında saklanır. Çıkış yapsan ya da cihaz değiştirsen de kaybolmaz.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 pb-12 lg:py-12">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-cream p-6">
          {mod !== "unuttum" ? (
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-paper p-1 text-sm">
              <button
                type="button"
                onClick={() => modDegistir("giris")}
                className={`min-h-10 rounded-lg ${mod === "giris" ? "bg-cream font-medium text-ink" : "text-muted"}`}
              >
                Giriş yap
              </button>
              <button
                type="button"
                onClick={() => modDegistir("kayit")}
                className={`min-h-10 rounded-lg ${mod === "kayit" ? "bg-cream font-medium text-ink" : "text-muted"}`}
              >
                Kayıt ol
              </button>
            </div>
          ) : null}

          <h2 className="mb-4 font-display text-2xl">{baslik}</h2>

          <form onSubmit={gonder} className="space-y-4">
            <Alan etiket="E-posta">
              <input
                className={alanClass}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Alan>
            {mod !== "unuttum" ? (
              <Alan etiket={mod === "kayit" ? "Şifre (en az 8 karakter)" : "Şifre"}>
                <input
                  className={alanClass}
                  type="password"
                  autoComplete={mod === "kayit" ? "new-password" : "current-password"}
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  required
                />
              </Alan>
            ) : null}
            {mod === "kayit" ? (
              <Alan etiket="Şifre (tekrar)">
                <input
                  className={alanClass}
                  type="password"
                  autoComplete="new-password"
                  value={sifre2}
                  onChange={(e) => setSifre2(e.target.value)}
                  required
                />
              </Alan>
            ) : null}

            <MesajSatiri mesaj={mesaj} />

            <button type="submit" disabled={bekle} className={dugmeClass}>
              {bekle
                ? "Bekle..."
                : mod === "kayit"
                  ? "Hesap oluştur"
                  : mod === "unuttum"
                    ? "Bağlantı gönder"
                    : "Giriş yap"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-muted">
            {mod === "giris" ? (
              <button type="button" onClick={() => modDegistir("unuttum")} className="underline">
                Şifremi unuttum
              </button>
            ) : null}
            {mod === "unuttum" ? (
              <button type="button" onClick={() => modDegistir("giris")} className="underline">
                Girişe dön
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function YeniSifre({ onBitti }: { onBitti: () => void }) {
  const [sifre, setSifre] = useState("");
  const [sifre2, setSifre2] = useState("");
  const [mesaj, setMesaj] = useState<Mesaj>(null);
  const [bekle, setBekle] = useState(false);

  async function kaydet(e: FormEvent) {
    e.preventDefault();
    if (bekle) return;
    if (sifre.length < 8) return setMesaj({ tur: "hata", metin: "Şifre en az 8 karakter olmalı." });
    if (sifre !== sifre2) return setMesaj({ tur: "hata", metin: "Şifreler aynı değil." });
    setBekle(true);
    setMesaj(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: sifre });
      if (error) throw error;
      window.history.replaceState(null, "", window.location.pathname);
      onBitti();
    } catch (err) {
      setMesaj({ tur: "hata", metin: hataCevir(err) });
    } finally {
      setBekle(false);
    }
  }

  return (
    <Ortala>
      <form
        onSubmit={kaydet}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-cream p-6"
      >
        <h2 className="font-display text-2xl">Yeni şifre belirle</h2>
        <Alan etiket="Yeni şifre (en az 8 karakter)">
          <input
            className={alanClass}
            type="password"
            autoComplete="new-password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            required
          />
        </Alan>
        <Alan etiket="Yeni şifre (tekrar)">
          <input
            className={alanClass}
            type="password"
            autoComplete="new-password"
            value={sifre2}
            onChange={(e) => setSifre2(e.target.value)}
            required
          />
        </Alan>
        <MesajSatiri mesaj={mesaj} />
        <button type="submit" disabled={bekle} className={dugmeClass}>
          {bekle ? "Bekle..." : "Şifreyi kaydet"}
        </button>
      </form>
    </Ortala>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [oturum, setOturum] = useState<Session | null>(null);
  const [kontrolBitti, setKontrolBitti] = useState(false);
  const [sifreYenile, setSifreYenile] = useState(
    () => typeof window !== "undefined" && window.location.hash.includes("type=recovery"),
  );
  const [veriDurumu, setVeriDurumu] = useState<"yukleniyor" | "hazir" | "hata">("yukleniyor");
  const [hataMetni, setHataMetni] = useState("");
  const [deneme, setDeneme] = useState(0);
  const setEmail = useOturum((s) => s.setEmail);

  useEffect(() => {
    if (!supabaseHazir) {
      setKontrolBitti(true);
      return;
    }
    let iptal = false;
    supabase.auth.getSession().then(({ data }) => {
      if (iptal) return;
      setOturum(data.session);
      setKontrolBitti(true);
    });
    const { data: abone } = supabase.auth.onAuthStateChange((olay, yeni) => {
      setOturum(yeni);
      if (olay === "PASSWORD_RECOVERY") setSifreYenile(true);
    });
    return () => {
      iptal = true;
      abone.subscription.unsubscribe();
    };
  }, []);

  const kullaniciId = oturum?.user.id ?? null;
  const eposta = oturum?.user.email ?? null;

  useEffect(() => {
    setEmail(eposta);
  }, [eposta, setEmail]);

  useEffect(() => {
    if (!kullaniciId) {
      setVeriDurumu("yukleniyor");
      return;
    }
    let iptal = false;
    setVeriDurumu("yukleniyor");
    bulutaBaglan(kullaniciId).then(
      () => {
        if (!iptal) setVeriDurumu("hazir");
      },
      (err: unknown) => {
        console.error("Veri yüklenemedi:", err);
        if (!iptal) {
          setHataMetni(err instanceof Error ? err.message : String(err));
          setVeriDurumu("hata");
        }
      },
    );
    return () => {
      iptal = true;
      bulutuDurdur();
    };
  }, [kullaniciId, deneme]);

  if (!supabaseHazir) {
    return (
      <Ortala>
        <div className="max-w-md space-y-3 rounded-2xl border border-line bg-cream p-6">
          <h2 className="font-display text-2xl">Hesap sistemi ayarlanmamış</h2>
          <p className="text-sm text-muted">
            VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerleri bu ortamda tanımlı değil. Yerelde
            .env dosyasına, yayında Vercel Environment Variables bölümüne ekle ve yeniden başlat.
          </p>
        </div>
      </Ortala>
    );
  }

  if (!kontrolBitti) {
    return (
      <Ortala>
        <p className="text-sm text-muted">Yükleniyor...</p>
      </Ortala>
    );
  }

  if (!oturum) return <GirisEkrani />;

  if (sifreYenile) return <YeniSifre onBitti={() => setSifreYenile(false)} />;

  if (veriDurumu === "yukleniyor") {
    return (
      <Ortala>
        <p className="text-sm text-muted">Verilerin yükleniyor...</p>
      </Ortala>
    );
  }

  if (veriDurumu === "hata") {
    return (
      <Ortala>
        <div className="max-w-md space-y-4 rounded-2xl border border-line bg-cream p-6">
          <h2 className="font-display text-2xl">Veriler yüklenemedi</h2>
          <p className="text-sm text-muted">
            Hesabındaki verilere ulaşılamadı. İnternetini ve Supabase tablosunu kontrol edip tekrar
            dene. Hiçbir veri silinmedi.
          </p>
          {hataMetni ? <p className="break-words text-xs text-muted">{hataMetni}</p> : null}
          <div className="flex gap-3">
            <button type="button" className={dugmeClass} onClick={() => setDeneme((d) => d + 1)}>
              Tekrar dene
            </button>
            <button
              type="button"
              className="min-h-11 w-full rounded-xl border border-line px-5 text-sm text-ink"
              onClick={() => void cikisYap(true)}
            >
              Çıkış yap
            </button>
          </div>
        </div>
      </Ortala>
    );
  }

  return <>{children}</>;
}