export interface KocSorParams {
  data: {
    soru: string;
    baglam?: string;
    gecmis?: Array<{ role: "user" | "assistant"; content: string }>;
  };
}

export async function kocSor({ data }: KocSorParams) {
  const { soru, baglam = "", gecmis = [] } = data;

  const sistemPrompt = `Sen ScoutFit uygulamasının uzman, samimi ve motive edici fitness ve beslenme koçusun.
Kullanıcının antrenman ve beslenme verilerini dikkate alarak net, doğrudan ve uygulanabilir tavsiyeler ver.

Kullanıcı Verileri ve Bağlamı:
${baglam || "Bağlam bilgisi yok."}`;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: sistemPrompt },
          ...gecmis,
          { role: "user", content: soru },
        ],
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, hata: `Sunucu hatası (${res.status}): ${errText}` };
    }

    const json = await res.json();
    const metin = json.choices?.[0]?.message?.content?.trim();
    return { ok: true, metin };
  } catch (err: any) {
    return { ok: false, hata: "Bağlantı hatası: " + err.message };
  }
}