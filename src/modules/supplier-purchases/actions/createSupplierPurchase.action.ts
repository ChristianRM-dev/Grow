"use server";

import { SupplierPurchaseFinalSchema } from "@/modules/supplier-purchases/forms/supplierPurchaseForm.schemas";
import { createSupplierPurchaseUseCase } from "@/modules/supplier-purchases/application/createSupplierPurchase.usecase";
import { businessDateStringToUtcDate } from "@/modules/shared/dates/businessDate";

export async function createSupplierPurchaseAction(
  input: unknown
): Promise<{ supplierPurchaseId: string }> {
  console.log("createSupplierPurchaseAction", input);
  const values = SupplierPurchaseFinalSchema.parse(input);

  const occurredAt = values.occurredAt
    ? businessDateStringToUtcDate(values.occurredAt)
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
