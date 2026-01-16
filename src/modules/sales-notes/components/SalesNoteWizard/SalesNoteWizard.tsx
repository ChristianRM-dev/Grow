"use client";

import React, { useEffect, useMemo, useState } from "react";
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

  // Draft management
  const draft = useFormDraft({
    draftKey: "sales-note:new",
    form,
    enabled: true,
    debounceMs: 1000,
    schema: SalesNoteFormSchema,
    expirationDays: 7,
    onAutoSave: () => {
      console.log("[SalesNoteWizard] Draft auto-saved");
    },
    onSaveError: (error) => {
      console.error("[SalesNoteWizard] Draft save error:", error);
    },
  });

  const { showRecoveryDialog } = useDraftRecoveryDialog();

  // Check for draft on mount and ask user if needed
  useEffect(() => {
    if (!draft.hasInitialized) return;
    if (draftCheckComplete) return;

    async function checkForDraft() {
      // Only show dialog if draft actually exists
      if (draft.hasDraft && draft.draftTimestamp) {
        console.log("[SalesNoteWizard] Draft found, asking user...");

        const shouldRestore = await showRecoveryDialog({
          timestamp: draft.draftTimestamp,
          context: "nota de venta",
        });

        if (shouldRestore) {
          // Load and restore draft
          const draftData = draft.loadDraft();
          if (draftData) {
            console.log("[SalesNoteWizard] Restoring draft");
            form.reset(draftData);
          } else {
            console.warn("[SalesNoteWizard] Draft load failed");
          }
        } else {
          // User chose to discard draft
          console.log("[SalesNoteWizard] User discarded draft");
          draft.clearDraft();
        }
      } else {
        // No draft, just proceed normally
        console.log("[SalesNoteWizard] No draft found, starting fresh");
      }

      setDraftCheckComplete(true);
    }

    checkForDraft();
  }, [draft.hasInitialized, draft.hasDraft, draft.draftTimestamp]);

  // Handle submit: Clear draft on success
  const handleSubmit = async (input: SalesNoteFormInput) => {
    try {
      const parsed = SalesNoteFormSchema.parse(input);
      await onSubmit(parsed);

      // Clear draft on successful submit
      draft.clearDraft();
      console.log("[SalesNoteWizard] Submit successful, draft cleared");
    } catch (error) {
      console.error("[SalesNoteWizard] Submit error:", error);
      // Don't clear draft on error - user can retry
      throw error;
    }
  };

  const Step = defineFormStep<SalesNoteFormInput>();

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
          submitting: submitting ? "Guardando…" : "Guardando…",
          next: "Siguiente",
          back: "Atrás",
        },
      },
    ] as const;
  }, [Step, submitting]);

  // Show minimal loading only while checking for draft
  // This should be very fast (just a localStorage check)
  if (!draftCheckComplete) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auto-save indicator - only show if there's been a save */}
      {draft.lastSaved && (
        <div className="alert alert-success shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">
            Borrador guardado automáticamente a las{" "}
            {draft.lastSaved.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      {/* Auto-saving indicator - show while saving */}
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
          console.log("SalesNoteWizard::event", e);
        }}
      />
    </div>
  );
}
