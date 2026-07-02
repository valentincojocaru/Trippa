/* ============================================================
   Trippa — hotelService
   search({city, nights, pax, pets, children, tier}) → hotels
   MOCK: clearly-labelled estimates. REAL: Hotellook/Booking when keyed.
   RULES enforced here:
     - pets selected      → only pet-friendly results
     - children selected  → family-friendly sorted first
   Prices are AI estimates (meta.mock); Book links go to partners.
   ============================================================ */

import { wrap } from "./config";
import { affiliateService } from "./affiliateService";
import type { HotelOption, ServiceResult } from "@/lib/types";

export type HotelQuery = {
  city?: string;
  nights?: number;
  pax?: number;
  pets?: boolean;
  children?: boolean;
  tier?: string;
  tripId?: string;
};

function seeded(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

const NAMES = [
  "The Hartwell",
  "Casa Lumina",
  "Nord Boutique",
  "Marisol Suites",
  "Old Town Residence",
  "Park & Vine",
  "Azure Bay Hotel",
  "The Greenhouse",
  "Maison Clara",
  "Riva Loft",
];
const AREAS = ["City Center", "Old Town", "Waterfront", "Arts District", "Near the station"];

function mockSearch(q: HotelQuery): HotelOption[] {
  const tierMul =
    q.tier === "Luxury" ? 3 : q.tier === "Premium" ? 1.9 : q.tier === "Comfort" ? 1.25 : 1;
  let out: HotelOption[] = [];
  for (let i = 0; i < 6; i++) {
    const s = seeded((q.city || "") + i);
    const petOk = s % 3 !== 0 || !!q.pets; // ensure pet rows exist when needed
    const familyOk = s % 2 === 0;
    const base = 45 + (s % 120);
    out.push({
      name: NAMES[s % NAMES.length],
      area: AREAS[(s >> 3) % AREAS.length],
      city: q.city || "",
      rating: (78 + (s % 20)) / 10, // 7.8–9.8
      reviews: 120 + (s % 1800),
      priceEUR: Math.round(base * tierMul),
      nights: q.nights || 1,
      petFriendly: petOk,
      familyFriendly: familyOk,
      freeCancellation: s % 2 === 0,
      breakfast: s % 3 === 0,
      deal: i === 1,
      img: "", // UI fills with a real photo at render
      link: affiliateService.hotelUrl(q.city || ""),
    });
  }
  if (q.pets) out = out.filter((h) => h.petFriendly);
  if (q.children)
    out.sort((a, b) => Number(b.familyFriendly) - Number(a.familyFriendly));
  else out.sort((a, b) => a.priceEUR - b.priceEUR);
  return out;
}

export const hotelService = {
  async search(q: HotelQuery = {}): Promise<ServiceResult<HotelOption[] | null>> {
    if (!q.city) return wrap("hotels", null, { needs: "destination" });
    return wrap("hotels", mockSearch(q));
  },
};
