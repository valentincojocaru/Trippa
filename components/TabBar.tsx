"use client";

/* Floating frosted bottom tab bar (mobile / ≤1023px). Nav items come from
   the shared NAV_ITEMS config so the desktop sidebar stays in sync. A single
   accent pill slides under the active tab (Framer layoutId). */

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { NAV_ITEMS, navHidden, navActive } from "@/lib/nav";

export default function TabBar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const t = useT();
  if (navHidden(pathname)) return null;

  return (
    <nav className="tabbar tabbar-mobile" aria-label="Main">
      {NAV_ITEMS.map(({ href, labelKey, Icon, primary }) => {
        const label = t(labelKey);
        if (primary) {
          return (
            <motion.button
              key={href}
              className="tab-fab"
              onClick={() => router.push(href)}
              aria-label={label}
              whileTap={{ scale: 0.9, rotate: 90 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
            >
              <Icon size={24} color="#fff" strokeWidth={2.2} />
            </motion.button>
          );
        }
        const active = navActive(pathname, href);
        return (
          <button
            key={href}
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
      })}
    </nav>
  );
}
