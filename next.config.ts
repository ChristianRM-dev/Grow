// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  experimental: {
    // keep empty or put other experimental flags here
    optimizeCss: false,
  },

  reactCompiler: true,

  // Prevent bundling pdfkit inside server chunks (keeps its files in node_modules)
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

export default nextConfig;
