"use client";

/* ============================================================
   Per-trip budget & expenses.
   With multiple trips, budget/expenses must not leak between them:
   values are keyed by trip id (`trippa.budget.<id>` /
   `trippa.expenses.<id>`), falling back to the legacy global keys
   only when there is no trip at all.
   ============================================================ */

import { store } from "./store";
import type { Expense, Trip } from "./types";

const bKey = (id: string) => `budget.${id}`;
const eKey = (id: string) => `expenses.${id}`;

export function budgetOf(trip: Trip | null): number {
  if (!trip) return store.get("budget", 2000);
  return store.get(bKey(trip.id), trip.budget || 2000);
}

export function setBudgetOf(trip: Trip | null, v: number) {
  if (!trip) {
    store.set("budget", v);
    return;
  }
  store.set(bKey(trip.id), v);
}

export function expensesOf(trip: Trip | null): Expense[] {
  if (!trip) return store.get("expenses", []);
  return store.get(eKey(trip.id), []);
}

export function setExpensesOf(trip: Trip | null, arr: Expense[]) {
  if (!trip) {
    store.set("expenses", arr);
    return;
  }
  store.set(eKey(trip.id), arr);
}

export function spentOf(trip: Trip | null): number {
  return expensesOf(trip).reduce((s, e) => s + (+e.eur || 0), 0);
}
