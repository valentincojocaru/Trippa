/* ============================================================
   Mobile build — produce the static bundle Capacitor ships in the
   native app, from the exact same Next.js/React codebase.

     app/  ──(MOBILE_BUILD=1 next build)──▶  out/  ──(cap sync)──▶ Android/iOS

   The only thing the static export can't contain is the POST route
   handler at app/api/ai (server-only). On mobile the AI layer talks to
   providers directly with the on-device key, so the route isn't needed —
   we move it aside for the export and always restore it afterwards, so the
   web build and repo are never left changed.
   ============================================================ */

import { spawnSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiDir = join(root, "app", "api");
const apiHidden = join(root, "app", "_api.mobileignore");
const outDir = join(root, "out");

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, ...env }, shell: false });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} exited with ${r.status}`);
}

let moved = false;
try {
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });

  if (existsSync(apiDir)) {
    renameSync(apiDir, apiHidden);
    moved = true;
    console.log("• temporarily excluded app/api (server-only) from the static export");
  }

  console.log("• building static export (MOBILE_BUILD=1 next build)…");
  run("npx", ["next", "build"], { MOBILE_BUILD: "1" });

  console.log("• syncing the bundle into the native Android/iOS projects (cap sync)…");
  run("npx", ["cap", "sync"]);

  console.log("\n✓ Mobile bundle ready in ./out and synced to android/ + ios/.");
  console.log("  Next: npm run mobile:android  (opens Android Studio → Build APK)");
} finally {
  if (moved) {
    renameSync(apiHidden, apiDir);
    console.log("• restored app/api");
  }
}
