import { prisma } from "@/lib/prisma";
import {
  Prisma,
  PaymentDirection,
  PaymentType,
} from "@/generated/prisma/client";

function purchaseToken(purchaseId: string) {
  return `SP:${purchaseId}`;
}

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
    paymentType: PaymentType;
    amount: string;
    occurredAt: string; // YYYY-MM-DD
    reference: string | null;
    notes: string | null;
  };

  // For header + max amount logic (EDIT mode)
  paidWithoutThisPayment: string;
  maxAllowedAmount: string; // remaining + currentAmount
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
      party: { select: { id: true, name: true } },
    },
  });
  if (!purchase) return null;

  const token = purchaseToken(purchase.id);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      partyId: true,
      direction: true,
      paymentType: true,
      amount: true,
      occurredAt: true,
      reference: true,
      notes: true,
    },
  });
  if (!payment) return null;

  // Must be OUT + same party + reference contains token (linked to this purchase)
  const sameParty = payment.partyId === purchase.party.id;
  const isOut = payment.direction === PaymentDirection.OUT;
  const hasToken =
    typeof payment.reference === "string" &&
    payment.reference.toLowerCase().includes(token.toLowerCase());

  if (!sameParty || !isOut || !hasToken) return null;

  // Sum all OUT payments for this purchase token
  const agg = await prisma.payment.aggregate({
    where: {
      direction: PaymentDirection.OUT,
      partyId: purchase.party.id,
      reference: { contains: token, mode: "insensitive" },
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
      paymentType: payment.paymentType,
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
