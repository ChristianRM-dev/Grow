import { prisma } from "@/lib/prisma";
import { toNumber } from "@/modules/shared/utils/toNumber";
import { assertNotSoftDeleted } from "@/modules/shared/queries/softDeleteHelpers";

export type SupplierPurchasePdfLineDto = {
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};

export type SupplierPurchasePdfDto = {
  id: string;
  supplierFolio: string;
  occurredAt: string; // ISO
  partyName: string;
  notes: string | null;
  total: string; // decimal as string
  lines: SupplierPurchasePdfLineDto[];
};

export async function getSupplierPurchasePdfDataById(
  id: string
): Promise<SupplierPurchasePdfDto | null> {
  const purchase = await prisma.supplierPurchase.findUnique({
    where: { id },
    select: {
      id: true,
      supplierFolio: true,
      occurredAt: true,
      total: true,
      notes: true,
      isDeleted: true, // ← Necesario
      party: { select: { name: true } },
    },
  });

  // Redirigir a 404 si está eliminada
  assertNotSoftDeleted(purchase, "Compra de proveedor");

  // SupplierPurchase doesn't have line items yet -> synthetic single row.
  const totalNumber = toNumber(purchase.total);
  const totalFixed = totalNumber.toFixed(2);

  return {
    id: purchase.id,
    supplierFolio: purchase.supplierFolio,
    occurredAt: purchase.occurredAt.toISOString(),
    partyName: purchase.party.name,
    notes: purchase.notes ?? null,
    total: totalFixed,
    lines: [
      {
        description: "Compra a proveedor",
        quantity: "1",
        unitPrice: totalFixed,
        lineTotal: totalFixed,
      },
    ],
  };
}
