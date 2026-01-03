import { notFound } from "next/navigation";

import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";
import { getQuotationForEditById } from "@/modules/quotations/queries/getQuotationForEdit.query";
import { QuotationEditClient } from "./quotation-edit-client";

export default async function QuotationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const quotation = await getQuotationForEditById(id);
  if (!quotation) return notFound();

  return (
    <FormPageLayout
      title={`Editar cotización ${quotation.folio}`}
      description="Actualiza los datos de la cotización."
      backHref={routes.quotations.details(quotation.id)}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Cotizaciones", href: routes.quotations.list() },
            { label: quotation.folio, href: routes.quotations.details(id) },
            { label: "Editar" },
          ]}
        />
      }
    >
      <QuotationEditClient
        quotationId={quotation.id}
        initialValues={quotation.values}
      />
    </FormPageLayout>
  );
}
