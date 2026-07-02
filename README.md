# Trippa — AI Travel Concierge

Mobile-first AI travel platform: an AI trip planner (wizard), day-by-day itinerary,
hotels comparison, live map, weather, budget/expenses, packing, reminders,
wallet/tickets/journal, and an AI concierge chat. Built with **Next.js 14 (App
Router) · React · TypeScript · Tailwind CSS · Supabase · PWA**, recreated from the
KodeFlow reference PWA per `HANDOFF-CLAUDE-CODE.md` / `ARCHITECTURE.md`.

## Run

```bash
npm install
cp .env.example .env.local   # fill what you have; blanks stay in labelled mock mode
npm run dev                  # → http://localhost:3000
npm run build                # production build
```

Run `supabase/schema.sql` in the Supabase SQL editor to create all tables with RLS
(profiles, trips, travelers, flights, hotels, itinerary_items, expenses,
packing_items, favorites, saved_searches, affiliate_clicks).

## Architecture

- **`lib/services/*.ts`** — the provider-agnostic service layer. Every method
  returns `{ data, meta: { provider, mock } }` so the UI can badge estimates.
  A provider is *real* only when all its required keys resolve
  (`config.ts → REQUIRES`); key resolution order is
  `process.env` / `NEXT_PUBLIC_*` → `localStorage['trippa.env.KEY']` (Settings) → empty.

| Service | Real provider (when keyed) | Keyless fallback |
|---|---|---|
| `destinationService` | Google Places | curated DB (`data/destinations.ts`, ~95 places) |
| `flightService` | Travelpayouts/Aviasales | labelled estimates |
| `hotelService` | Hotellook/Booking | labelled estimates (pet/family rules enforced) |
| `weatherService` | OpenWeather | Open-Meteo (real, keyless) |
| `currencyService` | exchangerate | Frankfurter/ECB (real, keyless) |
| `affiliateService` | Travelpayouts/Booking/CJ | local click log |
| `aiService` | OpenAI / Anthropic | "add a key" prompt |
| `supabaseClient` / `userService` | Supabase | localStorage |

- **State** lives in `localStorage` under `trippa.*` keys (offline cache, same keys
  as the reference PWA) with a subscription store (`lib/store.ts`); Supabase mirrors
  writes when configured.
- **AI generation** (`lib/tripGenerator.ts`): skeleton JSON first (flights + hotels),
  then activities in batches of 4 days to avoid truncation; geocoding via Nominatim
  and photos via Wikipedia (both keyless & real). Server keys run in `app/api/ai`;
  keys pasted in Settings call the provider directly from the device.
- **PWA**: `public/manifest.webmanifest` + hand-rolled service worker (`public/sw.js`,
  stale-while-revalidate; registered in production builds only).

## Non-negotiable business rules (implemented — keep them)

1. **Never guess trip info.** The planner requires departure, destination, dates,
   travelers, budget; the review checklist gates Generate.
2. **Budget is a ceiling, never overwritten.** Over-budget shows
   "over budget by €X" + cheaper alternatives; the budget is never scaled up.
3. **No hardcoded destinations.** Everything derives from the active trip; every
   screen has a real empty state.
4. **Keyless fallbacks stay usable and labelled** (`meta.mock === true` → estimate
   badges) — never silent fake data.
5. **Pets → only pet-friendly stays. Missing origin → flights refuse with
   `meta.needs:'origin'`** and ask for the departure airport.

## Notes vs. the handoff spec

- Motion uses CSS transitions/keyframes matching the specified curves
  (elastic press `cubic-bezier(.34,1.56,.64,1)`, staggered rise-in, gated behind
  `prefers-reduced-motion`) instead of adding Framer Motion as a dependency.
- Supabase is accessed through the same thin REST wrapper contract as the
  reference (`supabaseClient.ts`) rather than the SDK — swap in `@supabase/ssr`
  later without touching callers.
- Photos are Unsplash/Wikipedia at runtime — replace with a licensed image
  pipeline in production.
