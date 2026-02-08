"use client";

/**
 * QuotationWizard - Multi-step form for creating/editing quotations.
 *
 * Uses the shared DocumentWizard wrapper with quotation-specific
 * step definitions (no draft persistence).
 */

import React, { useMemo } from "react";

import { DocumentWizard } from "@/components/forms/document-wizard/DocumentWizard";
import type { DocumentWizardConfig } from "@/components/forms/document-wizard/DocumentWizard.types";
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
} from "@/modules/quotations/forms/quotationForm.schemas";

import { QuotationCustomerStep } from "./steps/QuotationCustomerStep";
import { QuotationLinesStep } from "./steps/QuotationLinesStep";
import { QuotationUnregisteredLinesStep } from "./steps/QuotationUnregisteredLinesStep";
import { QuotationSummaryStep } from "./steps/QuotationSummaryStep";

// Keep Step factory stable across renders
const Step = defineFormStep<QuotationFormInput>();

const wizardConfig: DocumentWizardConfig<QuotationFormInput, QuotationFormValues> = {
  formSchema: QuotationFormSchema,
  labels: {
    back: "Atrás",
    next: "Siguiente",
    submit: "Guardar cotización",
    submitting: "Guardando…",
  },
  logPrefix: "[QuotationWizard]",
};

type QuotationWizardProps = {
  initialValues: Partial<QuotationFormInput>;
  onSubmit: (values: QuotationFormValues) => Promise<void> | void;
  submitting: boolean;
};

export function QuotationWizard({
  initialValues,
  onSubmit,
  submitting,
}: QuotationWizardProps) {
  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: "customer",
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
        id: "lines",
        title: "Productos",
        fieldPaths: ["lines"],
        validator: {
          schema: QuotationLinesStepSchema,
          getStepValues: (v) => v.lines ?? [],
        },
        Component: QuotationLinesStep,
      }),

      Step.withValidator({
        id: "unregisteredLines",
        title: "Productos no registrados",
        fieldPaths: ["unregisteredLines"],
        validator: {
          schema: QuotationUnregisteredLinesStepSchema,
          getStepValues: (v) => v.unregisteredLines ?? [],
          mapIssuePathToFieldPath: (issuePath: readonly PropertyKey[]) =>
            `unregisteredLines.${issuePath.map(String).join(".")}` as any,
        },
        Component: QuotationUnregisteredLinesStep,
      }),

      {
        id: "summary",
        kind: "summary",
        title: "Resumen",
        fieldPaths: [],
        Component: QuotationSummaryStep,
        labels: {
          submit: "Guardar cotización",
          submitting: "Guardando…",
          next: "Siguiente",
          back: "Atrás",
        },
      },
    ] as const;
  }, [submitting]);

  return (
    <DocumentWizard<QuotationFormInput, QuotationFormValues>
      config={wizardConfig}
      steps={steps}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitting={submitting}
    />
  );
}
