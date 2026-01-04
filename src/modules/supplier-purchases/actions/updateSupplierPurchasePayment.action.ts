"use server";

import { safeTrim } from "@/modules/shared/utils/strings";
import { SupplierPurchasePaymentFinalSchema } from "@/modules/supplier-purchases/forms/supplierPurchasePaymentForm.schemas";
import { updatePartyPaymentOutUseCase } from "@/modules/payments/application/updatePartyPaymentOut.usecase";

function purchaseToken(purchaseId: string) {
  return `SP:${purchaseId}`;
}

function stripToken(text: string, token: string) {
  const t = token.toLowerCase();
  const parts = text
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => p.toLowerCase() !== t);

  return parts.join(" · ");
}

function buildReference(args: {
  supplierFolio: string;
  supplierPurchaseId: string;
  userReference?: string;
}) {
  const token = purchaseToken(args.supplierPurchaseId);
  const prefix = `Compra ${
    safeTrim(args.supplierFolio) || args.supplierPurchaseId
  }`;

  const rawExtra = safeTrim(args.userReference);
  const extra = rawExtra ? stripToken(rawExtra, token) : "";

  return extra ? `${prefix} · ${extra} · ${token}` : `${prefix} · ${token}`;
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
    paymentType: values.paymentType,
    amount: values.amount,
    supplierPurchaseId: values.supplierPurchaseId,
    reference,
    notes: safeTrim(values.notes) || undefined,
    occurredAt,
  });

  return { paymentId: res.paymentId };
}
