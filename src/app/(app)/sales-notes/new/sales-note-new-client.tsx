"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { SalesNoteWizard } from "@/modules/sales-notes/components/SalesNoteWizard/SalesNoteWizard";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { createSalesNoteAction } from "@/modules/sales-notes/actions/createSalesNote.action";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

export function SalesNoteNewClient({
  initialValues,
  sourceQuotation,
}: {
  initialValues: SalesNoteFormValues;
  sourceQuotation?: { id: string; folio: string };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SalesNoteFormValues) => {
    setSubmitting(true);
    try {
      const res = await createSalesNoteAction(values);

      if (!res.ok) {
        // Nota: aquí probablemente era toast.error, no success 🙂
        toast.error("Revisa los campos. Hay errores de validación.");
        return;
      }

      toast.success("Guardado exitosamente");

      router.replace(routes.salesNotes.details(res.salesNoteId)); // si la agregas
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {sourceQuotation ? (
        <div className="alert alert-info mb-4">
          <div>
            <h4 className="font-semibold">Cotización origen</h4>
            <p className="text-sm opacity-80">
              Prefill desde la cotización {sourceQuotation.folio}.
            </p>
          </div>
        </div>
      ) : null}

      <SalesNoteWizard
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </>
  );
}
