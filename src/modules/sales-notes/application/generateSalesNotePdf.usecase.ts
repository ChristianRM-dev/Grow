// src/modules/sales-notes/application/generateSalesNotePdf.usecase.ts
import PDFDocument from "pdfkit";
import path from "node:path";
import fs from "node:fs";
import { toNumber } from "@/modules/shared/utils/toNumber";
import { parseDescriptionSnapshotName } from "@/modules/shared/snapshots/parseDescriptionSnapshotName";
import { PrismaClient } from "@/generated/prisma/client";

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

export async function generateSalesNotePdf(
  prisma: PrismaClient,
  salesNoteId: string
): Promise<PdfResult> {
  const logPrefix = `[generateSalesNotePdf]`;

  console.info(`${logPrefix} start`, { salesNoteId });

  if (!salesNoteId || typeof salesNoteId !== "string") {
    console.warn(`${logPrefix} invalid id`, { salesNoteId });
    const err = new Error("INVALID_ID");
    (err as any).code = "INVALID_ID";
    throw err;
  }

  console.debug(`${logPrefix} prisma models`, {
    hasSalesNote: typeof (prisma as any)?.salesNote !== "undefined",
    hasPayment: typeof (prisma as any)?.payment !== "undefined",
  });

  const query = {
    where: { id: salesNoteId },
    select: {
      id: true,
      folio: true,
      createdAt: true,
      updatedAt: true,
      status: true,

      subtotal: true,
      discountTotal: true,
      total: true,

      party: { select: { name: true, phone: true } },

      lines: {
        select: {
          descriptionSnapshot: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
        orderBy: { id: "asc" as const },
      },

      payments: {
        select: {
          direction: true,
          paymentType: true,
          amount: true,
          reference: true,
          occurredAt: true,
          notes: true,
        },
        orderBy: { occurredAt: "asc" as const },
      },
    },
  } as const;

  console.debug(`${logPrefix} prisma query`, safeJson(query));

  let salesNote: any;
  try {
    salesNote = await prisma.salesNote.findUnique(query as any);
    console.info(`${logPrefix} query ok`, {
      found: Boolean(salesNote),
      folio: salesNote?.folio,
      linesCount: salesNote?.lines?.length ?? 0,
      paymentsCount: salesNote?.payments?.length ?? 0,
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

  if (!salesNote) {
    const err = new Error("NOT_FOUND");
    (err as any).code = "NOT_FOUND";
    throw err;
  }

  // --- Fonts (absolute paths) ---
  const interRegularPath = path.join(
    process.cwd(),
    "src/assets/fonts/Inter-Regular.ttf"
  );
  const interBoldPath = path.join(
    process.cwd(),
    "src/assets/fonts/Inter-Bold.ttf"
  );

  const regularExists = fs.existsSync(interRegularPath);
  const boldExists = fs.existsSync(interBoldPath);

  console.debug(`${logPrefix} font paths`, {
    interRegularPath,
    interBoldPath,
    regularExists,
    boldExists,
  });

  if (!regularExists || !boldExists) {
    const err = new Error("FONTS_NOT_FOUND");
    (err as any).code = "FONTS_NOT_FOUND";
    (err as any).meta = { interRegularPath, interBoldPath };
    throw err;
  }

  /**
   * IMPORTANT:
   * PDFKit loads Helvetica as the default font during PDFDocument construction.
   * To avoid looking for Helvetica.afm in Next.js environments, set a custom default font
   * using the constructor option `font`.
   */
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    font: interRegularPath, // ✅ prevents Helvetica.afm lookup
  });

  // Register named fonts for switching
  doc.registerFont("Inter", interRegularPath);
  doc.registerFont("Inter-Bold", interBoldPath);

  // Header
  doc
    .font("Inter-Bold")
    .fontSize(16)
    .text("Nota de venta", { align: "center" });
  doc.moveDown(0.5);

  doc.font("Inter").fontSize(10);
  doc.text(`Folio: ${salesNote.folio}`);
  doc.text(`Estado: ${salesNote.status}`);
  doc.text(`Fecha: ${new Date(salesNote.createdAt).toLocaleString("es-MX")}`);
  doc.text(
    `Cliente: ${salesNote.party.name}${
      salesNote.party.phone ? ` (${salesNote.party.phone})` : ""
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

  doc.font("Inter-Bold").fontSize(10);
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
  doc.font("Inter").fontSize(10);

  for (const line of salesNote.lines) {
    const qty = toNumber(line.quantity);
    const unit = toNumber(line.unitPrice);
    const total = toNumber(line.lineTotal);
    const desc = parseDescriptionSnapshotName(line.descriptionSnapshot);

    doc.text(qty.toFixed(3).replace(/\.?0+$/, ""), colQty, y, { width: 55 });
    doc.text(desc, colDesc, y, { width: 290 });
    doc.text(`$${unit.toFixed(2)}`, colUnit, y, { width: 80, align: "right" });
    doc.text(`$${total.toFixed(2)}`, colTotal, y, {
      width: 80,
      align: "right",
    });

    y = doc.y + 8;

    if (y > 740) {
      doc.addPage();
      y = doc.y;
      doc.font("Inter").fontSize(10);
    }
  }

  doc.moveDown();

  // Totals block
  const subtotal = toNumber(salesNote.subtotal);
  const discount = toNumber(salesNote.discountTotal);
  const grandTotal = toNumber(salesNote.total);

  doc.font("Inter").fontSize(11);
  doc.text(`Subtotal: $${subtotal.toFixed(2)}`, { align: "right" });
  doc.text(`Descuento: $${discount.toFixed(2)}`, { align: "right" });
  doc
    .font("Inter-Bold")
    .fontSize(12)
    .text(`Total: $${grandTotal.toFixed(2)}`, {
      align: "right",
    });

  // Payments summary (only IN for sales notes)
  const paymentsIn = (salesNote.payments ?? []).filter(
    (p: any) => p.direction === "IN"
  );
  const paid = paymentsIn.reduce(
    (acc: number, p: any) => acc + toNumber(p.amount),
    0
  );
  const pending = Math.max(0, grandTotal - paid);

  doc.moveDown(0.5);
  doc
    .font("Inter")
    .fontSize(11)
    .text(`Pagado: $${paid.toFixed(2)}`, { align: "right" });
  doc.text(`Pendiente: $${pending.toFixed(2)}`, { align: "right" });

  if (paymentsIn.length > 0) {
    doc.moveDown();
    doc.font("Inter-Bold").fontSize(10).text("Pagos", { underline: true });
    doc.moveDown(0.25);

    doc.font("Inter").fontSize(10);
    for (const p of paymentsIn) {
      const amount = toNumber(p.amount);
      const date = new Date(p.occurredAt).toLocaleString("es-MX");
      const ref = p.reference ? ` • Ref: ${p.reference}` : "";
      doc.text(`${date} • ${p.paymentType} • $${amount.toFixed(2)}${ref}`);
    }
  }

  doc.moveDown(1.5);
  doc
    .font("Inter")
    .fontSize(9)
    .text("Gracias por su compra.", { align: "center" });

  doc.end();

  const fileName = `nota-venta-${salesNote.folio}.pdf`;
  console.info(`${logPrefix} pdf generated`, { fileName });

  return { doc, fileName };
}
