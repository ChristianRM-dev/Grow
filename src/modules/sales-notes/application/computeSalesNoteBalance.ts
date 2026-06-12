import { Prisma, PaymentDirection } from "@/generated/prisma/client";
import { excludeSoftDeletedPayments } from "@/modules/shared/queries/softDeleteHelpers";
import { computeOutstandingBalance } from "@/modules/shared/utils/decimals";

export type SalesNoteBalanceResult = {
  salesNoteId: string;
  total: Prisma.Decimal;
  paid: Prisma.Decimal;
  balance: Prisma.Decimal; // max(total - paid, 0)
};

export async function computeSalesNoteBalance(
  tx: Prisma.TransactionClient,
  salesNoteId: string
): Promise<SalesNoteBalanceResult> {
  const id = String(salesNoteId ?? "").trim();
  if (!id) throw new Error("salesNoteId es requerido.");

  const note = await tx.salesNote.findUnique({
    where: { id },
    select: { id: true, total: true },
  });

  if (!note) throw new Error("La nota de venta no existe.");

  const agg = await tx.payment.aggregate({
    where: {
      direction: PaymentDirection.IN,
      salesNoteId: note.id,
      ...excludeSoftDeletedPayments,
    },
    _sum: { amount: true },
  });

  const { paid, remaining, total } = computeOutstandingBalance({
    total: note.total as Prisma.Decimal,
    paid: agg._sum.amount,
  });

  return { salesNoteId: note.id, total, paid, balance: remaining };
}
