import { Prisma, PaymentDirection } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";

export type SalesNotePaymentEditDto = {
  salesNoteId: string;
  paymentId: string;
  values: SalesNotePaymentFormValues;
  meta: {
    folio: string;
    partyName: string;
    total: string;
    paidWithoutThisPayment: string;
    maxAllowedAmount: string;
    currentAmount: string;
  };
};

export async function getSalesNotePaymentForEdit(params: {
  salesNoteId: string;
  paymentId: string;
}): Promise<SalesNotePaymentEditDto | null> {
  const { salesNoteId, paymentId } = params;

  const note = await prisma.salesNote.findUnique({
    where: { id: salesNoteId },
    select: {
      id: true,
      folio: true,
      total: true,
      party: { select: { name: true } },
    },
  });
  if (!note) return null;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      salesNoteId: true,
      direction: true,
      paymentType: true,
      amount: true,
      reference: true,
      notes: true,
    },
  });

  if (!payment) return null;
  if (payment.salesNoteId !== note.id) return null;
  if (payment.direction !== PaymentDirection.IN) return null;

  const agg = await prisma.payment.aggregate({
    where: {
      salesNoteId: note.id,
      direction: PaymentDirection.IN,
      NOT: { id: payment.id },
    },
    _sum: { amount: true },
  });

  const paidWithout = agg._sum.amount ?? new Prisma.Decimal(0);
  const currentAmount = payment.amount ?? new Prisma.Decimal(0);

  // Max allowed for this payment = total - paidWithoutThisPayment
  const maxRaw = note.total.sub(paidWithout);
  const maxAllowed = maxRaw.lt(0) ? new Prisma.Decimal(0) : maxRaw;

  // Safety: if data is inconsistent, allow at least keeping current amount.
  const maxSafe = Prisma.Decimal.max(maxAllowed, currentAmount);

  const values: SalesNotePaymentFormValues = {
    paymentType: payment.paymentType,
    amount: currentAmount.toString(),
    reference: payment.reference ?? "",
    notes: payment.notes ?? "",
  };

  return {
    salesNoteId: note.id,
    paymentId: payment.id,
    values,
    meta: {
      folio: note.folio,
      partyName: note.party.name,
      total: note.total.toString(),
      paidWithoutThisPayment: paidWithout.toString(),
      maxAllowedAmount: maxSafe.toString(),
      currentAmount: currentAmount.toString(),
    },
  };
}
