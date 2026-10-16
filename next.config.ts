import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/play",
        destination: "/classic",
        permanent: true,
      },
      {
        source: "/game",
        destination: "/classic",
        permanent: true,
      },
      {
        source: "/rules",
        destination: "/about",
        permanent: false,
      },
      {
        source: "/how-to-play",
        destination: "/about",
        permanent: false,
      },
      {
        source: "/leaderboard",
        destination: "/stats",
        permanent: true,
      },
      {
        source: "/feedback",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/support",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/help",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/legal",
        destination: "/terms",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
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
