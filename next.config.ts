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

const withSerwist = withSerwistInit({
  // Serwist OFF en dev por Turbopack; ON en prod.
  // Puedes forzar PWA en local con ENABLE_PWA=true.
  disable:
    process.env.NODE_ENV !== "production" && process.env.ENABLE_PWA !== "true",

  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",

  additionalPrecacheEntries: [{ url: "/~offline", revision }],
});

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: { optimizeCss: false },
  reactCompiler: true,
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/sales-notes/\\[id\\]/pdf": [
      "./node_modules/pdfkit/js/data/**/*",
      "./src/assets/fonts/**/*",
    ],
    "/reports/sales/pdf": [
      "./node_modules/pdfkit/js/data/**/*",
      "./src/assets/fonts/**/*",
    ],
    "/quotations/\\[id\\]/pdf": [
      "./node_modules/pdfkit/js/data/**/*",
      "./src/assets/fonts/**/*",
    ],
  },
};

export default withSerwist(nextConfig);
