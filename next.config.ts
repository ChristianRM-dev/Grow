// next.config.ts
import type { NextConfig } from "next";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import withSerwistInit from "@serwist/next";

function getRevision(): string {
  try {
    const out = spawnSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf-8",
    }).stdout?.trim();
    return out || crypto.randomUUID();
  } catch {
    return crypto.randomUUID();
  }
}

const revision = getRevision();
const isDev = process.env.NODE_ENV !== "production";
const isDocker = process.env.WATCHPACK_POLLING === "true";

const withSerwist = withSerwistInit({
  disable: isDev,
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
});

const nextConfig: NextConfig = {
  // ✅ reactCompiler va en root (Next.js 16+)
  reactCompiler: !isDev || !isDocker,

  // ✅ Configuración vacía de turbopack para silenciar el error
  turbopack: {},

  experimental: {
    // Ya no va reactCompiler aquí
  },

  webpack: (config, { isServer, dev }) => {
    // @react-pdf/renderer config
    if (!isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
    }

    // Optimizaciones para Docker en desarrollo
    if (dev && isDocker) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules", "**/.next", "**/.turbo", "**/.git"],
      };

      config.snapshot = {
        managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
      };
    }

    return config;
  },

  images: {
    remotePatterns: [],
    unoptimized: isDev,
  },

  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: isDocker ? 2 : 5,
  },
};

export default withSerwist(nextConfig);
