"use client";

/* ============================================================
   Native runtime wiring for the Capacitor shell. No-ops on the web
   (isNativePlatform() is false there), so the same code runs everywhere.

   - hides the splash screen once React has painted
   - styles the status bar to match the current light/dark theme and keeps
     it out of the WebView (content starts below it — native feel)
   - Android hardware back button: navigate back through history, and exit
     the app from a top-level screen instead of getting stuck
   - adds a `.native` class + keyboard open/close classes on <html> for
     any native-only CSS tweaks
   ============================================================ */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

// top-level tabs — pressing Android back here should exit, not loop
const ROOT_ROUTES = new Set(["/", "/trips", "/chat", "/profile"]);

export default function MobileInit() {
  const router = useRouter();
  const pathname = usePathname() || "/";

  // one-time native setup
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cleanups: Array<() => void> = [];

    (async () => {
      document.documentElement.classList.add("native");

      // Splash: hide once we're mounted and painted.
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        requestAnimationFrame(() => setTimeout(() => SplashScreen.hide().catch(() => {}), 120));
      } catch {}

      // Status bar: not overlaying, colour follows the theme.
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
        const applyBar = () => {
          const dark = document.documentElement.getAttribute("data-theme") === "dark";
          StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
          StatusBar.setBackgroundColor({ color: dark ? "#0b1220" : "#2563eb" }).catch(() => {});
        };
        applyBar();
        // ThemeApplier flips data-theme on <html>; mirror it onto the bar.
        const obs = new MutationObserver(applyBar);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        cleanups.push(() => obs.disconnect());
      } catch {}

      // Keyboard: toggle a class so layouts can react if needed.
      try {
        const { Keyboard } = await import("@capacitor/keyboard");
        const onShow = await Keyboard.addListener("keyboardWillShow", () =>
          document.documentElement.classList.add("kb-open")
        );
        const onHide = await Keyboard.addListener("keyboardWillHide", () =>
          document.documentElement.classList.remove("kb-open")
        );
        cleanups.push(() => {
          onShow.remove();
          onHide.remove();
        });
      } catch {}
    })();

    return () => cleanups.forEach((c) => c());
  }, []);

  // Android hardware back button — re-bound as the route changes so it always
  // knows whether the current screen is a top-level tab.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => void } | null = null;
    let active = true;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const h = await App.addListener("backButton", ({ canGoBack }) => {
          if (!ROOT_ROUTES.has(pathname) && (canGoBack || window.history.length > 1)) {
            router.back();
          } else if (ROOT_ROUTES.has(pathname) && pathname !== "/") {
            router.push("/"); // from a tab → Home first
          } else {
            App.exitApp();
          }
        });
        if (active) handle = h;
        else h.remove();
      } catch {}
    })();

    return () => {
      active = false;
      handle?.remove();
    };
  }, [pathname, router]);

  return null;
}
