import { prisma } from "@/lib/prisma";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { assertNotSoftDeleted } from "@/modules/shared/queries/softDeleteHelpers";
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";
import { mapSalesNoteRowToFormValues } from "./_salesNoteMappers";

export type SalesNoteForEditDto = {
  id: string;
  values: SalesNoteFormValues;
  createdAt: string; // ISO
  updatedAt: string | null; // ISO
};

export async function getSalesNoteForEditById(
  id: string
): Promise<SalesNoteForEditDto | null> {
  salesNoteLogger.info("getSalesNoteForEditById", "Fetching sales note for edit", { id });

  const row = await prisma.salesNote.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      isDeleted: true, // ← Necesario para verificar

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

  // Redirigir a 404 si está eliminada
  assertNotSoftDeleted(row, "Nota de venta");

  salesNoteLogger.info("getSalesNoteForEditById", "Sales note fetched from DB", {
    id: row.id,
    linesCount: row.lines?.length ?? 0,
    hasParty: !!row.party,
    partySystemKey: row.party?.systemKey ?? null,
  });

  const values = mapSalesNoteRowToFormValues({
    party: row.party,
    lines: row.lines,
  });

  salesNoteLogger.info("getSalesNoteForEditById", "Form values mapped", {
    id: row.id,
    customerMode: values.customer?.mode,
    registeredLinesCount: values.lines?.length ?? 0,
    unregisteredLinesCount: values.unregisteredLines?.length ?? 0,
  });

  return {
    id: row.id,
    values,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}
