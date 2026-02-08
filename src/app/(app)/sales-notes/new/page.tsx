import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs"
import { routes } from "@/lib/routes"
import { getQuotationForSalesNoteDraft } from "@/modules/quotations/queries/getQuotationForSalesNoteDraft.query"
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas"
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger"
import { SalesNoteNewClient } from "./sales-note-new-client"

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
}

function cloneDefaultValues(): SalesNoteFormValues {
  return JSON.parse(JSON.stringify(baseValues)) as SalesNoteFormValues
}

export default async function SalesNoteNewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const fromQuotationId =
    typeof params?.fromQuotationId === "string" ? params.fromQuotationId : null

  salesNoteLogger.info("NewPage", "Rendering server component", {
    fromQuotationId,
  })

  let initialValues = cloneDefaultValues()
  let sourceQuotation:
    | {
        id: string
        folio: string
      }
    | undefined

  if (fromQuotationId) {
    salesNoteLogger.info("NewPage", "Fetching quotation draft for prefill", {
      fromQuotationId,
    })
    const draft = await getQuotationForSalesNoteDraft(fromQuotationId)

    if (draft) {
      salesNoteLogger.info("NewPage", "Quotation draft loaded", {
        quotationId: draft.quotationId,
        folio: draft.folio,
        lines: draft.values.lines?.length ?? 0,
        unregisteredLines: draft.values.unregisteredLines?.length ?? 0,
      })
      initialValues = draft.values
      sourceQuotation = { id: draft.quotationId, folio: draft.folio }
    } else {
      salesNoteLogger.warn("NewPage", "Quotation draft not found", {
        fromQuotationId,
      })
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
  )
}
