import type { SalesNoteFormValues } from "./salesNoteForm.schemas"
import { cloneFormDefaults } from "@/modules/shared/forms/defaultValues"

export const salesNoteDefaultValues: SalesNoteFormValues = {
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

export function cloneSalesNoteDefaultValues(): SalesNoteFormValues {
  return cloneFormDefaults(salesNoteDefaultValues)
}
