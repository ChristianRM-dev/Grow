import { Prisma, PaymentDirection } from "@/generated/prisma/client";

export type SupplierPurchaseBalanceResult = {
  supplierPurchaseId: string;
  total: Prisma.Decimal;
  paid: Prisma.Decimal;
  balance: Prisma.Decimal; // max(total - paid, 0)
};

export async function computeSupplierPurchaseBalance(
  tx: Prisma.TransactionClient,
  supplierPurchaseId: string
): Promise<SupplierPurchaseBalanceResult> {
  const id = String(supplierPurchaseId ?? "").trim();
  if (!id) throw new Error("supplierPurchaseId es requerido.");

  const purchase = await tx.supplierPurchase.findUnique({
    where: { id },
    select: { id: true, total: true },
  });

  if (!purchase) throw new Error("La compra del proveedor no existe.");

  const agg = await tx.payment.aggregate({
    where: {
      direction: PaymentDirection.OUT,
      supplierPurchaseId: purchase.id,
    },
    _sum: { amount: true },
  });

  const total = purchase.total as Prisma.Decimal;
  const paid = (agg._sum.amount ?? new Prisma.Decimal(0)) as Prisma.Decimal;

  const raw = total.sub(paid);
  const balance = raw.lt(0) ? new Prisma.Decimal(0) : raw;

  return { supplierPurchaseId: purchase.id, total, paid, balance };
}
