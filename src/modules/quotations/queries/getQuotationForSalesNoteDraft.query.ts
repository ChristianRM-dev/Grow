import { prisma } from "@/lib/prisma";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { mapSalesNoteRowToFormValues } from "@/modules/sales-notes/queries/_salesNoteMappers";

export type QuotationSalesNoteDraftDto = {
  quotationId: string;
  folio: string;
  values: SalesNoteFormValues;
};

export async function getQuotationForSalesNoteDraft(
  quotationId: string
): Promise<QuotationSalesNoteDraftDto | null> {
  const row = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: {
      id: true,
      folio: true,
      party: {
        select: {
          id: true,
          name: true,
          phone: true,
          notes: true,
          systemKey: true,
        },
      },
      lines: {
        select: {
          productVariantId: true,
          quantity: true,
          quotedUnitPrice: true,
          descriptionSnapshot: true,
          productVariant: {
            select: {
              speciesName: true,
              variantName: true,
              bagSize: true,
              color: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!row) return null;

  const values: SalesNoteFormValues = mapSalesNoteRowToFormValues({
    party: row.party,
    lines: row.lines.map((l) => ({
      productVariantId: l.productVariantId,
      quantity: l.quantity,
      unitPrice: l.quotedUnitPrice,
      descriptionSnapshot: l.descriptionSnapshot,
      productVariant: l.productVariant,
    })),
  });

  return {
    quotationId: row.id,
    folio: row.folio,
    values,
  };
}
