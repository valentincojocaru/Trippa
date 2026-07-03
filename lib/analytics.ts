"use client";

/* ============================================================
   Product analytics — thin wrapper over Vercel Analytics.
   Privacy-friendly (no cookies, no cross-site tracking); events
   no-op silently when the app isn't deployed on Vercel.
   Key funnel events:
     wizard_generate  → user asked the AI for a plan
     trip_generated   → a plan landed (mock vs real AI)
     book_click       → handoff to a booking partner (the money event)
   ============================================================ */

import { track as vercelTrack } from "@vercel/analytics";

export function track(
  event: string,
  props?: Record<string, string | number | boolean | null>
) {
  try {
    vercelTrack(event, props);
  } catch {
    /* not on Vercel / blocked — analytics must never break the app */
  }
}
