"use client";

/* ============================================================
   Home dashboard — greeting, search (→ planner), upcoming-trip
   hero + live countdown, weather + budget widgets, trending
   destinations, Quick Actions grid, notification bell.
   Everything derives from the active trip; real empty states
   when no trip exists (rule 3).
   ============================================================ */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Search,
  ArrowRight,
  CalendarDays,
  Map as MapIcon,
  MessageCircle,
  Building2,
  Luggage,
  Wallet as WalletIcon,
  CreditCard,
  ArrowUpDown,
  CloudSun,
  Ticket as TicketIcon,
  BookOpen,
} from "lucide-react";
import { store, useStoreVersion } from "@/lib/store";
import { trending, photoURL } from "@/data/destinations";
import { activeReminderCount } from "@/lib/reminders";
import { userService } from "@/lib/services/userService";
import { wxEmoji } from "@/lib/services/weatherService";
import type { Expense, Trip } from "@/lib/types";

function useCountdown(dateStr: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  let ms = target.getTime() - now;
  if (ms < 0) ms = 0;
  return {
    d: Math.floor(ms / 86400e3),
    h: Math.floor(ms / 3600e3) % 24,
    m: Math.floor(ms / 60e3) % 60,
    s: Math.floor(ms / 1e3) % 60,
  };
}

