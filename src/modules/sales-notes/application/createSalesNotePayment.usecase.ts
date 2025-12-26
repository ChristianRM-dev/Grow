import { PaymentDirection, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";

function toDecimal(value: string | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}

export async function createSalesNotePaymentUseCase(params: {
  salesNoteId: string;
  values: SalesNotePaymentFormValues;
}) {
  const { salesNoteId, values } = params;

  return prisma.$transaction(async (tx) => {
    const note = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: { id: true, partyId: true, total: true },
    });

    if (!note) throw new Error("La nota de venta no existe.");

    const agg = await tx.payment.aggregate({
      where: { salesNoteId: note.id, direction: PaymentDirection.IN },
      _sum: { amount: true },
    });

    const paid = agg._sum.amount ?? new Prisma.Decimal(0);
    const remainingRaw = note.total.sub(paid);
    const remaining = remainingRaw.lt(0) ? new Prisma.Decimal(0) : remainingRaw;

    const amount = toDecimal(values.amount);
    if (amount.gt(remaining)) {
      throw new Error("El monto excede el saldo pendiente.");
    }

    const created = await tx.payment.create({
      data: {
        salesNoteId: note.id,
        partyId: note.partyId,
        direction: PaymentDirection.IN, // ✅ inferred
        paymentType: values.paymentType,
        amount,
        reference: safeTrim(values.reference) || null,
        notes: safeTrim(values.notes) || null,
        occurredAt: new Date(),
      },
      select: { id: true },
    });

    return { paymentId: created.id };
  });
}
