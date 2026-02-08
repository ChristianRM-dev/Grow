"use client";

/**
 * QuotationUnregisteredLinesStep - Thin wrapper over the shared UnregisteredLinesStep.
 *
 * Uses the shared component directly with quotation-specific settings
 * (quotedUnitPrice field, no registration features).
 */

import React from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { QuotationFormInput } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  UnregisteredLinesStep,
  QUOTATION_UNREGISTERED_CONFIG,
} from "@/components/forms/steps/UnregisteredLinesStep";

type Props = StepComponentProps<QuotationFormInput>;

export function QuotationUnregisteredLinesStep({ form }: Props) {
  return (
    <UnregisteredLinesStep
      form={form}
      config={QUOTATION_UNREGISTERED_CONFIG}
    />
  );
}
