"use client";

/**
 * SalesNoteLinesStep - Thin wrapper over the shared ProductLinesStep.
 *
 * Configures the shared component with sales-note-specific settings
 * (unitPrice field, "Precio" column label).
 */

import React, { useEffect } from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNoteFormInput } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import {
  ProductLinesStep,
  SALES_NOTE_LINES_CONFIG,
} from "@/components/forms/steps/ProductLinesStep";
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";

type Props = StepComponentProps<SalesNoteFormInput>;

export function SalesNoteLinesStep({ form }: Props) {
  // Log step mount/unmount and current lines count
  useEffect(() => {
    const lines = form.getValues("lines");
    salesNoteLogger.info("LinesStep", "Step mounted", {
      currentLinesCount: lines?.length ?? 0,
    });
    return () => {
      const linesOnUnmount = form.getValues("lines");
      salesNoteLogger.info("LinesStep", "Step unmounting", {
        linesCount: linesOnUnmount?.length ?? 0,
      });
    };
  }, []);

  return <ProductLinesStep form={form} config={SALES_NOTE_LINES_CONFIG} />;
}
