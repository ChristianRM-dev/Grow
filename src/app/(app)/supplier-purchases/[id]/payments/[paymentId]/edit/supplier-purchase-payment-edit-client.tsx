"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

import type { SupplierPurchasePaymentForEditDto } from "@/modules/supplier-purchases/queries/getSupplierPurchasePaymentForEdit.query";
import type { SupplierPurchasePaymentFormValues } from "@/modules/supplier-purchases/forms/supplierPurchasePaymentForm.schemas";

import { updateSupplierPurchasePaymentAction } from "@/modules/supplier-purchases/actions/updateSupplierPurchasePayment.action";
import { SupplierPurchasePaymentWizard } from "@/modules/supplier-purchases/components/SupplierPurchasePaymentWizard/SupplierPurchasePaymentWizard";

export function SupplierPurchasePaymentEditClient({
  dto,
}: {
  dto: SupplierPurchasePaymentForEditDto;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // maxAllowed is remaining + current amount (edit behavior)
  const maxAllowed = dto.maxAllowedAmount;
  const paidWithout = dto.paidWithoutThisPayment;

  const handleSubmit = async (values: SupplierPurchasePaymentFormValues) => {
    setSubmitting(true);
    try {
      await updateSupplierPurchasePaymentAction({
        paymentId: dto.payment.id,
        input: values,
      });

      toast.success("Pago actualizado");
      router.push(routes.supplierPurchases.details(dto.supplierPurchase.id));
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar el pago");
    } finally {
      setSubmitting(false);
    }
  };

  // Try to show only the "extra" portion in the reference input:
  // Since action rebuilds reference anyway, we can keep it empty or set to user's previous reference.
  const initialReference = useMemo(() => {
    // Keep it simple: show empty (user can type new extra reference).
    // If you want to prefill, we can parse dto.payment.reference and remove "Compra ... · SP:..."
    return "";
  }, []);

  return (
    <div className="p-4">
      <SupplierPurchasePaymentWizard
        meta={{
          supplierPurchaseId: dto.supplierPurchase.id,
          supplierFolio: dto.supplierPurchase.supplierFolio,
          partyId: dto.supplierPurchase.party.id,
          partyName: dto.supplierPurchase.party.name,

          purchaseTotal: dto.supplierPurchase.total,
          paidTotal: paidWithout, // ✅ paid without this payment
          remainingTotal: maxAllowed, // ✅ max allowed now
          mode: "edit",
          currentAmount: dto.payment.amount,
        }}
        initialValues={{
          supplierPurchaseId: dto.supplierPurchase.id,
          supplierFolio: dto.supplierPurchase.supplierFolio,
          partyId: dto.supplierPurchase.party.id,

          paymentType: dto.payment.paymentType,
          amount: dto.payment.amount,
          occurredAt: dto.payment.occurredAt,
          reference: initialReference,
          notes: dto.payment.notes ?? "",
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
