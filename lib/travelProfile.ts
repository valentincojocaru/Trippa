"use client";

/* Traveler style profile — captured in onboarding (3 taps) and
   injected into every AI prompt so plans match how this person
   actually travels. Stored on-device in trippa.travelProfile. */

import { store } from "./store";

export type TravelProfile = {
  styles: string[]; // relax | adventure | foodie | culture | nature | nightlife
  party: "solo" | "couple" | "family" | "friends" | "";
  tier: "Budget" | "Comfort" | "Premium" | "Luxury" | "";
};

export function getTravelProfile(): TravelProfile | null {
  if (typeof window === "undefined") return null;
  return store.get<TravelProfile | null>("travelProfile", null);
}

export function setTravelProfile(p: TravelProfile) {
  store.set("travelProfile", p);
}

/** One sentence for AI prompts, or "" when no profile exists. */
export function profilePromptLine(): string {
  const p = getTravelProfile();
  if (!p) return "";
  const bits: string[] = [];
  if (p.styles?.length) bits.push(`travel style: ${p.styles.join(", ")}`);
  if (p.party) bits.push(`usually travels ${p.party === "solo" ? "solo" : "as a " + p.party}`);
  if (p.tier) bits.push(`prefers ${p.tier}-level comfort`);
  if (!bits.length) return "";
  return `Traveler profile (${bits.join("; ")}) — bias recommendations toward this style unless the request says otherwise.`;
}
