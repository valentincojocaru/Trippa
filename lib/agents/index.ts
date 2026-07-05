"use client";

/* ============================================================
   Trippa — multi-agent trip planning system
   ------------------------------------------------------------
   One orchestrator, eight specialized agents. Phase 1 resolves
   the plan skeleton (destination, days, logistics). Phase 2 runs
   the specialists CONCURRENTLY, each with its own routed model
   tier, and the orchestrator merges everything into one coherent
   plan. Every agent reports live start/done/error events so the
   UI shows real progress, not a simulation.

   Honesty rules carried through from the service layer:
   • Agents that need an AI key degrade explicitly (skip event),
     never silently — flights/hotels fall back to the labelled
     deterministic estimate services.
   • The budget agent VALIDATES the ceiling; it never edits it.
   ============================================================ */

import { aiService } from "@/lib/services/aiService";
import { flightService } from "@/lib/services/flightService";
import { hotelService } from "@/lib/services/hotelService";
import { weatherService } from "@/lib/services/weatherService";
import { profilePromptLine } from "@/lib/travelProfile";
import { richPrompt } from "@/lib/prompt";
import { searchDestinations } from "@/data/destinations";
import type { PlanState } from "@/lib/types";

/* ------------------------------------------------------------ */
/*  events + shared plumbing                                      */
/* ------------------------------------------------------------ */

export type AgentName =
  | "planner"
  | "flights"
  | "hotels"
  | "itinerary"
  | "dining"
  | "weather"
  | "budget"
  | "packing"
  | "visa";

export type AgentEvent = {
  agent: AgentName;
  status: "start" | "done" | "error" | "skip";
  detail?: string;
};

export type OnEvent = (e: AgentEvent) => void;

/** tolerant JSON extraction — models occasionally wrap output */
export function extractJson<T>(text: string, kind: "object" | "array"): T | null {
  if (!text) return null;
  const t = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const [open, close] = kind === "object" ? ["{", "}"] : ["[", "]"];
  const a = t.indexOf(open);
  const b = t.lastIndexOf(close);
  if (a < 0 || b < 0) return null;
  const raw = t.slice(a, b + 1);
  for (const candidate of [
    raw,
    raw.replace(/,\s*([}\]])/g, "$1"),
    raw.replace(/,\s*([}\]])/g, "$1").replace(/[\u0000-\u001F]+/g, " "),
  ]) {
    try {
      return JSON.parse(candidate) as T;
    } catch {}
  }
  return null;
}

/** run a JSON-producing agent with one retry and event reporting */
async function jsonAgent<T>(
  agent: AgentName,
  onEvent: OnEvent,
  tier: "fast" | "deep",
  prompt: string,
  kind: "object" | "array"
): Promise<T | null> {
  onEvent({ agent, status: "start" });
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await aiService.complete(
        attempt ? prompt + "\n\nReturn ONLY valid minified JSON." : prompt,
        { tier }
      );
      const parsed = extractJson<T>(raw, kind);
      if (parsed) {
        onEvent({ agent, status: "done" });
        return parsed;
      }
    }
    onEvent({ agent, status: "error", detail: "unparseable" });
    return null;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    onEvent({ agent, status: /no-key/.test(msg) ? "skip" : "error", detail: msg });
    if (/no-key/.test(msg)) return null;
    return null;
  }
}

/* ------------------------------------------------------------ */
/*  agent output shapes                                           */
/* ------------------------------------------------------------ */

export type PlanSkeleton = {
  name: string;
  country: string;
  origin: string;
  currency: string;
  timezone: string;
  bestTime: string;
  weather: string;
  transport: string;
  budgetEUR: number;
  flights: { estEUR: number; note: string; outDate: string; backDate: string };
  tips: string[];
  days: { day: string; date: string; city: string; items?: DayItem[] }[];
  hotels: { city: string; name: string; area: string; nights: number; priceEUR: number; why: string }[];
};

export type DayItem = { time: string; t: string; note?: string; cat?: string };

export type BudgetReport = {
  fits: boolean;
  estimatedTotal: number;
  advice: string[];
};

/* ------------------------------------------------------------ */
/*  phase 1 — planner agent (skeleton: destination + logistics)   */
/* ------------------------------------------------------------ */

