import type { CapacitorConfig } from "@capacitor/cli";

/* Trippa — native wrapper for App Store / Google Play.
   The native shell loads the deployed web app (server.url), so every web
   deploy updates the mobile app instantly — no store re-submission for UI
   changes. Set TRIPPA_APP_URL before `npx cap sync`, e.g.:
     TRIPPA_APP_URL=https://trippa.vercel.app npx cap sync
   Without it the app falls back to the offline shell in mobile/www. */

const appUrl = process.env.TRIPPA_APP_URL;

const config: CapacitorConfig = {
  appId: "com.trippa.app",
  appName: "Trippa",
  webDir: "mobile/www",
  ...(appUrl
    ? { server: { url: appUrl, cleartext: false } }
    : {}),
  backgroundColor: "#FFFFFF",
  ios: { contentInset: "automatic" },
  android: { allowMixedContent: false },
};

export default config;
