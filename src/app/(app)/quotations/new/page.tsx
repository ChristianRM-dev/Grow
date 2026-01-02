import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";
import { QuotationNewClient } from "./quotation-new-client";

export default function QuotationNewPage() {
  return (
    <FormPageLayout
      title="Nueva cotización"
      description="Crea una nueva cotización para un contacto."
      backHref={routes.quotations.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Cotizaciones", href: routes.quotations.list() },
            { label: "Nueva" },
          ]}
        />
      }
    >
      <QuotationNewClient />
    </FormPageLayout>
  );
}
