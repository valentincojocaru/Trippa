import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import TabBar from "@/components/TabBar";
import Toaster from "@/components/Toast";
import SwRegister from "@/components/SwRegister";
import ThemeApplier from "@/components/ThemeApplier";

export const metadata: Metadata = {
  title: "Trippa — AI Travel Concierge",
  description:
    "Plan a whole trip in one sentence. Flights, hotels, itinerary, budget, packing — powered by AI.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-frame">{children}</div>
        <TabBar />
        <Toaster />
        <SwRegister />
        <ThemeApplier />
        <Analytics />
      </body>
    </html>
  );
}
