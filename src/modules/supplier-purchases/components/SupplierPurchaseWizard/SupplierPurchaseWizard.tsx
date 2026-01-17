"use client";

import React, { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm";
import { defineFormStep } from "@/components/ui/MultiStepForm/stepBuilders";

import {
  SupplierPurchaseFinalSchema,
  type SupplierPurchaseFormValues,
} from "@/modules/supplier-purchases/forms/supplierPurchaseForm.schemas";

import { SupplierPurchaseSingleStep } from "./steps/SupplierPurchaseSingleStep";
import { useForm } from "react-hook-form";

type Props = {
  initialValues?: Partial<SupplierPurchaseFormValues>;
  onSubmit: (values: SupplierPurchaseFormValues) => Promise<void> | void;
  submitting: boolean;
};

export function SupplierPurchaseWizard({
  initialValues,
  onSubmit,
  submitting,
}: Props) {
  const form = useForm<SupplierPurchaseFormValues>({
    resolver: zodResolver(SupplierPurchaseFinalSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  const Step = defineFormStep<SupplierPurchaseFormValues>();

  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: "purchase",
        title: "Compra",
        fieldPaths: [
          "supplier.partyId",
          "supplierFolio",
          "total",
          "notes",
          "occurredAt",
        ],
        validator: {
          schema: SupplierPurchaseFinalSchema,
          getStepValues: (v) => v,
        },
        Component: SupplierPurchaseSingleStep,
        labels: { next: "Guardar", submit: "Guardar" },
      }),
    ] as const;
  }, [Step]);

  return (
    <MultiStepForm<SupplierPurchaseFormValues>
      config={{
        showProgress: false,
        allowFreeNavigation: false,
        labels: {
          back: "Atrás",
          next: "Guardar",
          submit: "Guardar",
          submitting: submitting ? "Guardando…" : "Guardando…",
        },
      }}
      steps={steps}
      form={form}
      finalSchema={SupplierPurchaseFinalSchema}
      onSubmit={onSubmit}
    />
  );
}
