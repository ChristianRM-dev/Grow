"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { QuotationWizard } from "@/modules/quotations/components/QuotationWizard/QuotationWizard";
import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
import { updateQuotationAction } from "@/modules/quotations/actions/updateQuotation.action";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

export function QuotationEditClient({
  quotationId,
  initialValues,
}: {
  quotationId: string;
  initialValues: QuotationFormValues;
}) {
  const router = useRouter();

  const handleSubmit = async (values: QuotationFormValues) => {
    try {
      const res = await updateQuotationAction({ id: quotationId, values });

      if (!res.ok) {
        toast.error("Revisa los campos. Hay errores de validación.");
        return;
      }

      toast.success("Cotización actualizada exitosamente");
      router.replace(routes.quotations.details(res.quotationId));
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar la cotización.");
    }
  };

  return (
    <QuotationWizard
      initialValues={initialValues}
      onSubmit={handleSubmit}
    />
  );
}
