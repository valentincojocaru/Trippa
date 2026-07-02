/* ============================================================
   Trippa — affiliateService
   Builds affiliate-ready deep links + logs every click locally
   (and to Supabase when connected). Trippa never processes payments;
   it always sends the user to a trusted booking partner.
   ============================================================ */

import { affiliate, isReal } from "./config";
import { supabaseClient } from "./supabaseClient";

const M = () => affiliate.travelpayoutsMarker;

export type AffiliateClick = {
  userId: string;
  ts: number;
  provider: string;
  bookingType: string;
  destination?: string;
  tripId?: string;
  marker: string;
};

function log(entry: Omit<AffiliateClick, "userId" | "ts">): AffiliateClick {
  let userId = "anon";
  try {
    const p = JSON.parse(window.localStorage.getItem("trippa.profile") || "null");
    if (p && p.id) userId = p.id;
  } catch {}
  const rec: AffiliateClick = { userId, ts: Date.now(), ...entry };
  try {
    const k = "trippa.affiliate_clicks";
    const arr = JSON.parse(window.localStorage.getItem(k) || "[]");
    arr.push(rec);
    window.localStorage.setItem(k, JSON.stringify(arr.slice(-200)));
  } catch {}
  // mirror to Supabase if available (fire-and-forget)
  if (isReal("supabase")) {
    try {
      supabaseClient.insert("affiliate_clicks", {
        user_id: rec.userId === "anon" ? null : rec.userId,
        trip_id: rec.tripId || null,
        provider: rec.provider,
        booking_type: rec.bookingType,
        destination: rec.destination || null,
        marker: rec.marker,
      });
    } catch {}
  }
  return rec;
}

export const affiliateService = {
  flight(originIata: string, destIata: string, opts: { tripId?: string } = {}) {
    log({
      provider: "aviasales",
      bookingType: "flight",
      destination: destIata,
      tripId: opts.tripId,
      marker: M(),
    });
    return (
      "https://www.aviasales.com/search?origin_iata=" +
      encodeURIComponent(originIata || "") +
      "&destination_iata=" +
      encodeURIComponent(destIata || "") +
      "&marker=" +
      M()
    );
  },
  hotel(city: string, opts: { tripId?: string } = {}) {
    log({
      provider: "hotellook",
      bookingType: "hotel",
      destination: city,
      tripId: opts.tripId,
      marker: M(),
    });
    const b = affiliate.bookingAffiliateId;
    if (b)
      return (
        "https://www.booking.com/searchresults.html?aid=" +
        b +
        "&ss=" +
        encodeURIComponent(city)
      );
    return (
      "https://search.hotellook.com/?destination=" +
      encodeURIComponent(city || "") +
      "&marker=" +
      M()
    );
  },
  activity(city: string, opts: { tripId?: string } = {}) {
    log({
      provider: "getyourguide",
      bookingType: "activity",
      destination: city,
      tripId: opts.tripId,
      marker: M(),
    });
    return (
      "https://www.getyourguide.com/s/?q=" + encodeURIComponent(city || "") + "&partner_id=" + M()
    );
  },
  insurance(opts: { tripId?: string } = {}) {
    log({ provider: "ekta", bookingType: "insurance", tripId: opts.tripId, marker: M() });
    return "https://ektatraveling.tpx.lt/?marker=" + M();
  },
  car(city: string, opts: { tripId?: string } = {}) {
    log({
      provider: "localrent",
      bookingType: "car",
      destination: city,
      tripId: opts.tripId,
      marker: M(),
    });
    return "https://localrent.com/?marker=" + M();
  },
  clicks(): AffiliateClick[] {
    try {
      return JSON.parse(window.localStorage.getItem("trippa.affiliate_clicks") || "[]");
    } catch {
      return [];
    }
  },
};
