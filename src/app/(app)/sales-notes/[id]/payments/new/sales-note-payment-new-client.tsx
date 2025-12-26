"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import type { SalesNoteForPaymentDto } from "@/modules/sales-notes/queries/getSalesNoteForPayment.query";
import { SalesNotePaymentWizard } from "@/modules/sales-notes/components/SalesNotePaymentWizard/SalesNotePaymentWizard";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import { createSalesNotePaymentAction } from "@/modules/sales-notes/actions/createSalesNotePayment.action";

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

      alert("Pago registrado exitosamente");
      router.push(`/sales-notes/${salesNote.id}/edit`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "No se pudo registrar el pago"
      );
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
