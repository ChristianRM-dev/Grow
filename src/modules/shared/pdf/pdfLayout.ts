import type PDFDocument from "pdfkit";

export function ensureSpace(doc: PDFDocument, minRemainingHeight: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + minRemainingHeight > bottom) {
    doc.addPage();
  }
}

export function drawHLine(
  doc: PDFDocument,
  x: number,
  y: number,
  width: number
) {
  doc
    .moveTo(x, y)
    .lineTo(x + width, y)
    .stroke();
}

export function formatMoney(value: number) {
  // Simple formatter (you can replace with Intl if needed)
  return `$${value.toFixed(2)}`;
}

export function formatDateMX(date: Date) {
  return date.toLocaleString("es-MX");
}
