/* ============================================================
   Trippa — aiService (client)
   The client NEVER talks to OpenAI/Anthropic/Gemini directly and never
   holds an API key. Every completion goes through our own backend route
   (/api/ai), which reads the key from server-side environment variables.

   Base URL:
     - web            → same origin ("/api/ai")
     - native/mobile  → NEXT_PUBLIC_APP_URL + "/api/ai" (the deployed backend)
   If no backend is reachable, complete() throws "no-key" and callers fall
   back to the labelled keyless estimate engine — never a fake AI answer.
   ============================================================ */

export type AiTier = "fast" | "deep";

let serverAvailable: boolean | null = null;

/** Where the backend lives. On the web it's same-origin; inside the native
    shell (static bundle, no server) it's the deployed app URL. */
function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return base.replace(/\/$/, "");
}

async function checkServer(): Promise<boolean> {
  if (serverAvailable != null) return serverAvailable;
  try {
    const r = await fetch(apiBase() + "/api/ai", { method: "GET" });
    const j = await r.json();
    serverAvailable = !!j.available;
  } catch {
    serverAvailable = false;
  }
  return serverAvailable;
}

async function completeViaServer(prompt: string, tier: AiTier): Promise<string> {
  const r = await fetch(apiBase() + "/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, tier }),
  });
  if (r.status === 501) throw new Error("no-key");
  if (!r.ok) throw new Error("ai " + r.status);
  const j = await r.json();
  return j.text || "";
}

export const aiService = {
  /** true when the backend has an AI key configured */
  async available(): Promise<boolean> {
    return checkServer();
  },

  /** Routed completion — always server-side. Throws "no-key" when the
      backend has no key (or no backend is reachable) so callers can fall
      back to the keyless estimate engine. */
  async complete(prompt: string, opts: { tier?: AiTier } = {}): Promise<string> {
    const tier = opts.tier || "deep";
    if (!(await checkServer())) throw new Error("no-key");
    return completeViaServer(prompt, tier);
  },
};
