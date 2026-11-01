export const config = {
  runtime: 'edge',
};

const IZINLI_MODELLER = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // APK (https://localhost) ve web için gerekli
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonYanit(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonYanit(405, { error: { message: 'Method Not Allowed' } });
  }

  // @ts-ignore
  const apiKey = (process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '').trim();
  if (!apiKey) {
    return jsonYanit(500, {
      error: { message: 'Sunucuda GROQ_API_KEY tanımlı değil (Vercel > Settings > Environment Variables).' },
    });
  }

  try {
    const girdi = await req.json();
    if (!Array.isArray(girdi?.messages) || girdi.messages.length === 0) {
      return jsonYanit(400, { error: { message: 'messages gerekli' } });
    }

    // Anahtarı kötüye kullanıma karşı: sadece izinli model ve sınırlı parametreler iletilir
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(25000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: IZINLI_MODELLER.includes(girdi.model) ? girdi.model : IZINLI_MODELLER[0],
        messages: girdi.messages.slice(-30),
        temperature: typeof girdi.temperature === 'number' ? girdi.temperature : 0.5,
        // gpt-oss düşünme token'ları da bu sınırdan harcar; çok düşük olursa boş cevap gelir
        max_tokens: Math.min(Math.max(Number(girdi.max_tokens) || 1024, 800), 2000),
        reasoning_effort: 'low',
      }),
    });

    return new Response(await groqResponse.text(), {
      status: groqResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return jsonYanit(502, { error: { message: error?.message || 'AI proxy hatası' } });
  }
}
