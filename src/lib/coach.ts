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

type KocGirdi = { soru: string; baglam?: string };

export async function kocSor({ data }: { data: KocGirdi }) {
  const soru = String(data?.soru ?? "").trim().slice(0, 600);
  const baglam = String(data?.baglam ?? "").trim().slice(0, 500);

  if (!soru) return { ok: false as const, hata: "bos" };

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.error("Groq API Key eksik!");
    return { ok: false as const, hata: "api_key_eksik" };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${String(apiKey).trim()}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content: `Sen ScoutFit koçusun. Türkçe, sakin, kısa ve somut konuş.
Profil: ${baglam || "profil yok"}.
Kurallar:
- Boy veya kilo dökümüyle başlama. Doğrudan soruyu yanıtla.
- En fazla 90 kelime. Gerekirse en fazla 4 madde.
- Tıbbi teşhis koyma. Güvenli tempo haftada 0,3–0,7 kg.
- Emoji kullanma.`,
          },
          { role: "user", content: soru },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Koç API Hatası:", res.status, errBody.slice(0, 300));
      return { ok: false as const, hata: `http-${res.status}` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (text) return { ok: true as const, metin: text };

    return { ok: false as const, hata: "bos-yanit" };
  } catch (err) {
    console.error("Koç bağlantı hatası:", err);
    return { ok: false as const, hata: "ag" };
  }
}