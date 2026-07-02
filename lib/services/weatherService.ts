/* ============================================================
   Trippa — weatherService
   forecast(lat, lon, days) → [{date,max,min,code,emoji}]
   MOCK/keyless: Open-Meteo (no key required, real data).
   REAL: OpenWeather when OPENWEATHER_API_KEY is set.
   ============================================================ */

import { wrap } from "./config";
import type { ServiceResult } from "@/lib/types";

export type ForecastDay = {
  date: string;
  max: number;
  min: number;
  code: number;
  emoji: string;
};

export const wxEmoji = (c: number) =>
  c === 0 ? "☀️" : c <= 2 ? "🌤️" : c <= 3 ? "☁️" : c <= 48 ? "🌫️" : c <= 67 ? "🌧️" : c <= 77 ? "❄️" : c <= 82 ? "🌦️" : "⛈️";

export const wxLabel = (c: number) =>
  c === 0 ? "Clear" : c <= 2 ? "Partly cloudy" : c <= 3 ? "Overcast" : c <= 48 ? "Fog" : c <= 67 ? "Rain" : c <= 77 ? "Snow" : c <= 82 ? "Showers" : c <= 99 ? "Storm" : "—";

async function openMeteo(lat: number, lon: number, days = 7): Promise<ForecastDay[]> {
  const u =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=${days}`;
  const j = await (await fetch(u)).json();
  if (!j || !j.daily) throw new Error("no data");
  return j.daily.time.map((d: string, i: number) => {
    const code = j.daily.weathercode[i];
    return {
      date: d,
      max: Math.round(j.daily.temperature_2m_max[i]),
      min: Math.round(j.daily.temperature_2m_min[i]),
      code,
      emoji: wxEmoji(code),
    };
  });
}

export const weatherService = {
  async forecast(
    lat: number | null,
    lon: number | null,
    days = 7
  ): Promise<ServiceResult<ForecastDay[] | null>> {
    if (lat == null || lon == null) return wrap("weather", null, { error: "missing-coords" });
    try {
      const rows = await openMeteo(lat, lon, days);
      return wrap("weather", rows, { live: true, source: "open-meteo" });
    } catch (e) {
      return wrap("weather", null, { live: false, error: String(e) });
    }
  },
};
