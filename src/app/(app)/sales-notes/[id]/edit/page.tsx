import { notFound } from "next/navigation";
import { SalesNoteEditClient } from "./sales-note-edit-client";
import { getSalesNoteForEditById } from "@/modules/sales-notes/queries/getSalesNoteForEdit.query";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SalesNoteEditPage({ params }: Props) {
  const { id } = await params;
  console.log("SalesNoteEditPage", id);
  const saleNote = await getSalesNoteForEditById(id);
  console.log("SalesNoteEditPage", saleNote);
  if (!saleNote) notFound();

  return <SalesNoteEditClient salesNote={saleNote} />;
}
