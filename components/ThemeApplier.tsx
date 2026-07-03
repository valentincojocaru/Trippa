"use client";

/* Applies the theme (Auto / Light / Dark) to <html data-theme>.
   Stored in trippa.theme; Auto follows the system preference live. */

import { useEffect } from "react";
import { store, useStoreVersion } from "@/lib/store";

export type Theme = "auto" | "light" | "dark";

export function getTheme(): Theme {
  const t = store.get<Theme>("theme", "auto");
  return t === "light" || t === "dark" ? t : "auto";
}

export function setTheme(t: Theme) {
  store.set("theme", t);
}

export default function ThemeApplier() {
  useStoreVersion();
  const theme = getTheme();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "auto" && mq.matches);
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  return null;
}
