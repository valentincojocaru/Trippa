"use client";

/* AI Concierge — chat with full trip context. Talks only to our own
   /api/ai backend (server-side key); when the backend has no key it says
   so honestly — it never fakes an answer and never holds a key itself. */

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, UtensilsCrossed, Compass, CalendarClock, Gem } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import { store, useStoreVersion } from "@/lib/store";
import { aiService } from "@/lib/services/aiService";
import { profilePromptLine } from "@/lib/travelProfile";
import { tripService } from "@/lib/services/userService";
import type { ChatMsg, ItineraryDay } from "@/lib/types";

function persona(): string {
  const trip = tripService.active();
  const itin = store.get<ItineraryDay[]>("itin", []);
  const plan = itin.length
    ? " Their itinerary: " +
      itin
        .map((d) => `${d.day} (${d.city}): ` + (d.items || []).map((i) => i.time + " " + i.t).join(", "))
        .join(" | ")
    : "";
  const ctx = trip
    ? `The user is planning/on a trip to ${trip.name}${trip.country ? ", " + trip.country : ""} (budget ~€${trip.budget}). Currency ${trip.currency}.`
    : `The user has not planned a trip yet — you may suggest destinations, but never invent trip details they did not give you.`;
  const profile = profilePromptLine();
  return `You are Trippa, a warm, expert AI travel concierge inside a mobile travel app. ${ctx}${plan} ${profile} Reply in the user's language. Keep replies short and practical (2-4 sentences), concrete, friendly, with the occasional tasteful emoji. Suggest specific real places, times or tips when relevant. If asked to rearrange the itinerary, give the new order clearly.`;
}

export default function ChatPage() {
  useStoreVersion();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [streamText, setStreamText] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  if (!mounted) return <div className="screen-body" />;

  const trip = tripService.active();
  const hist = store.get<ChatMsg[]>("chat", [
    {
      r: "ai",
      t: trip
        ? `Hi! 👋 I'm your Trippa concierge — I know your ${trip.name} trip. Ask me anything: food, routes, hidden gems, timing…`
        : `Hi! 👋 I'm your Trippa concierge. Plan a trip and I'll know every detail — or ask me anything about travel.`,
    },
  ]);

  async function send(msg?: string) {
    const text = (msg ?? input).trim();
    if (!text || typing) return;
    setInput("");
    const h = [...hist, { r: "me" as const, t: text }];
    store.set("chat", h);
    setTyping(true);
    setStreamText("");
    let reply = "";
    try {
      const transcript = h.map((m) => (m.r === "me" ? "User: " : "Trippa: ") + m.t).join("\n");
      const promptText =
        persona() + "\n\nConversation so far:\n" + transcript + "\n\nWrite Trippa's next reply only.";
      // stream tokens into the live bubble; fall back to buffered on any issue
      reply = await aiService.stream(promptText, { tier: "fast" }, (partial) => setStreamText(partial));
    } catch (e: any) {
      reply = /no-key/.test(e?.message || "")
        ? "AI chat isn't available right now — it needs the server AI key configured. I can still help you navigate your trip."
        : "I'm offline right now — reconnect and I'll plan your day. Meanwhile, check your itinerary and saved places.";
    }
    setStreamText(null);
    setTyping(false);
    store.set("chat", [...h, { r: "ai", t: reply.trim() }]);
  }

  const suggestions = ["What should I do today?", "Best local food nearby?", "Rearrange my afternoon", "Hidden gems?"];
  const starters = [
    { Icon: CalendarClock, label: "What should I do today?" },
    { Icon: UtensilsCrossed, label: "Best local food nearby?" },
    { Icon: Compass, label: "Rearrange my afternoon" },
    { Icon: Gem, label: "Hidden gems?" },
  ];
  const fresh = hist.length <= 1 && !typing;

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
      <ScreenHeader title="AI Concierge" backHref="/" />
      <div className="flex-1 flex flex-col gap-[10px] px-5 pt-4" style={{ paddingBottom: 170 }}>
        {hist.map((m, i) => (
          <div key={i} className={"bub " + (m.r === "me" ? "me" : "ai")}>
            {m.t}
          </div>
        ))}
        {fresh && (
          /* welcome state — fills the empty room with a brand orb and starters */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-8">
            <span
              className="itile"
              style={{
                width: 64,
                height: 64,
                borderRadius: 22,
                background: "var(--accent-grad)",
                boxShadow: "0 14px 34px -10px var(--accent-glow)",
              }}
            >
              <Sparkles size={26} color="#fff" fill="#fff" />
            </span>
            <div className="dim text-[12.5px]">Try one of these</div>
            <div className="w-full flex flex-col gap-[9px]" style={{ maxWidth: 300 }}>
              {starters.map(({ Icon, label }) => (
                <button
                  key={label}
                  className="card tap flex items-center gap-3 text-left"
                  style={{ padding: "12px 14px", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}
                  onClick={() => send(label)}
                >
                  <span className="itile acc" style={{ width: 34, height: 34, borderRadius: 11 }}>
                    <Icon size={16} />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        {typing && (
          <div className="bub ai">
            {streamText ? (
              <span>
                {streamText}
                <span className="tx-caret" />
              </span>
            ) : (
              <span className="tx-typing">
                <i />
                <i />
                <i />
              </span>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div
        className="fixed left-1/2 -translate-x-1/2 z-40 w-full"
        style={{ maxWidth: 430, bottom: 92, padding: "0 16px" }}
      >
        {!fresh && (
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {suggestions.map((s) => (
              <span key={s} className="pill tap" onClick={() => send(s)}>
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-[9px]">
          <input
            className="tx-input flex-1"
            style={{ height: 46, borderRadius: 16, background: "var(--surface-solid)", boxShadow: "var(--shadow-sm)" }}
            placeholder="Ask your concierge…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className="tap"
            aria-label="Send"
            style={{
              width: 46,
              height: 46,
              flex: "0 0 auto",
              border: "none",
              borderRadius: 16,
              background: "var(--accent-grad)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px -6px var(--accent-glow)",
              cursor: "pointer",
            }}
            onClick={() => send()}
          >
            <ArrowUp size={18} color="#fff" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
