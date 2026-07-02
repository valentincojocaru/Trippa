"use client";

/* ============================================================
   Trippa — reminder engine (port of features3.js)
   Auto reminders derived from live trip data: packing left,
   pre-departure tasks, check-in from real ticket dates, document
   expiry from the wallet, budget watch, today's first activity.
   ============================================================ */

import { store } from "./store";
import { daysTo } from "./util";
import type {
  PackingGroup,
  Ticket,
  WalletDoc,
  Expense,
  ItineraryDay,
  CustomReminder,
} from "./types";

export type Reminder = {
  id: string;
  icon: string;
  title: string;
  body: string;
  sub: string;
  go?: string;
  urgent?: boolean;
  done: boolean;
  auto: boolean;
};

export function autoReminders(): Omit<Reminder, "done" | "auto">[] {
  const days = daysTo(store.get<string | null>("tripDate", null));
  const out: Omit<Reminder, "done" | "auto">[] = [];

  // packing
  const pack = store.get<PackingGroup[]>("packing", []);
  let pt = 0,
    pd = 0;
  pack.forEach((g) =>
    g.items.forEach((i) => {
      pt++;
      if (i.d) pd++;
    })
  );
  if (pt && pd < pt)
    out.push({
      id: "pack",
      icon: "bag",
      title: "Finish packing",
      body: `${pt - pd} item${pt - pd > 1 ? "s" : ""} still unchecked on your list.`,
      sub: days != null ? days + "d to go" : "packing",
      go: "/trip/active/packing",
      urgent: days != null && days <= 2,
    });

  // pre-departure tasks
  const prep = store.get<{ t: string; d: number }[]>("prep", []);
  const pend = prep.filter((x) => !x.d);
  if (pend.length)
    out.push({
      id: "prep",
      icon: "check",
      title: "Pre-departure tasks",
      body: `${pend.length} task${pend.length > 1 ? "s" : ""} left — e.g. “${pend[0].t}”.`,
      sub: "before you go",
      go: "/tools/prep",
      urgent: pend.length >= 4,
    });

  // check-in — driven by real ticket data (nearest upcoming flight)
  const tickets = store.get<Ticket[]>("tickets", []);
  const flights = tickets
    .filter((t) => t.kind === "Flight" && t.date)
    .map((t) => ({ ...t, when: new Date(t.date + "T" + (t.time || "00:00")).getTime() }))
    .filter((t) => t.when > Date.now() - 6 * 3600e3)
    .sort((a, b) => a.when - b.when);
  if (flights.length) {
    const f = flights[0];
    const hrs = Math.round((f.when - Date.now()) / 3600e3);
    const open = hrs <= 24;
    out.push({
      id: "checkin",
      icon: "plane",
      title: open ? "Check-in is open" : "Online check-in",
      body: `${f.from || "?"} → ${f.to || "?"} · ${open ? "grab your seats now" : "opens 24h before departure"}.`,
      sub: open ? "open now" : hrs < 48 ? "tomorrow" : `in ${Math.round(hrs / 24)}d`,
      go: "/tools/tickets",
      urgent: open,
    });
  } else {
    out.push({
      id: "checkin",
      icon: "plane",
      title: "Add your flight",
      body: "Save a flight ticket and Trippa will remind you when check-in opens.",
      sub: "tickets",
      go: "/tools/tickets",
    });
  }

  // document expiry — from Travel Wallet
  const docs = store.get<WalletDoc[]>("wallet_docs", []);
  docs.forEach((d, i) => {
    if (!d.expiry) return;
    const dd = Math.ceil((new Date(d.expiry).getTime() - Date.now()) / 86400e3);
    if (dd < 0)
      out.push({
        id: "doc" + i,
        icon: "check",
        title: `${d.label || d.type} expired`,
        body: `Your ${d.type.toLowerCase()} expired — renew before you travel.`,
        sub: "action needed",
        go: "/tools/wallet",
        urgent: true,
      });
    else if (dd <= 180)
      out.push({
        id: "doc" + i,
        icon: "check",
        title: `${d.label || d.type} expires soon`,
        body: `Valid for ${dd} more day${dd > 1 ? "s" : ""}. Many countries require 6 months.`,
        sub: dd <= 30 ? "urgent" : "heads-up",
        go: "/tools/wallet",
        urgent: dd <= 60,
      });
  });

  // budget watch
  const budget = store.get<number>("budget", 2000);
  const exp = store.get<Expense[]>("expenses", []);
  const spent = exp.reduce((s, e) => s + (+e.eur || 0), 0);
  if (spent > budget * 0.8)
    out.push({
      id: "budget",
      icon: "money",
      title: spent > budget ? "Over budget" : "Budget watch",
      body: `You've used ${Math.round((spent / budget) * 100)}% of your €${budget.toLocaleString()} budget.`,
      sub: "spending",
      go: "/trip/active/budget",
      urgent: spent > budget,
    });

  // today's first activity
  const itin = store.get<ItineraryDay[]>("itin", []);
  if (itin[0] && itin[0].items[0]) {
    const a = itin[0].items[0];
    out.push({
      id: "today",
      icon: "pin",
      title: "Today · " + a.time + " " + a.t,
      body: a.note || "First stop on today’s plan.",
      sub: "itinerary",
      go: "/trip/active/itinerary",
    });
  }
  return out;
}

export function allReminders(): Reminder[] {
  const done = store.get<Record<string, number>>("remDone", {});
  const auto = autoReminders().map((r) => ({ ...r, done: !!done[r.id], auto: true }));
  const custom = store
    .get<CustomReminder[]>("customRems", [])
    .map((r, i) => ({
      id: "c" + i,
      icon: "bell",
      title: r.title,
      body: r.body || "",
      sub: r.time || "reminder",
      done: !!r.done,
      auto: false,
    }));
  return [...custom, ...auto];
}

export function activeReminderCount(): number {
  return allReminders().filter((r) => !r.done).length;
}

export function toggleReminderDone(id: string) {
  if (id.startsWith("c")) {
    const arr = store.get<CustomReminder[]>("customRems", []);
    const i = +id.slice(1);
    if (arr[i]) {
      arr[i].done = !arr[i].done;
      store.set("customRems", arr);
    }
  } else {
    const d = store.get<Record<string, number>>("remDone", {});
    if (d[id]) delete d[id];
    else d[id] = Date.now();
    store.set("remDone", d);
  }
}

export function maybeNotify(title: string, body: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" });
    }
  } catch {}
}
