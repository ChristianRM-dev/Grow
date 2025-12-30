import { prisma } from "@/lib/prisma";

export type SupplierPurchaseForEditDto = {
  id: string;
  supplier: {
    partyId: string;
    partyName: string;
    partyPhone: string | null;
  };
  supplierFolio: string;
  total: string; // decimal string
  occurredAt: string; // YYYY-MM-DD
  notes: string | null;
};

export async function getSupplierPurchaseForEditById(id: string) {
  const row = await prisma.supplierPurchase.findUnique({
    where: { id },
    select: {
      id: true,
      partyId: true,
      supplierFolio: true,
      total: true,
      occurredAt: true,
      notes: true,
      party: { select: { name: true, phone: true } },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    supplier: {
      partyId: row.partyId,
      partyName: row.party.name,
      partyPhone: row.party.phone,
    },
    supplierFolio: row.supplierFolio,
    total: row.total.toString(),
    occurredAt: row.occurredAt.toISOString().slice(0, 10),
    notes: row.notes,
  } satisfies SupplierPurchaseForEditDto;
}
