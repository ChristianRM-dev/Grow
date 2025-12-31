import {
  PaymentDirection,
  Prisma,
  PartyLedgerSide,
  PartyLedgerSourceType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import { toDecimal, zeroDecimal } from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";
import { ensureSingleLedgerEntryForSource } from "@/modules/shared/ledger/partyLedger";

export async function updateSalesNotePaymentUseCase(params: {
  salesNoteId: string;
  paymentId: string;
  values: SalesNotePaymentFormValues;
}) {
  const { salesNoteId, paymentId, values } = params;

  return prisma.$transaction(async (tx) => {
    const note = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: { id: true, total: true, partyId: true, folio: true },
    });
    if (!note) throw new Error("La nota de venta no existe.");

    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        salesNoteId: true,
        direction: true,
        occurredAt: true,
      },
    });

    if (!payment) throw new Error("El pago no existe.");
    if (payment.salesNoteId !== note.id)
      throw new Error("El pago no pertenece a esta nota de venta.");
    if (payment.direction !== PaymentDirection.IN)
      throw new Error("Solo se permiten pagos de entrada para notas de venta.");

    // Remaining validation excluding this payment
    const agg = await tx.payment.aggregate({
      where: {
        salesNoteId: note.id,
        direction: PaymentDirection.IN,
        NOT: { id: payment.id },
      },
      _sum: { amount: true },
    });

    const paidWithout = agg._sum.amount ?? zeroDecimal();
    const maxRaw = note.total.sub(paidWithout);
    const maxAllowed = maxRaw.lt(0) ? zeroDecimal() : maxRaw;

    const amount = toDecimal(values.amount);
    if (amount.gt(maxAllowed)) {
      throw new Error("El monto excede el saldo pendiente.");
    }

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        partyId: note.partyId, // keep consistent if customer changed
        paymentType: values.paymentType,
        amount,
        reference: safeTrim(values.reference) || null,
        notes: safeTrim(values.notes) || null,
      },
      select: { id: true, amount: true },
    });

    // Ledger entry: payment reduces receivable (RECEIVABLE -amount)
    await ensureSingleLedgerEntryForSource(tx, {
      partyId: note.partyId,
      side: PartyLedgerSide.RECEIVABLE,
      sourceType: PartyLedgerSourceType.PAYMENT,
      sourceId: updated.id,
      reference: note.folio,
      occurredAt: payment.occurredAt, // keep original occurredAt
      amount: updated.amount ? updated.amount.mul(-1) : toDecimal(0),
      notes: safeTrim(values.notes) || null,
    });

    return { paymentId: updated.id };
  });
}
