import type { QuotationFormValues } from "./quotationForm.schemas"
import { cloneFormDefaults } from "@/modules/shared/forms/defaultValues"

export const quotationDefaultValues: QuotationFormValues = {
  customer: {
    mode: "PARTY",
    partyName: "",
    partyMode: "EXISTING",
    existingPartyId: "",
    existingPartyName: "",
  },
  lines: [],
  unregisteredLines: [],
}

export function cloneQuotationDefaultValues(): QuotationFormValues {
  return cloneFormDefaults(quotationDefaultValues)
}
