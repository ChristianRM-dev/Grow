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

import React, { useEffect, useMemo, useState } from "react"
import {
  useForm,
  type DefaultValues,
  type Resolver,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import type * as z4 from "zod/v4/core"

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm"
import { useFormDraft } from "@/hooks"
import { useDraftRecoveryDialog } from "@/components/ui/DraftRecovery"
import { emitLog } from "@/modules/shared/observability/logging.shared"
import type {
  DocumentWizardInput,
  DocumentWizardOutput,
  DocumentWizardProps,
} from "./DocumentWizard.types"

type DraftableInitialValues = {
  lines?: unknown[];
  unregisteredLines?: unknown[];
}

type DraftSchemaResult<TInput> =
  | { success: true; data: TInput }
  | {
      success: false;
      error: {
        issues: readonly {
          path?: readonly PropertyKey[];
          message?: string;
        }[];
      };
    }

export function DocumentWizard<TSchema extends z.ZodTypeAny>({
  config,
  steps,
  initialValues,
  onSubmit,
  submitting,
}: DocumentWizardProps<TSchema>) {
  type TInput = DocumentWizardInput<TSchema>
  type TValues = DocumentWizardOutput<TSchema>

  const {
    formSchema,
    labels,
    draft: draftConfig,
    logPrefix = "[DocumentWizard]",
  } = config

  const [draftCheckComplete, setDraftCheckComplete] = useState(!draftConfig)

  const initialDocumentValues = initialValues as DraftableInitialValues
  const draftSchema = {
    safeParse(data: unknown): DraftSchemaResult<TInput> {
      const parsed = formSchema.safeParse(data)
      if (!parsed.success) {
        return {
          success: false,
          error: {
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
            })),
          },
        }
      }
      return { success: true, data: data as TInput }
    },
  }

  const resolver = zodResolver(
    formSchema as unknown as z4.$ZodType<TValues, TInput>,
  ) as unknown as Resolver<TInput>

  const form = useForm<TInput>({
    resolver,
    shouldUnregister: false,
    defaultValues: {
      ...initialValues,
      lines: initialDocumentValues.lines ?? [],
      unregisteredLines: initialDocumentValues.unregisteredLines ?? [],
    } as DefaultValues<TInput>,
    mode: "onSubmit",
  })

  // Draft support (only if draftConfig is provided)
  const draft = useFormDraft({
    draftKey: draftConfig?.draftKey ?? "__noop__",
    form,
    enabled: !!draftConfig?.enabled && !submitting,
    validateMode: "safe",
    debounceMs: draftConfig?.debounceMs ?? 1000,
    schema: draftSchema,
    expirationDays: draftConfig?.expirationDays ?? 7,
    onSaveError: (error) => {
      emitLog({
        prefix: logPrefix,
        level: "error",
        message: "draft_save_failed",
        data: error,
      })
    },
  })

  const { showRecoveryDialog } = useDraftRecoveryDialog()

  useEffect(() => {
    if (!draftConfig) return
    if (!draft.hasInitialized) return
    if (draftCheckComplete) return

    async function checkForDraft() {
      if (draft.hasDraft && draft.draftTimestamp) {
        const shouldRestore = await showRecoveryDialog({
          timestamp: draft.draftTimestamp,
          context: draftConfig!.contextLabel,
        })

        if (shouldRestore) {
          const draftData = draft.loadDraft()
          if (draftData) {
            emitLog({
              prefix: logPrefix,
              level: "debug",
              message: "draft_restored",
            })
            form.reset(draftData)
          } else {
            emitLog({
              prefix: logPrefix,
              level: "warn",
              message: "draft_restore_failed",
            })
          }
        } else {
          emitLog({
            prefix: logPrefix,
            level: "debug",
            message: "draft_discarded",
          })
          draft.clearDraft()
        }
      }

      setDraftCheckComplete(true)
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
      emitLog({
        prefix: logPrefix,
        level: "debug",
        message: "submit_parsed",
        data: { ms: Math.round(performance.now() - t0) },
      })

      await onSubmit(parsed)

      if (draftConfig) {
        draft.clearDraft()
      }
    } catch (error) {
      emitLog({
        prefix: logPrefix,
        level: "error",
        message: "submit_failed",
        data: error,
      })
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
        form={form}
        onSubmit={handleSubmit}
        onEvent={(e) => {
          emitLog({
            prefix: logPrefix,
            level: "debug",
            message: "wizard_event",
            data: {
              type: e.type,
              stepId: e.type === "step_change" ? e.toStepId : null,
            },
          })
        }}
      />
    </div>
  )
}
