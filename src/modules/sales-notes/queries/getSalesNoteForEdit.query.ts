import { prisma } from "@/lib/prisma";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { mapSalesNoteRowToFormValues } from "./_salesNoteMappers";

export type SalesNoteForEditDto = {
  id: string;
  values: SalesNoteFormValues; // ✅ perfect for RHF/wizard
  createdAt: string; // ISO
  updatedAt: string | null; // ISO
};

export async function getSalesNoteForEditById(
  id: string
): Promise<SalesNoteForEditDto | null> {
  const row = await prisma.salesNote.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,

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
          unitPrice: true,
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

  const values = mapSalesNoteRowToFormValues({
    party: row.party,
    lines: row.lines,
  });

  return {
    id: row.id,
    values,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}
