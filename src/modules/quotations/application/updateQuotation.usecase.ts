import { prisma } from "@/lib/prisma";
import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  createScopedLogger,
  type UseCaseContext,
} from "@/modules/shared/observability/scopedLogger";
import { resolvePartyIdForCustomerSelection } from "@/modules/parties/application/resolvePartyIdForCustomerSelection";
import {
  buildRegisteredDocumentLinePayloads,
  buildUnregisteredDocumentLinePayloads,
  calculateDocumentTotals,
  persistDocumentLines,
} from "@/modules/shared/documents/documentLines";

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

    const registeredLines = buildRegisteredDocumentLinePayloads(
      values.lines ?? [],
      "quotedUnitPrice",
    );

    const externalLines = buildUnregisteredDocumentLinePayloads(
      values.unregisteredLines ?? [],
      "quotedUnitPrice",
    );

    const allLines = [...registeredLines, ...externalLines];
    logger.log("lines_built", { allLines: allLines.length });

    const { total } = calculateDocumentTotals(allLines);

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

    await persistDocumentLines({
      payloads: allLines,
      logger,
      startMessage: "lines_replace_start",
      deleteExisting: () => tx.quotationLine.deleteMany({ where: { quotationId } }),
      createMany: (payloads) =>
        tx.quotationLine.createMany({
          data: payloads.map((line) => ({
            quotationId,
            productVariantId: line.productVariantId,
            descriptionSnapshot: line.descriptionSnapshot,
            quantity: line.quantity,
            quotedUnitPrice: line.quotedUnitPrice,
            discountPercent: line.discountPercent,
          })),
        }),
    });

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
