import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";

export type PdfFonts = {
  regularPath: string;
  boldPath: string;
};

export type PdfDocOptions = {
  size?: PDFKit.PDFDocumentOptions["size"];
  margin?: number;
};

function resolveInterFonts(): PdfFonts {
  const regularPath = path.join(
    process.cwd(),
    "src/assets/fonts/Inter-Regular.ttf"
  );
  const boldPath = path.join(process.cwd(), "src/assets/fonts/Inter-Bold.ttf");

  if (!fs.existsSync(regularPath) || !fs.existsSync(boldPath)) {
    const err = new Error("FONTS_NOT_FOUND");
    (err as any).code = "FONTS_NOT_FOUND";
    (err as any).meta = { regularPath, boldPath };
    throw err;
  }

  return { regularPath, boldPath };
}

/**
 * Creates a PDFKit document configured to avoid Helvetica.afm lookups.
 * It sets Inter-Regular as the default font in the constructor and registers Inter/Inter-Bold.
 */
export function createInterPdfDoc(options?: PdfDocOptions) {
  const fonts = resolveInterFonts();

  const doc = new PDFDocument({
    size: options?.size ?? "A4",
    margin: options?.margin ?? 40,
    font: fonts.regularPath, // ✅ avoids Helvetica.afm
  });

  doc.registerFont("Inter", fonts.regularPath);
  doc.registerFont("Inter-Bold", fonts.boldPath);

  // Set a stable default
  doc.font("Inter");

  return { doc, fonts };
}

export function setPdfFont(
  doc: PDFKit.PDFDocument,
  weight: "regular" | "bold"
) {
  doc.font(weight === "bold" ? "Inter-Bold" : "Inter");
}
