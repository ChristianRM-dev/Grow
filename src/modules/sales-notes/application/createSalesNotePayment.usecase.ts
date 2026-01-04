import {
  AuditAction,
  AuditChangeKey,
  AuditEntityType,
  PaymentDirection,
  PartyLedgerSide,
  PartyLedgerSourceType,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import { toDecimal, zeroDecimal } from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";
import { ensureSingleLedgerEntryForSource } from "@/modules/shared/ledger/partyLedger";
import {
  auditDecimalChange,
  createAuditLog,
} from "@/modules/shared/audit/createAuditLog.helper";
import { type UseCaseContext } from "@/modules/shared/observability/scopedLogger";

export async function createSalesNotePaymentUseCase(
  params: { salesNoteId: string; values: SalesNotePaymentFormValues },
  ctx?: UseCaseContext
) {
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
    const clampToZero = (value: Prisma.Decimal) =>
      value.lt(0) ? zeroDecimal() : value;
    const remaining = clampToZero(note.total.sub(paid));

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
      amount: created.amount ? created.amount.mul(-1) : toDecimal(0), // ✅ signed negative
      notes: safeTrim(values.notes) || null,
    });

    const actor =
      ctx?.user && ctx.user.id
        ? {
            userId: ctx.user.id,
            name: ctx.user.name,
            email: ctx.user.email,
          }
        : undefined;

    const paidAfter = paid.add(amount);
    const balanceBefore = clampToZero(note.total.sub(paid));
    const balanceAfter = clampToZero(note.total.sub(paidAfter));

    await createAuditLog(tx, {
      eventKey: "salesNote.payment.created",
      action: AuditAction.CREATE,
      entity: { type: AuditEntityType.PAYMENT, id: created.id },
      rootEntity: { type: AuditEntityType.SALES_NOTE, id: note.id },
      reference: note.folio,
      occurredAt: created.occurredAt,
      traceId: ctx?.traceId,
      actor,
      changes: [
        auditDecimalChange(
          AuditChangeKey.PAYMENT_AMOUNT,
          null,
          created.amount
        ),
        auditDecimalChange(
          AuditChangeKey.SALES_NOTE_BALANCE_DUE,
          balanceBefore,
          balanceAfter
        ),
      ],
    });

    return { paymentId: created.id };
  });
}
