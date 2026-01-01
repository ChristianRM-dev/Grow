"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

import type { SupplierPurchaseForPaymentDto } from "@/modules/supplier-purchases/queries/getSupplierPurchaseForPayment.query";
import type { SupplierPurchasePaymentFormValues } from "@/modules/supplier-purchases/forms/supplierPurchasePaymentForm.schemas";

import { createSupplierPurchasePaymentAction } from "@/modules/supplier-purchases/actions/createSupplierPurchasePayment.action";
import { SupplierPurchasePaymentWizard } from "@/modules/supplier-purchases/components/SupplierPurchasePaymentWizard/SupplierPurchasePaymentWizard";

export function SupplierPurchasePaymentNewClient({
  dto,
}: {
  dto: SupplierPurchaseForPaymentDto;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SupplierPurchasePaymentFormValues) => {
    console.log("handleSubmit");
    setSubmitting(true);
    try {
      console.log("handleSubmit", values);
      await createSupplierPurchasePaymentAction(values);
      toast.success("Pago registrado");
      router.replace(routes.supplierPurchases.details(dto.id));

    } catch (err) {
      console.error(err);
      toast.error("No se pudo registrar el pago");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <SupplierPurchasePaymentWizard
        meta={{
          supplierPurchaseId: dto.id,
          supplierFolio: dto.supplierFolio,
          partyId: dto.party.id,
          partyName: dto.party.name,
          purchaseTotal: dto.total,
          mode: "new",
          paidTotal: dto.paidTotal,
          remainingTotal: dto.remainingTotal,
        }}
        initialValues={{
          supplierPurchaseId: dto.id,
          supplierFolio: dto.supplierFolio, // ✅ FALTABA
          partyId: dto.party.id,
          paymentType: "CASH",
          amount: "",
          occurredAt: dto.occurredAt,
          reference: `Compra ${dto.supplierFolio}`,
          notes: "",
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
