"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm";
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
  const form = useForm<SalesNoteFormInput>({
    resolver: zodResolver(SalesNoteFormSchema),
    shouldUnregister: false,
    defaultValues: {
      ...initialValues,
      lines: initialValues?.lines ?? [],
      unregisteredLines: initialValues?.unregisteredLines ?? [],
    },
    mode: "onSubmit",
  });

  const Step = defineFormStep<SalesNoteFormInput>();

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
          submitting: submitting ? "Guardando…" : "Guardando…",
          next: "Siguiente",
          back: "Atrás",
        },
      },
    ] as const;
  }, [Step, submitting]);

  return (
    <MultiStepForm<SalesNoteFormInput>
      config={{
        showProgress: true,
        allowDraftSave: false,
        labels: {
          back: "Atrás",
          next: "Siguiente",
          submit: "Guardar",
          submitting: "Guardando…",
        },
      }}
      steps={steps}
      form={form}
      onSubmit={(input) => onSubmit(SalesNoteFormSchema.parse(input))}
      onEvent={(e) => {
        console.log("SalesNoteWizard::event", e);
      }}
    />
  );
}
