import React from "react";
import { notFound } from "next/navigation";

import { getSalesNoteForPaymentById } from "@/modules/sales-notes/queries/getSalesNoteForPayment.query";
import { SalesNotePaymentNewClient } from "./sales-note-payment-new-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SalesNotePaymentNewPage({ params }: Props) {
  const { id } = await params;

  console.log("SalesNotePaymentNewPage::id", id);
  const salesNote = await getSalesNoteForPaymentById(id);
  console.log("SalesNotePaymentNewPage::salesNote", salesNote);
  if (!salesNote) notFound();

  return <SalesNotePaymentNewClient salesNote={salesNote} />;
}
