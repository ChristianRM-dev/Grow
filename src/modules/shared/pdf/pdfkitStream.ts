// src/modules/shared/pdf/pdfkitStream.ts
import PDFDocument from "pdfkit";

export function createPdfDocument(options: PDFDocumentOptions) {
  // NOTE: A4 by default. You can switch to a ticket format later if needed.
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  return { doc };
}
