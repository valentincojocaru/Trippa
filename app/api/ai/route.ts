/* ============================================================
   Trippa — /api/ai
   Server-side AI completion with model routing. Secrets never
   reach the client.
   GET  → { available } so the UI knows whether a server key exists.
   POST { prompt, tier } → { text } via Anthropic / OpenAI / Gemini,
   in tier preference order (deep = quality-first, fast = cost-first).
   501 when no key is configured (UI shows "add a key" — never
   silently fabricate an AI answer).
   ============================================================ */

import { NextResponse } from "next/server";

type Tier = "fast" | "deep";

async function viaOpenAI(prompt: string, key: string, tier: Tier) {
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

async function viaAnthropic(prompt: string, key: string, tier: Tier) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
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

async function viaGemini(prompt: string, key: string, tier: Tier) {
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

export async function GET() {
  return NextResponse.json({
    available: !!(
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY
    ),
  });
}

export async function POST(req: Request) {
  const { prompt, tier: rawTier } = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }
  const tier: Tier = rawTier === "fast" ? "fast" : "deep";

  const providers: [string | undefined, (p: string, k: string, t: Tier) => Promise<string>][] =
    tier === "deep"
      ? [
          [process.env.ANTHROPIC_API_KEY, viaAnthropic],
          [process.env.OPENAI_API_KEY, viaOpenAI],
          [process.env.GEMINI_API_KEY, viaGemini],
        ]
      : [
          [process.env.GEMINI_API_KEY, viaGemini],
          [process.env.OPENAI_API_KEY, viaOpenAI],
          [process.env.ANTHROPIC_API_KEY, viaAnthropic],
        ];

  // No key configured on the server → clear, actionable error (never a fake answer).
  if (!providers.some(([key]) => !!key)) {
    return NextResponse.json(
      {
        error: "no-key",
        message:
          "AI is not configured on the server. Set OPENAI_API_KEY (or ANTHROPIC_API_KEY / GEMINI_API_KEY) in the server environment.",
      },
      { status: 501 }
    );
  }

  let lastErr: unknown = null;
  for (const [key, call] of providers) {
    if (!key) continue;
    try {
      return NextResponse.json({ text: await call(prompt, key, tier) });
    } catch (e) {
      lastErr = e; // fall through to the next provider
    }
  }
  return NextResponse.json(
    { error: "ai-upstream", message: "AI provider request failed: " + String(lastErr) },
    { status: 502 }
  );
}
