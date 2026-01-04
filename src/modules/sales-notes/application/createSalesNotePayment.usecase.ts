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

import { computeSalesNoteBalance } from "./computeSalesNoteBalance";
import { createAuditLog } from "@/modules/shared/audit/createAuditLog.helper";
import { auditDecimalChange } from "@/modules/shared/audit/auditChanges";

export async function createSalesNotePaymentUseCase(
  params: {
    salesNoteId: string;
    values: SalesNotePaymentFormValues;
  },
  ctx?: UseCaseContext
) {
  const { salesNoteId, values } = params;

  return prisma.$transaction(async (tx) => {
    const note = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: { id: true, partyId: true, folio: true },
    });

    if (!note) throw new Error("La nota de venta no existe.");

    // ✅ Balance BEFORE (used for validation + audit)
    const balanceBefore = await computeSalesNoteBalance(tx, note.id);

    const amount = toDecimal(values.amount);
    if (amount.lte(0)) {
      throw new Error("El monto del pago debe ser mayor a 0.");
    }
    if (amount.gt(balanceBefore.balance)) {
      throw new Error("El monto excede el saldo pendiente.");
    }

    const occurredAt = new Date();

    const created = await tx.payment.create({
      data: {
        salesNoteId: note.id,
        partyId: note.partyId,
        direction: PaymentDirection.IN,
        paymentType: values.paymentType,
        amount,
        reference: safeTrim(values.reference) || null,
        notes: safeTrim(values.notes) || null,
        occurredAt,
      },
      select: { id: true, amount: true, occurredAt: true, reference: true },
    });

    // Ledger: payment reduces receivable (RECEIVABLE -amount)
    await ensureSingleLedgerEntryForSource(tx, {
      partyId: note.partyId,
      side: PartyLedgerSide.RECEIVABLE,
      sourceType: PartyLedgerSourceType.PAYMENT,
      sourceId: created.id,
      reference: note.folio,
      occurredAt: created.occurredAt,
      amount: created.amount?.mul(toDecimal(-1)) ?? toDecimal(0),
      notes: safeTrim(values.notes) || null,
    });

    const balanceAfter = await computeSalesNoteBalance(tx, note.id);

    await createAuditLog(
      tx,
      {
        action: AuditAction.CREATE,
        eventKey: "salesNote.payment.created",
        entityType: AuditEntityType.PAYMENT,
        entityId: created.id,
        rootEntityType: AuditEntityType.SALES_NOTE,
        rootEntityId: note.id,
        reference: safeTrim(created.reference ?? "") || null,
        occurredAt: created.occurredAt,
        changes: [
          auditDecimalChange(
            AuditChangeKey.PAYMENT_AMOUNT,
            null,
            created.amount
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

    return { paymentId: created.id };
  });
}
