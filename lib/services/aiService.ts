/* ============================================================
   Trippa — aiService
   complete(prompt) → string. Provider-agnostic:
     1) server-side key (OPENAI_API_KEY / ANTHROPIC_API_KEY) via /api/ai
     2) user's key pasted in Settings (localStorage trippa.env.*) —
        called directly from the device, never uploaded anywhere
     3) none → throws 'no-key' so the UI shows "add a key"
   ============================================================ */

let serverAvailable: boolean | null = null;

function localKey(name: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem("trippa.env." + name) || "";
  } catch {
    return "";
  }
}

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

async function completeViaServer(prompt: string): Promise<string> {
  const r = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (r.status === 501) throw new Error("no-key");
  if (!r.ok) throw new Error("ai " + r.status);
  const j = await r.json();
  return j.text || "";
}

async function completeViaOpenAI(prompt: string, key: string): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  if (!r.ok) throw new Error("openai " + r.status);
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

async function completeViaAnthropic(prompt: string, key: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error("anthropic " + r.status);
  const j = await r.json();
  return j.content?.[0]?.text || "";
}

export const aiService = {
  /** true when any AI path can answer (device key or server key) */
  async available(): Promise<boolean> {
    if (localKey("OPENAI_API_KEY") || localKey("ANTHROPIC_API_KEY")) return true;
    return checkServer();
  },
  hasDeviceKey(): boolean {
    return !!(localKey("OPENAI_API_KEY") || localKey("ANTHROPIC_API_KEY"));
  },
  async complete(prompt: string): Promise<string> {
    const oa = localKey("OPENAI_API_KEY");
    if (oa) return completeViaOpenAI(prompt, oa);
    const an = localKey("ANTHROPIC_API_KEY");
    if (an) return completeViaAnthropic(prompt, an);
    if (await checkServer()) return completeViaServer(prompt);
    throw new Error("no-key");
  },
};
