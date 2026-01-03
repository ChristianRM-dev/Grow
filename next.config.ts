// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  output: "standalone",

  // Prevent bundling pdfkit inside server chunks (keeps its files in node_modules)
  serverExternalPackages: ["pdfkit"],

  // Ensure required runtime files are traced into standalone output
  outputFileTracingIncludes: {
    // Route glob (picomatch). Escape dynamic segment brackets.
    "/sales-notes/\\[id\\]/pdf": [
      "./node_modules/pdfkit/js/data/**/*",
      "./src/assets/fonts/**/*",
    ],
    "/reports/sales/pdf": [
      "./node_modules/pdfkit/js/data/**/*",
      "./src/assets/fonts/**/*",
    ],
  },
};

export default nextConfig;
