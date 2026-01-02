import { FolioType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
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

export type QuotationLinePayload = {
  productVariantId: string | null;
  descriptionSnapshot: string;
  quantity: Prisma.Decimal;
  quotedUnitPrice: Prisma.Decimal;
};

export async function createQuotationUseCase(
  values: QuotationFormValues,
  ctx?: UseCaseContext
) {
  const logger = createScopedLogger("createQuotationUseCase", ctx);

  logger.log("start", {
    lines: values.lines?.length ?? 0,
    unregisteredLines: values.unregisteredLines?.length ?? 0,
  });

  return prisma.$transaction(async (tx) => {
    logger.log("tx_begin");

    const partyId = await resolvePartyIdForCustomerSelection(
      tx,
      {
        mode: values.customer.mode,
        partyMode: "EXISTING",
        existingPartyId: values.customer.existingPartyId,
        newParty: undefined,
      },
      logger
    );

    const registeredLines: QuotationLinePayload[] = (values.lines ?? []).map(
      (l) => {
        const quantity = toDecimal(l.quantity);
        const quotedUnitPrice = toDecimal(l.quotedUnitPrice);

        return {
          productVariantId: safeTrim(l.productVariantId) || null,
          descriptionSnapshot: buildDescriptionSnapshot(
            l.productName,
            l.description
          ),
          quantity,
          quotedUnitPrice,
        };
      }
    );

    const externalLines: QuotationLinePayload[] = (
      values.unregisteredLines ?? []
    ).map((l) => {
      const quantity = toDecimal(l.quantity);
      const quotedUnitPrice = toDecimal(l.quotedUnitPrice);

      return {
        productVariantId: null,
        descriptionSnapshot: buildDescriptionSnapshot(l.name, l.description),
        quantity,
        quotedUnitPrice,
      };
    });

    const allLines = [...registeredLines, ...externalLines];
    logger.log("lines_built", { allLines: allLines.length });

    const total =
      allLines.length > 0
        ? sumDecimals(allLines, (l) => l.quantity.mul(l.quotedUnitPrice))
        : zeroDecimal();

    logger.log("totals", { total: total.toString() });

    const folio = await generateMonthlyFolio({
      tx,
      type: FolioType.QUOTATION,
      logger,
    });

    logger.log("quotation_create", { folio });

    const created = await tx.quotation.create({
      data: {
        folio,
        partyId,
        total,
        ...(values.status ? { status: values.status } : {}),
      },
      select: { id: true, folio: true },
    });

    logger.log("quotation_created", created);

    if (allLines.length > 0) {
      const res = await tx.quotationLine.createMany({
        data: allLines.map((l) => ({
          quotationId: created.id,
          productVariantId: l.productVariantId,
          descriptionSnapshot: l.descriptionSnapshot,
          quantity: l.quantity,
          quotedUnitPrice: l.quotedUnitPrice,
        })),
      });
      logger.log("lines_createMany_done", res);
    } else {
      logger.log("lines_skipped_empty");
    }

    return { quotationId: created.id };
  });
}
