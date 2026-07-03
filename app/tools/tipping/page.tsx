"use client";

/* Tipping & tax — country-specific etiquette, driven by the active
   trip's country (port of features2.js buildTipping). */

import ScreenHeader from "@/components/ScreenHeader";
import { Check } from "lucide-react";
import { useTrip } from "@/lib/useTrip";
import { countryInfo, TIP_TXT } from "@/data/countries";

export default function TippingPage() {
  const { trip, mounted } = useTrip("active");
  if (!mounted) return <div className="screen-body" />;

  const { country, info } = countryInfo(trip?.country);
  const rules: [string, string][] = [
    [
      "Restaurants",
      info.tip === "no"
        ? "No tip — service is the standard."
        : info.tip === "rounded"
          ? "Round up the bill."
          : `Around ${TIP_TXT[info.tip] || "10%"}.`,
    ],
    ["Taxis", info.tip === "no" ? "No tip needed." : "Round up to the nearest note."],
    ["Hotels", info.tip === "no" ? "No tip expected." : "A small note for housekeeping/porters is kind."],
    ["Cafés & bars", info.tip === "no" ? "No tip." : "Leave small change."],
  ];

  return (
    <>
      <ScreenHeader title="Tipping & Tax" backHref="/" />
      <div className="screen-body">
        <div className="card p-[14px]">
          <div className="flex items-center gap-[10px]">
            <span className="itile glass2" style={{ width: 40, height: 40, borderRadius: 12, fontSize: 20 }}>
              {info.flag || "🌍"}
            </span>
            <div>
              <b className="text-[15px]">{country}</b>
              <div className="dim text-[12px]">Tipping etiquette</div>
            </div>
          </div>
          <div className="muted text-[13px] leading-[1.5] mt-3">{info.note}</div>
        </div>

        <div className="sec-lbl mt-[18px] mb-2">QUICK RULES</div>
        {rules.map((r) => (
          <div className="lrow" key={r[0]}>
            <span className="itile glass2" style={{ width: 36, height: 36, borderRadius: 10, color: "var(--accent)" }}>
              <Check size={17} strokeWidth={2} />
            </span>
            <div className="lt">
              <b>{r[0]}</b>
              <span>{r[1]}</span>
            </div>
          </div>
        ))}

        <div className="sec-lbl mt-[18px] mb-2">SALES / VAT TAX</div>
        <div className="card p-[14px]">
          <div className="flex items-center justify-between">
            <span>Standard rate</span>
            <b className="text-[16px]">{info.taxStd || "varies"}</b>
          </div>
          <div className="muted text-[12px] mt-[10px] leading-[1.5]">
            {info.taxNote || "Tax is usually included in displayed prices in this country."}
          </div>
        </div>
      </div>
    </>
  );
}
