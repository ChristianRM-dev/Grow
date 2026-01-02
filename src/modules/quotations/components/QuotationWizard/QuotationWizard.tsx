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
  QuotationFormSchema,
  QuotationLinesStepSchema,
  QuotationUnregisteredLinesStepSchema,
  type QuotationFormValues,
} from "@/modules/quotations/forms/quotationForm.schemas";

import { QuotationCustomerStep } from "./steps/QuotationCustomerStep";
import { QuotationLinesStep } from "./steps/QuotationLinesStep";
import { QuotationUnregisteredLinesStep } from "./steps/QuotationUnregisteredLinesStep";
import { QuotationSummaryStep } from "./steps/QuotationSummaryStep";

type QuotationWizardProps = {
  initialValues: Partial<QuotationFormValues>;
  onSubmit: (values: QuotationFormValues) => Promise<void> | void;
  submitting: boolean;
};

export function QuotationWizard({
  initialValues,
  onSubmit,
  submitting,
}: QuotationWizardProps) {
  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(QuotationFormSchema),
    shouldUnregister: false,
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  const Step = defineFormStep<QuotationFormValues>();

  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: "customer",
        title: "Contacto",
        fieldPaths: [
          "customer.mode",
          "customer.existingPartyId",
          "customer.existingPartyName",
        ],
        validator: {
          schema: QuotationFormSchema.shape.customer,
          getStepValues: (v) => v.customer,
          mapIssuePathToFieldPath:
            prefixIssuePathMapper<QuotationFormValues>("customer"),
        },
        Component: QuotationCustomerStep,
      }),
      Step.withValidator({
        id: "lines",
        title: "Productos",
        fieldPaths: ["lines"],
        validator: {
          schema: QuotationLinesStepSchema,
          getStepValues: (v) => v.lines,
        },
        Component: QuotationLinesStep,
      }),
      Step.withValidator({
        id: "unregisteredLines",
        title: "Productos no registrados",
        fieldPaths: ["unregisteredLines"],
        validator: {
          schema: QuotationUnregisteredLinesStepSchema,
          getStepValues: (v) => v.unregisteredLines,
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
          submitting: submitting ? "Guardando…" : "Guardando…",
          next: "Siguiente",
          back: "Atrás",
        },
      },
    ] as const;
  }, [Step, submitting]);

  return (
    <MultiStepForm<QuotationFormValues>
      config={{
        showProgress: true,
        allowDraftSave: false,
        labels: {
          back: "Atrás",
          next: "Siguiente",
          submit: "Guardar cotización",
          submitting: "Guardando…",
        },
      }}
      steps={steps}
      form={form}
      onSubmit={onSubmit}
      onEvent={(e) => {
        console.log("QuotationWizard::event", e);
      }}
    />
  );
}
