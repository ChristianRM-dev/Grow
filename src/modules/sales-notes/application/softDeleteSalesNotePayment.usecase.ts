import {
  AuditAction,
  AuditChangeKey,
  AuditEntityType,
  PartyLedgerSourceType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { computeSalesNoteBalance } from "./computeSalesNoteBalance";
import { createAuditLog } from "@/modules/shared/audit/createAuditLog.helper";
import { auditDecimalChange } from "@/modules/shared/audit/auditChanges";

import { type UseCaseContext } from "@/modules/shared/observability/scopedLogger";

export async function softDeleteSalesNotePaymentUseCase(
  params: { salesNoteId: string; paymentId: string },
  ctx?: UseCaseContext,
) {
  const { salesNoteId, paymentId } = params;

  return prisma.$transaction(async (tx) => {
    // Load SalesNote basics (for audit reference + invariants)
    const note = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: { id: true, partyId: true, folio: true },
    });

    if (!note) throw new Error("La nota de venta no existe.");

    // Balance BEFORE (includes this payment if not deleted and your query counts it)
    const balanceBefore = await computeSalesNoteBalance(tx, note.id);

    // Load payment and ensure it's linked to this SalesNote
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        salesNoteId: true,
        partyId: true,
        amount: true,
        occurredAt: true,
        reference: true,
        isDeleted: true,
      },
    });

    if (!payment) throw new Error("El pago no existe.");
    if (payment.salesNoteId !== note.id) {
      throw new Error("El pago no pertenece a esta nota de venta.");
    }
    if (payment.isDeleted) {
      // Idempotent behavior: deleting twice should be safe
      return { ok: true };
    }

    const deletedAt = new Date();

    // Soft-delete payment
    await tx.payment.update({
      where: { id: payment.id },
      data: { isDeleted: true, deletedAt },
      select: { id: true },
    });

    // Soft-delete ledger entry derived from this payment
    // We updateMany to be resilient (in case entry is missing due to legacy data).
    const ledgerUpdate = await tx.partyLedgerEntry.updateMany({
      where: {
        sourceType: PartyLedgerSourceType.PAYMENT,
        sourceId: payment.id,
        isDeleted: false,
      },
      data: { isDeleted: true, deletedAt },
    });

    // Recompute balance AFTER (should increase receivable since payment was removed)
    const balanceAfter = await computeSalesNoteBalance(tx, note.id);

    // Audit log
    // We record PAYMENT_AMOUNT change as "amount -> null" to represent removal from active accounting.
    await createAuditLog(
      tx,
      {
        action: AuditAction.UPDATE,
        eventKey: "salesNote.payment.deleted",
        entityType: AuditEntityType.PAYMENT,
        entityId: payment.id,
        rootEntityType: AuditEntityType.SALES_NOTE,
        rootEntityId: note.id,
        reference: payment.reference ?? null,
        occurredAt: payment.occurredAt,
        meta: {
          ledgerSoftDeletedCount: ledgerUpdate.count,
        },
        changes: [
          auditDecimalChange(
            AuditChangeKey.PAYMENT_AMOUNT,
            payment.amount,
            null,
          ),
          auditDecimalChange(
            AuditChangeKey.SALES_NOTE_BALANCE_DUE,
            balanceBefore.balance,
            balanceAfter.balance,
          ),
        ],
      },
      ctx,
    );

    return { ok: true };
  });
}
