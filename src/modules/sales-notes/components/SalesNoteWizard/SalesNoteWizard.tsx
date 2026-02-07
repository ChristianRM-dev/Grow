"use client";

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm";
import {
  defineFormStep,
  prefixIssuePathMapper,
} from "@/components/ui/MultiStepForm/stepBuilders";

import {
  SalesNoteFormSchema,
  SalesNoteCustomerStepSchema,
  SalesNoteLinesStepSchema,
  SalesNoteUnregisteredLinesStepSchema,
  type SalesNoteFormInput,
  type SalesNoteFormValues,
} from "@/modules/sales-notes/forms/salesNoteForm.schemas";

import { SalesNoteCustomerStep } from "./steps/SalesNoteCustomerStep";
import { SalesNoteLinesStep } from "./steps/SalesNoteLinesStep";
import { SalesNoteUnregisteredLinesStep } from "./steps/SalesNoteUnregisteredLinesStep";
import { SalesNoteSummaryStep } from "./steps/SalesNoteSummaryStep";

import { useFormDraft } from "@/hooks";
import { useDraftRecoveryDialog } from "@/components/ui/DraftRecovery";

const LOG_PREFIX = "[SalesNoteWizard]"

// ✅ IMPORTANT: keep Step factory stable across renders
const Step = defineFormStep<SalesNoteFormInput>()

type SalesNoteWizardProps = {
  initialValues: Partial<SalesNoteFormInput>;
  onSubmit: (values: SalesNoteFormValues) => Promise<void> | void;
  submitting: boolean;
};

export function SalesNoteWizard({
  initialValues,
  onSubmit,
  submitting,
}: SalesNoteWizardProps) {
  const [draftCheckComplete, setDraftCheckComplete] = useState(false);
  const renderCountRef = useRef(0)
  renderCountRef.current += 1

  // Avoid logging huge objects, only summarize
  if (renderCountRef.current <= 3) {
    console.log(`${LOG_PREFIX} render #${renderCountRef.current}`, {
      submitting,
      initialLines: initialValues?.lines?.length ?? 0,
      initialUnregisteredLines: initialValues?.unregisteredLines?.length ?? 0,
    })
  }

  const form = useForm<SalesNoteFormInput>({
    resolver: zodResolver(SalesNoteFormSchema),
    shouldUnregister: false,
    defaultValues: {
      ...initialValues,
      lines: initialValues?.lines ?? [],
      unregisteredLines: initialValues?.unregisteredLines ?? [],
    },
    mode: "onSubmit",
  });

  const draft = useFormDraft({
    draftKey: "sales-note:new",
    form,
    enabled: true,
    debounceMs: 1000,
    schema: SalesNoteFormSchema,
    expirationDays: 7,
    onAutoSave: () => {
      console.log(`${LOG_PREFIX} Draft auto-saved`)
    },
    onSaveError: (error) => {
      console.error(`${LOG_PREFIX} Draft save error`, error)
    },
  });

  const { showRecoveryDialog } = useDraftRecoveryDialog();

  useEffect(() => {
    if (!draft.hasInitialized) return
    if (draftCheckComplete) return

    console.log(`${LOG_PREFIX} draft check start`, {
      hasDraft: draft.hasDraft,
      hasTimestamp: !!draft.draftTimestamp,
    })

    async function checkForDraft() {
      if (draft.hasDraft && draft.draftTimestamp) {
        const shouldRestore = await showRecoveryDialog({
          timestamp: draft.draftTimestamp,
          context: "nota de venta",
        })

        if (shouldRestore) {
          const draftData = draft.loadDraft()
          if (draftData) {
            console.log(`${LOG_PREFIX} Restoring draft`)
            form.reset(draftData)
          } else {
            console.warn(`${LOG_PREFIX} Draft load failed`)
          }
        } else {
          console.log(`${LOG_PREFIX} Draft discarded by user`)
          draft.clearDraft()
        }
      }

      setDraftCheckComplete(true)
      console.log(`${LOG_PREFIX} draft check complete`)
    }

    checkForDraft()
  }, [
    draft.hasInitialized,
    draft.hasDraft,
    draft.draftTimestamp,
    draftCheckComplete,
    showRecoveryDialog,
    form,
    draft,
  ])

  const handleSubmit = async (input: SalesNoteFormInput) => {
    const t0 = performance.now()
    try {
      const parsed = SalesNoteFormSchema.parse(input);
      console.log(`${LOG_PREFIX} Submit parse ok`, {
        ms: Math.round(performance.now() - t0),
        lines: parsed.lines?.length ?? 0,
        unregisteredLines: parsed.unregisteredLines?.length ?? 0,
      })

      await onSubmit(parsed);

      draft.clearDraft();
      console.log(`${LOG_PREFIX} Submit successful, draft cleared`)
    } catch (error) {
      console.error(`${LOG_PREFIX} Submit error`, error)
      throw error;
    }
  };

  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: "customer",
        title: "Cliente",
        fieldPaths: [
          "customer.mode",
          "customer.partyMode",
          "customer.existingPartyId",
          "customer.newParty.name",
          "customer.newParty.phone",
          "customer.newParty.notes",
        ],
        validator: {
          schema: SalesNoteCustomerStepSchema,
          getStepValues: (v) => v.customer,
          mapIssuePathToFieldPath:
            prefixIssuePathMapper<SalesNoteFormInput>("customer"),
        },
        Component: SalesNoteCustomerStep,
      }),
      Step.withValidator({
        id: "lines",
        title: "Productos",
        fieldPaths: ["lines"],
        validator: {
          schema: SalesNoteLinesStepSchema,
          getStepValues: (v) => v.lines ?? [],
        },
        Component: SalesNoteLinesStep,
      }),
      Step.withValidator({
        id: "unregisteredLines",
        title: "Productos no registrados",
        fieldPaths: ["unregisteredLines"],
        validator: {
          schema: SalesNoteUnregisteredLinesStepSchema,
          getStepValues: (v) => v.unregisteredLines ?? [],
          mapIssuePathToFieldPath: (issuePath: readonly PropertyKey[]) =>
            `unregisteredLines.${issuePath.map(String).join(".")}` as any,
        },
        Component: SalesNoteUnregisteredLinesStep,
      }),
      {
        id: "summary",
        kind: "summary",
        title: "Resumen",
        fieldPaths: [],
        Component: SalesNoteSummaryStep,
        labels: {
          submit: "Guardar",
          submitting: "Guardando…",
          next: "Siguiente",
          back: "Atrás",
        },
      },
    ] as const
  }, [submitting])

  if (!draftCheckComplete) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {draft.lastSaved && (
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

      {draft.isAutoSaving && (
        <div className="alert shadow-sm">
          <span className="loading loading-spinner loading-sm"></span>
          <span className="text-sm">Guardando borrador...</span>
        </div>
      )}

      <MultiStepForm<SalesNoteFormInput>
        config={{
          showProgress: true,
          labels: {
            back: "Atrás",
            next: "Siguiente",
            submit: "Guardar",
            submitting: "Guardando…",
          },
        }}
        steps={steps}
        form={form}
        onSubmit={handleSubmit}
        onEvent={(e) => {
          // Log lightweight only (avoid freezing due to huge event objects)
          const safe = {
            type: (e as any)?.type ?? "unknown",
            stepId: (e as any)?.stepId ?? (e as any)?.step?.id ?? null,
          }
          console.log(`${LOG_PREFIX} event`, safe)
        }}
      />
    </div>
  )
}
