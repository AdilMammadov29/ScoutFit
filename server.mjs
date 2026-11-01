// Yerel geliştirme için AI proxy. Çalıştır: npm run dev:api
// Anahtar .env içindeki GROQ_API_KEY (ya da VITE_GROQ_API_KEY) değerinden okunur.
import { createServer } from "node:http";

try {
  process.loadEnvFile?.(".env");
} catch {
  /* .env yoksa ortam değişkenlerine bakılır */
}

const PORT = Number(process.env.PORT) || 3001;
const apiKey = (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || "").trim();
const IZINLI_MODELLER = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }
  if (req.method !== "POST" || req.url !== "/api/chat") {
    return json(res, 404, { error: { message: "Bulunamadı" } });
  }
  if (!apiKey) {
    return json(res, 500, {
      error: { message: "GROQ_API_KEY bulunamadı. .env dosyasına GROQ_API_KEY=... ekle." },
    });
  }

  let raw = "";
  for await (const chunk of req) raw += chunk;

  let girdi;
  try {
    girdi = JSON.parse(raw);
  } catch {
    return json(res, 400, { error: { message: "Bozuk istek" } });
  }
  if (!Array.isArray(girdi?.messages) || girdi.messages.length === 0) {
    return json(res, 400, { error: { message: "messages gerekli" } });
  }

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: IZINLI_MODELLER.includes(girdi.model) ? girdi.model : IZINLI_MODELLER[0],
        messages: girdi.messages.slice(-30),
        temperature: Number(girdi.temperature) || 0.5,
        max_tokens: Math.min(Math.max(Number(girdi.max_tokens) || 1024, 800), 2000),
        reasoning_effort: "low",
      }),
    });
    res.writeHead(r.status, { "Content-Type": "application/json" });
    res.end(await r.text());
  } catch (e) {
    json(res, 502, { error: { message: `Groq'a ulaşılamadı: ${e?.message ?? e}` } });
  }
}).listen(PORT, () => console.log(`AI proxy: http://localhost:${PORT}/api/chat`));
