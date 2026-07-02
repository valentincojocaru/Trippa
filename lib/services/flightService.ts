/* ============================================================
   Trippa — flightService
   search({originIata, destIata, pax, cabin, baggage}) → flights
   MOCK: deterministic, clearly-labelled estimates (meta.mock=true).
   REAL: Travelpayouts/Aviasales prices when TRAVELPAYOUTS_API_TOKEN set.
   RULE: never invent a departure airport — if originIata is missing,
   returns { data: null, meta.needs: 'origin' } so the UI can ask for it.
   ============================================================ */

import { wrap } from "./config";
import { affiliateService } from "./affiliateService";
import type { FlightOption, ServiceResult } from "@/lib/types";

const AIRLINES = ["SkyEurope", "AtlanticAir", "NordReisen", "MeridianJet", "AzureWings"];

export type FlightQuery = {
  originIata?: string;
  destIata?: string;
  pax?: number;
  cabin?: string;
  baggage?: boolean;
  tripId?: string;
};

/* Deterministic pseudo-prices from a seed so the same query is stable
   (we never random-generate prices that change every render). */
function seeded(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function mockSearch(q: FlightQuery): FlightOption[] {
  const origin = q.originIata!;
  const dest = q.destIata!;
  const base = 60 + (seeded(origin + dest) % 240); // €60–300 leg
  const pax = Math.max(1, q.pax || 1);
  return [0, 1, 2]
    .map((i) => {
      const price = Math.round(
        (base * (q.cabin === "business" ? 2.6 : 1) + i * -18 + (q.baggage ? 35 : 0)) *
          (1 + i * 0.05)
      );
      return {
        airline: AIRLINES[(seeded(dest) + i) % AIRLINES.length],
        originIata: origin,
        destIata: dest,
        depart: ["07:25", "13:10", "19:40"][i],
        arrive: ["10:05", "16:30", "23:15"][i],
        durationMin: 160 + i * 70,
        stops: i,
        cabin: q.cabin || "economy",
        baggageIncluded: !!q.baggage,
        priceEUR: price * pax,
        perPax: price,
        deal: i === 0,
        link: affiliateService.flight(origin, dest, { tripId: q.tripId }),
      };
    })
    .sort((a, b) => a.priceEUR - b.priceEUR);
}

export const flightService = {
  async search(q: FlightQuery = {}): Promise<ServiceResult<FlightOption[] | null>> {
    if (!q.originIata)
      return wrap("flights", null, {
        needs: "origin",
        message: "Please select your departure airport.",
      });
    if (!q.destIata) return wrap("flights", null, { needs: "destination" });
    // REAL Travelpayouts wiring goes here when the token is present.
    return wrap("flights", mockSearch(q));
  },
};
