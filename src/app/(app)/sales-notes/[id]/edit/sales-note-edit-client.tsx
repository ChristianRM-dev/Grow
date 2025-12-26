"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { SalesNoteWizard } from "@/modules/sales-notes/components/SalesNoteWizard/SalesNoteWizard";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import type { SalesNoteForEditDto } from "@/modules/sales-notes/queries/getSalesNoteForEdit.query";
import { updateSalesNoteAction } from "@/modules/sales-notes/actions/updateSalesNote.action";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

export function SalesNoteEditClient({
  salesNote,
}: {
  salesNote: SalesNoteForEditDto;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SalesNoteFormValues) => {
    setSubmitting(true);
    try {
      await updateSalesNoteAction({ id: salesNote.id, values });
      toast.success("Actualizado exitosamente");
      router.push(routes.salesNotes.details(salesNote.id));
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar la nota de venta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <SalesNoteWizard
        initialValues={salesNote.values}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
