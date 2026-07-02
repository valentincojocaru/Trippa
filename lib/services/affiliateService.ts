/* ============================================================
   Trippa — affiliateService
   Builds affiliate-ready deep links; clicks are logged ONLY when
   the user actually hands off to a partner (call logClick from the
   Book button's onClick), never while constructing URLs — so
   affiliate_clicks reflects real conversions. Trippa never
   processes payments; it always sends the user to a trusted
   booking partner.
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

export const affiliateService = {
  /* ---- URL builders (no side effects) ---- */
  flightUrl(originIata: string, destIata: string) {
    return (
      "https://www.aviasales.com/search?origin_iata=" +
      encodeURIComponent(originIata || "") +
      "&destination_iata=" +
      encodeURIComponent(destIata || "") +
      "&marker=" +
      M()
    );
  },
  hotelUrl(city: string) {
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
  activityUrl(city: string) {
    return (
      "https://www.getyourguide.com/s/?q=" + encodeURIComponent(city || "") + "&partner_id=" + M()
    );
  },
  insuranceUrl() {
    return "https://ektatraveling.tpx.lt/?marker=" + M();
  },
  carUrl() {
    return "https://localrent.com/?marker=" + M();
  },

  /* ---- click logging (call on the actual user handoff) ---- */
  logClick(entry: { provider: string; bookingType: string; destination?: string; tripId?: string }): AffiliateClick {
    let userId = "anon";
    try {
      const p = JSON.parse(window.localStorage.getItem("trippa.profile") || "null");
      if (p && p.id) userId = p.id;
    } catch {}
    const rec: AffiliateClick = { userId, ts: Date.now(), marker: M(), ...entry };
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
  },

  clicks(): AffiliateClick[] {
    try {
      return JSON.parse(window.localStorage.getItem("trippa.affiliate_clicks") || "[]");
    } catch {
      return [];
    }
  },
};
