"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm";
import { defineFormStep } from "@/components/ui/MultiStepForm/stepBuilders";

import {
  ProductVariantFinalSchema,
  type ProductVariantFormValues,
} from "@/modules/products/forms/productVariantForm.schemas";

import { ProductVariantSingleStep } from "./steps/ProductVariantSingleStep";

type ProductVariantWizardProps = {
  /**
   * Optional initial values (for edit forms).
   */
  initialValues?: Partial<ProductVariantFormValues>;

  /**
   * Called when user submits the wizard.
   * Typically this will call a server action.
   */
  onSubmit: (values: ProductVariantFormValues) => Promise<void> | void;

  submitting: boolean;
};

export function ProductVariantWizard({
  initialValues,
  onSubmit,
  submitting,
}: ProductVariantWizardProps) {
  const form = useForm<ProductVariantFormValues>({
    resolver: zodResolver(ProductVariantFinalSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  const Step = defineFormStep<ProductVariantFormValues>();

  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: "product",
        title: "Producto",
        fieldPaths: [
          "speciesName",
          "variantName",
          "bagSize",
          "color",
          "defaultPrice",
        ],
        validator: {
          schema: ProductVariantFinalSchema,
          getStepValues: (v) => v,
        },
        Component: ProductVariantSingleStep,
        labels: {
          // Optional: customize labels for single-step experience
          next: "Guardar",
          submit: "Guardar",
        },
      }),
    ] as const;
  }, [Step]);

  return (
    <MultiStepForm<ProductVariantFormValues>
      config={{
        showProgress: false, // single step: no stepper needed
        allowFreeNavigation: false,
        allowDraftSave: false,
        labels: {
          back: "Atrás",
          next: "Guardar",
          submit: "Guardar",
          submitting: "Guardando…",
        },
      }}
      steps={steps}
      form={form}
      finalSchema={ProductVariantFinalSchema}
      onSubmit={onSubmit}
    />
  );
}
