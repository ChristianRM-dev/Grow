"use client"

import React, { useEffect, useMemo, useState } from "react"
import type { FieldValues } from "react-hook-form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ZodType } from "zod"

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm"
import type {
  MultiStepFormConfig,
  StepDefinition,
  WizardButtonLabels,
} from "@/components/ui/MultiStepForm/MultiStepForm.types"
import { useDraftRecoveryDialog } from "@/components/ui/DraftRecovery"
import { useFormDraft } from "@/hooks"

type DraftConfig<TValues extends FieldValues> = {
  key: string
  contextLabel: string
  enabled?: boolean
  debounceMs?: number
  expirationDays?: number
  schema?: ZodType<TValues>
}

type WizardShellProps<TInput extends FieldValues, TOutput extends FieldValues> = {
  initialValues: Partial<TInput>
  buildDefaultValues: (initialValues: Partial<TInput>) => TInput
  schema: ZodType<TOutput>
  steps: StepDefinition<TInput>[]
  labels: WizardButtonLabels
  onSubmit: (values: TOutput) => Promise<void> | void
  onEvent?: (event: unknown) => void
  draft?: DraftConfig<TInput>
  config?: Partial<MultiStepFormConfig>
}

export function WizardShell<
  TInput extends FieldValues,
  TOutput extends FieldValues,
>({
  initialValues,
  buildDefaultValues,
  schema,
  steps,
  labels,
  onSubmit,
  onEvent,
  draft,
  config,
}: WizardShellProps<TInput, TOutput>) {
  const defaultValues = useMemo(
    () => buildDefaultValues(initialValues),
    [buildDefaultValues, initialValues]
  )

  const form = useForm<TInput>({
    resolver: zodResolver(schema as ZodType<TInput>),
    shouldUnregister: false,
    defaultValues,
    mode: "onSubmit",
  })

  const draftKey = draft?.key ?? "__wizard__draft__disabled__"
  const draftEnabled = Boolean(draft?.key) && (draft?.enabled ?? true)

  const draftState = useFormDraft<TInput>({
    draftKey,
    form,
    enabled: draftEnabled,
    debounceMs: draft?.debounceMs,
    schema: draft?.schema,
    expirationDays: draft?.expirationDays,
  })

  const { showRecoveryDialog } = useDraftRecoveryDialog()
  const [draftCheckComplete, setDraftCheckComplete] = useState(!draftEnabled)

  useEffect(() => {
    if (!draftEnabled) return
    if (!draftState.hasInitialized) return
    if (draftCheckComplete) return

    async function checkForDraft() {
      if (draftState.hasDraft && draftState.draftTimestamp) {
        const shouldRestore = await showRecoveryDialog({
          timestamp: draftState.draftTimestamp,
          context: draft?.contextLabel ?? "documento",
        })

        if (shouldRestore) {
          const draftData = draftState.loadDraft()
          if (draftData) {
            form.reset(draftData)
          }
        } else {
          draftState.clearDraft()
        }
      }

      setDraftCheckComplete(true)
    }

    checkForDraft()
  }, [
    draft?.contextLabel,
    draftCheckComplete,
    draftEnabled,
    draftState,
    form,
    showRecoveryDialog,
  ])

  const handleSubmit = async (input: TInput) => {
    const parsed = schema.parse(input)
    await onSubmit(parsed)
    if (draftEnabled) {
      draftState.clearDraft()
    }
  }

  const mergedConfig: MultiStepFormConfig = {
    showProgress: true,
    labels,
    ...config,
    labels: {
      ...labels,
      ...(config?.labels ?? {}),
    },
  }

  if (!draftCheckComplete) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {draftEnabled && draftState.lastSaved ? (
        <div className="alert alert-success shadow-sm">
          <span className="text-sm">
            Borrador guardado automáticamente a las{" "}
            {draftState.lastSaved.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ) : null}

      {draftEnabled && draftState.isAutoSaving ? (
        <div className="alert shadow-sm">
          <span className="loading loading-spinner loading-sm"></span>
          <span className="text-sm">Guardando borrador...</span>
        </div>
      ) : null}

      <MultiStepForm<TInput>
        config={mergedConfig}
        steps={steps}
        form={form}
        onSubmit={handleSubmit}
        onEvent={onEvent}
      />
    </div>
  )
}
