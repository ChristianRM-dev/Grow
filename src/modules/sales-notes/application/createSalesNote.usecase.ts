// src/modules/sales-notes/application/createSalesNote.usecase.ts
import { FolioType, Prisma } from "@/generated/prisma/client";
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

type RegisteredLinePayload = {
  productVariantId: string | null;
  descriptionSnapshot: string;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
};

export async function createSalesNoteUseCase(
  values: SalesNoteFormValues,
  ctx?: UseCaseContext
) {
  const logger = createScopedLogger("createSalesNoteUseCase", ctx);

  logger.log("start", {
    customerMode: values.customer.mode,
    partyMode: (values.customer as any).partyMode,
    lines: values.lines?.length ?? 0,
    unregisteredLines: values.unregisteredLines?.length ?? 0,
  });

  return prisma.$transaction(async (tx) => {
    logger.log("tx_begin");

    // 1) Resolve partyId (reusable)
    const partyId = await resolvePartyIdForCustomerSelection(
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
    const registeredLines: RegisteredLinePayload[] = (values.lines ?? []).map(
      (l) => {
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
      }
    );

    const unregisteredLines: RegisteredLinePayload[] = (
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

    // 4) Create SalesNote with sequential folio (YYYY-MM-XX)
    const folio = await generateMonthlyFolio({
      tx,
      type: FolioType.SALES_NOTE,
      logger,
    });

    logger.log("salesNote_create", { folio });

    const created = await tx.salesNote.create({
      data: {
        folio,
        partyId,
        status: "DRAFT",
        subtotal,
        discountTotal,
        total,
      },
      select: { id: true, folio: true },
    });

    logger.log("salesNote_created", { id: created.id, folio: created.folio });

    // 5) Create lines
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

    // 6) Optional: verify snapshot
    const written = await tx.salesNote.findUnique({
      where: { id: created.id },
      select: {
        id: true,
        folio: true,
        partyId: true,
        total: true,
        _count: { select: { lines: true } },
      },
    });

    logger.log("tx_end_written_snapshot", written);

    return { salesNoteId: created.id };
  });
}
