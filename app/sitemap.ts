import type { MetadataRoute } from "next";
import { allDestinations } from "@/data/destinations";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://trippa.app";

const slugOf = (city: string) =>
  city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/destinations`, changeFrequency: "weekly", priority: 0.9 },
    ...allDestinations.map((d) => ({
      url: `${BASE}/destinations/${slugOf(d.city)}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
