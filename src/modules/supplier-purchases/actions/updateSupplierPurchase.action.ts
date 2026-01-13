"use server";

import { SupplierPurchaseFinalSchema } from "@/modules/supplier-purchases/forms/supplierPurchaseForm.schemas";
import { updateSupplierPurchaseUseCase } from "@/modules/supplier-purchases/application/updateSupplierPurchase.usecase";
import { businessDateStringToUtcDate } from "@/modules/shared/dates/businessDate";

export async function updateSupplierPurchaseAction(args: {
  id: string;
  input: unknown;
}): Promise<{ supplierPurchaseId: string }> {
  const values = SupplierPurchaseFinalSchema.parse(args.input);

  const occurredAt = values.occurredAt
    ? businessDateStringToUtcDate(values.occurredAt)
    : undefined;

  return updateSupplierPurchaseUseCase(args.id, {
    partyId: values.supplier.partyId,
    supplierFolio: values.supplierFolio,
    total: values.total,
    notes: values.notes,
    occurredAt,
  });
}
