"use server";

import { SupplierPurchaseFinalSchema } from "@/modules/supplier-purchases/forms/supplierPurchaseForm.schemas";
import { createSupplierPurchaseUseCase } from "@/modules/supplier-purchases/application/createSupplierPurchase.usecase";

export async function createSupplierPurchaseAction(
  input: unknown
): Promise<{ supplierPurchaseId: string }> {
  const values = SupplierPurchaseFinalSchema.parse(input);

  const occurredAt = values.occurredAt
    ? new Date(values.occurredAt + "T00:00:00")
    : undefined;

  const res = await createSupplierPurchaseUseCase({
    partyId: values.supplier.partyId,
    supplierFolio: values.supplierFolio,
    total: values.total,
    notes: values.notes,
    occurredAt,
  });

  return res;
}
