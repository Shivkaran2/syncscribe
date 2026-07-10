import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow server-side rendering with Yjs
  serverExternalPackages: ["yjs"],

  // Trust the deployed origin(s) for Server Actions when running behind
  // Render's proxy, so the Origin/forwarded-host check doesn't reject them.
  experimental: {
    serverActions: {
      allowedOrigins: ["syncscribe-obxs.onrender.com"],
    },
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
