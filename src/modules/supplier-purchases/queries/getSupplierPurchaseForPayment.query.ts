import { prisma } from "@/lib/prisma";
import { Prisma, PaymentDirection } from "@/generated/prisma/client";
import {
  assertNotSoftDeleted,
  excludeSoftDeletedPayments,
} from "@/modules/shared/queries/softDeleteHelpers";
import {
  computeOutstandingBalance,
  decimalToString,
} from "@/modules/shared/utils/decimals";

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
      isDeleted: true, // ← Necesario
      party: { select: { id: true, name: true } },
    },
  });

  // Redirigir a 404 si está eliminada
  assertNotSoftDeleted(row, "Compra de proveedor");

  const paidAgg = await prisma.payment.aggregate({
    where: {
      direction: PaymentDirection.OUT,
      supplierPurchaseId: row.id,
      ...excludeSoftDeletedPayments, // ← Filtrar pagos eliminados
    },
    _sum: { amount: true },
  });

  const { isFullyPaid, paid, remaining, total } = computeOutstandingBalance({
    total: row.total as Prisma.Decimal,
    paid: paidAgg._sum.amount,
  });

  return {
    id: row.id,
    party: { id: row.party.id, name: row.party.name },
    supplierFolio: row.supplierFolio,
    total: decimalToString(total),
    paidTotal: decimalToString(paid),
    remainingTotal: decimalToString(remaining),
    isFullyPaid,
    occurredAt: row.occurredAt.toISOString().slice(0, 10),
  } satisfies SupplierPurchaseForPaymentDto;
}
