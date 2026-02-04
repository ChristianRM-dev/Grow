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
import {
  toDecimal,
  sumDecimals,
  zeroDecimal,
} from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";
import { buildDescriptionSnapshot } from "@/modules/shared/snapshots/descriptionSnapshot";
import { generateMonthlyFolio } from "@/modules/shared/folio/monthlyFolio";
import { resolvePartyIdForCustomerSelection } from "@/modules/parties/application/resolvePartyIdForCustomerSelection";
import { ensureSingleLedgerEntryForSource } from "@/modules/shared/ledger/partyLedger";
import { createAuditLog } from "@/modules/shared/audit/createAuditLog.helper";
import { auditDecimalChange } from "@/modules/shared/audit/auditChanges";

type LinePayload = {
  productVariantId: string | null;
  descriptionSnapshot: string;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
};

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
      const registeredProductIds = new Map<number, string>();

      for (let i = 0; i < (values.unregisteredLines ?? []).length; i++) {
        const line = values.unregisteredLines![i];

        if (line.shouldRegister) {
          logger.log("registering_product", { index: i, name: line.name });

          // Check if a similar product already exists (case-insensitive)
          const existing = await tx.productVariant.findFirst({
            where: {
              speciesName: { equals: line.name.trim(), mode: "insensitive" },
              variantName: line.variantName?.trim() || null,
              isDeleted: false,
            },
          });

          if (existing) {
            registeredProductIds.set(i, existing.id);
            logger.log("product_already_exists", {
              index: i,
              productId: existing.id,
              name: line.name,
            });
          } else {
            const newProduct = await tx.productVariant.create({
              data: {
                speciesName: line.name.trim(),
                variantName: line.variantName?.trim() || null,
                bagSize: line.bagSize?.trim() || null,
                color: line.color?.trim() || null,
                defaultPrice: toDecimal(line.unitPrice),
                isActive: true,
              },
            });

            registeredProductIds.set(i, newProduct.id);
            logger.log("product_registered", {
              index: i,
              productId: newProduct.id,
              name: line.name,
              defaultPrice: newProduct.defaultPrice.toString(),
            });
          }
        }
      }

      // 3) Build line payloads
      const registeredLines: LinePayload[] = (values.lines ?? []).map((l) => {
        const qty = toDecimal(l.quantity);
        const unitPrice = toDecimal(l.unitPrice);
        const lineTotal = qty.mul(unitPrice);

        return {
          productVariantId: safeTrim(l.productVariantId) || null,
          descriptionSnapshot: buildDescriptionSnapshot(
            l.productName,
            l.description,
          ),
          quantity: qty,
          unitPrice,
          lineTotal,
        };
      });

      const filterUnregisterLines = (
        l: SalesNoteFormValues["unregisteredLines"][number],
        index: number,
      ) => {
        const qty = toDecimal(l.quantity);
        const unitPrice = toDecimal(l.unitPrice);
        const lineTotal = qty.mul(unitPrice);

        // If the product was registered, use its productVariantId
        const productVariantId = registeredProductIds.get(index) || null;

        return {
          productVariantId,
          descriptionSnapshot: buildDescriptionSnapshot(l.name, l.description),
          quantity: qty,
          unitPrice,
          lineTotal,
        };
      };

      const unregisteredLines: LinePayload[] = (
        values.unregisteredLines ?? []
      ).map(filterUnregisterLines);

      const allLines = [...registeredLines, ...unregisteredLines];
      logger.log("lines_built", {
        allLines: allLines.length,
        newlyRegistered: registeredProductIds.size,
      });

      // 4) Totals
      const subtotal = sumDecimals(allLines, (l) => l.lineTotal);
      const discountTotal = zeroDecimal();
      const total = subtotal.sub(discountTotal);

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
      if (allLines.length > 0) {
        logger.log("lines_createMany_start");
        const res = await tx.salesNoteLine.createMany({
          data: allLines.map((l) => ({
            salesNoteId: created.id,
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
