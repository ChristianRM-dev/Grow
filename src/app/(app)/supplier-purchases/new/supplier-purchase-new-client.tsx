"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

import { SupplierPurchaseWizard } from "@/modules/supplier-purchases/components/SupplierPurchaseWizard/SupplierPurchaseWizard";
import type { SupplierPurchaseFormValues } from "@/modules/supplier-purchases/forms/supplierPurchaseForm.schemas";
import { createSupplierPurchaseAction } from "@/modules/supplier-purchases/actions/createSupplierPurchase.action";

export function SupplierPurchaseNewClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SupplierPurchaseFormValues) => {
    setSubmitting(true);
    try {
      const res = await createSupplierPurchaseAction(values);
      toast.success("Guardado exitosamente");
      router.replace(routes.supplierPurchases.details(res.supplierPurchaseId));

    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar la compra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <SupplierPurchaseWizard
        initialValues={{
          supplier: { partyId: "", partyName: "", partyPhone: "" },
          supplierFolio: "",
          total: "",
          notes: "",
          occurredAt: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
