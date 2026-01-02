import PDFDocument from "pdfkit";
import { PrismaClient } from "@/generated/prisma/client";

import { toNumber } from "@/modules/shared/utils/toNumber";
import { parseDescriptionSnapshotName } from "@/modules/shared/snapshots/parseDescriptionSnapshotName";
import { createInterPdfDoc, setPdfFont } from "@/modules/shared/pdf/pdfDoc";

type PdfResult = { doc: PDFKit.PDFDocument; fileName: string };

export async function generateQuotationPdf(
  prisma: PrismaClient,
  quotationId: string
): Promise<PdfResult> {
  const logPrefix = `[generateQuotationPdf]`;

  console.info(`${logPrefix} start`, { quotationId });

  if (!quotationId || typeof quotationId !== "string") {
    const err = new Error("INVALID_ID");
    (err as any).code = "INVALID_ID";
    throw err;
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: {
      id: true,
      folio: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      total: true,
      party: { select: { name: true, phone: true } },
      lines: {
        select: {
          descriptionSnapshot: true,
          quantity: true,
          quotedUnitPrice: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!quotation) {
    const err = new Error("NOT_FOUND");
    (err as any).code = "NOT_FOUND";
    throw err;
  }

  // Create PDF (Inter as default font to avoid Helvetica.afm)
  const { doc } = createInterPdfDoc({ size: "A4", margin: 40 });

  // Header
  setPdfFont(doc, "bold");
  doc.fontSize(16).text("Cotización", { align: "center" });
  doc.moveDown(0.5);

  setPdfFont(doc, "regular");
  doc.fontSize(10);
  doc.text(`Folio: ${quotation.folio}`);
  doc.text(`Estado: ${quotation.status}`);
  doc.text(`Fecha: ${new Date(quotation.createdAt).toLocaleString("es-MX")}`);
  doc.text(
    `Cliente: ${quotation.party.name}${
      quotation.party.phone ? ` (${quotation.party.phone})` : ""
    }`
  );
  doc.moveDown();

  // Table header
  const startX = doc.x;
  let y = doc.y;

  const colQty = startX;
  const colDesc = startX + 60;
  const colUnit = startX + 360;
  const colTotal = startX + 460;

  setPdfFont(doc, "bold");
  doc.fontSize(10);
  doc.text("Cant.", colQty, y);
  doc.text("Descripción", colDesc, y);
  doc.text("P. Unit.", colUnit, y, { width: 80, align: "right" });
  doc.text("Importe", colTotal, y, { width: 80, align: "right" });

  y += 14;
  doc
    .moveTo(startX, y)
    .lineTo(startX + 520, y)
    .stroke();
  y += 8;

  // Lines
  setPdfFont(doc, "regular");
  doc.fontSize(10);

  let computedTotal = 0;

  for (const line of quotation.lines) {
    const qty = toNumber(line.quantity);
    const unit = toNumber(line.quotedUnitPrice);
    const lineTotal = qty * unit;
    computedTotal += lineTotal;

    const desc = parseDescriptionSnapshotName(line.descriptionSnapshot);

    doc.text(qty.toFixed(3).replace(/\.?0+$/, ""), colQty, y, { width: 55 });
    doc.text(desc, colDesc, y, { width: 290 });
    doc.text(`$${unit.toFixed(2)}`, colUnit, y, { width: 80, align: "right" });
    doc.text(`$${lineTotal.toFixed(2)}`, colTotal, y, {
      width: 80,
      align: "right",
    });

    y = doc.y + 8;

    if (y > 740) {
      doc.addPage();
      y = doc.y;
      setPdfFont(doc, "regular");
      doc.fontSize(10);
    }
  }

  doc.moveDown();

  // Total (prefer stored total if present, else computed)
  const storedTotal =
    quotation.total == null ? null : toNumber(quotation.total);
  const grandTotal = storedTotal ?? computedTotal;

  setPdfFont(doc, "bold");
  doc.fontSize(12).text(`Total: $${grandTotal.toFixed(2)}`, { align: "right" });

  // Footer
  doc.moveDown(1.5);
  setPdfFont(doc, "regular");
  doc
    .fontSize(9)
    .text("Esta cotización no genera adeudos hasta confirmarse la venta.", {
      align: "center",
    });

  doc.end();

  const fileName = `cotizacion-${quotation.folio}.pdf`;
  console.info(`${logPrefix} pdf generated`, { fileName });

  return { doc, fileName };
}
