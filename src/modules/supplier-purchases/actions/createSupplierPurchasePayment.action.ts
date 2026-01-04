"use server";

import { safeTrim } from "@/modules/shared/utils/strings";
import { createPartyPaymentOutUseCase } from "@/modules/payments/application/createPartyPaymentOut.usecase";
import { SupplierPurchasePaymentFinalSchema } from "@/modules/supplier-purchases/forms/supplierPurchasePaymentForm.schemas";

function purchaseToken(purchaseId: string) {
  return `SP:${purchaseId}`;
}

function buildPurchasePaymentReference(args: {
  supplierFolio: string;
  supplierPurchaseId: string;
  userReference?: string;
}) {
  const token = purchaseToken(args.supplierPurchaseId);
  const prefix = `Compra ${
    safeTrim(args.supplierFolio) || args.supplierPurchaseId
  }`;
  const extra = safeTrim(args.userReference);

  return extra ? `${prefix} · ${extra} · ${token}` : `${prefix} · ${token}`;
}

export async function createSupplierPurchasePaymentAction(
  input: unknown
): Promise<{ paymentId: string }> {
  const values = SupplierPurchasePaymentFinalSchema.parse(input);

  const occurredAt = values.occurredAt
    ? new Date(values.occurredAt + "T00:00:00")
    : new Date();

  const reference = buildPurchasePaymentReference({
    supplierFolio: values.supplierFolio,
    supplierPurchaseId: values.supplierPurchaseId,
    userReference: values.reference,
  });

  const res = await createPartyPaymentOutUseCase({
    partyId: values.partyId,
    paymentType: values.paymentType,
    amount: values.amount,
    supplierPurchaseId: values.supplierPurchaseId,
    reference,
    notes: safeTrim(values.notes) || undefined,
    occurredAt,
  });

  return { paymentId: res.paymentId };
}
