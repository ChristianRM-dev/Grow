import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { SalesNoteNewClient } from "./sales-note-new-client";
import { routes } from "@/lib/routes";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";

export default function SalesNoteNewPage() {
  return (
    <FormPageLayout
      title="Nueva nota de venta"
      description="Registra una nueva nota de venta."
      backHref={routes.salesNotes.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Notas de venta", href: routes.salesNotes.list() },
            { label: "Nueva" },
          ]}
        />
      }
    >
      <SalesNoteNewClient />
    </FormPageLayout>
  );
}
