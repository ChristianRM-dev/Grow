import type { FieldValues } from "react-hook-form";
import type { StepDefinition } from "../MultiStepForm.types";

/**
 * Finds the first visible step id that is not summary (fallback to first visible).
 */
export function pickInitialStepId<TFormValues extends FieldValues>(
  steps: readonly StepDefinition<TFormValues>[],
  values: TFormValues
): string | null {
  const visible = steps.filter((s) =>
    s.isVisible ? s.isVisible(values) : true
  );
  if (visible.length === 0) return null;

  const firstNonSummary = visible.find((s) => s.kind !== "summary");
  return (firstNonSummary ?? visible[0]).id;
}
