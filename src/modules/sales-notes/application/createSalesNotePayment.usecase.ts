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

export async function createSalesNotePaymentUseCase(params: {
  salesNoteId: string;
  values: SalesNotePaymentFormValues;
}) {
  const { salesNoteId, values } = params;

  return prisma.$transaction(async (tx) => {
    const note = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: { id: true, partyId: true, total: true, folio: true },
    });

    if (!note) throw new Error("La nota de venta no existe.");

    // Remaining validation: based on existing IN payments
    const agg = await tx.payment.aggregate({
      where: { salesNoteId: note.id, direction: PaymentDirection.IN },
      _sum: { amount: true },
    });

    const paid = agg._sum.amount ?? zeroDecimal();
    const remainingRaw = note.total.sub(paid);
    const remaining = remainingRaw.lt(0) ? zeroDecimal() : remainingRaw;

    const amount = toDecimal(values.amount);
    if (amount.gt(remaining)) {
      throw new Error("El monto excede el saldo pendiente.");
    }

    const occurredAt = new Date();

    const created = await tx.payment.create({
      data: {
        salesNoteId: note.id,
        partyId: note.partyId,
        direction: PaymentDirection.IN, // ✅ inferred
        paymentType: values.paymentType,
        amount,
        reference: safeTrim(values.reference) || null,
        notes: safeTrim(values.notes) || null,
        occurredAt,
      },
      select: { id: true, amount: true, occurredAt: true },
    });

    // Ledger entry: payment reduces receivable (RECEIVABLE -amount)
    await ensureSingleLedgerEntryForSource(tx, {
      partyId: note.partyId,
      side: PartyLedgerSide.RECEIVABLE,
      sourceType: PartyLedgerSourceType.PAYMENT,
      sourceId: created.id,
      reference: note.folio, // ✅ reference folio for statement/search
      occurredAt: created.occurredAt,
      amount: created.amount.mul(-1), // ✅ signed negative
      notes: safeTrim(values.notes) || null,
    });

    return { paymentId: created.id };
  });
}
