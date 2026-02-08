"use client";

/**
 * QuotationSummaryStep - Thin wrapper over the shared SummaryStep.
 *
 * Uses the shared component with quotation-specific configuration
 * (quotedUnitPrice fields, "Contacto" label).
 */

import React from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { QuotationFormInput } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  SummaryStep,
  QUOTATION_SUMMARY_CONFIG,
} from "@/components/forms/steps/SummaryStep";

type Props = StepComponentProps<QuotationFormInput>;

export function QuotationSummaryStep({ form }: Props) {
  return <SummaryStep form={form} config={QUOTATION_SUMMARY_CONFIG} />;
}
