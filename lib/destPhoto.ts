"use client";

/* ============================================================
   Real destination photos — every vacation/country gets a real
   image of the actual place:
     1) curated Unsplash id (fast path, ~30 hero destinations)
     2) Wikipedia REST thumbnail of the city/country page —
        real, keyless, available for every destination; cached
        in localStorage so it loads once per device
     3) flag-gradient tile while loading / offline (never a
        random stock photo of somewhere else)
   ============================================================ */

import { useEffect, useState } from "react";
import type { Place } from "./types";

const CACHE_PREFIX = "trippa.destimg.";
const pending = new Map<string, Promise<string | null>>();

function cacheGet(key: string): string | null {
  try {
    return window.localStorage.getItem(CACHE_PREFIX + key);
  } catch {
    return null;
  }
}
function cacheSet(key: string, url: string) {
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, url);
  } catch {}
}

async function wikiThumb(title: string): Promise<string | null> {
  try {
    const r = await fetch(
      "https://en.wikipedia.org/api/rest_v1/page/summary/" +
        encodeURIComponent(title.replace(/\s+/g, "_"))
    );
    if (!r.ok) return null;
    const j = await r.json();
    return j.thumbnail?.source || j.originalimage?.source || null;
  } catch {
    return null;
  }
}

/** Resolve a real photo URL for a destination (may hit the network once). */
export async function resolveDestPhoto(d: Place, size = 300): Promise<string | null> {
  if (d.ph)
    return `https://images.unsplash.com/photo-${d.ph}?w=${size}&h=${size}&fit=crop&q=70`;
  const key = d.city.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return cached;
  if (!pending.has(key)) {
    pending.set(
      key,
      (async () => {
        // the city page first, then "City, Country", then the country page
        const url =
          (await wikiThumb(d.city)) ||
          (await wikiThumb(`${d.city}, ${d.country}`)) ||
          (await wikiThumb(d.country));
        if (url) cacheSet(key, url);
        pending.delete(key);
        return url;
      })()
    );
  }
  return pending.get(key)!;
}

/** React hook: real photo URL for any city/country, null while resolving. */
export function usePlacePhoto(city: string, country = "", ph?: string, size = 300): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (ph) return `https://images.unsplash.com/photo-${ph}?w=${size}&h=${size}&fit=crop&q=70`;
    if (typeof window !== "undefined" && city) return cacheGet(city.toLowerCase());
    return null;
  });
  useEffect(() => {
    let alive = true;
    if (!url && city) {
      resolveDestPhoto(
        { city, country, flag: "", iata: "", type: "place", tags: [], ph } as Place,
        size
      ).then((u) => alive && u && setUrl(u));
    }
    return () => {
      alive = false;
    };
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps
  return url;
}

/** React hook: real photo URL for a destination, null while resolving. */
export function useDestPhoto(d: Place, size = 300): string | null {
  return usePlacePhoto(d.city, d.country, d.ph, size);
}

/* flag-gradient placeholder colors, deterministic per city */
export function flagTileGradient(d: Place): string {
  let h = 0;
  for (let i = 0; i < d.city.length; i++) h = (h * 31 + d.city.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(160deg, hsl(${hue} 42% 38%), hsl(${(hue + 40) % 360} 48% 22%))`;
}
