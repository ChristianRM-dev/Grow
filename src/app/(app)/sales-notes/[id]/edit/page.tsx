import { notFound } from "next/navigation";

import { SalesNoteEditClient } from "./sales-note-edit-client";
import { getSalesNoteForEditById } from "@/modules/sales-notes/queries/getSalesNoteForEdit.query";
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";

import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SalesNoteEditPage({ params }: Props) {
  const { id } = await params;

  salesNoteLogger.info("EditPage", "Rendering server component", { id });

  const salesNote = await getSalesNoteForEditById(id);
  if (!salesNote) {
    salesNoteLogger.warn("EditPage", "Sales note not found, returning 404", { id });
    notFound();
  }

  salesNoteLogger.info("EditPage", "Sales note loaded for edit", {
    id: salesNote.id,
    linesCount: salesNote.values.lines?.length ?? 0,
    unregisteredLinesCount: salesNote.values.unregisteredLines?.length ?? 0,
    customerMode: salesNote.values.customer?.mode,
  });

  return (
    <FormPageLayout
      title="Editar nota de venta"
      description="Actualiza la información de la nota de venta."
      backHref={routes.salesNotes.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Notas de venta", href: routes.salesNotes.list() },
            { label: "Editar" },
          ]}
        />
      }
    >
      <SalesNoteEditClient salesNote={salesNote} />
    </FormPageLayout>
  );
}
