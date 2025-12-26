import React from "react";
import { notFound } from "next/navigation";

import { getSalesNoteForPaymentById } from "@/modules/sales-notes/queries/getSalesNoteForPayment.query";
import { SalesNotePaymentNewClient } from "./sales-note-payment-new-client";

import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SalesNotePaymentNewPage({ params }: Props) {
  const { id } = await params;

  const salesNote = await getSalesNoteForPaymentById(id);
  if (!salesNote) notFound();

  const salesNoteLink = routes.salesNotes.details(salesNote.id);

  return (
    <FormPageLayout
      title="Nuevo pago"
      description={`Agregar un pago a la nota de venta: ${salesNote.folio}`}
      backHref={salesNoteLink}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Notas de venta", href: routes.salesNotes.list() },
            { label: `Nota: ${salesNote.folio}`, href: salesNoteLink },
            { label: "Nuevo pago" },
          ]}
        />
      }
    >
      <SalesNotePaymentNewClient salesNote={salesNote} />
    </FormPageLayout>
  );
}
