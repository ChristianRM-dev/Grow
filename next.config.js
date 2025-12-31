// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // ✅ Next 16+: moved out of "experimental"
  outputFileTracingIncludes: {
    "*": [
      // PDFKit built-in font metrics (required at runtime)
      "node_modules/pdfkit/js/data/*.afm",
      // pnpm layout (extra-safe)
      "node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/data/*.afm",

      // Your Inter fonts
      "src/assets/fonts/*.ttf",
    ],
  },

  experimental: {
    // keep empty or put other experimental flags here
    optimizeCss: false
  },
};

module.exports = nextConfig;
