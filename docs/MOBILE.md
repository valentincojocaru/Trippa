# Trippa as a native mobile app (Capacitor)

One codebase. The **same** Next.js/React app you run on the web is compiled to a
**static bundle** and wrapped by Capacitor into native **Android** (`android/`) and
**iOS** (`ios/`) apps. Nothing is rebuilt in React Native, and no pages or components
are duplicated.

```
app/  ──(MOBILE_BUILD=1 next build)──▶  out/  ──(cap sync)──▶  Android / iOS app
```

The app is **fully self-contained** — it does **not** need the website to be deployed.
The whole UI renders on the client from on-device `localStorage`, so the bundled static
shell + client-side routing cover every screen offline.

## Build an APK you can install on your phone

Prerequisites: **Android Studio** (with an SDK + a device/emulator). One time:

```bash
npm install                       # deps incl. Capacitor core, android/ios, plugins
```

Then, whenever you want a fresh build:

```bash
npm run mobile:build              # static export → ./out, then cap sync into android/ios
npm run mobile:android            # opens Android Studio
```

In Android Studio: **Run ▶** onto your device, or **Build → Build APK(s)** and install the
generated `app-debug.apk`. That's it — Trippa runs as a real native app.

> `npm run mobile:build` runs `scripts/mobile-build.mjs`, which sets `MOBILE_BUILD=1`
> (flips `next.config.mjs` to `output: "export"`), builds `./out`, and runs `cap sync`.
> The server-only `app/api/ai` route is excluded from the static export automatically
> (and restored right after) — on mobile the AI layer calls providers directly with the
> key you enter in **Settings**, which stays on the device.

## App icon & splash screen

Brand source images live in `assets/` (`icon.png`, `splash.png`, `splash-dark.png`).
Generate the native icon/splash sets (needs `sharp`, so run it locally):

```bash
npm i -D @capacitor/assets
npm run mobile:assets             # writes android/ + ios/ icon & splash resources
npx cap sync
```

The launch splash background and status bar are brand blue (`#2563eb`), configured in
`capacitor.config.ts`.

## What makes it feel native

Wired in `components/MobileInit.tsx` (all no-ops on the web):

- **Splash screen** shown on launch, hidden once React paints.
- **Status bar** styled to match light/dark theme, sitting above the WebView (content
  starts below it — no overlap).
- **Safe-area insets** honoured throughout via `env(safe-area-inset-*)` + `viewport-fit=cover`.
- **Keyboard** resizes the view natively; a `.kb-open` class is toggled for any tweaks.
- **Android hardware back button**: goes back through history, drops to Home from a tab,
  and exits the app from Home instead of getting stuck.
- **Service worker** is skipped inside the native shell (the WebView already serves assets
  locally); it still powers offline on the web.

## iOS (structure ready)

Requires a Mac with Xcode:

```bash
npm run mobile:build
npm run mobile:ios                # opens Xcode
```

Set your Team + signing, then **Product → Archive**. The iOS project, plugins, and
`Package.swift` are already in place.

## npm scripts

| Script | Does |
| --- | --- |
| `npm run mobile:build` | Static export → `out/`, then `cap sync` into android/ios |
| `npm run mobile:sync` | `cap sync` only (after an existing `out/`) |
| `npm run mobile:android` | Open the Android project in Android Studio |
| `npm run mobile:ios` | Open the iOS project in Xcode |
| `npm run mobile:assets` | Regenerate native icons & splash from `assets/` |

## Optional: live web updates

If you later deploy the web app and want UI updates without a store resubmission, set
`TRIPPA_APP_URL` before `cap sync` to point the native shell at the remote URL instead of
the bundled `out/`. Off by default — the app ships self-contained.

```bash
TRIPPA_APP_URL=https://your-deploy.example npx cap sync
```
