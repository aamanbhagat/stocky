import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@next/third-parties"],
    optimizeCss: true,
  },
  async redirects() {
    return [
      // Canonicalise host: www → apex. Only fires if www.financecity.me is
      // routed to this deployment; also set the apex as the primary domain in
      // Vercel so it is enforced at the edge.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.financecity.me" }],
        destination: "https://financecity.me/:path*",
        permanent: true,
      },
      // Legacy URLs from the previous site that lived on this domain — Google
      // still crawls them and gets 404s. 301 them to the closest live surface
      // to clear the report and recover any link equity. None are real routes
      // today, so there is no conflict with the app.
      { source: "/posts", destination: "/blog", permanent: true },
      { source: "/posts/:path*", destination: "/blog", permanent: true },
      { source: "/tags", destination: "/blog", permanent: true },
      { source: "/tags/:path*", destination: "/blog", permanent: true },
      { source: "/search/:path*", destination: "/companies", permanent: true },
      {
        source: "/private-credit-revolution-high-yield-for-retail-2025",
        destination: "/blog",
        permanent: true,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=(self)",
      },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      // Long-cache the static, content-typed crawler files.
      {
        source: "/ads.txt",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
};

export default nextConfig;
