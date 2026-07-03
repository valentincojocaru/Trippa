/* ============================================================
   Trippa — /api/ai
   Server-side AI completion. Secrets never reach the client.
   GET  → { available } so the UI knows whether a server key exists.
   POST { prompt } → { text } via OpenAI or Anthropic.
   501 when no key is configured (UI shows "add a key" — rule 4:
   never silently fabricate an AI answer).
   ============================================================ */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    available: !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
  });
}

export async function POST(req: Request) {
  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const openai = process.env.OPENAI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;

  try {
    if (openai) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + openai },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });
      if (!r.ok) throw new Error("openai " + r.status);
      const j = await r.json();
      return NextResponse.json({ text: j.choices?.[0]?.message?.content || "" });
    }
    if (anthropic) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropic,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!r.ok) throw new Error("anthropic " + r.status);
      const j = await r.json();
      return NextResponse.json({ text: j.content?.[0]?.text || "" });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }

  return NextResponse.json({ error: "no-key" }, { status: 501 });
}
