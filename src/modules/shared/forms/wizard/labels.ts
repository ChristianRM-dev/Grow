import type { WizardButtonLabels } from "@/components/ui/MultiStepForm/MultiStepForm.types"

const baseWizardLabels = {
  back: "Atrás",
  next: "Siguiente",
  submitting: "Guardando…",
} satisfies Omit<WizardButtonLabels, "submit">

export function buildWizardLabels(submit: string): WizardButtonLabels {
  return {
    ...baseWizardLabels,
    submit,
  }
}
