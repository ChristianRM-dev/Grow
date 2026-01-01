import { Prisma, PaymentDirection } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type SalesNoteLineDetailsDto = {
  id: string;
  productVariantId: string | null;
  descriptionSnapshot: string;
  quantity: string; // decimal string
  unitPrice: string; // decimal string
  lineTotal: string; // decimal string
};

export type SalesNotePaymentDetailsDto = {
  id: string;
  paymentType: string; // keep string for client safety
  amount: string; // decimal string
  reference: string | null;
  notes: string | null;
  occurredAt: string; // ISO
  createdAt: string; // ISO
};

export type SalesNoteDetailsDto = {
  id: string;
  folio: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  party: { id: string; name: string };

  subtotal: string;
  discountTotal: string;
  total: string;

  paidTotal: string;
  remainingTotal: string;
  isFullyPaid: boolean;

  registeredLines: SalesNoteLineDetailsDto[];
  externalLines: SalesNoteLineDetailsDto[];

  payments: SalesNotePaymentDetailsDto[];
};

function decToString(v: Prisma.Decimal | null | undefined): string {
  return (v ?? new Prisma.Decimal(0)).toString();
}

export async function getSalesNoteDetailsById(
  id: string
): Promise<SalesNoteDetailsDto | null> {
  const note = await prisma.salesNote.findUnique({
    where: { id },
    select: {
      id: true,
      folio: true,
      createdAt: true,
      updatedAt: true,
      subtotal: true,
      discountTotal: true,
      total: true,
      party: { select: { id: true, name: true } },
      lines: {
        select: {
          id: true,
          productVariantId: true,
          descriptionSnapshot: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!note) return null;

  const payments = await prisma.payment.findMany({
    where: {
      salesNoteId: note.id,
      direction: PaymentDirection.IN,
    },
    select: {
      id: true,
      paymentType: true,
      amount: true,
      reference: true,
      notes: true,
      occurredAt: true,
      createdAt: true,
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });

  const paidAgg = await prisma.payment.aggregate({
    where: {
      salesNoteId: note.id,
      direction: PaymentDirection.IN,
    },
    _sum: { amount: true },
  });

  const paidTotal = paidAgg._sum.amount ?? new Prisma.Decimal(0);
  const remainingRaw = note.total.sub(paidTotal);
  const remaining = remainingRaw.lt(0) ? new Prisma.Decimal(0) : remainingRaw;

  const linesDto: SalesNoteLineDetailsDto[] = note.lines.map((l) => ({
    id: l.id,
    productVariantId: l.productVariantId ?? null,
    descriptionSnapshot: l.descriptionSnapshot,
    quantity: decToString(l.quantity),
    unitPrice: decToString(l.unitPrice),
    lineTotal: decToString(l.lineTotal),
  }));

  return {
    id: note.id,
    folio: note.folio,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    party: note.party,

    subtotal: decToString(note.subtotal),
    discountTotal: decToString(note.discountTotal),
    total: decToString(note.total),

    paidTotal: paidTotal.toString(),
    remainingTotal: remaining.toString(),
    isFullyPaid: remaining.lte(0),

    registeredLines: linesDto.filter((l) => l.productVariantId !== null),
    externalLines: linesDto.filter((l) => l.productVariantId === null),

    payments: payments.map((p) => ({
      id: p.id,
      paymentType: String(p.paymentType),
      amount: decToString(p.amount),
      reference: p.reference,
      notes: p.notes,
      occurredAt: p.occurredAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
    })),
  };
}
