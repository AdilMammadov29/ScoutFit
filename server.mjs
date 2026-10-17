import { createServer } from "node:http";

const PORT = 3001;
const apiKey = process.env.GROQ_API_KEY;

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
  const origin = req.headers.origin ?? "";
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }
  if (req.method !== "POST" || req.url !== "/api/koc") {
    return json(res, 404, { ok: false, hata: "yok" });
  }
  if (!apiKey) return json(res, 500, { ok: false, hata: "anahtar-yok" });

  let raw = "";
  for await (const chunk of req) raw += chunk;

  let girdi;
  try {
    girdi = JSON.parse(raw);
  } catch {
    return json(res, 400, { ok: false, hata: "bozuk-istek" });
  }
  const soru = String(girdi?.soru ?? "").trim().slice(0, 600);
  const baglam = String(girdi?.baglam ?? "").trim().slice(0, 500);
  if (!soru) return json(res, 400, { ok: false, hata: "bos" });

  try {
    const r = await fetch(  "https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(12000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
         model: "openai/gpt-oss-120b",
        temperature: 0.4,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: `Sen ScoutFit koçusun. Türkçe, sakin, kısa ve somut konuş.
Profil: ${baglam || "profil yok"}.
Kurallar:
- Boy veya kilo dökümüyle başlama. Doğrudan soruyu yanıtla.
- En fazla 90 kelime. Gerekirse en fazla 4 madde.
- Tıbbi teşhis koyma. Güvenli tempo haftada 0,3–0,7 kg.
- Emoji, ünlem yağmuru ve motivasyon sloganı kullanma.`,
          },
          { role: "user", content: soru },
        ],
      }),
    });
    if (!r.ok) return json(res, 200, { ok: false, hata: `http-${r.status}` });
    const body = await r.json();
    const metin = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!metin) return json(res, 200, { ok: false, hata: "bos-yanit" });
    return json(res, 200, { ok: true, metin });
  } catch {
    return json(res, 200, { ok: false, hata: "ag" });
  }
}).listen(PORT, () => console.log(`Koç sunucusu: http://localhost:${PORT}`));