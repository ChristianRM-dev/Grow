"use server";

import { SupplierPurchaseFinalSchema } from "@/modules/supplier-purchases/forms/supplierPurchaseForm.schemas";
import { updateSupplierPurchaseUseCase } from "@/modules/supplier-purchases/application/updateSupplierPurchase.usecase";

export async function updateSupplierPurchaseAction(args: {
  id: string;
  input: unknown;
}): Promise<{ supplierPurchaseId: string }> {
  const values = SupplierPurchaseFinalSchema.parse(args.input);

  const occurredAt = values.occurredAt
    ? new Date(values.occurredAt + "T00:00:00")
    : undefined;

  return updateSupplierPurchaseUseCase(args.id, {
    partyId: values.supplier.partyId,
    supplierFolio: values.supplierFolio,
    total: values.total,
    notes: values.notes,
    occurredAt,
  });
}
