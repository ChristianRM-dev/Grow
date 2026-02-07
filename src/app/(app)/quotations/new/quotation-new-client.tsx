"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

import { QuotationWizard } from "@/modules/quotations/components/QuotationWizard/QuotationWizard";
import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
import { createQuotationAction } from "@/modules/quotations/actions/createQuotation.action";
import { cloneQuotationDefaultValues } from "@/modules/quotations/forms/quotationDefaults";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

export function QuotationNewClient() {
  const router = useRouter();
  const defaultValues = useMemo(() => cloneQuotationDefaultValues(), []);

  const handleSubmit = async (values: QuotationFormValues) => {
    try {
      const res = await createQuotationAction(values);

      if (!res.ok) {
        toast.error("Revisa los campos. Hay errores de validación.");
        return;
      }

      toast.success("Cotización guardada exitosamente");
      router.replace(routes.quotations.details(res.quotationId));
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar la cotización.");
    }
  };

  return (
    <QuotationWizard
      initialValues={defaultValues}
      onSubmit={handleSubmit}
      draftKey="quotation:new"
    />
  );
}
