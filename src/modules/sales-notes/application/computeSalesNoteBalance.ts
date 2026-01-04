import { Prisma, PaymentDirection } from "@/generated/prisma/client";

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
    },
    _sum: { amount: true },
  });

  const total = note.total as Prisma.Decimal;
  const paid = (agg._sum.amount ?? new Prisma.Decimal(0)) as Prisma.Decimal;

  const raw = total.sub(paid);
  const balance = raw.lt(0) ? new Prisma.Decimal(0) : raw;

  return { salesNoteId: note.id, total, paid, balance };
}
