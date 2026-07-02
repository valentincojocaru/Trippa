"use client";

/* ============================================================
   Trippa — client store
   localStorage under `trippa.*` keys (offline cache, same keys as
   the reference PWA) with a subscription so React screens re-render
   when trip data changes anywhere in the app.
   ============================================================ */

import { useSyncExternalStore, useCallback } from "react";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const store = {
  get<T>(key: string, def: T): T {
    if (typeof window === "undefined") return def;
    try {
      const v = JSON.parse(window.localStorage.getItem("trippa." + key) as string);
      return v == null ? def : (v as T);
    } catch {
      return def;
    }
  },
  set(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("trippa." + key, JSON.stringify(value));
    } catch {
      /* quota / private mode — app keeps working in memory */
    }
    emit();
  },
  remove(key: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem("trippa." + key);
    } catch {}
    emit();
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

/** React hook: read a `trippa.*` key and re-render whenever any store key changes. */
export function useStore<T>(key: string, def: T): [T, (v: T) => void] {
  const value = useSyncExternalStore(
    store.subscribe,
    () => JSON.stringify(store.get<T>(key, def)),
    () => JSON.stringify(def)
  );
  const set = useCallback((v: T) => store.set(key, v), [key]);
  return [JSON.parse(value) as T, set];
}

/** Re-render on any store change (for derived reads). Returns a version counter. */
let version = 0;
if (typeof window !== "undefined") {
  listeners.add(() => {
    version++;
  });
}
export function useStoreVersion(): number {
  return useSyncExternalStore(
    store.subscribe,
    () => version,
    () => 0
  );
}
