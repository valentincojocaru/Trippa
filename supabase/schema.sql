-- ============================================================
--  Trippa — Supabase schema
--  Run in Supabase Studio → SQL editor. Enables RLS so each user
--  only sees their own rows. Auth uses Supabase's built-in
--  auth.users; everything below references auth.uid().
-- ============================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  home_city text,
  home_airport text,
  currency text default 'EUR',
  created_at timestamptz default now()
);

-- ---------- trips ----------
create table if not exists public.trips (
  id text primary key,
  user_id uuid not null references auth.users on delete cascade,
  name text,
  country text,
  origin_iata text,
  dest_iata text,
  start_date date,
  end_date date,
  days int,
  budget numeric,
  currency text default 'EUR',
  data jsonb,                       -- full trip object (itinerary, hotels, flights…)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- travelers ----------
create table if not exists public.travelers (
  id bigint generated always as identity primary key,
  trip_id text references public.trips on delete cascade,
  kind text,                        -- adult | child | infant | senior | pet
  age int,
  pet_type text
);

-- ---------- flights ----------
create table if not exists public.flights (
  id bigint generated always as identity primary key,
  trip_id text references public.trips on delete cascade,
  airline text, origin_iata text, dest_iata text,
  depart timestamptz, arrive timestamptz,
  stops int, cabin text, price numeric, currency text,
  baggage_included boolean, deep_link text
);

-- ---------- hotels ----------
create table if not exists public.hotels (
  id bigint generated always as identity primary key,
  trip_id text references public.trips on delete cascade,
  name text, area text, rating numeric, reviews int,
  price_per_night numeric, currency text,
  pet_friendly boolean, family_friendly boolean,
  free_cancellation boolean, breakfast boolean, deep_link text
);

-- ---------- itinerary_items ----------
create table if not exists public.itinerary_items (
  id bigint generated always as identity primary key,
  trip_id text references public.trips on delete cascade,
  day int, time text, title text, note text, category text, lat numeric, lon numeric
);

-- ---------- expenses ----------
create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  trip_id text references public.trips on delete cascade,
  user_id uuid references auth.users on delete cascade,
  label text, amount numeric, currency text, category text,
  paid_by text, created_at timestamptz default now()
);

-- ---------- packing_items ----------
create table if not exists public.packing_items (
  id bigint generated always as identity primary key,
  trip_id text references public.trips on delete cascade,
  label text, category text, packed boolean default false
);

-- ---------- favorites ----------
create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  name text, city text, tag text, created_at timestamptz default now()
);

-- ---------- saved_searches ----------
create table if not exists public.saved_searches (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  query jsonb, created_at timestamptz default now()
);

-- ---------- affiliate_clicks ----------
create table if not exists public.affiliate_clicks (
  id bigint generated always as identity primary key,
  user_id uuid,
  trip_id text,
  provider text, booking_type text, destination text,
  marker text, ts timestamptz default now()
);

-- ============================================================
--  Row Level Security
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.trips           enable row level security;
alter table public.travelers       enable row level security;
alter table public.flights         enable row level security;
alter table public.hotels          enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.expenses        enable row level security;
alter table public.packing_items   enable row level security;
alter table public.favorites       enable row level security;
alter table public.saved_searches  enable row level security;
alter table public.affiliate_clicks enable row level security;

-- profiles: each user manages their own row
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- trips: owner-only
create policy "own trips" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- child tables: access if the parent trip belongs to the user
create policy "own trip children" on public.travelers
  for all using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));
create policy "own flight rows" on public.flights
  for all using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));
create policy "own hotel rows" on public.hotels
  for all using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));
create policy "own itinerary rows" on public.itinerary_items
  for all using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));
create policy "own packing rows" on public.packing_items
  for all using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));

-- user-scoped tables
create policy "own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own saved searches" on public.saved_searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own clicks" on public.affiliate_clicks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
