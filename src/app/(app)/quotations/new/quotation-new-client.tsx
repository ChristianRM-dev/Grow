"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { QuotationWizard } from "@/modules/quotations/components/QuotationWizard/QuotationWizard";
import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
import { createQuotationAction } from "@/modules/quotations/actions/createQuotation.action";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

const defaultValues: QuotationFormValues = {
  customer: {
    mode: "PARTY",
    partyName: "",
    partyMode: "EXISTING",
    existingPartyId: "",
    existingPartyName: "",
  },
  lines: [],
  unregisteredLines: [],
};

export function QuotationNewClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: QuotationFormValues) => {
    setSubmitting(true);
    try {
      const res = await createQuotationAction(values);

      if (!res.ok) {
        toast.error("Revisa los campos. Hay errores de validación.");
        return;
      }

      toast.success("Cotización guardada exitosamente");
      router.replace(routes.quotations.details(res.quotationId));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <QuotationWizard
      initialValues={defaultValues}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}
