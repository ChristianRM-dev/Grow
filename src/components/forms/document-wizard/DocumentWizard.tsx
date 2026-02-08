"use client"

/**
 * DocumentWizard - A generic multi-step form wrapper for document creation/editing.
 *
 * Shared by Sales Notes and Quotations flows. Encapsulates:
 * - react-hook-form setup with zodResolver
 * - Optional draft persistence with auto-save and recovery dialog
 * - MultiStepForm rendering with configurable steps and labels
 * - Submit handling with Zod parsing
 */

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { FieldValues } from "react-hook-form"

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm"
import { useFormDraft } from "@/hooks"
import { useDraftRecoveryDialog } from "@/components/ui/DraftRecovery"
import type { DocumentWizardProps } from "./DocumentWizard.types"

export function DocumentWizard<TInput extends FieldValues, TValues>({
  config,
  steps,
  initialValues,
  onSubmit,
  submitting,
}: DocumentWizardProps<TInput, TValues>) {
  const {
    formSchema,
    labels,
    draft: draftConfig,
    logPrefix = "[DocumentWizard]",
  } = config

  const [draftCheckComplete, setDraftCheckComplete] = useState(!draftConfig)
  const renderCountRef = useRef(0)
  renderCountRef.current += 1

  if (renderCountRef.current <= 3) {
    console.log(`${logPrefix} render #${renderCountRef.current}`, {
      submitting,
      hasDraftConfig: !!draftConfig,
    })
  }

  // Cast formSchema to `any` for zodResolver / useFormDraft because our
  // structural FormSchema type is compatible at runtime but not at the TS level.
  const form = useForm<TInput>({
    resolver: zodResolver(formSchema as any),
    shouldUnregister: false,
    defaultValues: {
      ...initialValues,
      lines: (initialValues as any)?.lines ?? [],
      unregisteredLines: (initialValues as any)?.unregisteredLines ?? [],
    } as any,
    mode: "onSubmit",
  })

  // Draft support (only if draftConfig is provided)
  const draft = useFormDraft({
    draftKey: draftConfig?.draftKey ?? "__noop__",
    form,
    enabled: !!draftConfig?.enabled && !submitting,
    validateMode: "safe",
    debounceMs: draftConfig?.debounceMs ?? 1000,
    schema: formSchema as any,
    expirationDays: draftConfig?.expirationDays ?? 7,
    onAutoSave: () => {
      console.log(`${logPrefix} Draft auto-saved`)
    },
    onSaveError: (error) => {
      console.error(`${logPrefix} Draft save error`, error)
    },
  })

  const { showRecoveryDialog } = useDraftRecoveryDialog()

  useEffect(() => {
    if (!draftConfig) return
    if (!draft.hasInitialized) return
    if (draftCheckComplete) return

    console.log(`${logPrefix} draft check start`, {
      hasDraft: draft.hasDraft,
      hasTimestamp: !!draft.draftTimestamp,
    })

    async function checkForDraft() {
      if (draft.hasDraft && draft.draftTimestamp) {
        const shouldRestore = await showRecoveryDialog({
          timestamp: draft.draftTimestamp,
          context: draftConfig!.contextLabel,
        })

        if (shouldRestore) {
          const draftData = draft.loadDraft()
          if (draftData) {
            console.log(`${logPrefix} Restoring draft`)
            form.reset(draftData)
          } else {
            console.warn(`${logPrefix} Draft load failed`)
          }
        } else {
          console.log(`${logPrefix} Draft discarded by user`)
          draft.clearDraft()
        }
      }

      setDraftCheckComplete(true)
      console.log(`${logPrefix} draft check complete`)
    }

    checkForDraft()
  }, [
    draftConfig,
    draft.hasInitialized,
    draft.hasDraft,
    draft.draftTimestamp,
    draftCheckComplete,
    showRecoveryDialog,
    form,
    draft,
    logPrefix,
  ])

  const handleSubmit = async (input: TInput) => {
    const t0 = performance.now()
    try {
      const parsed = formSchema.parse(input) as TValues
      console.log(`${logPrefix} Submit parse ok`, {
        ms: Math.round(performance.now() - t0),
      })

      await onSubmit(parsed)

      if (draftConfig) {
        draft.clearDraft()
        console.log(`${logPrefix} Submit successful, draft cleared`)
      }
    } catch (error) {
      console.error(`${logPrefix} Submit error`, error)
      throw error
    }
  }

  // Memoize steps to avoid unnecessary re-renders
  const memoizedSteps = useMemo(() => steps, [steps])

  if (!draftCheckComplete) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {draftConfig && draft.lastSaved && (
        <div className="alert alert-success shadow-sm">
          <span className="text-sm">
            Borrador guardado automáticamente a las{" "}
            {draft.lastSaved.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      {draftConfig && draft.isAutoSaving && (
        <div className="alert shadow-sm">
          <span className="loading loading-spinner loading-sm"></span>
          <span className="text-sm">Guardando borrador...</span>
        </div>
      )}

      <MultiStepForm<TInput>
        config={{
          showProgress: true,
          labels,
        }}
        steps={memoizedSteps}
        form={form as any}
        onSubmit={handleSubmit}
        onEvent={(e) => {
          const safe = {
            type: (e as any)?.type ?? "unknown",
            stepId: (e as any)?.stepId ?? (e as any)?.step?.id ?? null,
          }
          console.log(`${logPrefix} event`, safe)
        }}
      />
    </div>
  )
}
