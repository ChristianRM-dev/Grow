import type { WizardButtonLabels } from "../MultiStepForm.types";

export function mergeLabels(
  defaults: Required<WizardButtonLabels>,
  global?: WizardButtonLabels,
  perStep?: WizardButtonLabels
): Required<WizardButtonLabels> {
  return {
    back: perStep?.back ?? global?.back ?? defaults.back,
    next: perStep?.next ?? global?.next ?? defaults.next,
    saveDraft: perStep?.saveDraft ?? global?.saveDraft ?? defaults.saveDraft,
    submit: perStep?.submit ?? global?.submit ?? defaults.submit,
    submitting:
      perStep?.submitting ?? global?.submitting ?? defaults.submitting,
    savingDraft:
      perStep?.savingDraft ?? global?.savingDraft ?? defaults.savingDraft,
  };
}
