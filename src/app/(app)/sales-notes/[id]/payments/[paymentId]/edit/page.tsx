import React from "react";
import { notFound } from "next/navigation";

import { getSalesNotePaymentForEdit } from "@/modules/sales-notes/queries/getSalesNotePaymentForEdit.query";
import { SalesNotePaymentEditClient } from "./sales-note-payment-edit-client";

export default async function SalesNotePaymentEditPage({
  params,
}: {
  params: Promise<{ id: string; paymentId: string }>;
}) {
  const { id, paymentId } = await params;

  const dto = await getSalesNotePaymentForEdit({
    salesNoteId: id,
    paymentId,
  });

  if (!dto) return notFound();

  return <SalesNotePaymentEditClient dto={dto} />;
}
