/**
 * Shared types for the DocumentWizard component.
 *
 * DocumentWizard is a generic multi-step form wrapper used by both
 * Sales Notes and Quotations flows. It encapsulates form creation,
 * optional draft persistence, and step-based navigation.
 */

import type { FieldValues } from "react-hook-form";
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
 * A Zod-like schema with parse and safeParse methods.
 * Uses a structural type instead of z.ZodType to avoid Zod version compatibility issues.
 */
export type FormSchema<TValues> = {
  parse: (data: unknown) => TValues;
  safeParse: (data: unknown) => { success: true; data: TValues } | { success: false; error: any };
};

/**
 * Configuration for a DocumentWizard instance.
 *
 * @template TInput - The Zod input type (what react-hook-form manages)
 * @template TValues - The Zod output type (what the submit handler receives)
 */
export type DocumentWizardConfig<
  TInput extends FieldValues,
  TValues,
> = {
  /** The Zod schema for the full form */
  formSchema: FormSchema<TValues>;
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
export type DocumentWizardProps<
  TInput extends FieldValues,
  TValues,
> = {
  config: DocumentWizardConfig<TInput, TValues>;
  /** Step definitions for this wizard */
  steps: readonly StepDefinition<TInput>[];
  initialValues: Partial<TInput>;
  onSubmit: (values: TValues) => Promise<void> | void;
  submitting: boolean;
};
