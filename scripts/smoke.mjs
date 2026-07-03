/* ============================================================
   Trippa smoke test — drives the real app in headless Chromium.
   Run against a production server on :3100 (see CI workflow).
   Fails on any page error or broken flow step:
   onboarding → home → full wizard (gating!) → generation →
   results (estimate badge) → every route renders.
   ============================================================ */

import { chromium } from "playwright";

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3100";
const failures = [];
const check = (name, ok) => {
  console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (!ok) failures.push(name);
};

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
let ctx = "start";
page.on("pageerror", (e) => pageErrors.push(`[${ctx}] ${e.message.slice(0, 80)}`));

/* 1 — first run redirects to onboarding */
ctx = "/";
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
check("first run → onboarding", page.url().includes("/onboarding"));

/* 2 — home renders after onboarding */
await page.evaluate(() => localStorage.setItem("trippa.onboarded", "true"));
ctx = "/ (after onboarding)";
await page.goto(BASE + "/");
await page.waitForTimeout(800);
check("home headline", (await page.locator("text=Where to next?").count()) === 1);

/* 3 — wizard gating: Continue disabled until origin + destination */
ctx = "/plan";
await page.goto(BASE + "/plan");
await page.waitForTimeout(700);
check("continue gated", await page.locator("button.wz-next").isDisabled());
await page.locator(".wz-dchip").first().click();
await page.fill('input[placeholder*="OTP"], input[placeholder*="Bucharest"]', "Bucharest (OTP)");
check("continue enabled", !(await page.locator("button.wz-next").isDisabled()));

/* 4 — walk to review; required checklist gates Generate */
await page.locator("button.wz-next").click();
await page.waitForTimeout(300);
await page.locator(".wz-qbtn").nth(1).click(); // one week
for (let i = 0; i < 4; i++) {
  await page.locator("button.wz-next").click();
  await page.waitForTimeout(250);
}
check("review checklist", (await page.locator(".rv-chk").count()) === 5);
check("generate enabled", !(await page.locator("button.wz-next").isDisabled()));

/* 5 — generation (keyless estimate engine) lands on results */
await page.locator("button.wz-next").click();
await page.waitForURL("**/trip/**", { timeout: 90000 }).catch(() => {});
await page.waitForTimeout(1200);
check("results reached", page.url().includes("/trip/"));
check("budget breakdown", (await page.locator("text=Budget breakdown").count()) === 1);

/* 6 — every route renders without crashing */
const routes = [
  "/trips", "/favorites", "/chat", "/profile", "/settings", "/reminders",
  "/destinations", "/destinations/lisbon",
  "/tools/currency", "/tools/weather", "/tools/guide", "/tools/timezones",
  "/tools/tipping", "/tools/emergency", "/tools/prep", "/tools/wallet",
  "/tools/tickets", "/tools/journal",
  "/trip/active", "/trip/active/hotels", "/trip/active/flights",
  "/trip/active/itinerary", "/trip/active/budget", "/trip/active/packing",
  "/trip/active/split",
];
for (const r of routes) {
  ctx = r;
  await page.goto(BASE + r, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const text = await page.locator("body").innerText();
  check("route " + r, text.trim().length > 0);
}

/* 7 — zero page errors across the whole run */
check("no page errors", pageErrors.length === 0);
if (pageErrors.length) console.log("  errors:", pageErrors.slice(0, 5));

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} smoke check(s) failed`);
  process.exit(1);
}
console.log("\nAll smoke checks passed ✓");
