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
  experimental: {
    // Desactiva React Compiler en dev si estás en Docker
    reactCompiler: !isDev || !isDocker,
  },

  webpack: (config, { isServer, dev }) => {
    // @react-pdf/renderer config
    if (!isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
    }

    // Optimizaciones para Docker
    if (dev && isDocker) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules", "**/.next", "**/.turbo", "**/.git"],
      };

      // Snapshot optimization
      config.snapshot = {
        managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
      };
    }

    return config;
  },

  // Optimiza imágenes en dev
  images: {
    remotePatterns: [],
    unoptimized: isDev,
  },

  // Reduce el buffer de páginas en Docker
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: isDocker ? 2 : 5,
  },
};

export default withSerwist(nextConfig);
