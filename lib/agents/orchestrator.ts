"use client";

/* ============================================================
   Orchestrator — coordinates the agent fleet into ONE plan.

   Phase 1  planner agent (deep tier)     → skeleton
   Phase 2  itinerary + dining + packing  → concurrently
            + visa + weather (real) + budget validation
   Merge    one coherent PlanSkeleton, enriched, ready for
            buildTrip(). Per-agent AgentEvents stream to the UI.

   Replanning: replanDay() re-generates a single day when plans
   change (rain, closures, energy level) without touching the
   rest of the trip.
   ============================================================ */

import {
  plannerAgent,
  itineraryAgent,
  diningAgent,
  packingAgent,
  visaAgent,
  weatherAgent,
  budgetAgent,
  extractJson,
  type OnEvent,
  type PlanSkeleton,
  type DayItem,
  type BudgetReport,
} from "./index";
import { aiService } from "@/lib/services/aiService";
import type { PlanState, Trip } from "@/lib/types";

export type OrchestratedPlan = PlanSkeleton & {
  packing: { group: string; items: string[] }[];
  visa?: string | null;
  budgetReport?: BudgetReport;
};

/** Full multi-agent run. Requires an AI key (the caller falls back to
    the labelled estimate engine when none is available). */
export async function orchestrate(
  S: PlanState,
  opts: { withActivities?: boolean } = {},
  onEvent: OnEvent = () => {},
  geo?: { lat: number; lon: number } | null
): Promise<OrchestratedPlan> {
  /* phase 1 — the skeleton everything else hangs off */
  const skel = await plannerAgent(S, onEvent);
  if (!skel) throw new Error("parse");

  /* phase 2 — specialists in parallel; each degrades independently */
  const [packing, visa, weatherLine] = await Promise.all([
    packingAgent(skel, S, onEvent),
    visaAgent(skel, S, onEvent),
    geo ? weatherAgent(geo.lat, geo.lon, onEvent) : Promise.resolve(null),
    opts.withActivities
      ? itineraryAgent(skel, onEvent).then(() => diningAgent(skel, onEvent))
      : Promise.resolve(
          (skel.days.forEach((d) => (d.items = d.items || [])), undefined)
        ),
  ]).then(([p, v, w]) => [p, v, w] as const);

  /* budget validation — the user's ceiling is law */
  const budgetReport = budgetAgent(skel, S, onEvent);
  if (!budgetReport.fits && budgetReport.advice.length) {
    skel.tips = [...budgetReport.advice, ...(skel.tips || [])].slice(0, 5);
  }
  if (weatherLine) skel.weather = weatherLine;

  return {
    ...skel,
    packing:
      packing && packing.length
        ? packing
        : [
            { group: "Essentials", items: ["Passport & visa docs", "Universal power adapter", "Travel insurance card"] },
            { group: "Clothing", items: ["Comfortable walking shoes", `Layers (${S.days} days)`] },
          ],
    visa,
    budgetReport,
  };
}

/* ------------------------------------------------------------ */
/*  AI replanning — regenerate one day when something changes     */
/* ------------------------------------------------------------ */

export type ReplanReason = "rain" | "closed" | "relaxed" | "adventurous";

const REASON_LINE: Record<ReplanReason, string> = {
  rain: "The forecast turned to rain — prefer indoor activities (museums, markets, food halls, galleries).",
  closed: "One of the planned places is unexpectedly closed — replace the plan with open alternatives nearby.",
  relaxed: "The traveler wants a slower, more relaxed day — fewer stops, more cafés, parks and easy walks.",
  adventurous: "The traveler wants a more adventurous day — active, outdoors, off the beaten path.",
};

export async function replanDay(
  trip: Trip,
  dayIdx: number,
  reason: ReplanReason
): Promise<DayItem[]> {
  const day = trip.itin[dayIdx];
  if (!day) throw new Error("no-day");
  const current = (day.items || []).map((i) => `${i.time} ${i.t}`).join("; ") || "nothing planned yet";
  const prompt = `You are Trippa's replanning agent. Trip: ${trip.name}, ${trip.country}. ${day.day} in ${day.city}. Current plan: ${current}.
${REASON_LINE[reason]}
Return ONLY a minified JSON array of 3-4 REAL places for this day, morning to evening, no backticks, no apostrophes in strings:
[{"time":"HH:MM","t":"real place","note":"max 4 words","cat":"Sights"}]
cat one of Sights/Food/Views/Shopping/Culture/Nature. Keep one Food stop.`;
  const raw = await aiService.complete(prompt, { tier: "deep" });
  const items = extractJson<DayItem[]>(raw, "array");
  if (!items || !items.length) throw new Error("parse");
  return items.map((it) => ({
    time: it.time || "10:00",
    t: it.t,
    note: it.note || "",
    cat: it.cat || "Sights",
  }));
}
