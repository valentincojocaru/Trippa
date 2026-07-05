"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export default function SwRegister() {
  useEffect(() => {
    // In the Capacitor native shell the WebView already serves the bundled
    // assets locally — a service worker would fight it, so skip it there and
    // only register on the (production) web.
    if (Capacitor.isNativePlatform()) return;
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
