import { prisma } from "@/lib/prisma";
import { Prisma, PaymentDirection } from "@/generated/prisma/client";

export type SupplierPurchaseForPaymentDto = {
  id: string; // supplierPurchaseId
  party: { id: string; name: string };
  supplierFolio: string;

  total: string; // decimal string
  paidTotal: string; // decimal string
  remainingTotal: string; // decimal string
  isFullyPaid: boolean;

  occurredAt: string; // YYYY-MM-DD
};

export async function getSupplierPurchaseForPaymentById(id: string) {
  const row = await prisma.supplierPurchase.findUnique({
    where: { id },
    select: {
      id: true,
      supplierFolio: true,
      total: true,
      occurredAt: true,
      party: { select: { id: true, name: true } },
    },
  });

  if (!row) return null;

  const paidAgg = await prisma.payment.aggregate({
    where: {
      direction: PaymentDirection.OUT,
      supplierPurchaseId: row.id, // ✅ FK
    },
    _sum: { amount: true },
  });

  const paid = (paidAgg._sum.amount ?? new Prisma.Decimal(0)) as Prisma.Decimal;
  const total = row.total as Prisma.Decimal;

  const remainingRaw = total.sub(paid);
  const remaining = remainingRaw.lt(0) ? new Prisma.Decimal(0) : remainingRaw;

  return {
    id: row.id,
    party: { id: row.party.id, name: row.party.name },
    supplierFolio: row.supplierFolio,
    total: total.toString(),
    paidTotal: paid.toString(),
    remainingTotal: remaining.toString(),
    isFullyPaid: remaining.lte(0),
    occurredAt: row.occurredAt.toISOString().slice(0, 10),
  } satisfies SupplierPurchaseForPaymentDto;
}
