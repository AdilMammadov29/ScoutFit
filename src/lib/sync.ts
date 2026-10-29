import { supabase } from "@/lib/supabase";
import { useOturum } from "@/lib/auth";
import { useFit } from "@/lib/store";
import { useEkstra } from "@/lib/extras";
import { useOgun } from "@/lib/ogun";

type FitDurum = ReturnType<typeof useFit.getState>;
type EkstraDurum = ReturnType<typeof useEkstra.getState>;
type OgunDurum = ReturnType<typeof useOgun.getState>;

type Paket = {
  v: 1;
  fit: Pick<FitDurum, "profil" | "antrenmanlar" | "sohbet">;
  ekstra: Pick<EkstraDurum, "ad" | "birim" | "tema" | "kiloKayitlari">;
  ogunler: OgunDurum["ogunler"];
};

function anlikPaket(): Paket {
  const f = useFit.getState();
  const e = useEkstra.getState();
  const o = useOgun.getState();
  return {
    v: 1,
    fit: { profil: f.profil, antrenmanlar: f.antrenmanlar, sohbet: f.sohbet },
    ekstra: { ad: e.ad, birim: e.birim, tema: e.tema, kiloKayitlari: e.kiloKayitlari },
    ogunler: o.ogunler,
  };
}

function paketUygula(p: Partial<Paket>) {
  if (p.fit) {
    useFit.setState({
      profil: p.fit.profil ?? null,
      antrenmanlar: p.fit.antrenmanlar ?? [],
      sohbet: p.fit.sohbet ?? [],
    });
  }
  if (p.ekstra) {
    useEkstra.setState({
      ad: p.ekstra.ad ?? "",
      birim: p.ekstra.birim === "lb" ? "lb" : "kg",
      kiloKayitlari: p.ekstra.kiloKayitlari ?? [],
    });
    useEkstra.getState().setTema(p.ekstra.tema === "koyu" ? "koyu" : "acik");
  }
  if (p.ogunler) useOgun.setState({ ogunler: p.ogunler });
}

function bosVeri() {
  useFit.setState({ profil: null, antrenmanlar: [], sohbet: [] });
  useEkstra.setState({ ad: "", birim: "kg", kiloKayitlari: [] });
  useEkstra.getState().setTema("acik");
  useOgun.setState({ ogunler: [] });
}

let aktifKullanici: string | null = null;
let nesil = 0;
let zamanlayici: ReturnType<typeof setTimeout> | null = null;
let sonGonderilen = "";
let aboneler: Array<() => void> = [];
let kuyruk: Promise<void> = Promise.resolve();

async function bulutaYaz(): Promise<void> {
  const kimlik = aktifKullanici;
  if (!kimlik) return;
  const veri = anlikPaket();
  const metin = JSON.stringify(veri);
  if (metin === sonGonderilen) return;
  try {
    const { error } = await supabase
      .from("kullanici_verisi")
      .upsert({ user_id: kimlik, veri, guncellendi: new Date().toISOString() });
    if (error) throw new Error(error.message);
    sonGonderilen = metin;
    useOturum.getState().setSenkron("kaydedildi");
  } catch (err) {
    console.error("Bulut kaydı başarısız:", err);
    useOturum.getState().setSenkron("hata");
  }
}

function kuyrugaAl(): Promise<void> {
  kuyruk = kuyruk.then(bulutaYaz, bulutaYaz);
  return kuyruk;
}

function planla() {
  if (zamanlayici) clearTimeout(zamanlayici);
  zamanlayici = setTimeout(() => {
    zamanlayici = null;
    void kuyrugaAl();
  }, 1500);
}

export function bulutuDurdur() {
  nesil += 1;
  aktifKullanici = null;
  if (zamanlayici) {
    clearTimeout(zamanlayici);
    zamanlayici = null;
  }
  aboneler.forEach((iptal) => iptal());
  aboneler = [];
}

export async function bulutaBaglan(kullaniciId: string): Promise<void> {
  bulutuDurdur();
  const benim = nesil;
  aktifKullanici = kullaniciId;
  useOturum.getState().setSenkron("bekliyor");
  try {
    const { data, error } = await supabase
      .from("kullanici_verisi")
      .select("veri")
      .eq("user_id", kullaniciId)
      .maybeSingle();
    if (benim !== nesil) return;
    if (error) throw new Error(error.message);

    const kayitli = data?.veri as Partial<Paket> | undefined;
    if (kayitli && Object.keys(kayitli).length > 0) {
      paketUygula(kayitli);
      sonGonderilen = JSON.stringify(anlikPaket());
    } else {
      sonGonderilen = "";
      await kuyrugaAl();
      if (benim !== nesil) return;
    }
    useOturum.getState().setSenkron("kaydedildi");
    aboneler = [useFit.subscribe(planla), useEkstra.subscribe(planla), useOgun.subscribe(planla)];
  } catch (err) {
    if (benim === nesil) aktifKullanici = null;
    throw err;
  }
}

export async function cikisYap(zorla = false): Promise<"tamam" | "kaydedilemedi"> {
  if (!zorla) {
    if (zamanlayici) {
      clearTimeout(zamanlayici);
      zamanlayici = null;
    }
    await kuyrugaAl();
    if (JSON.stringify(anlikPaket()) !== sonGonderilen) return "kaydedilemedi";
  }
  bulutuDurdur();
  await supabase.auth.signOut();
  bosVeri();
  localStorage.clear();
  useOturum.getState().setEmail(null);
  return "tamam";
}

export function tumVeriyiSifirla() {
  bosVeri();
}