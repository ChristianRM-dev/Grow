import { prisma } from "@/lib/prisma";
import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
import { mapQuotationRowToFormValues } from "./_quotationMappers";

export type QuotationForEditDto = {
  id: string;
  folio: string;
  values: QuotationFormValues;
  createdAt: string; // ISO
  updatedAt: string | null; // ISO
};

export async function getQuotationForEditById(
  id: string
): Promise<QuotationForEditDto | null> {
  const row = await prisma.quotation.findUnique({
    where: { id },
    select: {
      id: true,
      folio: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      party: {
        select: {
          id: true,
          name: true,
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

  const values = mapQuotationRowToFormValues({
    party: row.party,
    lines: row.lines,
    status: row.status,
  });

  return {
    id: row.id,
    folio: row.folio,
    values,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}
