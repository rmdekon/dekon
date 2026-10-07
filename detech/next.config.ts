import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // This app is self-contained in `detech/` inside a larger repo.
  outputFileTracingRoot: __dirname,
  // Emits `.next/standalone` — a minimal self-contained server used by the
  // Dockerfile. Harmless for `npm run dev` / `npm start`.
  output: "standalone",
  serverExternalPackages: ["@libsql/client", "bcryptjs"],
  // Allows the app to be previewed through proxied sandbox/staging hostnames.
  allowedDevOrigins: ["*.e2b.app", "*.app.github.dev", "localhost"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
