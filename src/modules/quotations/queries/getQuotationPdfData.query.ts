// src/modules/quotations/queries/getQuotationPdfData.query.ts
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { PdfLineDto } from "@/modules/shared/pdf/pdfDtos";

export type QuotationPdfDataDto = {
  id: string;
  folio: string;
  createdAtIso: string;

  customerName: string;

  total: string; // Decimal as string
  lines: PdfLineDto[];
};

function dec(v: Prisma.Decimal | null | undefined): Prisma.Decimal {
  return v ?? new Prisma.Decimal(0);
}

export async function getQuotationPdfDataById(
  quotationId: string
): Promise<QuotationPdfDataDto | null> {
  const row = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: {
      id: true,
      folio: true,
      createdAt: true,
      total: true,
      party: { select: { name: true } },
      lines: {
        orderBy: { id: "asc" },
        select: {
          descriptionSnapshot: true,
          quantity: true,
          quotedUnitPrice: true,
        },
      },
    },
  });

  if (!row) return null;

  const lines: PdfLineDto[] = row.lines.map((l) => {
    const lineTotal = l.quantity.mul(l.quotedUnitPrice);
    return {
      description: l.descriptionSnapshot,
      quantity: l.quantity.toString(),
      unitPrice: l.quotedUnitPrice.toString(),
      lineTotal: lineTotal.toString(),
    };
  });

  const computedTotal = lines.reduce(
    (acc, l) => acc.add(new Prisma.Decimal(l.lineTotal)),
    new Prisma.Decimal(0)
  );

  const total = (row.total ? dec(row.total) : computedTotal).toString();

  return {
    id: row.id,
    folio: row.folio,
    createdAtIso: row.createdAt.toISOString(),
    customerName: row.party.name,
    total,
    lines,
  };
}
