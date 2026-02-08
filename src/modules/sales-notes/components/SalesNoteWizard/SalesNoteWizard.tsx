"use client";

/**
 * SalesNoteWizard - Multi-step form for creating/editing sales notes.
 *
 * Uses the shared DocumentWizard wrapper with sales-note-specific
 * step definitions and draft persistence.
 */

import React, { useEffect, useMemo } from "react";

import { DocumentWizard } from "@/components/forms/document-wizard/DocumentWizard";
import type { DocumentWizardConfig } from "@/components/forms/document-wizard/DocumentWizard.types";
import {
  defineFormStep,
  prefixIssuePathMapper,
} from "@/components/ui/MultiStepForm/stepBuilders";
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";

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

// Keep Step factory stable across renders
const Step = defineFormStep<SalesNoteFormInput>();

const wizardConfig: DocumentWizardConfig<SalesNoteFormInput, SalesNoteFormValues> = {
  formSchema: SalesNoteFormSchema,
  labels: {
    back: "Atrás",
    next: "Siguiente",
    submit: "Guardar",
    submitting: "Guardando…",
  },
  draft: {
    draftKey: "sales-note:new",
    contextLabel: "nota de venta",
    enabled: true,
    debounceMs: 1000,
    expirationDays: 7,
  },
  logPrefix: "[SalesNoteWizard]",
};

type SalesNoteWizardProps = {
  initialValues: Partial<SalesNoteFormInput>;
  onSubmit: (values: SalesNoteFormValues) => Promise<void> | void;
  submitting: boolean;
};

export function SalesNoteWizard({
  initialValues,
  onSubmit,
  submitting,
}: SalesNoteWizardProps) {
  // Lifecycle logging
  useEffect(() => {
    salesNoteLogger.info("SalesNoteWizard", "Wizard mounted", {
      initialLinesCount: (initialValues as any)?.lines?.length ?? 0,
      initialUnregisteredLinesCount: (initialValues as any)?.unregisteredLines?.length ?? 0,
      customerMode: (initialValues as any)?.customer?.mode,
    });
    return () => {
      salesNoteLogger.info("SalesNoteWizard", "Wizard unmounting");
    };
  }, []);

  // Log submitting state changes
  useEffect(() => {
    salesNoteLogger.info("SalesNoteWizard", "Submitting state changed", { submitting });
  }, [submitting]);

  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: "customer",
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
        id: "lines",
        title: "Productos",
        fieldPaths: ["lines"],
        validator: {
          schema: SalesNoteLinesStepSchema,
          getStepValues: (v) => v.lines ?? [],
        },
        Component: SalesNoteLinesStep,
      }),
      Step.withValidator({
        id: "unregisteredLines",
        title: "Productos no registrados",
        fieldPaths: ["unregisteredLines"],
        validator: {
          schema: SalesNoteUnregisteredLinesStepSchema,
          getStepValues: (v) => v.unregisteredLines ?? [],
          mapIssuePathToFieldPath: (issuePath: readonly PropertyKey[]) =>
            `unregisteredLines.${issuePath.map(String).join(".")}` as any,
        },
        Component: SalesNoteUnregisteredLinesStep,
      }),
      {
        id: "summary",
        kind: "summary",
        title: "Resumen",
        fieldPaths: [],
        Component: SalesNoteSummaryStep,
        labels: {
          submit: "Guardar",
          submitting: "Guardando…",
          next: "Siguiente",
          back: "Atrás",
        },
      },
    ] as const;
  }, [submitting]);

  // Wrap onSubmit to log the event at wizard level
  const handleWizardSubmit = async (values: SalesNoteFormValues) => {
    salesNoteLogger.info("SalesNoteWizard", "Wizard form submitted to parent", {
      linesCount: values.lines?.length ?? 0,
      unregisteredLinesCount: values.unregisteredLines?.length ?? 0,
      customerMode: values.customer?.mode,
    });
    return onSubmit(values);
  };

  return (
    <DocumentWizard<SalesNoteFormInput, SalesNoteFormValues>
      config={wizardConfig}
      steps={steps}
      initialValues={initialValues}
      onSubmit={handleWizardSubmit}
      submitting={submitting}
    />
  );
}
