"use client"

import React, { useMemo } from "react"
import {
  defineFormStep,
  prefixIssuePathMapper,
} from "@/components/ui/MultiStepForm/stepBuilders";

import {
  QuotationFormSchema,
  QuotationLinesStepSchema,
  QuotationUnregisteredLinesStepSchema,
} from "@/modules/quotations/forms/quotationForm.schemas";
import type {
  QuotationFormInput,
  QuotationFormValues,
} from "@/modules/quotations/forms/quotationForm.schemas"

import { QuotationCustomerStep } from "./steps/QuotationCustomerStep";
import { QuotationLinesStep } from "./steps/QuotationLinesStep";
import { QuotationUnregisteredLinesStep } from "./steps/QuotationUnregisteredLinesStep";
import { QuotationSummaryStep } from "./steps/QuotationSummaryStep";
import { WizardShell } from "@/modules/shared/forms/wizard/WizardShell"
import { buildWizardLabels } from "@/modules/shared/forms/wizard/labels"
import { WizardStepIds } from "@/modules/shared/forms/wizard/stepIds"
import { mapArrayIssuePath } from "@/modules/shared/forms/wizard/validation"

const Step = defineFormStep<QuotationFormInput>()
const summaryLabels = buildWizardLabels("Guardar cotización")

const buildDefaultValues = (
  values: Partial<QuotationFormInput>
): QuotationFormInput => ({
  ...values,
  lines: values?.lines ?? [],
  unregisteredLines: values?.unregisteredLines ?? [],
})

type QuotationWizardProps = {
  initialValues: Partial<QuotationFormInput>;
  onSubmit: (values: QuotationFormValues) => Promise<void> | void;
  draftKey?: string;
};

export function QuotationWizard({
  initialValues,
  onSubmit,
  draftKey,
}: QuotationWizardProps) {
  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: WizardStepIds.customer,
        title: "Contacto",
        fieldPaths: [
          "customer.mode",
          "customer.partyMode",
          "customer.existingPartyId",
          "customer.existingPartyName",
          "customer.newParty.name",
          "customer.newParty.phone",
          "customer.newParty.notes",
        ],
        validator: {
          schema: QuotationFormSchema.shape.customer,
          getStepValues: (v) => v.customer,
          mapIssuePathToFieldPath:
            prefixIssuePathMapper<QuotationFormInput>("customer"),
        },
        Component: QuotationCustomerStep,
      }),

      Step.withValidator({
        id: WizardStepIds.lines,
        title: "Productos",
        fieldPaths: ["lines"],
        validator: {
          schema: QuotationLinesStepSchema,
          // ✅ Input allows undefined; validator expects an array
          getStepValues: (v) => v.lines ?? [],
        },
        Component: QuotationLinesStep,
      }),

      Step.withValidator({
        id: WizardStepIds.unregisteredLines,
        title: "Productos no registrados",
        fieldPaths: ["unregisteredLines"],
        validator: {
          schema: QuotationUnregisteredLinesStepSchema,
          getStepValues: (v) => v.unregisteredLines ?? [],
          mapIssuePathToFieldPath:
            mapArrayIssuePath<QuotationFormInput>("unregisteredLines"),
        },
        Component: QuotationUnregisteredLinesStep,
      }),

      {
        id: WizardStepIds.summary,
        kind: "summary",
        title: "Resumen",
        fieldPaths: [],
        Component: QuotationSummaryStep,
        labels: summaryLabels,
      },
    ];
  }, [])

  return (
    <WizardShell<QuotationFormInput, QuotationFormValues>
      initialValues={initialValues}
      buildDefaultValues={buildDefaultValues}
      schema={QuotationFormSchema}
      steps={steps}
      labels={summaryLabels}
      onSubmit={onSubmit}
      draft={
        draftKey
          ? {
              key: draftKey,
              contextLabel: "cotización",
              schema: QuotationFormSchema,
            }
          : undefined
      }
    />
  )
}
