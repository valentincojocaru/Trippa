"use client";

/* Rich prompt builder — turns the wizard state into the traveler
   brief every agent receives (port of wizard.js richPrompt). */

import { profilePromptLine } from "./travelProfile";
import type { PlanState } from "./types";

/* ---------------- rich prompt (port of wizard.js richPrompt) ---------------- */
export function richPrompt(S: PlanState): string {
  const p: string[] = [];
  if (S.origin) p.push(`Departing from ${S.origin}.`);
  p.push(
    S.surprise
      ? `Surprise me with a destination that fits the profile below.`
      : `Destination: ${S.dest}.`
  );
  p.push(
    `${S.tripType === "round" ? "Round trip" : "One-way"}, ${S.days} days` +
      (S.depart ? `, departing ${S.depart}${S.ret ? ` returning ${S.ret}` : ""}` : "") +
      (S.flex !== "exact"
        ? ` (flexible ${S.flex === "p3" ? "±3" : "±7"} days — suggest cheaper nearby dates)`
        : "") +
      `.`
  );
  let trav = `${S.adults} adults`;
  if (S.children)
    trav += `, ${S.children} children${S.childAges.length ? ` (ages ${S.childAges.join(", ")})` : ""}`;
  if (S.infants) trav += `, ${S.infants} infants`;
  if (S.seniors) trav += `, ${S.seniors} seniors`;
  p.push(`Travelers: ${trav}.`);
  if (S.pets === "yes")
    p.push(
      `Travelling with ${S.petCount} ${S.petType.toLowerCase()}(s) — ONLY recommend pet-friendly accommodation.`
    );
  p.push(
    `The user's budget is €${S.budgetTotal}${S.perPerson ? " per person" : " total"} (${S.tier} level). ` +
      `Treat this as a hard constraint you must NOT change. Give realistic market-rate estimates for flights and stays; ` +
      `if a realistic trip cannot fit this budget, still return your best honest estimate (do not lower prices to fit) ` +
      `so the app can tell the user it is over budget and suggest alternatives.`
  );
  if (S.interests.length)
    p.push(`Interests: ${S.interests.join(", ")}. Build the day plan around these.`);
  const profileLine = profilePromptLine();
  if (profileLine) p.push(profileLine);
  p.push(
    `Use realistic, well-known real places and real hotel names. Do not invent fake airline flight numbers or exact gate/seat data. ` +
      `Also note: best time to visit, weather, recommended neighbourhoods, daily spend, and a travel-insurance tip.`
  );
  return p.join(" ");
}

