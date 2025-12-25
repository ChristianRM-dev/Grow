import type React from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import type { z } from "zod";

import type {
  FormStepDefinition,
  SummaryStepDefinition,
  StepComponentProps,
  StepValidator,
  NonEmptyReadonlyArray,
} from "./MultiStepForm.types";

/**
 * Creates a typed mapper that prefixes Zod issue paths with a RHF base path.
 * Example:
 *   prefix = "customer"
 *   issuePath ["name"] -> "customer.name"
 */
export function prefixIssuePathMapper<TFormValues extends FieldValues>(
  prefix: FieldPath<TFormValues>
) {
  return (issuePath: Array<string | number>): FieldPath<TFormValues> => {
    const suffix = issuePath.map(String).join(".");
    const full = suffix ? `${prefix}.${suffix}` : String(prefix);
    return full as FieldPath<TFormValues>;
  };
}

/**
 * Step builder with overloads to enforce schema/value consistency.
 * Consumers never have to touch generics like <TStepValues>.
 */
export function defineFormStep<TFormValues extends FieldValues>() {
  function withoutValidator(def: {
    id: string;
    title: string;
    description?: string;
    optional?: boolean;
    isVisible?: (values: TFormValues) => boolean;
    fieldPaths: NonEmptyReadonlyArray<FieldPath<TFormValues>>;
    labels?: {
      back?: string;
      next?: string;
      saveDraft?: string;
      submit?: string;
      submitting?: string;
      savingDraft?: string;
    };
    Component: React.ComponentType<StepComponentProps<TFormValues>>;
  }): FormStepDefinition<TFormValues, never> {
    return {
      kind: "step",
      ...def,
    };
  }

  function withValidator<TSchema extends z.ZodTypeAny>(def: {
    id: string;
    title: string;
    description?: string;
    optional?: boolean;
    isVisible?: (values: TFormValues) => boolean;
    fieldPaths: NonEmptyReadonlyArray<FieldPath<TFormValues>>;
    labels?: {
      back?: string;
      next?: string;
      saveDraft?: string;
      submit?: string;
      submitting?: string;
      savingDraft?: string;
    };
    validator: {
      schema: TSchema;
      getStepValues: (values: TFormValues) => z.infer<TSchema>;
      mapIssuePathToFieldPath?: (
        issuePath: Array<string | number>
      ) => FieldPath<TFormValues> | undefined;
    };
    Component: React.ComponentType<StepComponentProps<TFormValues>>;
  }): FormStepDefinition<TFormValues, z.infer<TSchema>> {
    const validator: StepValidator<TFormValues, z.infer<TSchema>> = {
      schema: def.validator.schema,
      getStepValues: def.validator.getStepValues,
      mapIssuePathToFieldPath: def.validator.mapIssuePathToFieldPath,
    };

    return {
      kind: "step",
      id: def.id,
      title: def.title,
      description: def.description,
      optional: def.optional,
      isVisible: def.isVisible,
      fieldPaths: def.fieldPaths,
      labels: def.labels,
      validator,
      Component: def.Component,
    };
  }

  return {
    withoutValidator,
    withValidator,
  };
}

/**
 * Summary step builder (read-only step).
 */
export function defineSummaryStep<TFormValues extends FieldValues>() {
  return function summary(def: {
    id: string;
    title: string;
    description?: string;
    isVisible?: (values: TFormValues) => boolean;
    labels?: {
      back?: string;
      next?: string;
      saveDraft?: string;
      submit?: string;
      submitting?: string;
      savingDraft?: string;
    };
    Component: React.ComponentType<StepComponentProps<TFormValues>>;
  }): SummaryStepDefinition<TFormValues> {
    return {
      kind: "summary",
      ...def,
    };
  };
}
