"use client";

/* Emergency — local emergency numbers per active trip country
   (port of features2.js buildEmergency). */

import ScreenHeader from "@/components/ScreenHeader";
import { AlertTriangle, Shield, Ambulance, Phone } from "lucide-react";
import { useTrip } from "@/lib/useTrip";
import { countryInfo } from "@/data/countries";

export default function EmergencyPage() {
  const { trip, mounted } = useTrip("active");
  if (!mounted) return <div className="screen-body" />;

  const { country, info } = countryInfo(trip?.country);
  const nums: { t: string; n: string; Icon: typeof Shield }[] = [];
  if (info.gen) nums.push({ t: "Emergency (all services)", n: info.gen, Icon: AlertTriangle });
  if (info.pol) nums.push({ t: "Police", n: info.pol, Icon: Shield });
  if (info.amb) nums.push({ t: "Ambulance / Fire", n: info.amb, Icon: Ambulance });
  if (!nums.length) nums.push({ t: "Emergency", n: "112", Icon: AlertTriangle });

  return (
    <>
      <ScreenHeader title="Emergency" backHref="/" />
      <div className="screen-body">
        <div
          className="card p-[14px] flex gap-[11px] items-center mb-4"
          style={{ background: "rgba(194,69,107,.08)", borderColor: "rgba(194,69,107,.3)" }}
        >
          <span className="itile" style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(194,69,107,.16)", color: "#C2456B" }}>
            <AlertTriangle size={20} strokeWidth={2.2} />
          </span>
          <div className="flex-1 text-[12.5px] leading-[1.4]">
            {info.flag || "🌍"} In <b>{country}</b>, dial <b>{nums[0].n}</b> for emergencies. Save these before you travel.
          </div>
        </div>

        <div className="flex flex-col gap-[11px]">
          {nums.map(({ t, n, Icon }) => (
            <a
              key={t}
              href={"tel:" + n.replace(/[^0-9+]/g, "")}
              className="card tap p-[14px] flex gap-3 items-center"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <span className="itile glass2" style={{ width: 44, height: 44, borderRadius: 13, color: "var(--accent)" }}>
                <Icon size={20} strokeWidth={2} />
              </span>
              <div className="flex-1">
                <b className="text-[14.5px]">{t}</b>
                <div className="dim text-[13px] tabular-nums mt-[1px]">{n}</div>
              </div>
              <span className="itile" style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent)", color: "#fff" }}>
                <Phone size={18} strokeWidth={2.2} />
              </span>
            </a>
          ))}
        </div>

        <div className="card mt-4 p-[13px]">
          <div className="muted text-[12px] leading-[1.5]">
            💡 Tip: save your country’s embassy number once you book — search “[your country] embassy in {country}”.
          </div>
        </div>
      </div>
    </>
  );
}
