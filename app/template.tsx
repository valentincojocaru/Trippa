"use client";

/* Route transition — this template re-mounts on every navigation, so each
   screen cross-fades in. Kept as a flex column with flex:1 so pages remain
   direct-child flex behaviour under .app-frame; motion is CSS-only and is
   disabled under prefers-reduced-motion (see globals.css). */

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-shell">{children}</div>;
}
