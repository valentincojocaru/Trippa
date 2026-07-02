"use client";

/* Resolve a trip from a route param. "active" → the active trip.
   Returns null until mounted (SSR-safe), then the trip or undefined. */

import { useEffect, useState } from "react";
import { tripService } from "./services/userService";
import { useStoreVersion } from "./store";
import type { Trip } from "./types";

export function useTrip(id: string): { trip: Trip | null; mounted: boolean } {
  const [mounted, setMounted] = useState(false);
  useStoreVersion();
  useEffect(() => setMounted(true), []);
  if (!mounted) return { trip: null, mounted: false };
  const trip = id === "active" ? tripService.active() : tripService.byId(id) || tripService.active();
  return { trip, mounted: true };
}
