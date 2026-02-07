"use client"

import React, { useMemo } from "react"
import {
  defineFormStep,
  prefixIssuePathMapper,
} from "@/components/ui/MultiStepForm/stepBuilders";

import {
  SalesNoteFormSchema,
  SalesNoteCustomerStepSchema,
  SalesNoteLinesStepSchema,
  SalesNoteUnregisteredLinesStepSchema,
  type SalesNoteFormInput,
  type SalesNoteFormValues,
} from "@/modules/sales-notes/forms/salesNoteForm.schemas";

import { SalesNoteCustomerStep } from "./steps/SalesNoteCustomerStep";
import { SalesNoteLinesStep } from "./steps/SalesNoteLinesStep";
import { SalesNoteUnregisteredLinesStep } from "./steps/SalesNoteUnregisteredLinesStep";
import { SalesNoteSummaryStep } from "./steps/SalesNoteSummaryStep";
import { WizardShell } from "@/modules/shared/forms/wizard/WizardShell"
import { buildWizardLabels } from "@/modules/shared/forms/wizard/labels"
import { WizardStepIds } from "@/modules/shared/forms/wizard/stepIds"
import { mapArrayIssuePath } from "@/modules/shared/forms/wizard/validation"

// ✅ IMPORTANT: keep Step factory stable across renders
const Step = defineFormStep<SalesNoteFormInput>()
const summaryLabels = buildWizardLabels("Guardar")

const buildDefaultValues = (
  initialValues: Partial<SalesNoteFormInput>
): SalesNoteFormInput => ({
  ...initialValues,
  lines: initialValues?.lines ?? [],
  unregisteredLines: initialValues?.unregisteredLines ?? [],
})

type SalesNoteWizardProps = {
  initialValues: Partial<SalesNoteFormInput>;
  onSubmit: (values: SalesNoteFormValues) => Promise<void> | void;
  draftKey?: string;
};

export function SalesNoteWizard({
  initialValues,
  onSubmit,
  draftKey,
}: SalesNoteWizardProps) {
  const steps = useMemo(
    () =>
      [
        Step.withValidator({
          id: WizardStepIds.customer,
          title: "Cliente",
          fieldPaths: [
            "customer.mode",
            "customer.partyMode",
            "customer.existingPartyId",
            "customer.newParty.name",
            "customer.newParty.phone",
            "customer.newParty.notes",
          ],
          validator: {
            schema: SalesNoteCustomerStepSchema,
            getStepValues: (v) => v.customer,
            mapIssuePathToFieldPath:
              prefixIssuePathMapper<SalesNoteFormInput>("customer"),
          },
          Component: SalesNoteCustomerStep,
        }),
        Step.withValidator({
          id: WizardStepIds.lines,
          title: "Productos",
          fieldPaths: ["lines"],
          validator: {
            schema: SalesNoteLinesStepSchema,
            getStepValues: (v) => v.lines ?? [],
          },
          Component: SalesNoteLinesStep,
        }),
        Step.withValidator({
          id: WizardStepIds.unregisteredLines,
          title: "Productos no registrados",
          fieldPaths: ["unregisteredLines"],
          validator: {
            schema: SalesNoteUnregisteredLinesStepSchema,
            getStepValues: (v) => v.unregisteredLines ?? [],
            mapIssuePathToFieldPath:
              mapArrayIssuePath<SalesNoteFormInput>("unregisteredLines"),
          },
          Component: SalesNoteUnregisteredLinesStep,
        }),
        {
          id: WizardStepIds.summary,
          kind: "summary",
          title: "Resumen",
          fieldPaths: [],
          Component: SalesNoteSummaryStep,
          labels: summaryLabels,
        },
      ],
    []
  )

  return (
    <WizardShell<SalesNoteFormInput, SalesNoteFormValues>
      initialValues={initialValues}
      buildDefaultValues={buildDefaultValues}
      schema={SalesNoteFormSchema}
      steps={steps}
      labels={summaryLabels}
      onSubmit={onSubmit}
      draft={
        draftKey
          ? {
              key: draftKey,
              contextLabel: "nota de venta",
              schema: SalesNoteFormSchema,
            }
          : undefined
      }
    />
  )
}
