"use client";

/* Floating frosted bottom tab bar — Home / Trips / + / Chat / Profile.
   Hidden on flows that own the full screen (wizard, processing, map…). */

import { usePathname, useRouter } from "next/navigation";
import { Home, Map as MapIcon, MessageCircle, User, Sparkles } from "lucide-react";

const HIDDEN_PREFIXES = [
  "/plan",
  "/onboarding",
  "/auth",
  "/trip/", // trip tools own their layout; results shows its own CTA
];

export default function TabBar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const tab = (
    href: string,
    label: string,
    Icon: typeof Home,
    active: boolean
  ) => (
    <div
      className={"ico" + (active ? " on" : "")}
      onClick={() => router.push(href)}
      role="button"
      aria-label={label}
    >
      <Icon size={22} strokeWidth={2} />
      {label}
    </div>
  );

  return (
    <div className="tabbar">
      {tab("/", "Home", Home, pathname === "/")}
      {tab("/trips", "Trips", MapIcon, pathname.startsWith("/trips"))}
      <div className="tab-fab" onClick={() => router.push("/plan")} aria-label="Plan a trip">
        <Sparkles size={24} color="#fff" strokeWidth={2.2} />
      </div>
      {tab("/chat", "Chat", MessageCircle, pathname.startsWith("/chat"))}
      {tab("/profile", "Profile", User, pathname.startsWith("/profile"))}
    </div>
  );
}
