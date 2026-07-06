/* Single source of truth for primary navigation — consumed by both the
   mobile tab bar and the desktop sidebar so the two never drift. */

import { Home, Map as MapIcon, MessageCircle, User, Sparkles, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  labelKey: string;
  Icon: LucideIcon;
  primary?: boolean; // the "Plan" action — rendered as the accent CTA
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "tab.home", Icon: Home },
  { href: "/trips", labelKey: "tab.trips", Icon: MapIcon },
  { href: "/plan", labelKey: "tab.plan", Icon: Sparkles, primary: true },
  { href: "/chat", labelKey: "tab.chat", Icon: MessageCircle },
  { href: "/profile", labelKey: "tab.profile", Icon: User },
];

/* Routes that own the full screen — nav is hidden here. */
export const NAV_HIDDEN_PREFIXES = ["/plan", "/onboarding", "/auth", "/trip/"];

export function navHidden(pathname: string): boolean {
  return NAV_HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
}

export function navActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
