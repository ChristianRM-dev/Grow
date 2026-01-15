import { prisma } from "@/lib/prisma";
import {
  Prisma,
  PaymentDirection,
  PaymentType,
} from "@/generated/prisma/client";
import {
  assertNotSoftDeleted,
  excludeSoftDeletedPayments,
} from "@/modules/shared/queries/softDeleteHelpers";

export type SupplierPurchasePaymentRowDto = {
  id: string;
  paymentType: PaymentType;
  amount: string;
  occurredAt: string; // ISO
  reference: string | null;
  notes: string | null;
};

export type SupplierPurchaseDetailsDto = {
  id: string;
  supplierFolio: string;
  occurredAt: string; // ISO
  createdAt: string; // ISO
  total: string;
  notes: string | null;

  party: {
    id: string;
    name: string;
  };

  paidTotal: string;
  remainingTotal: string;
  isFullyPaid: boolean;

  payments: SupplierPurchasePaymentRowDto[];
};

export async function getSupplierPurchaseDetailsById(id: string) {
  const supplierPurchaseId = String(id ?? "").trim();
  if (!supplierPurchaseId) return null;

  const purchase = await prisma.supplierPurchase.findUnique({
    where: { id: supplierPurchaseId },
    select: {
      id: true,
      supplierFolio: true,
      occurredAt: true,
      createdAt: true,
      total: true,
      notes: true,
      isDeleted: true, // ← Necesario para verificar soft-delete
      party: { select: { id: true, name: true } },
    },
  });

  // Redirigir a 404 si está eliminada o no existe
  assertNotSoftDeleted(purchase, "Compra de proveedor");

  const payments = await prisma.payment.findMany({
    where: {
      direction: PaymentDirection.OUT,
      supplierPurchaseId: purchase.id,
      ...excludeSoftDeletedPayments, // ← Filtrar pagos eliminados
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      paymentType: true,
      amount: true,
      occurredAt: true,
      reference: true,
      notes: true,
    },
  });

  const agg = await prisma.payment.aggregate({
    where: {
      direction: PaymentDirection.OUT,
      supplierPurchaseId: purchase.id,
      ...excludeSoftDeletedPayments, // ← Filtrar pagos eliminados en aggregate
    },
    _sum: { amount: true },
  });

  const total = purchase.total as Prisma.Decimal;
  const paid = (agg._sum.amount ?? new Prisma.Decimal(0)) as Prisma.Decimal;

  const remainingRaw = total.sub(paid);
  const remaining = remainingRaw.lt(0) ? new Prisma.Decimal(0) : remainingRaw;

  const dto: SupplierPurchaseDetailsDto = {
    id: purchase.id,
    supplierFolio: purchase.supplierFolio,
    occurredAt: purchase.occurredAt.toISOString(),
    createdAt: purchase.createdAt.toISOString(),
    total: total.toString(),
    notes: purchase.notes ?? null,
    party: { id: purchase.party.id, name: purchase.party.name },

    paidTotal: paid.toString(),
    remainingTotal: remaining.toString(),
    isFullyPaid: remaining.lte(0),

    payments: payments.map((p) => ({
      id: p.id,
      paymentType: p.paymentType,
      amount: (p.amount ?? new Prisma.Decimal(0)).toString(),
      occurredAt: p.occurredAt.toISOString(),
      reference: p.reference ?? null,
      notes: p.notes ?? null,
    })),
  };

  return dto;
}
