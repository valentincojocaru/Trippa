/* ============================================================
   Trippa — shared TypeScript data models
   Mirrors supabase/schema.sql and the reference-app data shapes.
   ============================================================ */

export type Place = {
  city: string;
  country: string;
  flag: string;
  iata: string;
  type: "city" | "island" | "beach" | "mountain" | "ski" | "park" | "place";
  tags: string[];
  /** curated Unsplash photo id (fast path) */
  ph?: string;
  photo?: string;
};

export type Traveler = {
  kind: "adult" | "child" | "infant" | "senior" | "pet";
  age?: number;
  petType?: "Dog" | "Cat" | "Other";
};

export type FlightOption = {
  airline: string;
  originIata: string;
  destIata: string;
  depart: string;
  arrive: string;
  durationMin: number;
  stops: number;
  cabin: string;
  baggageIncluded: boolean;
  priceEUR: number;
  perPax: number;
  deal: boolean;
  link: string;
};

export type HotelOption = {
  name: string;
  area: string;
  city: string;
  rating: number;
  reviews: number;
  priceEUR: number;
  nights: number;
  petFriendly: boolean;
  familyFriendly: boolean;
  freeCancellation: boolean;
  breakfast: boolean;
  deal: boolean;
  img: string;
  link: string;
};

export type ItineraryItem = {
  time: string;
  t: string;
  note?: string;
  cat?: string;
  icon?: string;
  ll?: [number, number];
};

export type ItineraryDay = {
  day: string;
  date: string;
  city: string;
  img?: string | null;
  items: ItineraryItem[];
};

export type TripHotel = {
  city: string;
  name: string;
  area: string;
  nights: number;
  priceEUR: number;
  why: string;
  img?: string | null;
  link: string;
};

export type TripFlights = {
  estEUR: number;
  note: string;
  outDate: string;
  backDate: string;
  origin: string;
  link: string;
};

export type PackingGroup = {
  g: string;
  items: { t: string; e: string; d: 0 | 1 }[];
};

export type Trip = {
  id: string;
  name: string;
  country: string;
  currency: string;
  tz: string;
  lat: number;
  lon: number;
  hero?: string | null;
  date?: string;
  days: number;
  budget: number;
  bestTime?: string;
  weather?: string;
  transport?: string;
  tips?: string[];
  flights?: TripFlights | null;
  hotels: TripHotel[];
  itin: ItineraryDay[];
  packing: PackingGroup[];
  createdAt: number;
  /** true when the plan was produced by the keyless estimate engine */
  mock?: boolean;
};

/* Wizard state — drives the planner and gates Generate */
export type PlanState = {
  origin: string;
  dest: string;
  tripType: "round" | "oneway";
  surprise: boolean;
  depart: string;
  ret: string;
  flex: "exact" | "p3" | "p7";
  days: number;
  adults: number;
  children: number;
  infants: number;
  seniors: number;
  childAges: string[];
  pets: "no" | "yes";
  petType: "Dog" | "Cat" | "Other";
  petCount: number;
  bags: { personal: boolean; cabin: boolean; checked: boolean };
  bagsPer: number;
  sports: boolean;
  oversized: boolean;
  budgetTotal: number;
  perPerson: boolean;
  tier: "Budget" | "Comfort" | "Premium" | "Luxury";
  interests: string[];
};

export const PLAN_DEFAULTS: PlanState = {
  origin: "",
  dest: "",
  tripType: "round",
  surprise: false,
  depart: "",
  ret: "",
  flex: "exact",
  days: 7,
  adults: 2,
  children: 0,
  infants: 0,
  seniors: 0,
  childAges: [],
  pets: "no",
  petType: "Dog",
  petCount: 1,
  bags: { personal: true, cabin: true, checked: false },
  bagsPer: 1,
  sports: false,
  oversized: false,
  budgetTotal: 2000,
  perPerson: false,
  tier: "Comfort",
  interests: [],
};

/* Every service method returns this envelope so the UI can badge estimates. */
export type ServiceResult<T> = {
  data: T;
  meta: {
    provider: string;
    mock: boolean;
    at: number;
    live?: boolean;
    source?: string;
    needs?: string;
    message?: string;
    error?: string;
    fellBack?: boolean;
  };
  rate?: number | null;
};

export type Expense = {
  t: string;
  cat: string;
  eur: number;
  note?: string;
  day?: number;
};

export type WalletDoc = {
  type: string;
  label?: string;
  number?: string;
  expiry?: string;
  img?: string;
};

export type Ticket = {
  kind: string;
  from?: string;
  to?: string;
  fromName?: string;
  toName?: string;
  date?: string;
  time?: string;
  seat?: string;
  gate?: string;
  ref?: string;
};

export type JournalEntry = {
  id: string;
  t: number;
  title: string;
  place: string;
  note: string;
  img: string;
};

export type Favorite = { name: string; city: string; tag: string };

export type ChatMsg = { r: "ai" | "me"; t: string };

export type CustomReminder = {
  title: string;
  body?: string;
  time?: string;
  done: boolean;
};
