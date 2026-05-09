// src/modules/sales-notes/application/updateSalesNote.usecase.ts
import {
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
import { resolvePartyIdForCustomerSelection } from "@/modules/parties/application/resolvePartyIdForCustomerSelection";
import {
  ensureSingleLedgerEntryForSource,
  reassignLedgerPartyBySourceIds,
} from "@/modules/shared/ledger/partyLedger";
import { createAuditLog } from "@/modules/shared/audit/createAuditLog.helper";
import { auditDecimalChange } from "@/modules/shared/audit/auditChanges";
import { computeSalesNoteBalance } from "./computeSalesNoteBalance";
import {
  buildRegisteredDocumentLinePayloads,
  buildUnregisteredDocumentLinePayloads,
  calculateDocumentTotals,
  persistDocumentLines,
  registerProductVariantsFromUnregisteredLines,
} from "@/modules/shared/documents/documentLines";

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
      select: {
        id: true,
        partyId: true,
        folio: true,
        createdAt: true,
        total: true,
        subtotal: true,
        discountTotal: true,
      },
    });

    if (!existing) throw new Error("La nota de venta no existe.");

    // Capture balance BEFORE any changes
    const balanceBefore = await computeSalesNoteBalance(tx, existing.id);

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

    // 2) Register products marked for registration
    const registeredProductIds = await registerProductVariantsFromUnregisteredLines(
      tx,
      values.unregisteredLines ?? [],
      "unitPrice",
      logger,
    );

    // 3) Build line payloads
    const registeredLines = buildRegisteredDocumentLinePayloads(
      values.lines ?? [],
      "unitPrice",
    );

    const unregisteredLines = buildUnregisteredDocumentLinePayloads(
      values.unregisteredLines ?? [],
      "unitPrice",
      registeredProductIds,
    );

    const allLines = [...registeredLines, ...unregisteredLines];
    logger.log("lines_built", {
      allLines: allLines.length,
      newlyRegistered: registeredProductIds.size,
    });

    // 4) Totals
    const { subtotal, discountTotal, total } =
      calculateDocumentTotals(allLines);

    logger.log("totals", {
      subtotal: subtotal.toString(),
      discountTotal: discountTotal.toString(),
      total: total.toString(),
    });

    // 5) Update SalesNote header
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

    // 6) Replace lines (simple approach)
    await persistDocumentLines({
      payloads: allLines,
      logger,
      startMessage: "lines_replace_start",
      deleteExisting: () => tx.salesNoteLine.deleteMany({ where: { salesNoteId } }),
      createMany: (payloads) =>
        tx.salesNoteLine.createMany({
          data: payloads.map((line) => ({
            salesNoteId,
            productVariantId: line.productVariantId,
            descriptionSnapshot: line.descriptionSnapshot,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPercent: line.discountPercent,
            lineTotal: line.lineTotal,
          })),
        }),
    });

    // 7) Ledger: ensure SalesNote entry matches new totals/party
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

    // 8) If party changed, move Payments and their ledger entries (recommended for statement consistency)
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

    // 9) Get updated state for audit
    const after = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: {
        id: true,
        folio: true,
        total: true,
        subtotal: true,
        discountTotal: true,
        updatedAt: true,
        _count: { select: { lines: true } },
      },
    });

    if (!after) {
      throw new Error("No se pudo leer la nota de venta actualizada.");
    }

    const balanceAfter = await computeSalesNoteBalance(tx, after.id);

    // 10) Create audit log
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
            existing.subtotal,
            after.subtotal
          ),
          auditDecimalChange(
            AuditChangeKey.SALES_NOTE_DISCOUNT_TOTAL,
            existing.discountTotal,
            after.discountTotal
          ),
          auditDecimalChange(
            AuditChangeKey.SALES_NOTE_TOTAL,
            existing.total,
            after.total
          ),
          auditDecimalChange(
            AuditChangeKey.SALES_NOTE_BALANCE_DUE,
            balanceBefore.balance,
            balanceAfter.balance
          ),
        ],
        meta: {
          linesCount: after._count.lines,
          newProductsRegistered: registeredProductIds.size,
        },
      },
      ctx
    );

    logger.log("tx_end_written_snapshot", {
      id: after.id,
      folio: after.folio,
      partyId: nextPartyId,
      total: after.total.toString(),
      linesCount: after._count.lines,
      newProductsRegistered: registeredProductIds.size,
    });

    return {
      salesNoteId,
      newProductsRegistered: registeredProductIds.size,
    };
  });
}