export default function HomePage() {
  const router = useRouter();
  useStoreVersion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // first run → onboarding
    if (!store.get("onboarded", false) && !store.get("trips", []).length) {
      router.replace("/onboarding");
    }
  }, [router]);

  const trips = store.get<Trip[]>("trips", []);
  const activeId = store.get<string | null>("activeTripId", null);
  const trip = trips.find((t) => t.id === activeId) || trips[0] || null;
  const cd = useCountdown(mounted && trip?.date ? trip.date : null);

  const budget = store.get<number>("budget", 2000);
  const expenses = store.get<Expense[]>("expenses", []);
  const spent = expenses.reduce((s, e) => s + (+e.eur || 0), 0);
  const pct = Math.min(100, Math.round((spent / (budget || 1)) * 100));
  const bellCount = mounted ? activeReminderCount() : 0;
  const name = mounted ? userService.profile()?.name || "" : "";

  const [wx, setWx] = useState<{ max: number; min: number; code: number } | null>(null);
  useEffect(() => {
    if (!mounted || !trip || trip.lat == null) return;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${trip.lat}&longitude=${trip.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=1`
    )
      .then((r) => r.json())
      .then((j) => {
        if (j?.daily)
          setWx({
            max: Math.round(j.daily.temperature_2m_max[0]),
            min: Math.round(j.daily.temperature_2m_min[0]),
            code: j.daily.weathercode[0],
          });
      })
      .catch(() => {});
  }, [mounted, trip?.lat, trip?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const qa = useMemo(
    () => [
      { t: "Itinerary", Icon: CalendarDays, bg: "linear-gradient(160deg,rgba(37,99,235,.17),rgba(37,99,235,.07))", c: "var(--accent)", href: "/trip/active/itinerary" },
      { t: "Explore", Icon: MapIcon, bg: "linear-gradient(160deg,rgba(124,92,255,.18),rgba(124,92,255,.07))", c: "var(--purple)", href: "/tools/guide" },
      { t: "AI Chat", Icon: MessageCircle, bg: "linear-gradient(160deg,rgba(37,99,235,.17),rgba(37,99,235,.07))", c: "var(--accent)", href: "/chat" },
      { t: "Hotels", Icon: Building2, bg: "linear-gradient(160deg,rgba(37,99,235,.17),rgba(37,99,235,.07))", c: "var(--blue)", href: "/trip/active/hotels" },
      { t: "Packing", Icon: Luggage, bg: "linear-gradient(160deg,rgba(202,138,4,.2),rgba(202,138,4,.08))", c: "var(--yellow)", href: "/trip/active/packing" },
      { t: "Budget", Icon: CreditCard, bg: "linear-gradient(160deg,rgba(22,163,74,.18),rgba(22,163,74,.07))", c: "var(--green)", href: "/trip/active/budget" },
      { t: "Converter", Icon: ArrowUpDown, bg: "linear-gradient(160deg,rgba(22,163,74,.18),rgba(22,163,74,.07))", c: "var(--green)", href: "/tools/currency" },
      { t: "Weather", Icon: CloudSun, bg: "linear-gradient(160deg,rgba(37,99,235,.17),rgba(37,99,235,.07))", c: "var(--blue)", href: "/tools/weather" },
      { t: "Tickets", Icon: TicketIcon, bg: "linear-gradient(160deg,rgba(37,99,235,.17),rgba(37,99,235,.07))", c: "var(--accent)", href: "/tools/tickets" },
      { t: "Wallet", Icon: WalletIcon, bg: "linear-gradient(160deg,rgba(22,163,74,.18),rgba(22,163,74,.07))", c: "var(--green)", href: "/tools/wallet" },
      { t: "Journal", Icon: BookOpen, bg: "linear-gradient(160deg,rgba(219,39,119,.18),rgba(219,39,119,.07))", c: "var(--pink)", href: "/tools/journal" },
    ],
    []
  );

  return (
    <div className="screen-body">
      {/* header */}
      <div className="flex items-center justify-between">
        <div
          className="itile glass tap"
          style={{ width: 42, height: 42, borderRadius: 13 }}
          onClick={() => router.push("/trips")}
          aria-label="My trips"
        >
          <Menu size={20} strokeWidth={2} />
        </div>
        <div className="text-[23px] font-extrabold tracking-[-0.03em]">
          Trip<span className="t-acc">pa</span>
        </div>
        <div
          className="itile glass tap relative"
          style={{ width: 42, height: 42, borderRadius: 13 }}
          onClick={() => router.push("/reminders")}
          aria-label="Reminders"
        >
          <Bell size={20} strokeWidth={2} />
          {bellCount > 0 && <span className="rm-bell-badge">{bellCount}</span>}
        </div>
      </div>

      <div className="mt-5">
        <div className="dim text-[14px]">
          {greet}
          {name ? `, ${name}` : ""} ☀️
        </div>
        <h1 className="text-[27px] mt-[3px]">Where to next?</h1>
      </div>

      {/* search → planner */}
      <div className="home-search tap" onClick={() => router.push("/plan")}>
        <Search size={19} color="#9295A0" strokeWidth={2} />
        <span>Search destinations, trips…</span>
        <span className="hs-go">
          <ArrowRight size={17} color="#fff" strokeWidth={2.4} />
        </span>
      </div>

      {/* upcoming trip hero + countdown */}
      <div className="card overflow-hidden mt-[18px]" style={{ padding: 0 }}>
        <div
          className="relative tap"
          style={{
            height: 168,
            backgroundImage: trip?.hero ? `url('${trip.hero}')` : undefined,
            backgroundColor: "#2a3550",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onClick={() => router.push(trip ? `/trip/${trip.id}` : "/plan")}
        >
          <div className="photo-cap-ov" />
          <div className="absolute left-[14px] right-[14px] bottom-3">
            <span className="chip-ico" style={{ background: "rgba(255,255,255,.92)", color: "var(--accent)" }}>
              {trip ? "Upcoming Trip" : "Trippa AI"}
            </span>
            <div className="text-[23px] font-extrabold text-white tracking-[-0.02em] mt-[9px]">
              {trip ? trip.name : "Plan your first trip"}
            </div>
            <div className="text-[12.5px]" style={{ color: "rgba(255,255,255,.86)" }}>
              {trip && trip.date
                ? new Date(trip.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) +
                  (trip.days ? ` · ${trip.days} days` : "")
                : "Tap to start with Trippa AI ✨"}
            </div>
          </div>
        </div>
        {trip && cd && (
          <div className="countdown">
            <div className="cd-cell"><b>{cd.d}</b><small>DAYS</small></div>
            <div className="cd-cell"><b>{String(cd.h).padStart(2, "0")}</b><small>HRS</small></div>
            <div className="cd-cell"><b>{String(cd.m).padStart(2, "0")}</b><small>MIN</small></div>
            <div className="cd-cell"><b>{String(cd.s).padStart(2, "0")}</b><small>SEC</small></div>
          </div>
        )}
      </div>

      {/* weather + budget widgets */}
      <div className="grid grid-cols-2 gap-3 mt-[14px]">
        <div className="card tap p-[15px]" onClick={() => router.push("/tools/weather")}>
          <div className="dim text-[12px]">Weather</div>
          <div className="flex items-center gap-2 mt-[7px]">
            <span className="text-[30px] leading-none">{wx ? wxEmoji(wx.code) : "🌍"}</span>
            <b className="text-[25px] tracking-[-0.02em]">{wx ? wx.max + "°" : "—"}</b>
          </div>
          <div className="dim text-[11.5px] mt-[7px]">
            {wx ? `H: ${wx.max}°  L: ${wx.min}°` : "Plan a trip"}
          </div>
        </div>
        <div className="card tap p-[15px]" onClick={() => router.push("/trip/active/budget")}>
          <div className="flex items-start justify-between">
            <div className="dim text-[12px]">Budget</div>
            <div className="ring-sm" style={{ ["--p" as any]: pct, width: 44, height: 44 }}>
              <b className="text-[11px]">{pct}%</b>
            </div>
          </div>
          <b className="text-[21px] block mt-1 tracking-[-0.02em]">€{spent.toLocaleString()}</b>
          <div className="dim text-[11.5px]">of €{budget.toLocaleString()}</div>
        </div>
      </div>

      {/* trending destinations */}
      <div className="flex items-center justify-between mt-[22px]">
        <b className="text-[16px]">Trending destinations</b>
        <span className="t-acc tap text-[13px] font-semibold" onClick={() => router.push("/plan")}>
          Plan one
        </span>
      </div>
      <div className="ai-sugg-row">
        {trending.slice(0, 8).map((d) => (
          <div
            key={d.city}
            className="ai-sugg tap"
            onClick={() => {
              store.set("planSeed", d.city);
              router.push("/plan");
            }}
          >
            <div className="ai-sugg-img" style={{ backgroundImage: `url('${photoURL(d, 300)}')` }} />
            <b>
              {d.flag} {d.city}
            </b>
            <span>{d.country}</span>
          </div>
        ))}
      </div>

      {/* quick actions */}
      <div className="flex items-center justify-between mt-[22px] mb-[14px]">
        <b className="text-[16px]">Quick Actions</b>
        <span className="t-acc tap text-[13px] font-semibold" onClick={() => router.push("/reminders")}>
          Reminders
        </span>
      </div>
      <div className="qa-grid">
        {qa.map(({ t, Icon, bg, c, href }) => (
          <div key={t} className="qa-tile tap" onClick={() => router.push(href)}>
            <div className="qa-ic" style={{ background: bg, color: c }}>
              <Icon size={22} strokeWidth={2} />
            </div>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
