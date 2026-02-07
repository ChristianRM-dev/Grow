import { routes } from "@/lib/routes";
import { FormPageScaffold } from "@/modules/shared/forms/FormPageScaffold";
import { QuotationNewClient } from "./quotation-new-client";

export default function QuotationNewPage() {
  return (
    <FormPageScaffold
      title="Nueva cotización"
      description="Crea una nueva cotización para un contacto."
      backHref={routes.quotations.list()}
      breadcrumbs={[
        { label: "Cotizaciones", href: routes.quotations.list() },
        { label: "Nueva" },
      ]}
    >
      <QuotationNewClient />
    </FormPageScaffold>
  );
}
