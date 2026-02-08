"use client";

/**
 * QuotationLinesStep - Thin wrapper over the shared ProductLinesStep.
 *
 * Configures the shared component with quotation-specific settings
 * (quotedUnitPrice field, "Precio cotizado" column label).
 */

import React from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { QuotationFormInput } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  ProductLinesStep,
  QUOTATION_LINES_CONFIG,
} from "@/components/forms/steps/ProductLinesStep";

type Props = StepComponentProps<QuotationFormInput>;

export function QuotationLinesStep({ form }: Props) {
  return <ProductLinesStep form={form} config={QUOTATION_LINES_CONFIG} />;
}
