/** @type {import('next').NextConfig} */

// MOBILE_BUILD=1 switches the build to a fully static export that Capacitor
// bundles into the native app (webDir: "out"). The normal web build is left
// untouched — server features and the /api/ai route keep working there.
const isMobile = process.env.MOBILE_BUILD === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(isMobile
    ? {
        output: "export",
        // no Next image server in a static bundle
        images: { unoptimized: true },
        // each route becomes a folder with its own index.html, which the
        // native WebView serves reliably from the local file system
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
