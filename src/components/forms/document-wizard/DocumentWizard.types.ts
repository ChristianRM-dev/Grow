/**
 * Shared types for the DocumentWizard component.
 *
 * DocumentWizard is a generic multi-step form wrapper used by both
 * Sales Notes and Quotations flows. It encapsulates form creation,
 * optional draft persistence, and step-based navigation.
 */

import type { FieldValues } from "react-hook-form";
import type { z } from "zod";
import type { StepDefinition, WizardButtonLabels } from "@/components/ui/MultiStepForm/MultiStepForm.types";

/**
 * Optional draft configuration for form auto-save.
 */
export type DraftConfig = {
  /** localStorage key for the draft (e.g., "sales-note:new") */
  draftKey: string;
  /** Spanish context label for the recovery dialog (e.g., "nota de venta") */
  contextLabel: string;
  enabled: boolean;
  debounceMs?: number;
  expirationDays?: number;
};

/**
 * Configuration for a DocumentWizard instance.
 *
 * @template TInput - The form input managed by react-hook-form.
 * @template TOutput - The parsed output returned by Zod.
 */
export type DocumentWizardInput<TSchema extends z.ZodTypeAny> =
  z.input<TSchema> & FieldValues;

export type DocumentWizardOutput<TSchema extends z.ZodTypeAny> =
  z.output<TSchema>;

export type DocumentWizardConfig<TSchema extends z.ZodTypeAny> = {
  /** The Zod schema for the full form */
  formSchema: TSchema;
  /** Spanish labels for wizard navigation buttons */
  labels: Required<WizardButtonLabels>;
  /** Optional draft persistence configuration */
  draft?: DraftConfig;
  /** Log prefix for console output (e.g., "[SalesNoteWizard]") */
  logPrefix?: string;
};

/**
 * Props for the DocumentWizard component.
 */
export type DocumentWizardProps<TSchema extends z.ZodTypeAny> = {
  config: DocumentWizardConfig<TSchema>;
  /** Step definitions for this wizard */
  steps: readonly StepDefinition<DocumentWizardInput<TSchema>>[];
  initialValues: Partial<DocumentWizardInput<TSchema>>;
  onSubmit: (values: DocumentWizardOutput<TSchema>) => Promise<void> | void;
  submitting: boolean;
};
