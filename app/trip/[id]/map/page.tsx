"use client";

/* ============================================================
   Live map — Leaflet + OpenStreetMap (keyless). Pins come from the
   active trip's geocoded itinerary; route polyline between stops.
   Swap to Google Maps when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set
   (MapPreview keeps the same props).
   ============================================================ */

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useTrip } from "@/lib/useTrip";
import { store } from "@/lib/store";
import EmptyState from "@/components/EmptyState";
import ScreenHeader from "@/components/ScreenHeader";
import type { ItineraryDay } from "@/lib/types";

const PIN_COLORS = ["#2563EB", "#16A34A", "#7C5CFF", "#DB2777", "#CA8A04"];

export default function MapPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { trip, mounted } = useTrip(params.id);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!mounted || !trip || !mapEl.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current) return;

      const itin = store.get<ItineraryDay[]>("itin", trip.itin || []);
      const stops: { n: string; t: string; ll: [number, number] }[] = [];
      itin.forEach((d) =>
        (d.items || []).forEach((it) => {
          if (it.ll) stops.push({ n: it.t, t: (it.time || "") + " · " + (d.city || ""), ll: it.ll });
        })
      );
      if (!stops.length && trip.lat != null) stops.push({ n: trip.name, t: trip.country, ll: [trip.lat, trip.lon] });

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

      const pts: [number, number][] = [];
      stops.forEach((s, i) => {
        L.marker(s.ll, { icon: pinIcon(i + 1, PIN_COLORS[i % PIN_COLORS.length]) })
          .addTo(map)
          .bindPopup(`<b>${s.n}</b><br><span style="color:#888">${s.t || ""}</span>`);
        pts.push(s.ll);
      });
      if (pts.length > 1) {
        L.polyline(pts, { color: "#2563EB", weight: 4, opacity: 0.9, dashArray: "2 10", lineCap: "round" }).addTo(map);
        map.fitBounds(pts, { padding: [70, 80] });
      } else if (pts.length) {
        map.setView(pts[0], 12);
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
        <div
          className="itile glass tap"
          style={{ width: 40, height: 40, borderRadius: 13 }}
          onClick={() => router.push(`/trip/${trip.id}`)}
        >
          <ChevronLeft size={19} strokeWidth={2.2} />
        </div>
      </div>
      <div
        className="glass absolute top-4 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 text-[13px] font-bold"
        style={{ borderRadius: 13 }}
      >
        {(trip.name || "Map").split(/[,&]/)[0].trim()}
      </div>
    </div>
  );
}
