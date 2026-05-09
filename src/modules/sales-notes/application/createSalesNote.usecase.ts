// src/modules/sales-notes/application/createSalesNote.usecase.ts
import {
  FolioType,
  Prisma,
  PartyLedgerSide,
  PartyLedgerSourceType,
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
import { generateMonthlyFolio } from "@/modules/shared/folio/monthlyFolio";
import { resolvePartyIdForCustomerSelection } from "@/modules/parties/application/resolvePartyIdForCustomerSelection";
import { ensureSingleLedgerEntryForSource } from "@/modules/shared/ledger/partyLedger";
import { createAuditLog } from "@/modules/shared/audit/createAuditLog.helper";
import { auditDecimalChange } from "@/modules/shared/audit/auditChanges";
import {
  buildRegisteredDocumentLinePayloads,
  buildUnregisteredDocumentLinePayloads,
  calculateDocumentTotals,
  persistDocumentLines,
  registerProductVariantsFromUnregisteredLines,
} from "@/modules/shared/documents/documentLines";

function isUniqueConstraintError(
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

export async function createSalesNoteUseCase(
  values: SalesNoteFormValues,
  ctx?: UseCaseContext,
  userId?: string,
  clientRequestId?: string,
) {
  const logger = createScopedLogger("createSalesNoteUseCase", ctx);

  logger.log("start", {
    customerMode: values.customer.mode,
    partyMode: values.customer.partyMode,
    lines: values.lines?.length ?? 0,
    unregisteredLines: values.unregisteredLines?.length ?? 0,
    clientRequestId: clientRequestId ?? null,
  });

  // Idempotency fast-path: if a sales note was already created for this request id, return it.
  if (clientRequestId) {
    const existing = await prisma.salesNote.findUnique({
      where: { clientRequestId },
      select: { id: true },
    });

    if (existing) {
      logger.log("idempotency_hit_return_existing", {
        clientRequestId,
        salesNoteId: existing.id,
      });
      return { salesNoteId: existing.id, newProductsRegistered: 0 };
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      logger.log("tx_begin", { clientRequestId: clientRequestId ?? null });

      // 1) Resolve partyId (reusable)
      const partyId = await resolvePartyIdForCustomerSelection(
        tx,
        {
          mode: values.customer.mode,
          partyMode: values.customer.partyMode,
          existingPartyId: values.customer.existingPartyId,
          newParty: values.customer.newParty,
        },
        logger,
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

      // 5) Create SalesNote with sequential folio (YYYY-MM-XX)
      // NOTE: generateMonthlyFolio should lock the FolioSequence row (SELECT ... FOR UPDATE) internally.
      const folio = await generateMonthlyFolio({
        tx,
        type: FolioType.SALES_NOTE,
        logger,
      });

      logger.log("salesNote_create", {
        folio,
        userId: userId ?? null,
        clientRequestId: clientRequestId ?? null,
      });

      const created = await tx.salesNote.create({
        data: {
          folio,
          partyId,
          status: "DRAFT",
          subtotal,
          discountTotal,
          total,
          createdByUserId: userId ?? null,
          clientRequestId: clientRequestId ?? null, // ✅ idempotency key persisted
        },
        select: { id: true, folio: true, createdAt: true },
      });

      await createAuditLog(
        tx,
        {
          action: AuditAction.CREATE,
          eventKey: "salesNote.created",
          entityType: AuditEntityType.SALES_NOTE,
          entityId: created.id,
          rootEntityType: AuditEntityType.SALES_NOTE,
          rootEntityId: created.id,
          reference: created.folio,
          occurredAt: created.createdAt,
          changes: [
            auditDecimalChange(
              AuditChangeKey.SALES_NOTE_SUBTOTAL,
              null,
              subtotal,
            ),
            auditDecimalChange(
              AuditChangeKey.SALES_NOTE_DISCOUNT_TOTAL,
              null,
              discountTotal,
            ),
            auditDecimalChange(AuditChangeKey.SALES_NOTE_TOTAL, null, total),
            auditDecimalChange(
              AuditChangeKey.SALES_NOTE_BALANCE_DUE,
              null,
              total,
            ),
          ],
          meta: {
            linesCount: allLines.length,
            newProductsRegistered: registeredProductIds.size,
            clientRequestId: clientRequestId ?? null,
          },
        },
        ctx,
      );

      logger.log("salesNote_created", { id: created.id, folio: created.folio });

      // 5.1) Ledger entry: charge to customer (RECEIVABLE +total)
      await ensureSingleLedgerEntryForSource(tx, {
        partyId,
        side: PartyLedgerSide.RECEIVABLE,
        sourceType: PartyLedgerSourceType.SALES_NOTE,
        sourceId: created.id,
        reference: created.folio,
        occurredAt: created.createdAt,
        amount: total, // ✅ positive
        notes: null,
      });

      // 6) Create lines
      await persistDocumentLines({
        payloads: allLines,
        logger,
        startMessage: "lines_createMany_start",
        createMany: (payloads) =>
          tx.salesNoteLine.createMany({
            data: payloads.map((line) => ({
              salesNoteId: created.id,
              productVariantId: line.productVariantId,
              descriptionSnapshot: line.descriptionSnapshot,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              discountPercent: line.discountPercent,
              lineTotal: line.lineTotal,
            })),
          }),
      });

      // 7) Optional: verify snapshot
      const written = await tx.salesNote.findUnique({
        where: { id: created.id },
        select: {
          id: true,
          folio: true,
          partyId: true,
          total: true,
          clientRequestId: true,
          _count: { select: { lines: true } },
        },
      });

      logger.log("tx_end_written_snapshot", {
        ...written,
        newProductsRegistered: registeredProductIds.size,
      });

      return {
        salesNoteId: created.id,
        newProductsRegistered: registeredProductIds.size,
      };
    });
  } catch (err: unknown) {
    // Idempotency race recovery:
    // If two requests with the same clientRequestId reach the server concurrently,
    // the second one can hit the unique constraint.
    if (clientRequestId && isUniqueConstraintError(err)) {
      logger.log("idempotency_race_detected", { clientRequestId });

      const existing = await prisma.salesNote.findUnique({
        where: { clientRequestId },
        select: { id: true },
      });

      if (existing) {
        logger.log("idempotency_race_recovered_return_existing", {
          clientRequestId,
          salesNoteId: existing.id,
        });
        return { salesNoteId: existing.id, newProductsRegistered: 0 };
      }
    }

    logger.log("failed", {
      clientRequestId: clientRequestId ?? null,
      error:
        err instanceof Error
          ? { message: err.message, stack: err.stack }
          : String(err),
    });

    throw err;
  }
}