export async function plannerAgent(S: PlanState, onEvent: OnEvent): Promise<PlanSkeleton | null> {
  const prompt = `You are Trippa's lead trip-planning agent. The traveler's request: "${richPrompt(S)}".
Plan the LOGISTICS: destination, dates layout, flights estimate and one real hotel per city. Return ONLY raw minified single-line JSON, no backticks, no apostrophes inside strings:
{"name":"short name","country":"country","origin":"likely departure city or empty","currency":"EUR","timezone":"Europe/Rome","bestTime":"one line","weather":"one line","transport":"one line","budgetEUR":1200,"flights":{"estEUR":350,"note":"e.g. 3h direct","outDate":"Mon DD","backDate":"Mon DD"},"tips":["3 short tips"],"days":[{"day":"Day 1","date":"Mon DD","city":"city"}],"hotels":[{"city":"city","name":"real hotel name","area":"neighbourhood","nights":3,"priceEUR":110,"why":"max 5 words"}]}
Rules: days MUST match the requested length. Real cities, REAL hotel names, honest market prices — never lower prices to fit the budget.`;
  const skel = await jsonAgent<PlanSkeleton>("planner", onEvent, "deep", prompt, "object");
  if (skel && !Array.isArray(skel.days)) return null;
  return skel;
}

/* ------------------------------------------------------------ */
/*  phase 2 — specialist agents (run concurrently)                */
/* ------------------------------------------------------------ */

