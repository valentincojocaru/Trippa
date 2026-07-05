/* ============================================================
   Trippa — trip generation pipeline (port of ai-trip.js)
   PlanState → rich prompt → structured JSON trip → geocode
   (Nominatim, keyless) → photos (Wikipedia, keyless) → Trip.

   Two paths, one contract:
   • REAL — an AI key is configured: skeleton JSON first (flights +
     hotels, the logistics), then activities in batches of 4 days
     to avoid truncation.
   • MOCK — keyless: a deterministic, clearly-labelled estimate plan
     (trip.mock = true, UI badges "AI estimate / demo data"). Never
     silent fake data; geocoding, photos and weather stay real.

   Business rules enforced here and downstream:
   • The user's budget is NEVER changed to fit the estimate.
   • Pets → hotels come pet-friendly only (hotelService rule).
   ============================================================ */

import { aiService } from "./services/aiService";
import { orchestrate } from "./agents/orchestrator";
import type { OnEvent } from "./agents";
import { affiliateService } from "./services/affiliateService";
import { hotelService } from "./services/hotelService";
import { searchDestinations, photoURL } from "@/data/destinations";
import type { PlanState, Trip, ItineraryDay } from "./types";

/* ---------------- geocoding (Nominatim, keyless & real) ---------------- */
async function geocode(q: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const r = await fetch(
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(q),
      { headers: { Accept: "application/json" } }
    );
    const j = await r.json();
    if (j && j[0]) return { lat: +j[0].lat, lon: +j[0].lon };
  } catch {}
  return null;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ---------------- real photos (Wikipedia REST, free, no key) ---------------- */
async function wikiImage(name?: string): Promise<string | null> {
  if (!name) return null;
  try {
    const r = await fetch(
      "https://en.wikipedia.org/api/rest_v1/page/summary/" +
        encodeURIComponent(name.replace(/\s+/g, "_"))
    );
    if (!r.ok) return null;
    const j = await r.json();
    return j.originalimage?.source || j.thumbnail?.source || null;
  } catch {
    return null;
  }
}

/* ---------------- keyless estimate engine (clearly-labelled mock) ----------------
   Deterministic from the wizard inputs so the same plan is stable.
   No fabricated "real" names: the plan is generic day slots + partner
   search links; everything is badged as an estimate downstream.    */
function generateMock(S: PlanState): any {
  const destQ = S.surprise ? "" : S.dest;
  const match = destQ ? searchDestinations(destQ, 1)[0] : undefined;
  const surprisePick = searchDestinations("b", 20).find((d) => d.tags.includes("trending"));
  const place = match || (S.surprise ? surprisePick : undefined);
  const name = place ? place.city : destQ || "Your trip";
  const country = place ? place.country : "";
  const days = Math.max(1, S.days || 1);
  const nights = Math.max(1, days - 1);

  const seedStr = name + S.tier + days;
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  const tierMul =
    S.tier === "Luxury" ? 3 : S.tier === "Premium" ? 1.9 : S.tier === "Comfort" ? 1.25 : 1;
  const pax = Math.max(1, (S.adults || 0) + (S.children || 0));
  const flightPer = Math.round((70 + (h % 220)) * (S.tripType === "round" ? 1.8 : 1));
  const hotelNight = Math.round((45 + (h % 110)) * tierMul);

  const dayList = Array.from({ length: days }, (_, i) => {
    const d = S.depart ? new Date(S.depart) : new Date(Date.now() + 14 * 86400e3);
    d.setDate(d.getDate() + i);
    return {
      day: "Day " + (i + 1),
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      city: name,
      items: [] as any[],
    };
  });

  return {
    name,
    country,
    origin: S.origin,
    currency: "EUR",
    timezone: "auto",
    bestTime: "",
    weather: "",
    transport: "",
    budgetEUR: S.budgetTotal,
    flights: {
      estEUR: flightPer * pax,
      note: `${S.tripType === "round" ? "Round trip" : "One-way"} · estimate for ${pax} traveler${pax !== 1 ? "s" : ""}`,
      outDate: dayList[0]?.date || "",
      backDate: dayList[dayList.length - 1]?.date || "",
    },
    tips: [
      "Prices shown are estimates — tap any Book button for live partner prices.",
      "Mid-week departures are usually cheaper than weekends.",
      "This is a smart estimate — live AI planning fills in a fully personalised day-by-day plan.",
    ],
    packing: [
      { group: "Essentials", items: ["Passport & visa docs", "Universal power adapter", "Travel insurance card"] },
      { group: "Clothing", items: ["Comfortable walking shoes", `Layers (${days} days)`] },
      { group: "Tech", items: ["Phone + charger", "Portable battery"] },
    ],
    days: dayList,
    hotels: [
      {
        city: name,
        name: `Stay in ${name}`,
        area: "City Center",
        nights,
        priceEUR: hotelNight,
        why: "estimated from your tier",
      },
    ],
    __mock: true,
  };
}

/* ---------------- build a Trip object from generated data ---------------- */
const catIcon = (cat?: string) =>
  ({ Sights: "view", Food: "food", Views: "view", Shopping: "view", Transport: "transport", Hotel: "hotel" } as Record<string, string>)[cat || ""] || "view";

