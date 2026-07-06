"use client";

/* Desktop / large-tablet sidebar (≥1024px). Lives in the ambient margin to
   the left of the centered app column, so the column stays put and no screen
   layout changes. Shares NAV_ITEMS with the mobile tab bar. Hidden below
   1024px via CSS, where the floating tab bar takes over. */

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import TrippaMark from "@/components/TrippaMark";
import { useT } from "@/lib/i18n";
import { NAV_ITEMS, navHidden, navActive } from "@/lib/nav";

export default function DesktopNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const t = useT();
  if (navHidden(pathname)) return null;

  return (
    <nav className="dnav" aria-label="Primary">
      <button className="dnav-brand tap" onClick={() => router.push("/")} aria-label="Trippa home">
        <TrippaMark size={20} />
        <span>
          Trip<span className="t-acc">pa</span>
        </span>
      </button>

      <div className="dnav-items">
        {NAV_ITEMS.map(({ href, labelKey, Icon, primary }) => {
          const label = t(labelKey);
          const active = navActive(pathname, href);
          if (primary) {
            return (
              <button key={href} className="dnav-cta tap" onClick={() => router.push(href)}>
                <Icon size={18} strokeWidth={2.2} />
                {label}
              </button>
            );
          }
          return (
            <button
              key={href}
              className={"dnav-item" + (active ? " on" : "")}
              onClick={() => router.push(href)}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="dnav-pill"
                  className="dnav-pill"
                  transition={{ type: "spring", stiffness: 480, damping: 40 }}
                />
              )}
              <Icon size={19} strokeWidth={2} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
