import {
  PaymentDirection,
  PartyLedgerSide,
  PartyLedgerSourceType,
  AuditAction,
  AuditEntityType,
  AuditChangeKey,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import { toDecimal } from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";
import { ensureSingleLedgerEntryForSource } from "@/modules/shared/ledger/partyLedger";

import { type UseCaseContext } from "@/modules/shared/observability/scopedLogger";

import { createAuditLog } from "@/modules/shared/audit/createAuditLog.helper";
import { auditDecimalChange } from "@/modules/shared/audit/auditChanges";
import { computeSalesNoteBalance } from "./computeSalesNoteBalance";

export async function updateSalesNotePaymentUseCase(
  params: {
    salesNoteId: string;
    paymentId: string;
    values: SalesNotePaymentFormValues;
  },
  ctx?: UseCaseContext
) {
  const { salesNoteId, paymentId, values } = params;

  return prisma.$transaction(async (tx) => {
    const note = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: { id: true, total: true, partyId: true, folio: true },
    });
    if (!note) throw new Error("La nota de venta no existe.");

    const existingPayment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        salesNoteId: true,
        direction: true,
        occurredAt: true,
        amount: true,
      },
    });

    if (!existingPayment) throw new Error("El pago no existe.");
    if (existingPayment.salesNoteId !== note.id)
      throw new Error("El pago no pertenece a esta nota de venta.");
    if (existingPayment.direction !== PaymentDirection.IN)
      throw new Error("Solo se permiten pagos de entrada para notas de venta.");

    const amountBefore = existingPayment.amount ?? toDecimal(0);

    // ✅ Balance BEFORE (audit)
    const balanceBefore = await computeSalesNoteBalance(tx, note.id);

    // Remaining validation excluding this payment
    const agg = await tx.payment.aggregate({
      where: {
        salesNoteId: note.id,
        direction: PaymentDirection.IN,
        NOT: { id: existingPayment.id },
      },
      _sum: { amount: true },
    });

    const paidWithout = agg._sum.amount ?? toDecimal(0);
    const maxRaw = note.total.sub(paidWithout);
    const maxAllowed = maxRaw.lt(0) ? toDecimal(0) : maxRaw;

    const amount = toDecimal(values.amount);
    if (amount.lte(0)) {
      throw new Error("El monto del pago debe ser mayor a 0.");
    }
    if (amount.gt(maxAllowed)) {
      throw new Error("El monto excede el saldo pendiente.");
    }

    const updated = await tx.payment.update({
      where: { id: existingPayment.id },
      data: {
        partyId: note.partyId,
        paymentType: values.paymentType,
        amount,
        reference: safeTrim(values.reference) || null,
        notes: safeTrim(values.notes) || null,
        // occurredAt intentionally unchanged
      },
      select: { id: true, amount: true, reference: true, occurredAt: true },
    });

    await ensureSingleLedgerEntryForSource(tx, {
      partyId: note.partyId,
      side: PartyLedgerSide.RECEIVABLE,
      sourceType: PartyLedgerSourceType.PAYMENT,
      sourceId: updated.id,
      reference: note.folio,
      occurredAt: existingPayment.occurredAt, // keep original occurredAt
      amount: updated.amount?.mul(toDecimal(-1)) ?? toDecimal(0),
      notes: safeTrim(values.notes) || null,
    });

    const balanceAfter = await computeSalesNoteBalance(tx, note.id);

    await createAuditLog(
      tx,
      {
        action: AuditAction.UPDATE,
        eventKey: "salesNote.payment.updated",
        entityType: AuditEntityType.PAYMENT,
        entityId: updated.id,
        rootEntityType: AuditEntityType.SALES_NOTE,
        rootEntityId: note.id,
        reference: safeTrim(updated.reference ?? "") || null,
        occurredAt: updated.occurredAt,
        changes: [
          auditDecimalChange(
            AuditChangeKey.PAYMENT_AMOUNT,
            amountBefore,
            updated.amount
          ),
          auditDecimalChange(
            AuditChangeKey.SALES_NOTE_BALANCE_DUE,
            balanceBefore.balance,
            balanceAfter.balance
          ),
        ],
      },
      ctx
    );

    return { paymentId: updated.id };
  });
}
