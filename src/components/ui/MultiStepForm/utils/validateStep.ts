import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import type { StepDefinition } from "../MultiStepForm.types";
import { issuePathToDotPath } from "./issuePath";

type Args<TFormValues extends FieldValues> = {
  form: UseFormReturn<TFormValues>;
  step: StepDefinition<TFormValues>;
  onStepError: (stepId: string) => void;
  onStepCompleted: (stepId: string) => void;
  focusFirstField: (field: FieldPath<TFormValues> | undefined) => Promise<void>;
};

/**
 * Validates the current step.
 *
 * IMPORTANT:
 * - If a step has a Zod validator, we do NOT rely on RHF trigger(fieldPaths),
 *   because fieldPaths can include conditional/unmounted fields.
 * - Zod becomes the source of truth for step validity and we map issues back to RHF.
 */
export async function validateStep<TFormValues extends FieldValues>({
  form,
  step,
  onStepError,
  onStepCompleted,
  focusFirstField,
}: Args<TFormValues>): Promise<boolean> {
  if (step.kind === "summary") return true;

  // 1) Zod step-level validation (cross-field rules + conditional rules)
  if (step.validator) {
    const allValues = form.getValues() as TFormValues;
    const stepValues = step.validator.getStepValues(allValues);
    const parsed = step.validator.schema.safeParse(stepValues);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const mapped =
          step.validator.mapIssuePathToFieldPath?.(issue.path) ??
          (issuePathToDotPath(issue.path) as FieldPath<TFormValues>);

        if (mapped) {
          form.setError(mapped, { type: "zod", message: issue.message });
        }
      }

      onStepError(step.id);
      await focusFirstField(step.fieldPaths?.[0]);
      return false;
    }

    onStepCompleted(step.id);
    return true;
  }

  // 2) Fallback: RHF field-level validation for steps without Zod validator
  const okRhf = await form.trigger(step.fieldPaths as any);
  if (!okRhf) {
    onStepError(step.id);
    await focusFirstField(step.fieldPaths?.[0]);
    return false;
  }

  onStepCompleted(step.id);
  return true;
}
