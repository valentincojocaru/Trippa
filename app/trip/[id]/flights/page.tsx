"use client";

/* ============================================================
   Flights — flight options for the trip.
   RULE: flightService refuses without an origin (meta.needs:'origin')
   → the UI shows "Please select your departure airport" instead of
   inventing one. Estimates are always badged when meta.mock.
   ============================================================ */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plane } from "lucide-react";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import EstimateBadge from "@/components/EstimateBadge";
import { SkeletonList } from "@/components/Skeleton";
import { useTrip } from "@/lib/useTrip";
import { affiliateService } from "@/lib/services/affiliateService";
import { flightService } from "@/lib/services/flightService";
import { searchDestinations } from "@/data/destinations";
import { store } from "@/lib/store";
import { fmt } from "@/lib/util";
import type { FlightOption, PlanState, ServiceResult } from "@/lib/types";

/* pull an IATA code out of "Bucharest (OTP)" or plain text via the curated DB */
function toIata(text: string): string {
  const m = (text || "").match(/\(([A-Za-z]{3})\)/);
  if (m) return m[1].toUpperCase();
  const hit = searchDestinations(text, 1)[0];
  if (hit?.iata) return hit.iata;
  const raw = (text || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(raw) ? raw : "";
}

export default function FlightsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { trip, mounted } = useTrip(params.id);
  const [res, setRes] = useState<ServiceResult<FlightOption[] | null> | null>(null);

  const prof = store.get<Partial<PlanState>>("wizardProfile", {});

  useEffect(() => {
    if (!mounted || !trip) return;
    const originIata = toIata((prof.origin as string) || trip.flights?.origin || "");
    const destIata = toIata(trip.name) || toIata(trip.itin?.[0]?.city || "");
    flightService
      .search({
        originIata: originIata || undefined,
        destIata: destIata || trip.name?.slice(0, 3).toUpperCase(),
        pax: (prof.adults || 1) + (prof.children || 0),
        cabin: "economy",
        baggage: !!prof.bags?.checked,
        tripId: trip.id,
      })
      .then(setRes);
  }, [mounted, trip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return <div className="screen-body" />;
  if (!trip)
    return (
      <>
        <ScreenHeader title="Flights" />
        <div className="screen-body">
          <EmptyState emoji="✈️" text="Plan a trip to see flight options here." ctaLabel="Plan a trip" ctaHref="/plan" />
        </div>
      </>
    );

  return (
    <>
      <ScreenHeader title="Flights" backHref={`/trip/active`} />
      <div className="screen-body">
        {!res ? (
          <SkeletonList n={2} />
        ) : res.meta.needs === "origin" ? (
          /* never invent a departure airport */
          <div className="card p-[18px] flex gap-[13px] items-center">
            <span className="itile glass2" style={{ width: 42, height: 42, borderRadius: 13, color: "var(--accent)" }}>
              <Plane size={20} />
            </span>
            <div className="flex-1">
              <b className="text-[14px]">Please select your departure airport</b>
              <div className="dim text-[12px] mt-[2px]">We need your departure city to find flights.</div>
            </div>
            <button className="rs-book sm tap" onClick={() => router.push("/plan")}>
              Add
            </button>
          </div>
        ) : (
          <>
            {res.meta.mock && (
              <div className="ht-estnote mb-2">
                ⚡ These are AI estimates for planning — tap Book for live partner prices.
              </div>
            )}
            <div className="flex flex-col gap-3">
              {(res.data || []).map((f, i) => (
                <div className="card p-4" key={i}>
                  <div className="flex items-center justify-between">
                    <b className="text-[14.5px]">{f.airline}</b>
                    <div className="flex gap-[6px] items-center">
                      {f.deal && <span className="badge">Deal</span>}
                      {res.meta.mock && <EstimateBadge />}
                    </div>
                  </div>
                  <div className="rs-fl-route mt-3">
                    <div className="rs-fl-pt">
                      <b className="text-[19px]">{f.originIata}</b>
                      <div className="dim text-[10.5px]">{f.depart}</div>
                    </div>
                    <div className="rs-fl-line">
                      <span />
                      <Plane size={16} color="var(--accent)" fill="var(--accent)" />
                      <span />
                    </div>
                    <div className="rs-fl-pt text-right">
                      <b className="text-[19px]">{f.destIata}</b>
                      <div className="dim text-[10.5px]">{f.arrive}</div>
                    </div>
                  </div>
                  <div className="dim text-[11.5px] mt-2">
                    {Math.floor(f.durationMin / 60)}h {f.durationMin % 60}m ·{" "}
                    {f.stops === 0 ? "Direct" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`} · {f.cabin}
                    {f.baggageIncluded ? " · bags included" : ""}
                  </div>
                  <div className="rs-fl-foot">
                    <div>
                      <b className="text-[19px]">€{fmt(f.priceEUR)}</b>
                      <span className="dim text-[11px]"> total · €{fmt(f.perPax)} pp</span>
                    </div>
                    <a
                      href={f.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rs-book sm tap"
                      onClick={() =>
                        affiliateService.logClick({
                          provider: "aviasales",
                          bookingType: "flight",
                          destination: f.destIata,
                          tripId: trip.id,
                        })
                      }
                    >
                      Book
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
