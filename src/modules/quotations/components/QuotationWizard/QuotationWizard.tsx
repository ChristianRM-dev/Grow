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
} from "@/modules/quotations/forms/quotationForm.schemas";
import type {
  QuotationFormInput,
  QuotationFormValues,
} from "@/modules/quotations/forms/quotationForm.schemas";

import { QuotationCustomerStep } from "./steps/QuotationCustomerStep";
import { QuotationLinesStep } from "./steps/QuotationLinesStep";
import { QuotationUnregisteredLinesStep } from "./steps/QuotationUnregisteredLinesStep";
import { QuotationSummaryStep } from "./steps/QuotationSummaryStep";

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
  const form = useForm<QuotationFormInput>({
    resolver: zodResolver(QuotationFormSchema),
    shouldUnregister: false,
    defaultValues: {
      ...initialValues,
      lines: initialValues?.lines ?? [],
      unregisteredLines: initialValues?.unregisteredLines ?? [],
    },
    mode: "onSubmit",
  });

  // ✅ IMPORTANT: build steps using the SAME type as the form (Input)
  const Step = defineFormStep<QuotationFormInput>();

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
          // ✅ Input allows undefined; validator expects an array
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
          submitting: submitting ? "Guardando…" : "Guardando…",
          next: "Siguiente",
          back: "Atrás",
        },
      },
    ] as const;
  }, [Step, submitting]);

  return (
    <MultiStepForm<QuotationFormInput>
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
      // ✅ Parse Input -> Output here, so DB layer receives normalized values
      onSubmit={(input) => onSubmit(QuotationFormSchema.parse(input))}
      onEvent={(e) => {
        console.log("QuotationWizard::event", e);
      }}
    />
  );
}
