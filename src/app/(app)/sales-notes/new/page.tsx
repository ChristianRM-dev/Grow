import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";
import { getQuotationForSalesNoteDraft } from "@/modules/quotations/queries/getQuotationForSalesNoteDraft.query";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { SalesNoteNewClient } from "./sales-note-new-client";

const baseValues: SalesNoteFormValues = {
  customer: {
    mode: "PUBLIC",
    partyMode: "EXISTING",
    existingPartyName: "",
    existingPartyId: "",
    newParty: { name: "", phone: "", notes: "" },
  },
  lines: [],
  unregisteredLines: [],
};

function cloneDefaultValues(): SalesNoteFormValues {
  return JSON.parse(JSON.stringify(baseValues)) as SalesNoteFormValues;
}

export default async function SalesNoteNewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const fromQuotationId =
    typeof params?.fromQuotationId === "string" ? params.fromQuotationId : null;

  let initialValues = cloneDefaultValues();
  let sourceQuotation:
    | {
        id: string;
        folio: string;
      }
    | undefined;

  if (fromQuotationId) {
    const draft = await getQuotationForSalesNoteDraft(fromQuotationId);
    if (draft) {
      initialValues = draft.values;
      sourceQuotation = { id: draft.quotationId, folio: draft.folio };
    }
  }

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
      <SalesNoteNewClient
        initialValues={initialValues}
        sourceQuotation={sourceQuotation}
      />
    </FormPageLayout>
  );
}
