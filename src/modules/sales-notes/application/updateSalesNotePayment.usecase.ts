import { PaymentDirection, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import { toDecimal } from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";

export async function updateSalesNotePaymentUseCase(params: {
  salesNoteId: string;
  paymentId: string;
  values: SalesNotePaymentFormValues;
}) {
  const { salesNoteId, paymentId, values } = params;

  return prisma.$transaction(async (tx) => {
    const note = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: { id: true, total: true },
    });
    if (!note) throw new Error("La nota de venta no existe.");

    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, salesNoteId: true, direction: true },
    });

    if (!payment) throw new Error("El pago no existe.");
    if (payment.salesNoteId !== note.id)
      throw new Error("El pago no pertenece a esta nota de venta.");
    if (payment.direction !== PaymentDirection.IN)
      throw new Error("Solo se permiten pagos de entrada para notas de venta.");

    const agg = await tx.payment.aggregate({
      where: {
        salesNoteId: note.id,
        direction: PaymentDirection.IN,
        NOT: { id: payment.id },
      },
      _sum: { amount: true },
    });

    const paidWithout = agg._sum.amount ?? new Prisma.Decimal(0);
    const maxRaw = note.total.sub(paidWithout);
    const maxAllowed = maxRaw.lt(0) ? new Prisma.Decimal(0) : maxRaw;

    const amount = toDecimal(values.amount);
    if (amount.gt(maxAllowed)) {
      throw new Error("El monto excede el saldo pendiente.");
    }

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        paymentType: values.paymentType,
        amount,
        reference: safeTrim(values.reference) || null,
        notes: safeTrim(values.notes) || null,
      },
      select: { id: true },
    });

    return { paymentId: updated.id };
  });
}
