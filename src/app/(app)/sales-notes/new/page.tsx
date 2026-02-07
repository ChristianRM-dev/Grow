import { routes } from "@/lib/routes"
import { FormPageScaffold } from "@/modules/shared/forms/FormPageScaffold"
import { resolveSalesNoteNewState } from "@/modules/sales-notes/flows/resolveSalesNoteNewState"
import { SalesNoteNewClient } from "./sales-note-new-client"

export default async function SalesNoteNewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const { initialValues, sourceQuotation } =
    await resolveSalesNoteNewState(params)

  return (
    <FormPageScaffold
      title="Nueva nota de venta"
      description="Registra una nueva nota de venta."
      backHref={routes.salesNotes.list()}
      breadcrumbs={[
        { label: "Notas de venta", href: routes.salesNotes.list() },
        { label: "Nueva" },
      ]}
    >
      <SalesNoteNewClient
        initialValues={initialValues}
        sourceQuotation={sourceQuotation}
      />
    </FormPageScaffold>
  )
}
