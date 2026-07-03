"use client";

/* ============================================================
   Trip Results dashboard — port of results.js.
   Hero · savings/over-budget banner · budget breakdown · best
   flight & stays (pet-aware) · good-to-know · quick links · tips.

   Budget rule (non-negotiable): the USER's budget is the source
   of truth and is never overwritten. If the estimate exceeds it →
   "over budget by €X" + cheaper alternatives. Never scale it up.
   Flights rule: no origin → ask for the departure airport instead
   of inventing one.
   ============================================================ */

import { useRouter, useParams } from "next/navigation";
import {
  CalendarDays,
  Map as MapIcon,
  Building2,
  CloudSun,
  FileText,
  CircleDollarSign,
  MessageCircle,
  Luggage,
  Plane,
} from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import { affiliateService } from "@/lib/services/affiliateService";
import { useTrip } from "@/lib/useTrip";
import { useT } from "@/lib/i18n";
import { store } from "@/lib/store";
import { fmt } from "@/lib/util";
import type { PlanState } from "@/lib/types";

const HPOOL = [
  "1566073771259-6a8506099945",
  "1571896349842-33c89424de2d",
  "1611892440504-42a792e24d32",
  "1502672260266-1c1ef2d93688",
  "1455587734955-081b22074882",
  "1582719508461-905c673771fd",
];
const hotelPhoto = (name: string, i: number) => {
  const seed = [...(name || "")].reduce((s, c) => s + c.charCodeAt(0), i);
  return `https://images.unsplash.com/photo-${HPOOL[seed % HPOOL.length]}?w=320&h=320&fit=crop&q=72`;
};

