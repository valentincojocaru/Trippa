"use client";

/* Onboarding — 1-screen value prop with cinematic hero + floating
   "itinerary ready" card. Skippable. */

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import TrippaMark from "@/components/TrippaMark";
import { store } from "@/lib/store";

export default function OnboardingPage() {
  const router = useRouter();
  const done = (to: string) => {
    store.set("onboarded", true);
    router.push(to);
  };

  return (
    <div className="screen-body" style={{ paddingBottom: 30 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrippaMark />
          <b className="text-[15px]">Trippa</b>
        </div>
        <span className="dim tap text-[13px]" onClick={() => done("/")}>
          Skip
        </span>
      </div>

      {/* hero photo with floating AI plan card */}
      <div className="relative overflow-hidden rounded-[24px] mt-[18px]" style={{ height: 380 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=700&q=70"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ backgroundColor: "#2a3550" }}
        />
        <div className="photo-cap-ov" />
        <div className="glass absolute left-4 right-4 top-4 flex items-center gap-3 p-3" style={{ borderRadius: 16 }}>
          <span className="itile" style={{ width: 38, height: 38, background: "var(--accent-grad)", borderRadius: 12 }}>
            <Sparkles size={15} color="#fff" fill="#fff" />
          </span>
          <div className="flex-1">
            <b className="text-[13px]">7-day Italy · €3,000</b>
            <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
              Itinerary ready in 8 seconds
            </div>
          </div>
        </div>
        <div className="absolute left-4 right-4 bottom-4">
          <div className="flex gap-2 mb-[9px]">
            <span className="chip-ico">🌍 Anywhere</span>
            <span className="chip-ico">7 days</span>
          </div>
          <div className="text-[25px] font-bold text-white tracking-[-0.02em] leading-[1.1]">
            Plan a whole trip
            <br />
            in one sentence.
          </div>
        </div>
      </div>

      <p className="muted text-[14.5px] leading-[1.5] mt-6">
        Tell Trippa where and how much. It books, maps, budgets and guides — so you just travel.
      </p>

      <div className="mt-auto flex flex-col gap-4 pt-8">
        <div className="flex justify-center gap-[7px]">
          <i style={{ width: 22, height: 7, borderRadius: 4, background: "var(--accent-grad)" }} />
          <i style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--surface-2)" }} />
          <i style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--surface-2)" }} />
        </div>
        <button className="btn btn-primary tap" onClick={() => done("/auth")}>
          Get started <ArrowRight size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
