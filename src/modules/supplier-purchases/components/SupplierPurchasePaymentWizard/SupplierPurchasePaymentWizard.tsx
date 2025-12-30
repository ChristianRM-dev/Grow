"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm";
import { defineFormStep } from "@/components/ui/MultiStepForm/stepBuilders";

import {
  SupplierPurchasePaymentFinalSchema,
  type SupplierPurchasePaymentFormValues,
} from "@/modules/supplier-purchases/forms/supplierPurchasePaymentForm.schemas";

import {
  SupplierPurchasePaymentWizardProvider,
  type SupplierPurchasePaymentWizardMeta,
} from "./SupplierPurchasePaymentWizard.context";

import { SupplierPurchasePaymentSingleStep } from "./steps/SupplierPurchasePaymentSingleStep";

type Props = {
  meta: SupplierPurchasePaymentWizardMeta;
  initialValues?: Partial<SupplierPurchasePaymentFormValues>;
  onSubmit: (values: SupplierPurchasePaymentFormValues) => Promise<void> | void;
  submitting: boolean;
};

export function SupplierPurchasePaymentWizard({
  meta,
  initialValues,
  onSubmit,
  submitting,
}: Props) {
  const form = useForm<SupplierPurchasePaymentFormValues>({
    resolver: zodResolver(SupplierPurchasePaymentFinalSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  const Step = defineFormStep<SupplierPurchasePaymentFormValues>();

  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: "payment",
        title: "Pago",
        fieldPaths: [
          "partyId",
          "supplierPurchaseId",
          "paymentType",
          "amount",
          "occurredAt",
          "reference",
          "notes",
        ],
        validator: {
          schema: SupplierPurchasePaymentFinalSchema,
          getStepValues: (v) => v,
        },
        Component: SupplierPurchasePaymentSingleStep,
        labels: { next: "Guardar", submit: "Guardar" },
      }),
    ] as const;
  }, [Step]);

  return (
    <SupplierPurchasePaymentWizardProvider meta={meta}>
      <MultiStepForm<SupplierPurchasePaymentFormValues>
        config={{
          showProgress: false,
          allowFreeNavigation: false,
          allowDraftSave: false,
          labels: {
            back: "Atrás",
            next: "Guardar",
            submit: "Guardar",
            submitting: submitting ? "Guardando…" : "Guardando…",
          },
        }}
        steps={steps}
        form={form}
        finalSchema={SupplierPurchasePaymentFinalSchema}
        onSubmit={onSubmit}
      />
    </SupplierPurchasePaymentWizardProvider>
  );
}
