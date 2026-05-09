import { Prisma, PaymentDirection } from "@/generated/prisma/client";
import { computeOutstandingBalance } from "@/modules/shared/utils/decimals";

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

  const { paid, remaining, total } = computeOutstandingBalance({
    total: purchase.total as Prisma.Decimal,
    paid: agg._sum.amount,
  });

  return { supplierPurchaseId: purchase.id, total, paid, balance: remaining };
}
