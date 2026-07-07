"use client";

/* ============================================================
   Live map — Leaflet + OpenStreetMap (keyless). Pins come from the
   active trip's geocoded itinerary; the route is drawn day-by-day,
   each day in its own colour, with a faint connector across days and
   a day legend. Dark mode tints the tiles to match the app.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useTrip } from "@/lib/useTrip";
import { store } from "@/lib/store";
import EmptyState from "@/components/EmptyState";
import ScreenHeader from "@/components/ScreenHeader";
import type { ItineraryDay } from "@/lib/types";

/* per-day route colours */
const DAY_COLORS = ["#2563EB", "#16A34A", "#7C5CFF", "#DB2777", "#CA8A04", "#0EA5E9", "#E11D48"];

export default function MapPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { trip, mounted } = useTrip(params.id);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [legend, setLegend] = useState<{ label: string; color: string }[]>([]);

  useEffect(() => {
    if (!mounted || !trip || !mapEl.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current) return;

      const itin = store.get<ItineraryDay[]>("itin", trip.itin || []);
      type Stop = { di: number; n: string; t: string; ll: [number, number] };
      const stops: Stop[] = [];
      itin.forEach((d, di) =>
        (d.items || []).forEach((it) => {
          if (it.ll) stops.push({ di, n: it.t, t: (it.time || "") + " · " + (d.city || ""), ll: it.ll });
        })
      );
      if (!stops.length && trip.lat != null)
        stops.push({ di: 0, n: trip.name, t: trip.country, ll: [trip.lat, trip.lon] });

      const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView(
        trip.lat != null ? [trip.lat, trip.lon] : [20, 0],
        trip.lat != null ? 12 : 2
      );
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const pinIcon = (n: number, c: string) =>
        L.divIcon({
          className: "",
          html: `<div style="transform:translate(-50%,-100%);"><div style="width:30px;height:30px;border-radius:50% 50% 50% 2px;transform:rotate(45deg);background:${c};display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px -4px rgba(0,0,0,.45);border:2px solid #fff;"><span style="transform:rotate(-45deg);color:#fff;font-size:12px;font-weight:700;">${n}</span></div></div>`,
          iconSize: [0, 0],
        });

      const allPts = stops.map((s) => s.ll);

      // faint connector showing the overall order across days (drawn underneath)
      if (allPts.length > 1) {
        L.polyline(allPts, { color: "#94A3B8", weight: 2, opacity: 0.5, dashArray: "2 9", lineCap: "round" }).addTo(map);
      }

      // one solid coloured line per day
      const byDay = new Map<number, [number, number][]>();
      stops.forEach((s) => {
        if (!byDay.has(s.di)) byDay.set(s.di, []);
        byDay.get(s.di)!.push(s.ll);
      });
      byDay.forEach((pts, di) => {
        if (pts.length > 1) {
          L.polyline(pts, {
            color: DAY_COLORS[di % DAY_COLORS.length],
            weight: 4,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
        }
      });

      // numbered markers, coloured by their day
      stops.forEach((s, i) => {
        L.marker(s.ll, { icon: pinIcon(i + 1, DAY_COLORS[s.di % DAY_COLORS.length]) })
          .addTo(map)
          .bindPopup(`<b>${s.n}</b><br><span style="color:#888">${s.t || ""}</span>`);
      });

      if (allPts.length > 1) map.fitBounds(allPts, { padding: [70, 80] });
      else if (allPts.length) map.setView(allPts[0], 12);

      // legend — one entry per day that actually has stops
      const days = [...byDay.keys()].sort((a, b) => a - b);
      if (!cancelled) {
        setLegend(
          days.length > 1
            ? days.map((di) => ({
                label: itin[di]?.day || `Day ${di + 1}`,
                color: DAY_COLORS[di % DAY_COLORS.length],
              }))
            : []
        );
      }
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mounted, trip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return <div className="screen-body" />;
  if (!trip)
    return (
      <>
        <ScreenHeader title="Map" />
        <div className="screen-body">
          <EmptyState emoji="🗺️" text="Plan a trip and your route appears on a live map." ctaLabel="Plan a trip" ctaHref="/plan" />
        </div>
      </>
    );

  return (
    <div className="relative flex-1" style={{ minHeight: "100dvh" }}>
      <div ref={mapEl} className="map-full" />
      <div className="absolute top-4 left-4 z-[500]">
        <button
          type="button"
          className="itile glass tap"
          style={{ width: 40, height: 40, borderRadius: 13, padding: 0, color: "var(--text)" }}
          onClick={() => router.push(`/trip/active`)}
          aria-label="Back to trip"
        >
          <ChevronLeft size={19} strokeWidth={2.2} />
        </button>
      </div>
      <div
        className="glass absolute top-4 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 text-[13px] font-bold"
        style={{ borderRadius: 13 }}
      >
        {(trip.name || "Map").split(/[,&]/)[0].trim()}
      </div>

      {legend.length > 1 && (
        <div className="map-legend glass z-[500]">
          {legend.map((d) => (
            <span key={d.label} className="map-legend-item">
              <i style={{ background: d.color }} />
              {d.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
