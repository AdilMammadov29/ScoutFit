export function yerelKoc(soru: string, kalori: number): string {
  const q = soru.toLocaleLowerCase("tr-TR");
  if (["naber", "merhaba", "selam", "hey", "nasılsın", "iyi günler"].some((k) => q.includes(k))) {
    return `Merhaba. Günlük hedefin ${kalori} kcal. Antrenman, öğün ya da tempo — hangisini açalım?`;
  }
  if (["göğüs", "gogus", "chest", "press", "itme", "bench"].some((k) => q.includes(k))) {
    return [
      "Göğüs için sıra şöyle:",
      "1. Flat dumbbell press — 4×8–10",
      "2. Incline dumbbell press — 4×10",
      "3. Cable fly — 4×12–15",
      "Set arası 90 saniye. Son tekrarda 2 tekrar yedeğin kalsın.",
    ].join("\n");
  }
  if (["bacak", "squat", "deadlift", "leg"].some((k) => q.includes(k))) {
    return [
      "Bacak günü:",
      "1. Squat veya leg press — 4×8–10",
      "2. Romanian deadlift — 4×8–10",
      "3. Leg curl veya lunge — 3×12",
      "Diz ağrısı varsa squat derinliğini kıs, hareketi bırakma.",
    ].join("\n");
  }
  if (["beslenme", "yemek", "kalori", "protein", "diyet", "öğün", "ogun"].some((k) => q.includes(k))) {
    return [
      `${kalori} kcal hedefin üç öğüne bölünür.`,
      "Kahvaltıda yulaf ve yumurta, öğünde pirinç ve tavuk, akşamda et ve yeşillik.",
      "Proteini günün içine yay. Tatlıyı antrenman sonrasına bırak.",
    ].join("\n");
  }
  if (["tempo", "hafta", "kilo ver", "hızlı", "hizli", "plato"].some((k) => q.includes(k))) {
    return "Güvenli tempo haftada 0,3–0,7 kg. Daha hızlı kesmek kas ve enerji yer. İki hafta değişim yoksa kaloriyi 150 kcal düşür, antrenmanı aynı tut.";
  }
  return `${kalori} kcal hedefini bozmadan sorunu antrenman ya da öğün olarak netleştirirsem daha kısa cevap veririm. Neyi değiştirmek istiyorsun?`;
}

type KocGirdi = { soru: string; baglam: string };

type KocSonuc =
  | { ok: true; metin: string }
  | { ok: false; hata: string };

export async function kocSor({ data }: { data: KocGirdi }): Promise<KocSonuc> {
  try {
    const res = await fetch("http://localhost:3001/api/koc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, hata: `http-${res.status}` };
    return (await res.json()) as KocSonuc;
  } catch {
    return { ok: false, hata: "ag" };
  }
}