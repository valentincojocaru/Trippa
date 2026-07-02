"use client";

/* Weather — live 7-day forecast for the active trip's destination
   (Open-Meteo keyless / OpenWeather when keyed). Real empty state
   when no trip exists. */

import { useEffect, useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import { useTrip } from "@/lib/useTrip";
import { weatherService, wxLabel, type ForecastDay } from "@/lib/services/weatherService";

export default function WeatherPage() {
  const { trip, mounted } = useTrip("active");
  const [days, setDays] = useState<ForecastDay[] | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!mounted || !trip || trip.lat == null) return;
    weatherService.forecast(trip.lat, trip.lon, 7).then((r) => {
      if (r.data) {
        setDays(r.data);
        setLive(!!r.meta.live);
      }
    });
  }, [mounted, trip?.lat, trip?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return <div className="screen-body" />;
  if (!trip || trip.lat == null)
    return (
      <>
        <ScreenHeader title="Weather" backHref="/" />
        <div className="screen-body">
          <EmptyState
            emoji="🌤️"
            text={"Plan a trip and you'll see a live 7-day\nforecast for your destination here."}
            ctaLabel="Plan a trip"
            ctaHref="/plan"
          />
        </div>
      </>
    );

  return (
    <>
      <ScreenHeader title="Weather" backHref="/" />
      <div className="screen-body">
        <div
          className="card p-[18px] text-center"
          style={{ background: "linear-gradient(135deg,rgba(110,155,255,.12),transparent)", borderColor: "rgba(110,155,255,.28)" }}
        >
          <div className="dim text-[12px]">
            {trip.name} · {trip.country}
          </div>
          <div className="text-[40px] font-bold mt-1">{days ? Math.round(days[0].max) + "°" : "—"}</div>
          <div className="muted text-[13px]">
            {days ? `${days[0].emoji} ${wxLabel(days[0].code)} · low ${Math.round(days[0].min)}°` : "Loading…"}
          </div>
        </div>

        <div className="sec-lbl mt-5 mb-[10px]">7-DAY FORECAST</div>
        {days ? (
          days.map((d, i) => {
            const dt = new Date();
            dt.setDate(dt.getDate() + i);
            const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : dt.toLocaleDateString("en-US", { weekday: "long" });
            const pct = Math.max(8, Math.min(100, ((d.max - 2) / 24) * 100));
            return (
              <div className="lrow" key={d.date}>
                <div style={{ width: 84 }}>
                  <b className="text-[13.5px]">{label}</b>
                  <div className="dim text-[11px]">{dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <div className="text-[20px] w-[34px] text-center">{d.emoji}</div>
                <div className="flex-1">
                  <div className="meter" style={{ height: 6 }}>
                    <i style={{ width: pct + "%" }} />
                  </div>
                </div>
                <div className="text-right" style={{ width: 62 }}>
                  <b className="text-[13.5px]">{Math.round(d.max)}°</b>{" "}
                  <span className="dim text-[12px]">{Math.round(d.min)}°</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="dim text-center py-4 text-[12px]">Loading forecast…</div>
        )}
        <div className="dim text-[11px] text-center mt-4">{live ? "Live · Open-Meteo" : days ? "Cached forecast" : ""}</div>
      </div>
    </>
  );
}
