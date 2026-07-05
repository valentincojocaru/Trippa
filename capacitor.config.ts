import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";
import { Style } from "@capacitor/status-bar";

/* Trippa — Capacitor native wrapper around the one Next.js/React codebase.

   The app ships fully self-contained: `npm run mobile:build` produces a static
   export in ./out (from the same app/ code) and Capacitor bundles it into the
   APK/IPA. No website or server is required for the app to run on a phone.

   The whole UI is client-rendered from on-device localStorage, so the bundled
   static shell + client SPA routing cover every screen offline.

   (If you later DO deploy the web app and want live UI updates without a store
   resubmission, set TRIPPA_APP_URL before `npx cap sync` to point the shell at
   the remote URL instead — opt-in, off by default.) */

const appUrl = process.env.TRIPPA_APP_URL;

const config: CapacitorConfig = {
  appId: "com.trippa.app",
  appName: "Trippa",
  // static export output — bundled into the native app
  webDir: "out",
  backgroundColor: "#ffffff",
  ios: { contentInset: "always" },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: false, // hidden from JS once React has mounted
      backgroundColor: "#2563eb",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: Style.Light,
      backgroundColor: "#2563eb",
    },
    Keyboard: {
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
  },
  ...(appUrl ? { server: { url: appUrl, cleartext: false } } : {}),
};

export default config;
