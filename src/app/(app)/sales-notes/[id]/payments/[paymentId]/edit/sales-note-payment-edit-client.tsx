"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { SalesNotePaymentWizard } from "@/modules/sales-notes/components/SalesNotePaymentWizard/SalesNotePaymentWizard";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import type { SalesNotePaymentEditDto } from "@/modules/sales-notes/queries/getSalesNotePaymentForEdit.query";
import { updateSalesNotePaymentAction } from "@/modules/sales-notes/actions/updateSalesNotePayment.action";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

export function SalesNotePaymentEditClient({
  payment,
}: {
  payment: SalesNotePaymentEditDto;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SalesNotePaymentFormValues) => {
    setSubmitting(true);
    try {
      await updateSalesNotePaymentAction({
        salesNoteId: payment.salesNoteId,
        paymentId: payment.paymentId,
        values,
      });
      toast.success("Pago actualizado exitosamente");
      router.push(routes.salesNotes.details(payment.salesNoteId));
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar el pago";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <SalesNotePaymentWizard
        title="Editar pago"
        description="Actualiza la información del pago y guarda los cambios."
        meta={{
          folio: payment.meta.folio,
          partyName: payment.meta.partyName,
          total: payment.meta.total,
          paid: payment.meta.paidWithoutThisPayment,
          remaining: payment.meta.maxAllowedAmount,
          mode: "edit",
          currentAmount: payment.meta.currentAmount,
        }}
        initialValues={payment.values}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
