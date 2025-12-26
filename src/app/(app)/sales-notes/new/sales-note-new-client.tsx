"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { SalesNoteWizard } from "@/modules/sales-notes/components/SalesNoteWizard/SalesNoteWizard";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { createSalesNoteAction } from "@/modules/sales-notes/actions/createSalesNote.action";

export function SalesNoteNewClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SalesNoteFormValues) => {
    setSubmitting(true);
    try {
      console.log("Form::handleSubmit::values", values);
      const res = await createSalesNoteAction(values);
      console.log("Form::handleSubmit::res", res);

      if (!res.ok) {
        alert("Revisa los campos. Hay errores de validación.");
        return;
      }

      alert("Guardado exitosamente");
      router.push("/sales-notes");
      // Or if you later have details page:
      // router.push(`/sales-notes/${res.salesNoteId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SalesNoteWizard
      initialValues={{
        customer: {
          mode: "PUBLIC",
          partyMode: "EXISTING",
          existingPartyName: "",
          existingPartyId: "",
          newParty: { name: "", phone: "", notes: "" },
        },
        lines: [
          {
            productVariantId: "",
            productName: "",
            quantity: 1,
            unitPrice: "",
            description: "",
          },
        ],
        unregisteredLines: [],
      }}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}
