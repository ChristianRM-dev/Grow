import type { NextConfig } from "next";
import crypto from "node:crypto";
import withSerwistInit from "@serwist/next";

const isDev = process.env.NODE_ENV !== "production";

const withSerwist = withSerwistInit({
  disable: isDev,
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    { url: "/~offline", revision: crypto.randomUUID() },
  ],
});

const nextConfig: NextConfig = {
  reactCompiler: false, // Desactivado en Docker

  // Config vacía para Turbopack
  turbopack: {},

  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
    }

    // Preserve normal HMR/file watching. Polling remains opt-in for
    // containerized or network-mounted filesystems.
    if (dev && process.env.NEXT_WEBPACK_POLL === "true") {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/.git/**", "**/.next/**", "**/node_modules/**"],
      };
    }

    return config;
  },

  images: {
    unoptimized: isDev,
  },
};

export default withSerwist(nextConfig);
