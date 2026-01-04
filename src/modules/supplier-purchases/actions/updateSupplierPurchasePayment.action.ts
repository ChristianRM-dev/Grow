"use server";

import { safeTrim } from "@/modules/shared/utils/strings";
import { SupplierPurchasePaymentFinalSchema } from "@/modules/supplier-purchases/forms/supplierPurchasePaymentForm.schemas";
import { updatePartyPaymentOutUseCase } from "@/modules/payments/application/updatePartyPaymentOut.usecase";

function buildReference(args: {
  supplierFolio: string;
  supplierPurchaseId: string;
  userReference?: string;
}) {
  const prefix = `Compra ${
    safeTrim(args.supplierFolio) || args.supplierPurchaseId
  }`;

  const extra = safeTrim(args.userReference);
  return extra ? `${prefix} · ${extra}` : prefix;
}

export async function updateSupplierPurchasePaymentAction(params: {
  paymentId: string;
  input: unknown;
}): Promise<{ paymentId: string }> {
  const paymentId = safeTrim(params.paymentId);
  if (!paymentId) throw new Error("paymentId es requerido");

  const values = SupplierPurchasePaymentFinalSchema.parse(params.input);

  const occurredAt = new Date(values.occurredAt + "T00:00:00");

  const reference = buildReference({
    supplierFolio: values.supplierFolio,
    supplierPurchaseId: values.supplierPurchaseId,
    userReference: values.reference,
  });

  const res = await updatePartyPaymentOutUseCase(paymentId, {
    partyId: values.partyId,
    supplierPurchaseId: values.supplierPurchaseId, // ✅ NEW FK
    paymentType: values.paymentType,
    amount: values.amount,
    reference,
    notes: safeTrim(values.notes) || undefined,
    occurredAt,
  });

  return { paymentId: res.paymentId };
}
