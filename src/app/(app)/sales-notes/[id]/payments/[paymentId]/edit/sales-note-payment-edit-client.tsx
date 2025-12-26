"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { SalesNotePaymentWizard } from "@/modules/sales-notes/components/SalesNotePaymentWizard/SalesNotePaymentWizard";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import type { SalesNotePaymentEditDto } from "@/modules/sales-notes/queries/getSalesNotePaymentForEdit.query";
import { updateSalesNotePaymentAction } from "@/modules/sales-notes/actions/updateSalesNotePayment.action";

export function SalesNotePaymentEditClient({
  dto,
}: {
  dto: SalesNotePaymentEditDto;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: SalesNotePaymentFormValues) => {
    setSubmitting(true);
    try {
      await updateSalesNotePaymentAction({
        salesNoteId: dto.salesNoteId,
        paymentId: dto.paymentId,
        values,
      });

      alert("Pago actualizado exitosamente");
      router.push(`/sales-notes/${dto.salesNoteId}/edit`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "No se pudo actualizar el pago"
      );
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
          folio: dto.meta.folio,
          partyName: dto.meta.partyName,
          total: dto.meta.total,
          paid: dto.meta.paidWithoutThisPayment,
          remaining: dto.meta.maxAllowedAmount,
          mode: "edit",
          currentAmount: dto.meta.currentAmount,
        }}
        initialValues={dto.values}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
