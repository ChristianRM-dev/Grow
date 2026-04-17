import { FolioType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  createScopedLogger,
  type UseCaseContext,
} from "@/modules/shared/observability/scopedLogger";
import { generateMonthlyFolio } from "@/modules/shared/folio/monthlyFolio";
import { resolvePartyIdForCustomerSelection } from "@/modules/parties/application/resolvePartyIdForCustomerSelection";
import {
  buildRegisteredDocumentLinePayloads,
  buildUnregisteredDocumentLinePayloads,
  calculateDocumentTotals,
  persistDocumentLines,
} from "@/modules/shared/documents/documentLines";

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
        status: values.status ?? "DRAFT",
        total,
        ...(values.status ? { status: values.status } : {}),
      },
      select: { id: true, folio: true },
    });

    logger.log("quotation_created", created);

    await persistDocumentLines({
      payloads: allLines,
      logger,
      createMany: (payloads) =>
        tx.quotationLine.createMany({
          data: payloads.map((line) => ({
            quotationId: created.id,
            productVariantId: line.productVariantId,
            descriptionSnapshot: line.descriptionSnapshot,
            quantity: line.quantity,
            quotedUnitPrice: line.quotedUnitPrice,
            discountPercent: line.discountPercent,
          })),
        }),
    });

    return { quotationId: created.id };
  });
}
