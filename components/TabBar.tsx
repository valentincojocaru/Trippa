"use client";

/* Floating frosted bottom tab bar — Home / Trips / + / Chat / Profile.
   A single accent pill slides under the active tab (Framer layoutId).
   Hidden on flows that own the full screen (wizard, processing, map…). */

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Map as MapIcon, MessageCircle, User, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";

const HIDDEN_PREFIXES = [
  "/plan",
  "/onboarding",
  "/auth",
  "/trip/", // trip tools own their layout; results shows its own CTA
];

export default function TabBar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const t = useT();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const tab = (href: string, label: string, Icon: typeof Home, active: boolean) => (
    <button
      className={"ico" + (active ? " on" : "")}
      onClick={() => router.push(href)}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <motion.span
          layoutId="tab-pill"
          className="tab-pill"
          transition={{ type: "spring", stiffness: 480, damping: 38 }}
        />
      )}
      <Icon size={22} strokeWidth={2} />
      <span className="tab-lbl">{label}</span>
    </button>
  );

  return (
    <nav className="tabbar" aria-label="Main">
      {tab("/", t("tab.home"), Home, pathname === "/")}
      {tab("/trips", t("tab.trips"), MapIcon, pathname.startsWith("/trips"))}
      <motion.button
        className="tab-fab"
        onClick={() => router.push("/plan")}
        aria-label="Plan a trip"
        whileTap={{ scale: 0.9, rotate: 90 }}
        transition={{ type: "spring", stiffness: 500, damping: 24 }}
      >
        <Sparkles size={24} color="#fff" strokeWidth={2.2} />
      </motion.button>
      {tab("/chat", t("tab.chat"), MessageCircle, pathname.startsWith("/chat"))}
      {tab("/profile", t("tab.profile"), User, pathname.startsWith("/profile"))}
    </nav>
  );
}
