"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm";
import { defineFormStep } from "@/components/ui/MultiStepForm/stepBuilders";

import {
  SalesNotePaymentFormSchema,
  type SalesNotePaymentFormValues,
} from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";

import { SalesNotePaymentSingleStep } from "./steps/SalesNotePaymentSingleStep";
import {
  SalesNotePaymentWizardProvider,
  type SalesNotePaymentWizardMeta,
} from "./SalesNotePaymentWizard.context";

type SalesNotePaymentWizardProps = {
  initialValues?: Partial<SalesNotePaymentFormValues>;
  meta: SalesNotePaymentWizardMeta;
  onSubmit: (values: SalesNotePaymentFormValues) => Promise<void> | void;
  submitting: boolean;

  title?: string;
  description?: string;
};

export function SalesNotePaymentWizard({
  initialValues,
  meta,
  onSubmit,
  submitting,
}: SalesNotePaymentWizardProps) {
  const form = useForm<SalesNotePaymentFormValues>({
    resolver: zodResolver(SalesNotePaymentFormSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  const Step = defineFormStep<SalesNotePaymentFormValues>();

  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: "payment",
        title: "Pago",
        fieldPaths: ["paymentType", "amount", "reference", "notes"],
        validator: {
          schema: SalesNotePaymentFormSchema,
          getStepValues: (v) => v,
        },
        Component: SalesNotePaymentSingleStep,
        labels: {
          next: "Guardar",
          submit: "Guardar",
          submitting: "Guardando…",
        },
      }),
    ] as const;
  }, [Step]);

  return (
    <SalesNotePaymentWizardProvider meta={meta}>
      <MultiStepForm<SalesNotePaymentFormValues>
        config={{
          showProgress: false,
          allowFreeNavigation: false,
          labels: {
            back: "Atrás",
            next: "Guardar",
            submit: "Guardar",
            submitting: "Guardando…",
          },
        }}
        steps={steps}
        form={form}
        finalSchema={SalesNotePaymentFormSchema}
        onSubmit={onSubmit}
      />
    </SalesNotePaymentWizardProvider>
  );
}