export async function buildTrip(
  data: any,
  S: PlanState,
  setProgress?: (t: string) => void
): Promise<Trip> {
  setProgress?.("Locating " + (data.name || "destination") + "…");
  const centre =
    (await geocode((data.name || "") + " " + (data.country || ""))) ||
    (await geocode(data.country || data.name || "")) || { lat: 48.8566, lon: 2.3522 };

  const cities: string[] = [...new Set((data.days || []).map((d: any) => d.city).filter(Boolean))] as string[];
  const cityLL: Record<string, { lat: number; lon: number }> = {};
  const cityImg: Record<string, string | null> = {};
  for (const c of cities.slice(0, 6)) {
    setProgress?.("Mapping " + c + "…");
    const g = await geocode(c + " " + (data.country || ""));
    if (g) cityLL[c] = g;
    await sleep(600);
  }

  setProgress?.("Finding photos…");
  const curated = searchDestinations(data.name || "", 1)[0];
  const heroImg =
    (await wikiImage(data.name)) ||
    (await wikiImage(cities[0])) ||
    (await wikiImage(data.country)) ||
    (curated ? photoURL(curated, 800) : null);
  await Promise.all(
    cities.map(async (c) => {
      cityImg[c] = (await wikiImage(c + " " + (data.country || ""))) || (await wikiImage(c));
    })
  );

  const itin: ItineraryDay[] = (data.days || []).map((d: any) => {
    const base = cityLL[d.city] || centre;
    return {
      day: d.day,
      date: d.date,
      city: d.city,
      img: cityImg[d.city] || null,
      items: (d.items || [])
        .map((it: any, k: number) => ({
          time: it.time || "10:00",
          t: it.t,
          note: it.note || "",
          icon: catIcon(it.cat),
          cat: it.cat || "Sights",
          ll: [
            base.lat + (k - 1) * 0.004 + (Math.random() - 0.5) * 0.002,
            base.lon + (k - 1) * 0.005 + (Math.random() - 0.5) * 0.002,
          ] as [number, number],
        }))
        .sort((a: any, b: any) => (a.time || "").localeCompare(b.time || "")),
    };
  });

  const tripId = "t" + Date.now();

  /* hotels — respect the pet rule: with pets, only pet-friendly stays */
  let hotels = (data.hotels || []).map((hh: any) => ({
    city: hh.city,
    name: hh.name,
    area: hh.area || "",
    nights: hh.nights || 1,
    priceEUR: Math.round(hh.priceEUR || 90),
    why: hh.why || "",
    img: cityImg[hh.city] || null,
    link: affiliateService.hotelUrl((hh.city || "") + " " + (data.country || "")),
  }));
  if (data.__mock) {
    // keyless path: pull labelled estimates from hotelService (applies pet/family rules)
    const hs = await hotelService.search({
      city: data.name,
      nights: Math.max(1, (data.days || []).length - 1),
      pets: S.pets === "yes",
      children: S.children > 0,
      tier: S.tier,
      tripId,
    });
    if (hs.data && hs.data.length) {
      hotels = hs.data.slice(0, 3).map((hh) => ({
        city: data.name,
        name: hh.name,
        area: hh.area,
        nights: hh.nights,
        priceEUR: hh.priceEUR,
        why: hh.petFriendly && S.pets === "yes" ? "pet-friendly" : hh.freeCancellation ? "free cancellation" : "",
        img: null,
        link: hh.link,
      }));
    }
  }

  const f = data.flights || {};
  const flights = {
    estEUR: Math.round(f.estEUR || 300),
    note: f.note || "",
    outDate: f.outDate || "",
    backDate: f.backDate || "",
    origin: data.origin || S.origin || "",
    link: affiliateService.flightUrl(data.origin || S.origin || "", cities[0] || data.name || ""),
  };

  const startDate = S.depart
    ? new Date(S.depart)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d;
      })();

  return {
    id: tripId,
    name: data.name || "Trip",
    country: data.country || "",
    currency: (data.currency || "EUR").toUpperCase(),
    tz: data.timezone || "auto",
    lat: centre.lat,
    lon: centre.lon,
    hero: heroImg || null,
    date: startDate.toISOString().slice(0, 10),
    days: itin.length,
    budget: S.budgetTotal || Math.round(data.budgetEUR || 1200),
    bestTime: data.bestTime || "",
    weather: data.weather || "",
    transport: data.transport || "",
    tips: data.tips || [],
    flights,
    hotels,
    itin,
    visa: data.visa || undefined,
    packing: (data.packing || []).map((g: any) => ({
      g: g.group,
      items: (g.items || []).map((t: string) => ({ t, e: "•", d: 0 as const })),
    })),
    createdAt: Date.now(),
    mock: !!data.__mock,
  };
}

/** Full pipeline. Uses AI when available, else the labelled estimate engine. */
export async function generateTrip(
  S: PlanState,
  opts: { withActivities?: boolean } = {},
  setProgress?: (t: string) => void,
  onAgentEvent?: OnEvent
): Promise<Trip> {
  const hasAI = await aiService.available();
  let data: any;
  if (hasAI) {
    setProgress?.("Coordinating AI agents…");
    // geocode up front so the weather agent can pull a REAL forecast
    const geo = S.surprise ? null : await geocode(S.dest);
    data = await orchestrate(
      S,
      { withActivities: opts.withActivities },
      onAgentEvent || (() => {}),
      geo
    );
  } else {
    setProgress?.("Building a labelled estimate plan…");
    data = generateMock(S);
  }
  return buildTrip(data, S, setProgress);
}
