import { prisma } from "@/lib/prisma";
import { Prisma, PaymentDirection } from "@/generated/prisma/client";
import { toFormPaymentType } from "@/modules/payments/application/paymentTypeMapping";
import {
  assertNotSoftDeleted,
  excludeSoftDeletedPayments,
} from "@/modules/shared/queries/softDeleteHelpers";

export type SupplierPurchasePaymentForEditDto = {
  supplierPurchase: {
    id: string;
    supplierFolio: string;
    occurredAt: string; // YYYY-MM-DD
    total: string;
    party: { id: string; name: string };
  };

  payment: {
    id: string;
    paymentType: "CASH" | "TRANSFER" | "CREDIT" | "EXCHANGE";
    amount: string;
    occurredAt: string; // YYYY-MM-DD
    reference: string | null;
    notes: string | null;
  };

  paidWithoutThisPayment: string;
  maxAllowedAmount: string;
  isLocked: boolean;
};

export async function getSupplierPurchasePaymentForEdit(params: {
  supplierPurchaseId: string;
  paymentId: string;
}) {
  const supplierPurchaseId = String(params.supplierPurchaseId || "").trim();
  const paymentId = String(params.paymentId || "").trim();
  if (!supplierPurchaseId || !paymentId) return null;

  const purchase = await prisma.supplierPurchase.findUnique({
    where: { id: supplierPurchaseId },
    select: {
      id: true,
      supplierFolio: true,
      occurredAt: true,
      total: true,
      isDeleted: true, // ← Necesario
      party: { select: { id: true, name: true } },
    },
  });

  // Redirigir a 404 si la compra está eliminada
  assertNotSoftDeleted(purchase, "Compra de proveedor");

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      partyId: true,
      supplierPurchaseId: true,
      direction: true,
      paymentType: true,
      amount: true,
      occurredAt: true,
      reference: true,
      notes: true,
      isDeleted: true, // ← Necesario
    },
  });

  // Redirigir a 404 si el pago está eliminado
  assertNotSoftDeleted(payment, "Pago");

  // Must be OUT + linked to this purchase
  const isOut = payment.direction === PaymentDirection.OUT;
  const isLinkedToPurchase = payment.supplierPurchaseId === purchase.id;

  // Optional safety: keep party consistency too
  const sameParty = payment.partyId === purchase.party.id;

  if (!isOut || !isLinkedToPurchase || !sameParty) return null;

  // Sum all OUT payments linked to this purchase (excluding soft-deleted)
  const agg = await prisma.payment.aggregate({
    where: {
      direction: PaymentDirection.OUT,
      supplierPurchaseId: purchase.id,
      ...excludeSoftDeletedPayments, // ← Filtrar pagos eliminados
    },
    _sum: { amount: true },
  });

  const total = purchase.total as Prisma.Decimal;
  const paidTotal = (agg._sum.amount ??
    new Prisma.Decimal(0)) as Prisma.Decimal;

  const currentAmount = (payment.amount ??
    new Prisma.Decimal(0)) as Prisma.Decimal;

  // Paid without current payment
  const paidWithout = paidTotal.sub(currentAmount);
  const paidWithoutSafe = paidWithout.lt(0)
    ? new Prisma.Decimal(0)
    : paidWithout;

  // Max allowed in edit = total - paidWithout
  const maxAllowedRaw = total.sub(paidWithoutSafe);
  const maxAllowed = maxAllowedRaw.lt(0)
    ? new Prisma.Decimal(0)
    : maxAllowedRaw;

  return {
    supplierPurchase: {
      id: purchase.id,
      supplierFolio: purchase.supplierFolio,
      occurredAt: purchase.occurredAt.toISOString().slice(0, 10),
      total: total.toString(),
      party: { id: purchase.party.id, name: purchase.party.name },
    },
    payment: {
      id: payment.id,
      paymentType: toFormPaymentType(payment.paymentType),
      amount: currentAmount.toString(),
      occurredAt: payment.occurredAt.toISOString().slice(0, 10),
      reference: payment.reference ?? null,
      notes: payment.notes ?? null,
    },
    paidWithoutThisPayment: paidWithoutSafe.toString(),
    maxAllowedAmount: maxAllowed.toString(),
    isLocked: maxAllowed.lte(0),
  } satisfies SupplierPurchasePaymentForEditDto;
}
