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
import {
  computeOutstandingBalance,
  decimalToString,
} from "@/modules/shared/utils/decimals";

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

  const { isFullyPaid, paid, remaining, total } = computeOutstandingBalance({
    total: purchase.total as Prisma.Decimal,
    paid: agg._sum.amount,
  });

  const dto: SupplierPurchaseDetailsDto = {
    id: purchase.id,
    supplierFolio: purchase.supplierFolio,
    occurredAt: purchase.occurredAt.toISOString(),
    createdAt: purchase.createdAt.toISOString(),
    total: decimalToString(total),
    notes: purchase.notes ?? null,
    party: { id: purchase.party.id, name: purchase.party.name },

    paidTotal: decimalToString(paid),
    remainingTotal: decimalToString(remaining),
    isFullyPaid,

    payments: payments.map((p) => ({
      id: p.id,
      paymentType: p.paymentType,
      amount: decimalToString(p.amount),
      occurredAt: p.occurredAt.toISOString(),
      reference: p.reference ?? null,
      notes: p.notes ?? null,
    })),
  };

  return dto;
}
