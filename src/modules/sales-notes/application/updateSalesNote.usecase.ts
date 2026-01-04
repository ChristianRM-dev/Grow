import {
  Prisma,
  PartyLedgerSide,
  PartyLedgerSourceType,
  PaymentDirection,
  AuditAction,
  AuditEntityType,
  AuditChangeKey,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";

import {
  createScopedLogger,
  type UseCaseContext,
} from "@/modules/shared/observability/scopedLogger";
import {
  toDecimal,
  sumDecimals,
  zeroDecimal,
} from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";
import { buildDescriptionSnapshot } from "@/modules/shared/snapshots/descriptionSnapshot";
import { resolvePartyIdForCustomerSelection } from "@/modules/parties/application/resolvePartyIdForCustomerSelection";
import {
  ensureSingleLedgerEntryForSource,
  reassignLedgerPartyBySourceIds,
} from "@/modules/shared/ledger/partyLedger";
import { createAuditLog } from "@/modules/shared/audit/createAuditLog.helper";
import { auditDecimalChange } from "@/modules/shared/audit/auditChanges";
import { computeSalesNoteBalance } from "./computeSalesNoteBalance";

type LinePayload = {
  productVariantId: string | null;
  descriptionSnapshot: string;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
};

export async function updateSalesNoteUseCase(
  salesNoteId: string,
  values: SalesNoteFormValues,
  ctx?: UseCaseContext
) {
  const logger = createScopedLogger("updateSalesNoteUseCase", ctx);

  logger.log("start", {
    salesNoteId,
    customerMode: values.customer.mode,
    partyMode: values.customer.partyMode,
    lines: values.lines?.length ?? 0,
    unregisteredLines: values.unregisteredLines?.length ?? 0,
  });

  return prisma.$transaction(async (tx) => {
    logger.log("tx_begin");

    const existing = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: { id: true, partyId: true, folio: true, createdAt: true },
    });

    if (!existing) throw new Error("La nota de venta no existe.");

    // 1) Resolve partyId (reusable)
    const nextPartyId = await resolvePartyIdForCustomerSelection(
      tx,
      {
        mode: values.customer.mode,
        partyMode: values.customer.partyMode,
        existingPartyId: values.customer.existingPartyId,
        newParty: values.customer.newParty,
      },
      logger
    );

    // 2) Build line payloads
    const registeredLines: LinePayload[] = (values.lines ?? []).map((l) => {
      const qty = toDecimal(l.quantity);
      const unitPrice = toDecimal(l.unitPrice);
      const lineTotal = qty.mul(unitPrice);

      return {
        productVariantId: safeTrim(l.productVariantId) || null,
        descriptionSnapshot: buildDescriptionSnapshot(
          l.productName,
          l.description
        ),
        quantity: qty,
        unitPrice,
        lineTotal,
      };
    });

    const unregisteredLines: LinePayload[] = (
      values.unregisteredLines ?? []
    ).map((l) => {
      const qty = toDecimal(l.quantity);
      const unitPrice = toDecimal(l.unitPrice);
      const lineTotal = qty.mul(unitPrice);

      return {
        productVariantId: null,
        descriptionSnapshot: buildDescriptionSnapshot(l.name, l.description),
        quantity: qty,
        unitPrice,
        lineTotal,
      };
    });

    const allLines = [...registeredLines, ...unregisteredLines];
    logger.log("lines_built", { allLines: allLines.length });

    // 3) Totals
    const subtotal = sumDecimals(allLines, (l) => l.lineTotal);
    const discountTotal = zeroDecimal();
    const total = subtotal.sub(discountTotal);

    logger.log("totals", {
      subtotal: subtotal.toString(),
      discountTotal: discountTotal.toString(),
      total: total.toString(),
    });

    // 4) Update SalesNote header
    await tx.salesNote.update({
      where: { id: salesNoteId },
      data: {
        partyId: nextPartyId,
        subtotal,
        discountTotal,
        total,
      },
      select: { id: true },
    });

    // 5) Replace lines (simple approach)
    logger.log("lines_replace_start");

    await tx.salesNoteLine.deleteMany({ where: { salesNoteId } });

    if (allLines.length > 0) {
      const res = await tx.salesNoteLine.createMany({
        data: allLines.map((l) => ({
          salesNoteId,
          productVariantId: l.productVariantId,
          descriptionSnapshot: l.descriptionSnapshot,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
        })),
      });
      logger.log("lines_createMany_done", res);
    } else {
      logger.log("lines_skipped_empty");
    }

    // 6) Ledger: ensure SalesNote entry matches new totals/party
    await ensureSingleLedgerEntryForSource(tx, {
      partyId: nextPartyId,
      side: PartyLedgerSide.RECEIVABLE,
      sourceType: PartyLedgerSourceType.SALES_NOTE,
      sourceId: salesNoteId,
      reference: existing.folio,
      occurredAt: existing.createdAt, // keep original business date
      amount: total, // ✅ positive
      notes: null,
    });

    // 7) If party changed, move Payments and their ledger entries (recommended for statement consistency)
    if (existing.partyId !== nextPartyId) {
      logger.log("party_changed_move_payments", {
        from: existing.partyId,
        to: nextPartyId,
      });

      // Move payments to new partyId
      await tx.payment.updateMany({
        where: { salesNoteId, direction: PaymentDirection.IN },
        data: { partyId: nextPartyId },
      });

      // Move corresponding payment ledger entries too
      const paymentIds = await tx.payment.findMany({
        where: { salesNoteId, direction: PaymentDirection.IN },
        select: { id: true },
      });

      await reassignLedgerPartyBySourceIds(tx, {
        sourceType: PartyLedgerSourceType.PAYMENT,
        sourceIds: paymentIds.map((p) => p.id),
        newPartyId: nextPartyId,
      });
    }

    // 8) Optional debug snapshot
    const written = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: {
        id: true,
        folio: true,
        partyId: true,
        total: true,
        _count: { select: { lines: true } },
      },
    });

    const before = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: {
        id: true,
        folio: true,
        total: true,
        subtotal: true,
        discountTotal: true,
        createdAt: true,
      },
    });
    if (!before) throw new Error("La nota de venta no existe.");

    const balanceBefore = await computeSalesNoteBalance(tx, before.id);

    // ... tu lógica de update (lines, totals, ledger, etc.)

    const after = await tx.salesNote.findUnique({
      where: { id: before.id },
      select: {
        id: true,
        folio: true,
        total: true,
        subtotal: true,
        discountTotal: true,
        updatedAt: true,
      },
    });
    if (!after)
      throw new Error("No se pudo leer la nota de venta actualizada.");

    const balanceAfter = await computeSalesNoteBalance(tx, after.id);

    await createAuditLog(
      tx,
      {
        action: AuditAction.UPDATE,
        eventKey: "salesNote.updated",
        entityType: AuditEntityType.SALES_NOTE,
        entityId: after.id,
        rootEntityType: AuditEntityType.SALES_NOTE,
        rootEntityId: after.id,
        reference: after.folio,
        occurredAt: after.updatedAt,
        changes: [
          auditDecimalChange(
            AuditChangeKey.SALES_NOTE_SUBTOTAL,
            before.subtotal,
            after.subtotal
          ),
          auditDecimalChange(
            AuditChangeKey.SALES_NOTE_DISCOUNT_TOTAL,
            before.discountTotal,
            after.discountTotal
          ),
          auditDecimalChange(
            AuditChangeKey.SALES_NOTE_TOTAL,
            before.total,
            after.total
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

    logger.log("tx_end_written_snapshot", written);

    return { salesNoteId };
  });
}
