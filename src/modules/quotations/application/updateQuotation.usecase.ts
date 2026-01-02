import { Prisma } from "@/generated/prisma/client";
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
import { resolvePartyIdForCustomerSelection } from "@/modules/parties/application/resolvePartyIdForCustomerSelection";

export async function updateQuotationUseCase(
  quotationId: string,
  values: QuotationFormValues,
  ctx?: UseCaseContext
) {
  const logger = createScopedLogger("updateQuotationUseCase", ctx);

  logger.log("start", {
    quotationId,
    lines: values.lines?.length ?? 0,
    unregisteredLines: values.unregisteredLines?.length ?? 0,
  });

  return prisma.$transaction(async (tx) => {
    logger.log("tx_begin");

    const existing = await tx.quotation.findUnique({
      where: { id: quotationId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new Error("La cotización no existe.");
    }

    const partyMode = values.customer.partyMode ?? "EXISTING";
    const partyId = await resolvePartyIdForCustomerSelection(
      tx,
      {
        mode: values.customer.mode,
        partyMode,
        existingPartyId: values.customer.existingPartyId,
        newParty: values.customer.newParty,
      },
      logger
    );

    const registeredLines = (values.lines ?? []).map((l) => {
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
    });

    const externalLines = (values.unregisteredLines ?? []).map((l) => {
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

    const nextStatus = values.status ?? existing.status;

    await tx.quotation.update({
      where: { id: quotationId },
      data: {
        partyId,
        total,
        status: nextStatus,
      },
      select: { id: true },
    });

    logger.log("lines_replace_start");

    await tx.quotationLine.deleteMany({ where: { quotationId } });

    if (allLines.length > 0) {
      const res = await tx.quotationLine.createMany({
        data: allLines.map((l) => ({
          quotationId,
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

    const written = await tx.quotation.findUnique({
      where: { id: quotationId },
      select: {
        id: true,
        folio: true,
        partyId: true,
        total: true,
        status: true,
        _count: { select: { lines: true } },
      },
    });

    logger.log("tx_end_written_snapshot", written);

    return { quotationId };
  });
}
