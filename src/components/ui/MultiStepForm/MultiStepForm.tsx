"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { useWatch } from "react-hook-form";

import type {
  MultiStepFormProps,
  StepDefinition,
  StepRuntimeState,
  StepStatus,
  WizardApi,
  WizardButtonLabels,
} from "./MultiStepForm.types";

/**
 * Safely converts a Zod issue path into a dot-path string.
 */
function issuePathToDotPath(issuePath: Array<string | number>): string {
  return issuePath.map(String).join(".");
}

/**
 * Finds the first visible step id that is not summary (fallback to first visible).
 */
function pickInitialStepId<TFormValues extends FieldValues>(
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

function mergeLabels(
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

/**
 * MultiStepForm wrapper component:
 * - Owns wizard navigation and validation orchestration
 * - Steps render fields using the same RHF instance
 */
export function MultiStepForm<TFormValues extends FieldValues>(
  props: MultiStepFormProps<TFormValues>
) {
  const { config, steps, form, finalSchema, onSaveDraft, onSubmit, onEvent } =
    props;

  const values = useWatch({ control: form.control }) as TFormValues;

  const defaultLabels: Required<WizardButtonLabels> = {
    back: "Atrás",
    next: "Siguiente",
    saveDraft: "Guardar",
    submit: "Guardar",
    submitting: "Guardando…",
    savingDraft: "Guardando…",
  };

  const visibleSteps = useMemo(() => {
    return steps.filter((s) => (s.isVisible ? s.isVisible(values) : true));
  }, [steps, values]);

  const [currentStepId, setCurrentStepId] = useState<string | null>(null);

  const [visitedIds, setVisitedIds] = useState<Set<string>>(() => new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [skippedIds, setSkippedIds] = useState<Set<string>>(() => new Set());
  const [errorIds, setErrorIds] = useState<Set<string>>(() => new Set());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Initialize current step
  useEffect(() => {
    if (currentStepId) return;

    const initial = pickInitialStepId(steps, values);
    if (initial) {
      setCurrentStepId(initial);
      setVisitedIds((prev) => new Set(prev).add(initial));
    }
  }, [currentStepId, steps, values]);

  // If current step becomes invisible, move to nearest visible step.
  useEffect(() => {
    if (!currentStepId) return;
    const stillVisible = visibleSteps.some((s) => s.id === currentStepId);
    if (stillVisible) return;

    const fallback = pickInitialStepId(steps, values);
    setCurrentStepId(fallback);
    if (fallback) setVisitedIds((prev) => new Set(prev).add(fallback));
  }, [currentStepId, steps, values, visibleSteps]);

  const currentIndex = useMemo(() => {
    if (!currentStepId) return 0;
    const idx = visibleSteps.findIndex((s) => s.id === currentStepId);
    return idx >= 0 ? idx : 0;
  }, [currentStepId, visibleSteps]);

  const currentStep = useMemo(() => {
    if (!currentStepId) return null;
    return visibleSteps.find((s) => s.id === currentStepId) ?? null;
  }, [currentStepId, visibleSteps]);

  const isLastVisibleStep =
    currentIndex >= Math.max(0, visibleSteps.length - 1);
  const canGoBack = currentIndex > 0;

  const computeStepStatus = useCallback(
    (stepId: string): StepStatus => {
      if (currentStepId === stepId) return "active";
      if (errorIds.has(stepId)) return "error";
      if (completedIds.has(stepId)) return "completed";
      if (skippedIds.has(stepId)) return "skipped";
      if (visitedIds.has(stepId)) return "pending";
      return "pending";
    },
    [completedIds, currentStepId, errorIds, skippedIds, visitedIds]
  );

  const runtimeSteps: StepRuntimeState[] = useMemo(() => {
    return steps.map((s) => {
      const isVisible = s.isVisible ? s.isVisible(values) : true;
      const isOptional = s.kind === "step" ? Boolean(s.optional) : false;
      const isSummary = s.kind === "summary";
      const status = isVisible ? computeStepStatus(s.id) : "skipped";

      return {
        id: s.id,
        status,
        isVisible,
        isOptional,
        isSummary,
      };
    });
  }, [steps, values, computeStepStatus]);

  const visibleRuntimeSteps = useMemo(() => {
    const byId = new Map(runtimeSteps.map((s) => [s.id, s]));
    return visibleSteps.map((s) => byId.get(s.id)!).filter(Boolean);
  }, [runtimeSteps, visibleSteps]);

  const progress = useMemo(() => {
    const relevant = visibleRuntimeSteps.filter((s) => !s.isSummary);
    if (relevant.length === 0) return 0;

    const done = relevant.filter(
      (s) => s.status === "completed" || s.status === "skipped"
    ).length;

    return Math.round((done / relevant.length) * 100);
  }, [visibleRuntimeSteps]);

  const goToStepInternal = useCallback(
    (toStepId: string) => {
      if (!currentStepId) return;

      const targetIdx = visibleSteps.findIndex((s) => s.id === toStepId);
      if (targetIdx < 0) return;

      const currentIdx = visibleSteps.findIndex((s) => s.id === currentStepId);
      const isGoingBackward = targetIdx <= currentIdx;

      const allowFree = Boolean(config.allowFreeNavigation);
      const canJump =
        allowFree ||
        isGoingBackward ||
        visitedIds.has(toStepId) ||
        toStepId === currentStepId;

      if (!canJump) return;

      onEvent?.({ type: "step_change", fromStepId: currentStepId, toStepId });
      setCurrentStepId(toStepId);
      setVisitedIds((prev) => new Set(prev).add(toStepId));
    },
    [
      config.allowFreeNavigation,
      currentStepId,
      onEvent,
      visibleSteps,
      visitedIds,
    ]
  );

  const focusFirstField = useCallback(
    async (field: FieldPath<TFormValues> | undefined) => {
      if (!field) return;
      try {
        form.setFocus(field);
      } catch {
        // ignore focus errors (field may not be mounted)
      }
    },
    [form]
  );

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    if (!currentStep) return false;
    if (currentStep.kind === "summary") return true;

    // 1) RHF field-level validation (shows inline errors)
    const okRhf = await form.trigger(currentStep.fieldPaths as any);
    if (!okRhf) {
      setErrorIds((prev) => new Set(prev).add(currentStep.id));
      await focusFirstField(currentStep.fieldPaths[0]);
      return false;
    }

    // 2) Zod step-level validation (cross-field rules)
    if (currentStep.validator) {
      const allValues = form.getValues() as TFormValues;
      const stepValues = currentStep.validator.getStepValues(allValues);
      const parsed = currentStep.validator.schema.safeParse(stepValues);

      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const mapped =
            currentStep.validator.mapIssuePathToFieldPath?.(issue.path) ??
            (issuePathToDotPath(issue.path) as FieldPath<TFormValues>);

          if (mapped) {
            form.setError(mapped, { type: "zod", message: issue.message });
          }
        }

        setErrorIds((prev) => new Set(prev).add(currentStep.id));
        await focusFirstField(currentStep.fieldPaths[0]);
        return false;
      }
    }

    // Mark as completed
    setErrorIds((prev) => {
      const next = new Set(prev);
      next.delete(currentStep.id);
      return next;
    });
    setCompletedIds((prev) => new Set(prev).add(currentStep.id));
    return true;
  }, [currentStep, focusFirstField, form]);

  const goNext = useCallback(async () => {
    if (!currentStepId) return;

    // If on last step, treat as submit
    if (isLastVisibleStep) {
      await submit();
      return;
    }

    const ok = await validateCurrentStep();
    if (!ok) return;

    const next = visibleSteps[currentIndex + 1];
    if (!next) return;

    onEvent?.({
      type: "step_change",
      fromStepId: currentStepId,
      toStepId: next.id,
    });
    setCurrentStepId(next.id);
    setVisitedIds((prev) => new Set(prev).add(next.id));
  }, [
    currentIndex,
    currentStepId,
    isLastVisibleStep,
    onEvent,
    validateCurrentStep,
    visibleSteps,
  ]);

  const goBack = useCallback(() => {
    if (!currentStepId) return;
    if (!canGoBack) return;

    const prev = visibleSteps[currentIndex - 1];
    if (!prev) return;

    onEvent?.({
      type: "step_change",
      fromStepId: currentStepId,
      toStepId: prev.id,
    });
    setCurrentStepId(prev.id);
    setVisitedIds((p) => new Set(p).add(prev.id));
  }, [canGoBack, currentIndex, currentStepId, onEvent, visibleSteps]);

  const saveDraft = useCallback(async () => {
    if (!config.allowDraftSave) return;
    if (!onSaveDraft) return;

    const snapshot = form.getValues() as TFormValues;

    setIsSavingDraft(true);
    try {
      onEvent?.({ type: "draft_save", values: snapshot });
      await onSaveDraft(snapshot);
    } finally {
      setIsSavingDraft(false);
    }
  }, [config.allowDraftSave, form, onEvent, onSaveDraft]);

  const submit = useCallback(async () => {
    const snapshot = form.getValues() as TFormValues;

    setIsSubmitting(true);
    try {
      // 1) RHF full validation
      const okRhf = await form.trigger();
      if (!okRhf) {
        // Move to the first visible step that has any of its fields invalid
        const firstVisibleStep = visibleSteps.find((s) => {
          if (s.kind !== "step") return false;
          return s.fieldPaths.some((p) => Boolean(form.getFieldState(p).error));
        });
        if (firstVisibleStep) goToStepInternal(firstVisibleStep.id);
        return;
      }

      // 2) Final schema validation (recommended)
      if (finalSchema) {
        const parsed = finalSchema.safeParse(snapshot);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            const path = issuePathToDotPath(
              issue.path
            ) as FieldPath<TFormValues>;
            form.setError(path, { type: "zod", message: issue.message });
          }

          // Jump to the first step containing an errored field
          const firstVisibleStep = visibleSteps.find((s) => {
            if (s.kind !== "step") return false;
            return s.fieldPaths.some((p) =>
              Boolean(form.getFieldState(p).error)
            );
          });
          if (firstVisibleStep) goToStepInternal(firstVisibleStep.id);
          return;
        }
      }

      onEvent?.({ type: "submit", values: snapshot });
      await onSubmit(snapshot);
    } finally {
      setIsSubmitting(false);
    }
  }, [finalSchema, form, goToStepInternal, onEvent, onSubmit, visibleSteps]);

  const wizardLabels = useMemo(() => {
    const stepLabels = currentStep?.labels;
    return mergeLabels(defaultLabels, config.labels, stepLabels);
  }, [config.labels, currentStep?.labels]);

  const wizardApi: WizardApi<TFormValues> = useMemo(
    () => ({
      currentIndex,
      currentStepId: currentStepId ?? "",
      steps: runtimeSteps,

      canGoBack,
      canGoNext: true,
      isLastVisibleStep,
      isSubmitting,
      isSavingDraft,

      goBack,
      goNext,
      goToStep: goToStepInternal,

      saveDraft,
      submit,

      getValues: () => form.getValues() as TFormValues,
    }),
    [
      canGoBack,
      currentIndex,
      currentStepId,
      form,
      goBack,
      goNext,
      goToStepInternal,
      isLastVisibleStep,
      isSavingDraft,
      isSubmitting,
      runtimeSteps,
      saveDraft,
      submit,
    ]
  );

  if (!currentStep || !currentStepId) {
    return (
      <div className="w-full">
        <div className="alert">
          <span>No hay pasos disponibles para mostrar.</span>
        </div>
      </div>
    );
  }

  const CurrentComponent = currentStep.Component;

  // Top stepper uses only visible steps for navigation
  const stepperItems = visibleSteps.map((s) => {
    const state = visibleRuntimeSteps.find((x) => x.id === s.id);
    const status = state?.status ?? "pending";
    return { id: s.id, title: s.title, status };
  });

  // Primary action label: on last visible step -> submit label
  const primaryLabel = isLastVisibleStep
    ? wizardLabels.submit
    : wizardLabels.next;

  const primaryLoadingLabel = isLastVisibleStep
    ? wizardLabels.submitting
    : wizardLabels.next;

  const showDraftButton = Boolean(config.allowDraftSave && onSaveDraft);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold">{config.title}</h1>
        {config.description ? (
          <p className="mt-1 text-sm opacity-70">{config.description}</p>
        ) : null}
      </div>

      {/* Stepper */}
      {config.showProgress !== false ? (
        <div className="mb-4">
          <div className="overflow-x-auto">
            <ul className="steps min-w-max">
              {stepperItems.map((item) => {
                const active = item.id === currentStepId;
                const completed = item.status === "completed";
                const error = item.status === "error";
                const skipped = item.status === "skipped";

                // IMPORTANT:
                // - Only the active step is "primary"
                // - Completed steps use "success"
                // This avoids the "stuck on step 2" visual issue.
                const stepClass = [
                  "step",
                  active ? "step-primary" : "",
                  !active && completed ? "step-success" : "",
                  !active && error ? "step-error" : "",
                  !active && skipped ? "step-neutral" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                const canClick =
                  config.allowFreeNavigation ||
                  visitedIds.has(item.id) ||
                  item.id === currentStepId;

                return (
                  <li
                    key={item.id}
                    className={stepClass}
                    onClick={() =>
                      canClick ? wizardApi.goToStep(item.id) : null
                    }
                    style={{ cursor: canClick ? "pointer" : "default" }}
                    title={item.title}
                  >
                    {item.title}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Step content */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          {currentStep.description ? (
            <p className="text-sm opacity-70">{currentStep.description}</p>
          ) : null}

          <div className="mt-2">
            <CurrentComponent
              form={form}
              wizard={wizardApi}
              readOnly={currentStep.kind === "summary"}
            />
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm opacity-70">
          Paso <b>{currentIndex + 1}</b> de <b>{visibleSteps.length}</b>
        </div>

        <div className="flex items-center justify-end gap-2">
          {showDraftButton ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => wizardApi.saveDraft()}
              disabled={isSubmitting || isSavingDraft}
            >
              {isSavingDraft
                ? wizardLabels.savingDraft
                : wizardLabels.saveDraft}
            </button>
          ) : null}

          <button
            type="button"
            className="btn"
            onClick={() => wizardApi.goBack()}
            disabled={!wizardApi.canGoBack || isSubmitting || isSavingDraft}
          >
            {wizardLabels.back}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => wizardApi.goNext()}
            disabled={isSubmitting || isSavingDraft}
          >
            {isSubmitting ? primaryLoadingLabel : primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
