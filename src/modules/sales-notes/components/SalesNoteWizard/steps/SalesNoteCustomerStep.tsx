"use client";

/**
 * SalesNoteCustomerStep - Thin wrapper over the shared CustomerStep.
 *
 * Configures the shared component with sales-note-specific labels
 * ("Cliente", field-cleaning on mode switch, etc.).
 */

import React from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNoteFormInput } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import {
  CustomerStep,
  SALES_NOTE_CUSTOMER_CONFIG,
} from "@/components/forms/steps/CustomerStep";

type Props = StepComponentProps<SalesNoteFormInput>;

export function SalesNoteCustomerStep({ form }: Props) {
  return <CustomerStep form={form} config={SALES_NOTE_CUSTOMER_CONFIG} />;
}
