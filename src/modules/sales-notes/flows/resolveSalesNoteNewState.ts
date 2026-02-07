import { z } from "zod"

import { getQuotationForSalesNoteDraft } from "@/modules/quotations/queries/getQuotationForSalesNoteDraft.query"
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas"
import { cloneFormDefaults } from "@/modules/shared/forms/defaultValues"
import {
  getSearchParamString,
  type SearchParams,
} from "@/modules/shared/forms/searchParams"
import { cloneSalesNoteDefaultValues } from "@/modules/sales-notes/forms/salesNoteDefaults"

type SourceQuotation = {
  id: string
  folio: string
}

export type SalesNoteNewState = {
  initialValues: SalesNoteFormValues
  sourceQuotation?: SourceQuotation
}

const searchParamsSchema = z.object({
  fromQuotationId: z.string().optional(),
})

export async function resolveSalesNoteNewState(
  searchParams: SearchParams | undefined
): Promise<SalesNoteNewState> {
  const parsed = searchParamsSchema.safeParse({
    fromQuotationId: getSearchParamString(searchParams, "fromQuotationId"),
  })
  const fromQuotationId = parsed.success ? parsed.data.fromQuotationId : null

  if (!fromQuotationId) {
    return { initialValues: cloneSalesNoteDefaultValues() }
  }

  const draft = await getQuotationForSalesNoteDraft(fromQuotationId)
  if (!draft) {
    return { initialValues: cloneSalesNoteDefaultValues() }
  }

  return {
    initialValues: cloneFormDefaults(draft.values),
    sourceQuotation: { id: draft.quotationId, folio: draft.folio },
  }
}
