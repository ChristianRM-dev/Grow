"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

import { SupplierPurchaseWizard } from "@/modules/supplier-purchases/components/SupplierPurchaseWizard/SupplierPurchaseWizard";
import type { SupplierPurchaseFormValues } from "@/modules/supplier-purchases/forms/supplierPurchaseForm.schemas";
import { updateSupplierPurchaseAction } from "@/modules/supplier-purchases/actions/updateSupplierPurchase.action";
import type { SupplierPurchaseForEditDto } from "@/modules/supplier-purchases/queries/getSupplierPurchaseForEdit.query";

export function SupplierPurchaseEditClient({
  purchase,
}: {
  purchase: SupplierPurchaseForEditDto;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SupplierPurchaseFormValues) => {
    setSubmitting(true);
    try {
      await updateSupplierPurchaseAction({ id: purchase.id, input: values });
      toast.success("Guardado exitosamente");
      router.replace(routes.supplierPurchases.details(purchase.id));

    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar la compra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <SupplierPurchaseWizard
        initialValues={{
          supplier: {
            partyId: purchase.supplier.partyId,
            partyName: purchase.supplier.partyName,
            partyPhone: purchase.supplier.partyPhone ?? "",
          },
          supplierFolio: purchase.supplierFolio,
          total: purchase.total,
          occurredAt: purchase.occurredAt,
          notes: purchase.notes ?? "",
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