export default function TripResultsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { trip, mounted } = useTrip(params.id);
  const t = useT();

  if (!mounted) return <div className="screen-body" />;
  if (!trip)
    return (
      <>
        <ScreenHeader title={t("rs.yourTrip")} backHref="/" />
        <div className="screen-body">
          <EmptyState emoji="🧳" text={t("rs.noTrip")} ctaLabel={t("home.planATrip")} ctaHref="/plan" />
        </div>
      </>
    );

  const prof = store.get<Partial<PlanState>>("wizardProfile", {});
  const pets = prof.pets === "yes";
  const party = (prof.adults || 1) + (prof.children || 0) + (prof.infants || 0) + (prof.seniors || 0);
  const travelers = party > 1 ? `${party} ${t("rs.travelers")}` : t("rs.solo");

  /* ----- budget breakdown — the user's budget is never overwritten ----- */
  const party2 = party || 1;
  const userBudget = prof.budgetTotal ? (prof.perPerson ? prof.budgetTotal * party2 : prof.budgetTotal) : trip.budget || 0;
  const hotelTotal =
    (trip.hotels || []).reduce((s, h) => s + (h.priceEUR || 0) * (h.nights || 1), 0) ||
    Math.round((trip.budget || 1000) * 0.4);
  const flightTotal = trip.flights?.estEUR || Math.round((trip.budget || 1000) * 0.3);
  const foodEst = Math.round(party2 * (trip.days || 5) * 32);
  const actEst = Math.round((trip.budget || 1000) * 0.12);
  const spend = flightTotal + hotelTotal + foodEst + actEst;
  const budget = userBudget || spend;
  const hasBudget = userBudget > 0;
  const diff = budget - spend; // + = under, − = over
  const overBudget = hasBudget && diff < 0;
  const savings = Math.max(0, diff);
  const cats = [
    { l: t("rs.catFlights"), v: flightTotal, c: "var(--accent)" },
    { l: t("rs.catStays"), v: hotelTotal, c: "var(--green)" },
    { l: t("rs.catFood"), v: foodEst, c: "var(--yellow)" },
    { l: t("rs.catActivities"), v: actEst, c: "var(--purple)" },
  ];
  const maxC = Math.max(...cats.map((c) => c.v), 1);

  let dateStr = "";
  if (prof.depart) {
    const f = (x: Date) => x.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    dateStr = prof.ret ? `${f(new Date(prof.depart))} – ${f(new Date(prof.ret))}` : f(new Date(prof.depart));
  } else if (trip.date) {
    dateStr = new Date(trip.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  }

  const base = `/trip/${trip.id}`;
  const links = [
    { href: `${base}/itinerary`, t: t("qa.itinerary"), bg: "rgba(37,99,235,.1)", c: "var(--accent)", Icon: CalendarDays },
    { href: `${base}/map`, t: t("rs.lMap"), bg: "rgba(22,163,74,.12)", c: "var(--green)", Icon: MapIcon },
    { href: `${base}/hotels`, t: t("rs.lStays"), bg: "rgba(124,92,255,.12)", c: "var(--purple)", Icon: Building2 },
    { href: `/tools/weather`, t: t("qa.weather"), bg: "rgba(37,99,235,.1)", c: "var(--accent)", Icon: CloudSun },
    { href: `/tools/wallet`, t: t("rs.lDocs"), bg: "rgba(202,138,4,.13)", c: "var(--yellow)", Icon: FileText },
    { href: `/tools/currency`, t: t("rs.lCurrency"), bg: "rgba(22,163,74,.12)", c: "var(--green)", Icon: CircleDollarSign },
    { href: `/chat`, t: t("rs.lConcierge"), bg: "rgba(124,92,255,.12)", c: "var(--purple)", Icon: MessageCircle },
    { href: `${base}/packing`, t: t("qa.packing"), bg: "rgba(219,39,119,.1)", c: "var(--pink)", Icon: Luggage },
  ];

  const hotels = (trip.hotels || []).slice(0, 3);
  const hasOrigin = ((prof.origin as string) || trip.flights?.origin || "").trim().length > 1;

  return (
    <>
      <ScreenHeader title={t("rs.yourTrip")} backHref="/" />
      <div className="screen-body" style={{ paddingTop: 10 }}>
        {/* hero */}
        <div className="rs-hero" style={trip.hero ? { backgroundImage: `url('${trip.hero}')` } : undefined}>
          <div className="rs-hero-ov" />
          <div className="rs-hero-top">
            <span className="rs-chip">{trip.mock ? t("rs.estimatePlan") : t("rs.aiPlanned")}</span>
          </div>
          <div className="rs-hero-cap">
            <div className="rs-hero-sub">{trip.country || ""}</div>
            <h1 className="rs-hero-h1">{trip.name || "Your trip"}</h1>
            <div className="rs-hero-meta">{[dateStr, `${trip.days} ${t("rs.days")}`, travelers].filter(Boolean).join(" · ")}</div>
          </div>
        </div>

        {/* savings / over-budget */}
        {hasBudget &&
          (overBudget ? (
            <>
              <div className="rs-overb">
                <span className="rs-sav-ic">⚠️</span>
                <div className="flex-1">
                  <b>{t("rs.overBudget")} €{fmt(-diff)}</b>
                  <span className="dim block text-[11.5px]">
                    Cheapest plan we found is €{fmt(spend)} — your budget is €{fmt(budget)}.
                  </span>
                </div>
              </div>
              <div className="rs-alts">
                <div className="rs-alts-h">{t("rs.waysToFit")} €{fmt(budget)}</div>
                <button className="rs-alt tap" onClick={() => router.push("/plan")}>
                  <span>📅</span>
                  <div>
                    <b>{t("rs.shiftDates")}</b>
                    <span>{t("rs.shiftDatesSub")}</span>
                  </div>
                </button>
                <button className="rs-alt tap" onClick={() => router.push(`${base}/hotels`)}>
                  <span>🏨</span>
                  <div>
                    <b>{t("rs.cheaperStay")}</b>
                    <span>{t("rs.cheaperStaySub")}</span>
                  </div>
                </button>
                <button className="rs-alt tap" onClick={() => router.push("/plan")}>
                  <span>✈️</span>
                  <div>
                    <b>{t("rs.nearbyAirport")}</b>
                    <span>{t("rs.nearbyAirportSub")}</span>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="rs-savings">
              <span className="rs-sav-ic">💶</span>
              <div className="flex-1">
                <b>{t("rs.youAre")} €{fmt(savings)} {t("rs.underBudget")}</b>
                <span className="dim block text-[11.5px]">
                  Plan totals €{fmt(spend)} of your €{fmt(budget)}
                </span>
              </div>
            </div>
          ))}

        {/* budget breakdown */}
        <div className="rs-sec">{t("rs.breakdown")}</div>
        <div className="card p-4">
          <div className="flex items-start justify-between mb-[14px]">
            <div>
              <div className="dim text-[11.5px]">{t("rs.estTotal")}</div>
              <b className="text-[26px] tracking-[-0.02em]">€{fmt(spend)}</b>
            </div>
            <div className="text-right">
              <div className="dim text-[11.5px]">{t("rs.yourBudget")}</div>
              <b
                className="text-[15px]"
                style={{ color: !hasBudget ? "var(--text-2)" : overBudget ? "var(--pink)" : "var(--green)" }}
              >
                {hasBudget ? "€" + fmt(budget) : "—"}
              </b>
            </div>
          </div>
          {cats.map((c) => (
            <div className="rs-bar-row" key={c.l}>
              <span className="rs-bar-l">{c.l}</span>
              <div className="rs-bar">
                <div className="rs-bar-f" style={{ width: Math.round((c.v / maxC) * 100) + "%", background: c.c }} />
              </div>
              <b className="rs-bar-v">€{fmt(c.v)}</b>
            </div>
          ))}
          <div className="rs-estnote">{t("rs.estNote")}</div>
        </div>

        {/* best flight — requires a known departure airport */}
        <div className="rs-sec">{t("rs.bestFlight")}</div>
        {hasOrigin ? (
          <div className="card p-4">
            <div className="rs-fl-route">
              <div className="rs-fl-pt">
                <b>{(prof.origin as string) || trip.flights?.origin}</b>
              </div>
              <div className="rs-fl-line">
                <span />
                <Plane size={18} color="var(--accent)" fill="var(--accent)" />
                <span />
              </div>
              <div className="rs-fl-pt text-right">
                <b>{trip.itin?.[0]?.city || trip.name || ""}</b>
              </div>
            </div>
            <div className="rs-fl-foot">
              <div>
                <div className="dim text-[11px]">{trip.flights?.note || "Round trip · economy"}</div>
                <b className="text-[19px]">€{fmt(flightTotal)}</b>
                <span className="dim text-[11px]"> est.</span>
              </div>
              <a
                href={trip.flights?.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="rs-book tap"
                onClick={() =>
                  affiliateService.logClick({
                    provider: "aviasales",
                    bookingType: "flight",
                    destination: trip.itin?.[0]?.city || trip.name,
                    tripId: trip.id,
                  })
                }
              >
                {t("rs.searchFlights")}
              </a>
            </div>
          </div>
        ) : (
          <div className="card p-[18px] flex gap-[13px] items-center">
            <span className="itile glass2" style={{ width: 42, height: 42, borderRadius: 13, color: "var(--accent)" }}>
              <Plane size={20} />
            </span>
            <div className="flex-1">
              <b className="text-[14px]">{t("rs.selectAirport")}</b>
              <div className="dim text-[12px] mt-[2px]">{t("rs.needAirport")}</div>
            </div>
            <button className="rs-book sm tap" onClick={() => router.push("/plan")}>
              {t("rs.add")}
            </button>
          </div>
        )}

        {/* stays */}
        <div className="rs-sec">{pets ? t("rs.petStays") : t("rs.whereToStay")}</div>
        <div className="rs-estnote" style={{ margin: "-4px 0 11px", border: "none", padding: 0 }}>
          {t("rs.estTap")}
        </div>
        <div className="flex flex-col gap-[11px]">
          {hotels.length ? (
            hotels.map((h, hi) => (
              <div className="card rs-hotel" key={h.name + hi}>
                <span
                  className="rs-hotel-ph"
                  style={{ backgroundImage: `url('${h.img || hotelPhoto(h.name, hi)}')` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <b className="text-[14.5px]">{h.name}</b>
                    {pets && <span className="text-[14px]">🐾</span>}
                  </div>
                  <div className="dim text-[12px]">{h.area || h.city || ""}</div>
                  {h.why && <div className="muted text-[11.5px] mt-[3px] leading-[1.35]">{h.why}</div>}
                  <div className="flex items-center justify-between mt-[9px]">
                    <div>
                      <b className="text-[16px]">€{fmt(h.priceEUR)}</b>
                      <span className="dim text-[11px]">{t("rs.night")}</span>
                    </div>
                    <a
                      href={h.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rs-book sm tap"
                      onClick={() =>
                        affiliateService.logClick({
                          provider: "hotellook",
                          bookingType: "hotel",
                          destination: h.city || trip.name,
                          tripId: trip.id,
                        })
                      }
                    >
                      {t("rs.book")}
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-[18px] text-center">
              <div className="muted text-[13px]">Open “All stays” to browse hotels.</div>
            </div>
          )}
        </div>

        {/* good to know */}
        {(trip.bestTime || trip.weather || trip.transport || trip.visa) && (
          <>
            <div className="rs-sec">{t("rs.goodToKnow")}</div>
            <div className="card p-[15px] flex flex-col gap-[10px]">
              {trip.bestTime && (
                <div className="rs-fact">
                  <span>🗓️</span>
                  <div>
                    <b className="text-[13px]">{t("rs.bestTime")}</b>
                    <div className="dim text-[12px]">{trip.bestTime}</div>
                  </div>
                </div>
              )}
              {trip.weather && (
                <div className="rs-fact">
                  <span>🌤️</span>
                  <div>
                    <b className="text-[13px]">{t("rs.weather")}</b>
                    <div className="dim text-[12px]">{trip.weather}</div>
                  </div>
                </div>
              )}
              {trip.transport && (
                <div className="rs-fact">
                  <span>🚆</span>
                  <div>
                    <b className="text-[13px]">{t("rs.transport")}</b>
                    <div className="dim text-[12px]">{trip.transport}</div>
                  </div>
                </div>
              )}
              {trip.visa && (
                <div className="rs-fact">
                  <span>🛂</span>
                  <div>
                    <b className="text-[13px]">{t("rs.visa")}</b>
                    <div className="dim text-[12px]">{trip.visa}</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* quick links */}
        <div className="rs-sec">{t("rs.everything")}</div>
        <div className="rs-links">
          {links.map(({ href, t, bg, c, Icon }) => (
            <button key={t} className="rs-link tap" onClick={() => router.push(href)}>
              <span className="rs-link-ic" style={{ background: bg, color: c }}>
                <Icon size={20} strokeWidth={2} />
              </span>
              <span>{t}</span>
            </button>
          ))}
        </div>

        {/* AI tips */}
        {trip.tips && trip.tips.length > 0 && (
          <>
            <div className="rs-sec">{t("rs.tips")}</div>
            <div className="flex flex-col gap-[9px]">
              {trip.tips.slice(0, 5).map((t, i) => (
                <div className="rs-tip" key={i}>
                  <span>💡</span>
                  <span>{typeof t === "string" ? t : ""}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <button className="btn btn-primary tap mt-[22px]" onClick={() => router.push(`${base}/itinerary`)}>
          {t("rs.openPlan")}
        </button>
        <div style={{ height: 30 }} />
      </div>
    </>
  );
}
