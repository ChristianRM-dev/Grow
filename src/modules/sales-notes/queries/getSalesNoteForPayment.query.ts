import { Prisma, PaymentDirection } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertNotSoftDeleted,
  excludeSoftDeletedPayments,
} from "@/modules/shared/queries/softDeleteHelpers";

export type SalesNoteForPaymentDto = {
  id: string;
  folio: string;
  party: {
    id: string;
    name: string;
  };
  total: string; // decimal as string
  paid: string; // sum of IN payments
  remaining: string; // total - paid (min 0)
};

export async function getSalesNoteForPaymentById(
  id: string
): Promise<SalesNoteForPaymentDto | null> {
  const note = await prisma.salesNote.findUnique({
    where: { id },
    select: {
      id: true,
      folio: true,
      total: true,
      isDeleted: true, // ← Necesario para verificar
      party: { select: { id: true, name: true } },
    },
  });

  // Redirigir a 404 si está eliminada
  assertNotSoftDeleted(note, "Nota de venta");

  const agg = await prisma.payment.aggregate({
    where: {
      salesNoteId: note.id,
      direction: PaymentDirection.IN,
      ...excludeSoftDeletedPayments, // ← Filtrar pagos eliminados
    },
    _sum: { amount: true },
  });

  const paid = agg._sum.amount ?? new Prisma.Decimal(0);
  const total = note.total;
  const remainingRaw = total.sub(paid);
  const remaining = remainingRaw.lt(0) ? new Prisma.Decimal(0) : remainingRaw;

  return {
    id: note.id,
    folio: note.folio,
    party: note.party,
    total: total.toString(),
    paid: paid.toString(),
    remaining: remaining.toString(),
  };
}
