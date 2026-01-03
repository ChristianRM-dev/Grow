import PDFDocument from "pdfkit";
import type { SalesReportDto } from "@/modules/reports/queries/getSalesReport.dto";
import { money, dateMX } from "@/modules/shared/utils/formatters";

type PdfResult = { doc: PDFKit.PDFDocument; fileName: string };

function formatQty(qty: number) {
  return qty.toFixed(3).replace(/\.?0+$/, "");
}

function safeFileName(value: string) {
  // Keep filename stable and filesystem-safe
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .slice(0, 80);
}

export function generateSalesReportPdf(report: SalesReportDto): PdfResult {
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  // Header
  doc.fontSize(16).text("Reporte de ventas", { align: "center" });
  doc.moveDown(0.5);

  doc.fontSize(10);
  doc.text(`Período: ${report.rangeLabel}`);
  doc.moveDown(0.75);

  let grandTotal = 0;

  for (const sn of report.salesNotes) {
    // Sale header block
    doc.fontSize(12).text(`Folio: ${sn.folio}`, { continued: true });
    doc.fontSize(10).text(`  •  ${dateMX(sn.createdAt)}`);
    doc.fontSize(10).text(`Cliente: ${sn.partyName}`);
    doc.moveDown(0.25);

    // Table header
    const startX = doc.x;
    let y = doc.y;

    const colDesc = startX;
    const colUnit = startX + 300;
    const colQty = startX + 390;
    const colTotal = startX + 460;

    doc.fontSize(10).text("Descripción", colDesc, y);
    doc.text("P. Unit.", colUnit, y, { width: 80, align: "right" });
    doc.text("Cant.", colQty, y, { width: 60, align: "right" });
    doc.text("Importe", colTotal, y, { width: 80, align: "right" });

    y += 14;
    doc
      .moveTo(startX, y)
      .lineTo(startX + 520, y)
      .stroke();
    y += 8;

    // Lines
    doc.fontSize(10);
    for (const line of sn.lines) {
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

      y = doc.y + 6;

      // Page break safety
      if (y > 740) {
        doc.addPage();
        y = doc.y;
      }
    }

    // Sale total
    doc.moveDown(0.25);
    doc
      .fontSize(11)
      .text(`Total de la venta: ${money(sn.total)}`, { align: "right" });

    grandTotal += sn.total;

    doc.moveDown(0.9);

    // Extra page break cushion between notes
    if (doc.y > 740) {
      doc.addPage();
    }
  }

  // Grand total
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Gran total: ${money(grandTotal)}`, { align: "right" });

  // Footer
  doc.moveDown(1);
  doc.fontSize(9).text("Generado por Grow.", { align: "center" });

  doc.end();

  const fileName = `reporte-ventas-${safeFileName(report.rangeLabel)}.pdf`;

  return { doc, fileName };
}
