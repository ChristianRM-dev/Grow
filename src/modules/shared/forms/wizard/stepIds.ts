export const WizardStepIds = {
  customer: "customer",
  lines: "lines",
  unregisteredLines: "unregisteredLines",
  summary: "summary",
} as const

export type WizardStepId = (typeof WizardStepIds)[keyof typeof WizardStepIds]
