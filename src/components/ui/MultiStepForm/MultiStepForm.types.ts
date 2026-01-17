// src/components/ui/MultiStepForm/MultiStepForm.types.ts
// All code/comments in English. (UI labels live elsewhere in Spanish.)

import type React from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];

/**
 * Basic step status for UI stepper/progress.
 */
export type StepStatus =
  | "pending"
  | "active"
  | "completed"
  | "skipped"
  | "error";

/**
 * Labels for wizard navigation buttons.
 * These are only labels (strings). The wrapper will provide Spanish defaults,
 * but consumers can override them here.
 */
export type WizardButtonLabels = {
  back?: string;
  next?: string;
  submit?: string;
  submitting?: string;
};

/**
 * Global configuration for the wizard UI/behavior.
 */
export type MultiStepFormConfig = {
  /**
   * If true, allows clicking future steps (not recommended by default).
   */
  allowFreeNavigation?: boolean;

  /**
   * If true, show progress stepper UI.
   */
  showProgress?: boolean;

  /**
   * Button labels (Spanish defaults in the component, overrideable here).
   */
  labels?: WizardButtonLabels;
};

/**
 * Event emitted when user navigates or submits.
 * Useful for analytics/logging.
 */
export type WizardEvent<TFormValues extends FieldValues> =
  | { type: "step_change"; fromStepId: string; toStepId: string }
  | { type: "submit"; values: TFormValues };

/**
 * Helper type: Zod schema that returns T.
 */
export type ZodSchema<T> = z.ZodType<T>;

/**
 * A "slice" validator for a step.
 * - getStepValues extracts the subset of the full form values that this step owns
 * - schema validates that subset
 *
 * This enables cross-field validation inside the step without validating the entire form.
 */
export type StepValidator<TFormValues extends FieldValues, TStepValues> = {
  schema: ZodSchema<TStepValues>;
  getStepValues: (values: TFormValues) => TStepValues;

  /**
   * Optional mapper to translate Zod issue paths (relative to TStepValues)
   * into react-hook-form FieldPath<TFormValues>.
   *
   * Example: if step owns values under "customer", you can prefix paths like:
   * ["name"] -> "customer.name"
   */
  mapIssuePathToFieldPath?: (
    issuePath: readonly PropertyKey[]
  ) => FieldPath<TFormValues> | undefined;
};

/**
 * Props passed to each step component.
 */
export type StepComponentProps<TFormValues extends FieldValues> = {
  form: UseFormReturn<TFormValues>;
  wizard: WizardApi<TFormValues>;
  readOnly?: boolean;
};

/**
 * Core step definition (non-summary).
 */
export type FormStepDefinition<TFormValues extends FieldValues, TStepValues> = {
  kind: "step";

  id: string;
  title: string; // Spanish
  description?: string;

  /**
   * Optional step: can be skipped by the user (if UI enables it).
   */
  optional?: boolean;

  /**
   * Conditional step visibility.
   * If it becomes false, the wizard should treat the step as "skipped".
   */
  isVisible?: (values: TFormValues) => boolean;

  /**
   * Fields that belong to this step.
   * Used for react-hook-form trigger() to show inline errors.
   */
  fieldPaths: NonEmptyReadonlyArray<FieldPath<TFormValues>>;

  /**
   * Optional Zod validation for this step.
   * If omitted, the wizard can rely on RHF field-level validation only.
   */
  validator?: StepValidator<TFormValues, TStepValues>;

  /**
   * Step-level button label overrides (optional).
   */
  labels?: WizardButtonLabels;

  /**
   * Render function/component for the step.
   */
  Component: React.ComponentType<StepComponentProps<TFormValues>>;
};

/**
 * Summary step definition (read-only step).
 * It does not own fields; it just renders a summary of the whole form.
 */
export type SummaryStepDefinition<TFormValues extends FieldValues> = {
  kind: "summary";

  id: string;
  title: string; // Spanish
  description?: string;

  isVisible?: (values: TFormValues) => boolean;

  labels?: WizardButtonLabels;

  Component: React.ComponentType<StepComponentProps<TFormValues>>;
};

/**
 * Discriminated union for all steps.
 */
export type StepDefinition<TFormValues extends FieldValues> =
  | FormStepDefinition<TFormValues, any>
  | SummaryStepDefinition<TFormValues>;

/**
 * A normalized/derived runtime step state.
 */
export type StepRuntimeState = {
  id: string;
  status: StepStatus;
  isVisible: boolean;
  isOptional: boolean;
  isSummary: boolean;
};

/**
 * Wizard API exposed to steps.
 * Note: These functions will be implemented by the wrapper component.
 */
export type WizardApi<TFormValues extends FieldValues> = {
  /** Current visible step index (in the visible flow). */
  currentIndex: number;

  /** Current step id (stable). */
  currentStepId: string;

  /** All step states, including computed statuses. */
  steps: StepRuntimeState[];

  /** Convenience booleans. */
  canGoBack: boolean;
  canGoNext: boolean;
  isLastVisibleStep: boolean;
  isSubmitting: boolean;

  /** Navigation actions. */
  goBack: () => void;
  goNext: () => Promise<void>;

  /**
   * Jump to a step by id.
   * Implementations should enforce navigation rules (visited-only by default).
   */
  goToStep: (stepId: string) => void;

  /** Final submit action. */
  submit: () => Promise<void>;

  /** Read full current form values (snapshot). */
  getValues: () => TFormValues;
};

/**
 * Top-level props for the MultiStepForm wrapper.
 */
export type MultiStepFormProps<TFormValues extends FieldValues> = {
  config: MultiStepFormConfig;

  /**
   * Steps are defined by the feature module.
   * Include a summary step by adding a SummaryStepDefinition
   * or keep it out entirely.
   */
  steps: readonly StepDefinition<TFormValues>[];

  /**
   * React Hook Form instance (created in wrapper or injected from outside).
   * Option A: wrapper creates it from schema/defaultValues
   * Option B: consumer creates it and passes it here.
   */
  form: UseFormReturn<TFormValues>;

  /**
   * Optional final schema for validating the entire form on submit.
   * Recommended for "Guardar/Enviar" final action.
   */
  finalSchema?: ZodSchema<TFormValues>;

  /**
   * Called when user submits final.
   * Typically server action.
   */
  onSubmit: (values: TFormValues) => Promise<void> | void;

  /**
   * Optional event hook (analytics/logging).
   */
  onEvent?: (event: WizardEvent<TFormValues>) => void;
};