/** Itinerary agent — 3 real activities per day, batched to avoid truncation. */
export async function itineraryAgent(
  skel: PlanSkeleton,
  onEvent: OnEvent
): Promise<void> {
  onEvent({ agent: "itinerary", status: "start" });
  try {
    const BATCH = 4;
    for (let s = 0; s < skel.days.length; s += BATCH) {
      const slice = skel.days.slice(s, s + BATCH);
      const listing = slice.map((d, k) => `${s + k + 1}. ${d.day} in ${d.city}`).join("; ");
      const prompt = `For a trip to ${skel.name}, ${skel.country}, give 3 real activities/places for EACH of these days: ${listing}.
Return ONLY a raw minified JSON array, one entry per day in the SAME order (no backticks, no apostrophes inside strings):
[{"items":[{"time":"HH:MM","t":"real place","note":"max 4 words","cat":"Sights"}]}]
cat one of Sights/Food/Views/Shopping/Transport/Hotel. Exactly 3 per day, morning to evening, REAL named places.`;
      const raw = await aiService.complete(prompt, { tier: "deep" });
      const arr = extractJson<{ items: DayItem[] }[]>(raw, "array");
      slice.forEach((d, k) => {
        d.items = arr?.[k]?.items || d.items || [];
      });
    }
    onEvent({ agent: "itinerary", status: "done" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    onEvent({ agent: "itinerary", status: /no-key/.test(msg) ? "skip" : "error", detail: msg });
  }
}

/** Dining agent — one standout restaurant per day, merged into the plan. */
export async function diningAgent(skel: PlanSkeleton, onEvent: OnEvent): Promise<void> {
  const listing = skel.days.map((d, i) => `${i + 1}. ${d.day} in ${d.city}`).join("; ");
  const arr = await jsonAgent<{ name: string; note: string; time: string }[]>(
    "dining",
    onEvent,
    "fast",
    `Recommend ONE real, well-regarded restaurant for dinner for each day of a trip to ${skel.name}, ${skel.country}: ${listing}.
Return ONLY a minified JSON array in the SAME order, no backticks, no apostrophes in strings:
[{"name":"real restaurant","note":"cuisine, max 4 words","time":"19:30"}]
Real places only. One entry per day.`,
    "array"
  );
  if (!arr) return;
  skel.days.forEach((d, i) => {
    const r = arr[i];
    if (!r?.name) return;
    d.items = d.items || [];
    // don't double-book dinner if the itinerary already has an evening Food stop
    const hasDinner = d.items.some((it) => it.cat === "Food" && (it.time || "") >= "18:00");
    if (!hasDinner) d.items.push({ time: r.time || "19:30", t: r.name, note: r.note || "", cat: "Food" });
  });
}

/** Packing agent — climate/activity aware groups. */
export async function packingAgent(
  skel: PlanSkeleton,
  S: PlanState,
  onEvent: OnEvent
): Promise<{ group: string; items: string[] }[] | null> {
  return jsonAgent(
    "packing",
    onEvent,
    "fast",
    `Packing list for ${S.days} days in ${skel.name}, ${skel.country} (${skel.weather || "typical weather"}), ${S.adults} adults${S.children ? `, ${S.children} children` : ""}${S.pets === "yes" ? ", travelling with pets" : ""}. ${profilePromptLine()}
Return ONLY a minified JSON array, no backticks: [{"group":"Essentials","items":["item","item"]}]
3-4 groups, 3-5 items each, specific to this destination and season.`,
    "array"
  );
}

/** Visa/entry agent — one honest paragraph; explicitly says when to verify officially. */
export async function visaAgent(skel: PlanSkeleton, S: PlanState, onEvent: OnEvent): Promise<string | null> {
  const res = await jsonAgent<{ summary: string }>(
    "visa",
    onEvent,
    "fast",
    `Entry requirements summary for a traveler going from ${S.origin || "the EU"} to ${skel.country}. Return ONLY minified JSON, no backticks:
{"summary":"2-3 sentences: visa needed or not for common passports, passport validity rule, and a reminder to verify with the official source before booking"}
Be conservative — if rules vary by nationality, say so rather than guessing.`,
    "object"
  );
  return res?.summary || null;
}

/** Weather agent — REAL forecast (Open-Meteo, keyless) for the destination. */
export async function weatherAgent(
  lat: number,
  lon: number,
  onEvent: OnEvent
): Promise<string | null> {
  onEvent({ agent: "weather", status: "start" });
  const r = await weatherService.forecast(lat, lon, 7);
  if (!r.data) {
    onEvent({ agent: "weather", status: "error", detail: r.meta.error });
    return null;
  }
  onEvent({ agent: "weather", status: "done" });
  const min = Math.min(...r.data.map((d) => d.min));
  const max = Math.max(...r.data.map((d) => d.max));
  return `Next 7 days: ${min}°–${max}°C ${r.data[0].emoji} (live forecast)`;
}

/** Flight & hotel agents — real APIs when keyed, labelled estimates otherwise. */
export async function flightsAgent(S: PlanState, destIata: string, onEvent: OnEvent) {
  onEvent({ agent: "flights", status: "start" });
  const m = (S.origin || "").match(/\(([A-Za-z]{3})\)/);
  const res = await flightService.search({
    originIata: m ? m[1].toUpperCase() : undefined,
    destIata,
    pax: (S.adults || 1) + (S.children || 0),
    baggage: !!S.bags?.checked,
  });
  onEvent({
    agent: "flights",
    status: res.meta.needs ? "skip" : "done",
    detail: res.meta.needs,
  });
  return res;
}

export async function hotelsAgent(S: PlanState, city: string, onEvent: OnEvent) {
  onEvent({ agent: "hotels", status: "start" });
  const res = await hotelService.search({
    city,
    nights: Math.max(1, S.days - 1),
    pets: S.pets === "yes",
    children: S.children > 0,
    tier: S.tier,
  });
  onEvent({ agent: "hotels", status: "done" });
  return res;
}

/** Budget agent — validates the ceiling (NEVER changes it) + optimizer advice. */
export function budgetAgent(skel: PlanSkeleton, S: PlanState, onEvent: OnEvent): BudgetReport {
  onEvent({ agent: "budget", status: "start" });
  const party = Math.max(1, (S.adults || 0) + (S.children || 0));
  const hotelTotal = (skel.hotels || []).reduce((s, h) => s + (h.priceEUR || 0) * (h.nights || 1), 0);
  const flightTotal = skel.flights?.estEUR || 0;
  const foodEst = Math.round(party * S.days * 32);
  const estimatedTotal = flightTotal + hotelTotal + foodEst + Math.round((skel.budgetEUR || 1000) * 0.12);
  const ceiling = S.perPerson ? S.budgetTotal * party : S.budgetTotal;
  const fits = estimatedTotal <= ceiling;
  const advice = fits
    ? []
    : [
        "Fly mid-week — Tue/Wed departures are usually the cheapest.",
        "Swap one hotel night for a guesthouse or apartment.",
        "Book the top 1-2 activities only; keep the rest spontaneous.",
      ];
  onEvent({ agent: "budget", status: "done", detail: fits ? "within budget" : "over budget" });
  return { fits, estimatedTotal, advice };
}
