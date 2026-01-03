import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

/**
 * Centralized PDF core.
 * - Registers Inter fonts
 * - Sets a default font
 * - Provides a single place to adjust margins/page size later
 */
export function createPdfDocument(): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  // Resolve font files from project root (works well in Next standalone)
  const interRegularPath = path.join(
    process.cwd(),
    "src",
    "assets",
    "fonts",
    "Inter-Regular.ttf"
  );

  const interBoldPath = path.join(
    process.cwd(),
    "src",
    "assets",
    "fonts",
    "Inter-Bold.ttf"
  );

  // Validate font existence early to avoid silent fallback behavior.
  if (!fs.existsSync(interRegularPath) || !fs.existsSync(interBoldPath)) {
    // We throw with a clear message for easier debugging in server logs.
    const missing = {
      interRegularPath,
      interBoldPath,
      regularExists: fs.existsSync(interRegularPath),
      boldExists: fs.existsSync(interBoldPath),
    };
    const err = new Error("PDF_FONTS_NOT_FOUND");
    (err as any).code = "PDF_FONTS_NOT_FOUND";
    (err as any).meta = missing;
    throw err;
  }

  // Register fonts under stable names
  doc.registerFont("Inter-Regular", interRegularPath);
  doc.registerFont("Inter-Bold", interBoldPath);

  // Set default font
  doc.font("Inter-Regular");

  return doc;
}

/**
 * Helper to use bold without repeating font names everywhere.
 */
export function useBold(doc: PDFKit.PDFDocument) {
  doc.font("Inter-Bold");
}

/**
 * Helper to go back to regular font.
 */
export function useRegular(doc: PDFKit.PDFDocument) {
  doc.font("Inter-Regular");
}
