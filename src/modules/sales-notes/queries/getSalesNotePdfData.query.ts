import { prisma } from "@/lib/prisma";
import { assertNotSoftDeleted } from "@/modules/shared/queries/softDeleteHelpers";

export type SalesNotePdfLineDto = {
  description: string;
  quantity: string; // Decimal as string
  unitPrice: string; // Decimal as string
  lineTotal: string; // Decimal as string
};

export type SalesNotePdfDataDto = {
  id: string;
  folio: string;
  createdAtIso: string;

  customerName: string;

  subtotal: string;
  discountTotal: string;
  total: string;

  lines: SalesNotePdfLineDto[];
};

export async function getSalesNotePdfDataById(
  salesNoteId: string
): Promise<SalesNotePdfDataDto | null> {
  const row = await prisma.salesNote.findUnique({
    where: { id: salesNoteId },
    select: {
      id: true,
      folio: true,
      createdAt: true,
      subtotal: true,
      discountTotal: true,
      total: true,
      isDeleted: true, // ← Necesario para verificar
      party: { select: { name: true } },
      lines: {
        orderBy: { id: "asc" },
        select: {
          descriptionSnapshot: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
      },
    },
  });

  // Redirigir a 404 si está eliminada
  assertNotSoftDeleted(row, "Nota de venta");

  return {
    id: row.id,
    folio: row.folio,
    createdAtIso: row.createdAt.toISOString(),
    customerName: row.party.name,

    subtotal: row.subtotal.toString(),
    discountTotal: row.discountTotal.toString(),
    total: row.total.toString(),

    lines: row.lines.map((l) => ({
      description: l.descriptionSnapshot,
      quantity: l.quantity.toString(),
      unitPrice: l.unitPrice.toString(),
      lineTotal: l.lineTotal.toString(),
    })),
  };
}
