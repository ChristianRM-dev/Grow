"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import type { SalesNoteForPaymentDto } from "@/modules/sales-notes/queries/getSalesNoteForPayment.query";
import { SalesNotePaymentWizard } from "@/modules/sales-notes/components/SalesNotePaymentWizard/SalesNotePaymentWizard";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import { createSalesNotePaymentAction } from "@/modules/sales-notes/actions/createSalesNotePayment.action";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

export function SalesNotePaymentNewClient({
  salesNote,
}: {
  salesNote: SalesNoteForPaymentDto;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SalesNotePaymentFormValues) => {
    setSubmitting(true);
    try {
      await createSalesNotePaymentAction({
        salesNoteId: salesNote.id,
        values,
      });
      toast.success("Pago registrado exitosamente");
      router.replace(routes.salesNotes.details(salesNote.id));

    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "No se pudo registrar el pago";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <SalesNotePaymentWizard
        meta={{
          folio: salesNote.folio,
          partyName: salesNote.party.name,
          total: salesNote.total,
          paid: salesNote.paid,
          remaining: salesNote.remaining,
          mode: "create",
        }}
        initialValues={{
          paymentType: "CASH",
          amount: "",
          reference: "",
          notes: "",
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
