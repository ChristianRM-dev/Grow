import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type QuotationLineDetailsDto = {
  id: string;
  productVariantId: string | null;
  descriptionSnapshot: string;
  quantity: string;
  quotedUnitPrice: string;
  lineTotal: string;
};

export type QuotationDetailsDto = {
  id: string;
  folio: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  party: { id: string; name: string };
  total: string;
  registeredLines: QuotationLineDetailsDto[];
  externalLines: QuotationLineDetailsDto[];
};

function decToString(v: Prisma.Decimal | null | undefined): string {
  return (v ?? new Prisma.Decimal(0)).toString();
}

export async function getQuotationDetailsById(
  id: string
): Promise<QuotationDetailsDto | null> {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: {
      id: true,
      folio: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      total: true,
      party: { select: { id: true, name: true } },
      lines: {
        select: {
          id: true,
          productVariantId: true,
          descriptionSnapshot: true,
          quantity: true,
          quotedUnitPrice: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!quotation) return null;

  const linesDto: QuotationLineDetailsDto[] = quotation.lines.map((l) => {
    const quantity = l.quantity ?? new Prisma.Decimal(0);
    const unitPrice = l.quotedUnitPrice ?? new Prisma.Decimal(0);
    const lineTotal = quantity.mul(unitPrice);

    return {
      id: l.id,
      productVariantId: l.productVariantId ?? null,
      descriptionSnapshot: l.descriptionSnapshot,
      quantity: decToString(quantity),
      quotedUnitPrice: decToString(unitPrice),
      lineTotal: decToString(lineTotal),
    };
  });

  const computedTotal = linesDto.reduce((acc, l) => {
    return acc.add(new Prisma.Decimal(l.lineTotal));
  }, new Prisma.Decimal(0));

  const total = quotation.total ?? computedTotal;

  return {
    id: quotation.id,
    folio: quotation.folio,
    status: String(quotation.status),
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString(),
    party: quotation.party,
    total: decToString(total),
    registeredLines: linesDto.filter((l) => l.productVariantId !== null),
    externalLines: linesDto.filter((l) => l.productVariantId === null),
  };
}
