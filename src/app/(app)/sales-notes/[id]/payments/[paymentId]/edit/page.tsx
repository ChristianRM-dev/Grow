import React from "react";
import { notFound } from "next/navigation";

import { getSalesNotePaymentForEdit } from "@/modules/sales-notes/queries/getSalesNotePaymentForEdit.query";
import { SalesNotePaymentEditClient } from "./sales-note-payment-edit-client";

import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

export default async function SalesNotePaymentEditPage({
  params,
}: {
  params: Promise<{ id: string; paymentId: string }>;
}) {
  const { id, paymentId } = await params;

  const payment = await getSalesNotePaymentForEdit({
    salesNoteId: id,
    paymentId,
  });

  if (!payment) notFound();

  const salesNoteLink = routes.salesNotes.details(id);

  return (
    <FormPageLayout
      title="Editar pago"
      description="Actualiza la información del pago."
      backHref={salesNoteLink}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Notas de venta", href: routes.salesNotes.list() },
            { label: "Editar nota", href: salesNoteLink },
            { label: "Editar pago" },
          ]}
        />
      }
    >
      <SalesNotePaymentEditClient payment={payment} />
    </FormPageLayout>
  );
}
