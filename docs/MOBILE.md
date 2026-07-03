# Trippa on the App Store & Google Play (Capacitor)

The repo ships with native **Android** (`android/`) and **iOS** (`ios/`) projects that
wrap the deployed web app. The native shell loads your production URL, so every web
deploy updates the mobile apps instantly — store re-submission is only needed for
native-level changes (icons, permissions, plugins).

## One-time setup

1. **Deploy the web app** (e.g. Vercel) and note the URL, e.g. `https://trippa.vercel.app`.
2. **Generate native icons & splash screens** (uses `assets/icon-only.png` + `assets/splash.png`,
   already rendered from the brand logo):
   ```bash
   npm i -D @capacitor/assets
   npx @capacitor/assets generate
   ```
3. **Point the shell at your deployment and sync:**
   ```bash
   TRIPPA_APP_URL=https://trippa.vercel.app npx cap sync
   ```

## Android (Google Play)

```bash
npm run mobile:android          # opens Android Studio
```
- Build → Generate Signed Bundle (AAB), create/upload your keystore.
- Play Console → create the app (`com.trippa.app`), upload the AAB, fill the listing
  (screenshots are in the PR history / regenerate with any device).

## iOS (App Store)

Requires a Mac with Xcode:
```bash
npm run mobile:ios              # opens Xcode
```
- Set your Team + signing in Xcode, then Product → Archive → Distribute.
- App Store Connect → create the app (`com.trippa.app`) and submit.

## Notes

- Without `TRIPPA_APP_URL`, the shell falls back to the tiny offline page in
  `mobile/www/` — set the URL before `cap sync` for real builds.
- Apple review dislikes "just a website" apps; the PWA features already on board
  (offline localStorage data, notifications, camera photo picker for wallet/journal)
  are the story to tell. Adding one or two native plugins (@capacitor/push-notifications,
  @capacitor/geolocation) further strengthens the case.
- The PWA remains installable directly from the browser, independent of the stores.
