/* ============================================================
   Trippa — destinationService
   Global place search. MOCK: curated destinations DB.
   REAL: Google Places Autocomplete (GOOGLE_PLACES_API_KEY).
   API is identical in both modes:
     search(q) → { data: Place[], meta }
   ============================================================ */

import { env, isReal, wrap } from "./config";
import {
  searchDestinations,
  photoURL,
  byTag,
  categories,
} from "@/data/destinations";
import type { Place, ServiceResult } from "@/lib/types";

function mockSearch(q: string, limit = 6): Place[] {
  return searchDestinations(q, limit).map((d) => ({
    ...d,
    photo: photoURL(d, 160),
  }));
}

async function realSearch(q: string, limit = 6): Promise<Place[]> {
  const key = env("GOOGLE_PLACES_API_KEY");
  const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
    body: JSON.stringify({
      input: q,
      includedPrimaryTypes: ["locality", "country", "airport", "natural_feature"],
    }),
  });
  if (!r.ok) throw new Error("Places " + r.status);
  const j = await r.json();
  return (j.suggestions || []).slice(0, limit).map((s: any): Place => {
    const p = s.placePrediction || {};
    return {
      city: p.structuredFormat?.mainText?.text || p.text?.text || q,
      country: p.structuredFormat?.secondaryText?.text || "",
      flag: "📍",
      iata: "",
      type: "place",
      tags: [],
      photo: "",
    };
  });
}

export const destinationService = {
  /** sync mock search — used by the autocomplete for zero-delay results */
  searchSync(q: string, limit = 6): Place[] {
    return mockSearch(q, limit);
  },
  async search(q: string, limit = 6): Promise<ServiceResult<Place[]>> {
    if (!q || !q.trim()) return wrap("places", []);
    try {
      const rows = isReal("places") ? await realSearch(q, limit) : mockSearch(q, limit);
      return wrap("places", rows);
    } catch (e) {
      // graceful fallback to mock — never break the search box
      return wrap("places", mockSearch(q, limit), { fellBack: true, error: String(e) });
    }
  },
  categories: () => categories,
  byTag,
};
