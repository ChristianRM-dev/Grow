"use client";

/**
 * QuotationCustomerStep - Thin wrapper over the shared CustomerStep.
 *
 * Configures the shared component with quotation-specific labels
 * ("Contacto", no field-cleaning on mode switch, etc.).
 */

import React from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { QuotationFormInput } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  CustomerStep,
  QUOTATION_CUSTOMER_CONFIG,
} from "@/components/forms/steps/CustomerStep";

type Props = StepComponentProps<QuotationFormInput>;

export function QuotationCustomerStep({ form }: Props) {
  return <CustomerStep form={form} config={QUOTATION_CUSTOMER_CONFIG} />;
}
