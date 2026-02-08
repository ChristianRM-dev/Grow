"use client";

/**
 * SalesNoteCustomerStep - Thin wrapper over the shared CustomerStep.
 *
 * Configures the shared component with sales-note-specific labels
 * ("Cliente", field-cleaning on mode switch, etc.).
 */

import React, { useEffect } from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNoteFormInput } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import {
  CustomerStep,
  SALES_NOTE_CUSTOMER_CONFIG,
} from "@/components/forms/steps/CustomerStep";
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";

type Props = StepComponentProps<SalesNoteFormInput>;

export function SalesNoteCustomerStep({ form }: Props) {
  // Log step mount/unmount and current customer state
  useEffect(() => {
    const customerValues = form.getValues("customer");
    salesNoteLogger.info("CustomerStep", "Step mounted", {
      mode: customerValues?.mode,
      partyMode: customerValues?.partyMode,
      hasExistingPartyId: !!customerValues?.existingPartyId,
    });
    return () => {
      salesNoteLogger.info("CustomerStep", "Step unmounting");
    };
  }, []);

  return <CustomerStep form={form} config={SALES_NOTE_CUSTOMER_CONFIG} />;
}
