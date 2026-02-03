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

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
    }

    // 🔥 DESACTIVA FILE WATCHING COMPLETAMENTE
    config.watchOptions = {
      ignored: "**/*", // Ignora TODO
    };

    return config;
  },

  images: {
    unoptimized: isDev,
  },
};

export default withSerwist(nextConfig);
