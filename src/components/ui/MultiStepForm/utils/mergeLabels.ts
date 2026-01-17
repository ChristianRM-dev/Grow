import type { WizardButtonLabels } from "../MultiStepForm.types";

/**
 * Merge button labels from multiple sources with priority:
 * 1. Per-step labels (highest priority)
 * 2. Global config labels
 * 3. Default labels (fallback)
 */
export function mergeLabels(
  defaults: Required<WizardButtonLabels>,
  global?: WizardButtonLabels,
  perStep?: WizardButtonLabels
): Required<WizardButtonLabels> {
  return {
    back: perStep?.back ?? global?.back ?? defaults.back,
    next: perStep?.next ?? global?.next ?? defaults.next,
    submit: perStep?.submit ?? global?.submit ?? defaults.submit,
    submitting:
      perStep?.submitting ?? global?.submitting ?? defaults.submitting,
  };
}
