import type { SalesReportDto } from "@/modules/reports/queries/getSalesReport.dto";
import { createPdfDocument, useBold, useRegular } from "@/modules/shared/pdf";
import { safeFileNamePart } from "@/modules/shared/pdf/pdfFileName";
import { money, dateMX } from "@/modules/shared/utils/formatters";

type PdfResult = { doc: PDFKit.PDFDocument; fileName: string };

function formatQty(qty: number) {
  return qty.toFixed(3).replace(/\.?0+$/, "");
}

function resetCursor(doc: PDFKit.PDFDocument) {
  // PDFKit keeps doc.x after absolute positioned writes.
  // We force it back to the left margin for "normal flow" text.
  doc.x = doc.page.margins.left;
}

function contentWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

export function generateSalesReportPdf(report: SalesReportDto): PdfResult {
  const doc = createPdfDocument();

  const left = doc.page.margins.left;
  const width = contentWidth(doc);

  // Header
  resetCursor(doc);
  useBold(doc);
  doc
    .fontSize(16)
    .text("Reporte de ventas", left, doc.y, { width, align: "center" });
  useRegular(doc);

  doc.moveDown(0.5);
  resetCursor(doc);
  doc
    .fontSize(10)
    .text(`Período: ${report.rangeLabel}`, left, doc.y, { width });

  doc.moveDown(0.75);

  let grandTotal = 0;

  for (const sn of report.salesNotes) {
    // Page break cushion before a new sale block
    if (doc.y > 720) {
      doc.addPage();
    }

    resetCursor(doc);

    // Use a single line to avoid continued/width quirks
    const headerLine = `Folio: ${sn.folio} • ${dateMX(sn.createdAt)}`;

    useBold(doc);
    doc.fontSize(12).text(headerLine, left, doc.y, { width });
    useRegular(doc);

    doc.fontSize(10).text(`Cliente: ${sn.partyName}`, left, doc.y, { width });
    doc.moveDown(0.25);

    // Table header
    resetCursor(doc);

    const startX = left;
    let y = doc.y;

    const colDesc = startX;
    const colUnit = startX + 300;
    const colQty = startX + 390;
    const colTotal = startX + 460;

    useBold(doc);
    doc.fontSize(10).text("Descripción", colDesc, y);
    doc.text("P. Unit.", colUnit, y, { width: 80, align: "right" });
    doc.text("Cant.", colQty, y, { width: 60, align: "right" });
    doc.text("Importe", colTotal, y, { width: 80, align: "right" });
    useRegular(doc);

    y += 14;
    doc
      .moveTo(startX, y)
      .lineTo(startX + 520, y)
      .stroke();
    y += 8;

    // Lines
    doc.fontSize(10);

    for (const line of sn.lines) {
      // Compute dynamic row height (wrapping-safe)
      const descHeight = doc.heightOfString(line.description, { width: 290 });
      const rowHeight = Math.max(12, descHeight); // 12 ~ one line

      // Page break BEFORE writing the row
      if (y + rowHeight + 10 > 740) {
        doc.addPage();
        resetCursor(doc);
        y = doc.y;

        // Re-draw table header on new page
        useBold(doc);
        doc.fontSize(10).text("Descripción", colDesc, y);
        doc.text("P. Unit.", colUnit, y, { width: 80, align: "right" });
        doc.text("Cant.", colQty, y, { width: 60, align: "right" });
        doc.text("Importe", colTotal, y, { width: 80, align: "right" });
        useRegular(doc);

        y += 14;
        doc
          .moveTo(startX, y)
          .lineTo(startX + 520, y)
          .stroke();
        y += 8;
      }

      // Draw row at y
      doc.text(line.description, colDesc, y, { width: 290 });
      doc.text(money(line.unitPrice), colUnit, y, {
        width: 80,
        align: "right",
      });
      doc.text(formatQty(line.quantity), colQty, y, {
        width: 60,
        align: "right",
      });
      doc.text(money(line.lineTotal), colTotal, y, {
        width: 80,
        align: "right",
      });

      // Advance y safely and keep doc.y in sync
      y += rowHeight + 6;
      doc.y = y;
      resetCursor(doc);
    }

    // Sale total
    doc.moveDown(0.25);
    resetCursor(doc);

    useBold(doc);
    doc
      .fontSize(11)
      .text(`Total de la venta: ${money(sn.total)}`, left, doc.y, {
        width,
        align: "right",
      });
    useRegular(doc);

    grandTotal += sn.total;

    doc.moveDown(0.9);
  }

  // Grand total
  resetCursor(doc);
  useBold(doc);
  doc.fontSize(12).text(`Gran total: ${money(grandTotal)}`, left, doc.y, {
    width,
    align: "right",
  });
  useRegular(doc);

  doc.moveDown(1);
  resetCursor(doc);

  doc.end();

  const fileName = `reporte-ventas-${safeFileNamePart(report.rangeLabel)}.pdf`;
  return { doc, fileName };
}
