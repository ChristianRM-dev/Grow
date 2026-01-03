import { PrismaClient } from "@/generated/prisma/client";

import { toNumber } from "@/modules/shared/utils/toNumber";
import { parseDescriptionSnapshotName } from "@/modules/shared/snapshots/parseDescriptionSnapshotName";
import { createPdfDocument, useBold, useRegular } from "@/modules/shared/pdf";
import { safeFileNamePart } from "@/modules/shared/pdf/pdfFileName";

type PdfResult = { doc: PDFKit.PDFDocument; fileName: string };

function safeJson(value: unknown) {
  try {
    return JSON.stringify(
      value,
      (_k, v) => (typeof v === "bigint" ? v.toString() : v),
      2
    );
  } catch {
    return String(value);
  }
}

export async function generateQuotationPdf(
  prisma: PrismaClient,
  quotationId: string
): Promise<PdfResult> {
  const logPrefix = `[generateQuotationPdf]`;

  console.info(`${logPrefix} start`, { quotationId });

  if (!quotationId || typeof quotationId !== "string") {
    console.warn(`${logPrefix} invalid id`, { quotationId });
    const err = new Error("INVALID_ID");
    (err as any).code = "INVALID_ID";
    throw err;
  }

  const query = {
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
        orderBy: { id: "asc" as const },
      },
    },
  } as const;

  console.debug(`${logPrefix} prisma query`, safeJson(query));

  let quotation: any;
  try {
    quotation = await prisma.quotation.findUnique(query as any);
    console.info(`${logPrefix} query ok`, {
      found: Boolean(quotation),
      folio: quotation?.folio,
      linesCount: quotation?.lines?.length ?? 0,
    });
  } catch (e: any) {
    console.error(`${logPrefix} prisma query failed`, {
      name: e?.name,
      message: e?.message,
      code: e?.code,
      meta: e?.meta,
      stack: e?.stack,
    });
    throw e;
  }

  if (!quotation) {
    const err = new Error("NOT_FOUND");
    (err as any).code = "NOT_FOUND";
    throw err;
  }

  // Compute total from lines (source of truth for PDF)
  const computedTotal = (quotation.lines ?? []).reduce(
    (acc: number, l: any) => {
      const qty = toNumber(l.quantity);
      const unit = toNumber(l.quotedUnitPrice);
      return acc + qty * unit;
    },
    0
  );

  const storedTotal =
    quotation.total !== null && quotation.total !== undefined
      ? toNumber(quotation.total)
      : null;

  if (storedTotal !== null && Math.abs(storedTotal - computedTotal) > 0.01) {
    console.warn(`${logPrefix} total mismatch`, {
      folio: quotation.folio,
      storedTotal,
      computedTotal,
    });
  }

  // Create PDF (shared core: Inter fonts + defaults)
  const doc = createPdfDocument();

  // Header
  useBold(doc);
  doc.fontSize(16).text("Cotización", { align: "center" });
  useRegular(doc);

  doc.moveDown(0.5);

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

  useBold(doc);
  doc.fontSize(10).text("Cant.", colQty, y);
  doc.text("Descripción", colDesc, y);
  doc.text("P. Unit.", colUnit, y, { width: 80, align: "right" });
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
  for (const line of quotation.lines ?? []) {
    const qty = toNumber(line.quantity);
    const unit = toNumber(line.quotedUnitPrice);
    const lineTotal = qty * unit;

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
    }
  }

  doc.moveDown();

  // Total
  useBold(doc);
  doc.fontSize(12).text(`Total: $${computedTotal.toFixed(2)}`, {
    align: "right",
  });
  useRegular(doc);

  doc.moveDown(1.5);
  doc.fontSize(9).text("Gracias por su preferencia.", { align: "center" });

  doc.end();

  const fileName = `cotizacion-${safeFileNamePart(
    String(quotation.folio)
  )}.pdf`;

  console.info(`${logPrefix} pdf generated`, { fileName });

  return { doc, fileName };
}
