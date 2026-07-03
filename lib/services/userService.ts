/* ============================================================
   Trippa — userService + tripService + notificationService
   User/session + trip CRUD + reminders. Supabase when connected,
   localStorage fallback otherwise — same API either way.
   ============================================================ */

import { store } from "@/lib/store";
import { supabaseClient } from "./supabaseClient";
import type { Trip } from "@/lib/types";

export const userService = {
  id(): string {
    const s = store.get<{ id?: string } | null>("profile", null);
    return (s && s.id) || "anon";
  },
  profile(): { id?: string; email?: string; name?: string } | null {
    return store.get("profile", null);
  },
  signedIn(): boolean {
    try {
      return !!JSON.parse(window.localStorage.getItem("trippa.session") || "null");
    } catch {
      return false;
    }
  },
  async signIn(email: string, pw: string) {
    const j = await supabaseClient.signIn(email, pw);
    store.set("profile", { id: j.user?.id || email, email });
    return j;
  },
  async signUp(email: string, pw: string, name?: string) {
    const j = await supabaseClient.signUp(email, pw);
    store.set("profile", { id: j.user?.id || email, email, name });
    return j;
  },
  signOut() {
    supabaseClient.signOut();
    store.remove("profile");
  },
  /** guest mode — used when Supabase is not configured */
  continueAsGuest(name?: string) {
    store.set("profile", { id: "guest", name: name || "Traveler", guest: true });
  },
};

export const tripService = {
  all(): Trip[] {
    return store.get<Trip[]>("trips", []);
  },
  byId(id: string): Trip | null {
    return this.all().find((t) => t.id === id) || null;
  },
  active(): Trip | null {
    const id = store.get<string | null>("activeTripId", null);
    const a = this.all();
    return a.find((t) => t.id === id) || a[0] || null;
  },
  save(trip: Trip): Trip {
    const a = this.all();
    const i = a.findIndex((t) => t.id === trip.id);
    if (i >= 0) a[i] = trip;
    else a.unshift(trip);
    store.set("trips", a);
    store.set("activeTripId", trip.id);
    if (supabaseClient.enabled()) {
      try {
        supabaseClient.insert("trips", {
          id: trip.id,
          user_id: userService.id() === "anon" ? null : userService.id(),
          name: trip.name,
          country: trip.country,
          origin_iata: trip.flights?.origin || null,
          start_date: trip.date || null,
          days: trip.days,
          budget: trip.budget,
          currency: trip.currency,
          data: trip,
        });
      } catch {}
    }
    return trip;
  },
  remove(id: string) {
    store.set("trips", this.all().filter((t) => t.id !== id));
    if (store.get("activeTripId", null) === id) {
      const rest = this.all();
      store.set("activeTripId", rest[0] ? rest[0].id : null);
      if (!rest.length) store.set("activeTrip", null);
    }
  },
  /** Activate a trip across the whole app (mirrors the reference activate()). */
  activate(trip: Trip) {
    store.set("activeTrip", {
      name: trip.name,
      country: trip.country,
      lat: trip.lat,
      lon: trip.lon,
      currency: trip.currency,
      tz: trip.tz,
      budget: trip.budget,
      date: trip.date,
      days: trip.days,
    });
    store.set("itin", trip.itin || []);
    store.set("flights", trip.flights || null);
    store.set("hotels", trip.hotels || []);
    store.set("hero", trip.hero || null);
    if (trip.packing && trip.packing.length) store.set("packing", trip.packing);
    // budget/expenses are per-trip (trippa.budget.<id> / trippa.expenses.<id>)
    // and read through lib/tripBudget.ts — nothing global to overwrite here
    if (trip.date) store.set("tripDate", trip.date);
    store.set("chat", [
      {
        r: "ai",
        t: `Hi! 👋 I'm your Trippa concierge for ${trip.name}. Ask me anything — today's plan, food nearby, hidden gems, getting around…`,
      },
    ]);
    store.set("activeTripId", trip.id);
  },
};
