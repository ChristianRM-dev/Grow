"use client";

/**
 * SalesNoteLinesStep - Thin wrapper over the shared ProductLinesStep.
 *
 * Configures the shared component with sales-note-specific settings
 * (unitPrice field, "Precio" column label).
 */

import React from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNoteFormInput } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import {
  ProductLinesStep,
  SALES_NOTE_LINES_CONFIG,
} from "@/components/forms/steps/ProductLinesStep";

type Props = StepComponentProps<SalesNoteFormInput>;

export function SalesNoteLinesStep({ form }: Props) {
  return <ProductLinesStep form={form} config={SALES_NOTE_LINES_CONFIG} />;
}
