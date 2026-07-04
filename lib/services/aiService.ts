/* ============================================================
   Trippa — aiService
   Provider-agnostic completions with model ROUTING across
   OpenAI, Anthropic and Gemini:

     tier "deep" — plan skeletons, day itineraries (quality first)
                   Anthropic → OpenAI → Gemini
     tier "fast" — extraction, dining, packing, short lists
                   Gemini → OpenAI → Anthropic

   Key resolution: on-device key from Settings (called directly,
   never uploaded) → server key via /api/ai → throws "no-key" so
   the UI can ask for one. Never fabricates an answer.
   ============================================================ */

export type AiTier = "fast" | "deep";

type Provider = "openai" | "anthropic" | "gemini";

let serverAvailable: boolean | null = null;

function localKey(name: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem("trippa.env." + name) || "";
  } catch {
    return "";
  }
}

const KEY_NAME: Record<Provider, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
};

/** provider preference per tier — quality-first vs latency/cost-first */
const ROUTE: Record<AiTier, Provider[]> = {
  deep: ["anthropic", "openai", "gemini"],
  fast: ["gemini", "openai", "anthropic"],
};

async function checkServer(): Promise<boolean> {
  if (serverAvailable != null) return serverAvailable;
  try {
    const r = await fetch("/api/ai", { method: "GET" });
    const j = await r.json();
    serverAvailable = !!j.available;
  } catch {
    serverAvailable = false;
  }
  return serverAvailable;
}

async function completeViaServer(prompt: string, tier: AiTier): Promise<string> {
  const r = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, tier }),
  });
  if (r.status === 501) throw new Error("no-key");
  if (!r.ok) throw new Error("ai " + r.status);
  const j = await r.json();
  return j.text || "";
}

async function completeViaOpenAI(prompt: string, key: string, tier: AiTier): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({
      model: tier === "deep" ? "gpt-4o" : "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  if (!r.ok) throw new Error("openai " + r.status);
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

async function completeViaAnthropic(prompt: string, key: string, tier: AiTier): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: tier === "deep" ? "claude-sonnet-5" : "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error("anthropic " + r.status);
  const j = await r.json();
  return j.content?.[0]?.text || "";
}

async function completeViaGemini(prompt: string, key: string, tier: AiTier): Promise<string> {
  const model = tier === "deep" ? "gemini-2.5-pro" : "gemini-2.5-flash";
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!r.ok) throw new Error("gemini " + r.status);
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

const CALL: Record<Provider, (p: string, k: string, t: AiTier) => Promise<string>> = {
  openai: completeViaOpenAI,
  anthropic: completeViaAnthropic,
  gemini: completeViaGemini,
};

export const aiService = {
  /** true when any AI path can answer (device key or server key) */
  async available(): Promise<boolean> {
    if ((["openai", "anthropic", "gemini"] as Provider[]).some((p) => localKey(KEY_NAME[p])))
      return true;
    return checkServer();
  },

  hasDeviceKey(): boolean {
    return (["openai", "anthropic", "gemini"] as Provider[]).some((p) => localKey(KEY_NAME[p]));
  },

  /** Routed completion. Tries providers in tier preference order,
      falling through on per-provider failures; server key last. */
  async complete(prompt: string, opts: { tier?: AiTier } = {}): Promise<string> {
    const tier = opts.tier || "deep";
    let lastErr: unknown = null;
    for (const provider of ROUTE[tier]) {
      const key = localKey(KEY_NAME[provider]);
      if (!key) continue;
      try {
        return await CALL[provider](prompt, key, tier);
      } catch (e) {
        lastErr = e; // fall through to the next provider
      }
    }
    if (await checkServer()) return completeViaServer(prompt, tier);
    if (lastErr) throw lastErr;
    throw new Error("no-key");
  },
};
