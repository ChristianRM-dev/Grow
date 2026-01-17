"use client";

import React, { useCallback, useMemo } from "react";
import type { StepStatus } from "./MultiStepForm.types";

export type StepperItem = {
  id: string;
  title: string;
  status: StepStatus;
};

export function MultiStepFormStepper(props: {
  items: StepperItem[];
  currentStepId: string;
  allowFreeNavigation?: boolean;
  visitedIds: Set<string>;
  onStepClick: (stepId: string) => void;
}) {
  const { items, currentStepId, allowFreeNavigation, visitedIds, onStepClick } =
    props;

  /**
   * Map step status to DaisyUI step classes
   * Priority: active > error > completed > pending/skipped
   * Active step ALWAYS shows as primary (step-primary)
   */
  const getStepClass = useCallback(
    (item: StepperItem, isCurrentStep: boolean): string => {
      // Current step always gets primary styling, regardless of status
      if (isCurrentStep) {
        return "step step-primary";
      }

      // Map other statuses
      switch (item.status) {
        case "error":
          return "step step-error";
        case "completed":
          return "step step-success";
        case "skipped":
          return "step step-neutral";
        case "pending":
        default:
          return "step";
      }
    },
    [],
  );

  /**
   * Determine if a step is clickable
   */
  const canClick = useCallback(
    (stepId: string): boolean => {
      // Always allow clicking current step (no-op but harmless)
      if (stepId === currentStepId) return true;

      // Allow free navigation if enabled
      if (allowFreeNavigation) return true;

      // Allow clicking previously visited steps (backward navigation)
      return visitedIds.has(stepId);
    },
    [allowFreeNavigation, currentStepId, visitedIds],
  );

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLLIElement>, stepId: string) => {
      if (!canClick(stepId)) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onStepClick(stepId);
      }
    },
    [canClick, onStepClick],
  );

  /**
   * Handle click
   */
  const handleClick = useCallback(
    (stepId: string) => {
      if (canClick(stepId)) {
        onStepClick(stepId);
      }
    },
    [canClick, onStepClick],
  );

  /**
   * Get accessible label for step
   */
  const getAriaLabel = useCallback(
    (item: StepperItem, isCurrentStep: boolean): string => {
      const parts: string[] = [item.title];

      if (isCurrentStep) {
        parts.push("(paso actual)");
      } else if (item.status === "completed") {
        parts.push("(completado)");
      } else if (item.status === "error") {
        parts.push("(con errores)");
      } else if (item.status === "skipped") {
        parts.push("(omitido)");
      }

      return parts.join(" ");
    },
    [],
  );

  /**
   * Render step items
   */
  const rendered = useMemo(() => {
    return items.map((item, index) => {
      const isCurrentStep = item.id === currentStepId;
      const clickable = canClick(item.id);
      const stepNumber = index + 1;

      return (
        <li
          key={item.id}
          className={getStepClass(item, isCurrentStep)}
          onClick={() => handleClick(item.id)}
          onKeyDown={(e) => handleKeyDown(e, item.id)}
          tabIndex={clickable ? 0 : -1}
          role="button"
          aria-label={getAriaLabel(item, isCurrentStep)}
          aria-current={isCurrentStep ? "step" : undefined}
          aria-disabled={!clickable}
          data-content={stepNumber}
          style={{
            cursor: clickable ? "pointer" : "not-allowed",
            opacity: clickable || isCurrentStep ? 1 : 0.6,
          }}
        >
          <span className="sr-only">Paso {stepNumber}: </span>
          {item.title}
        </li>
      );
    });
  }, [
    items,
    currentStepId,
    canClick,
    getStepClass,
    getAriaLabel,
    handleClick,
    handleKeyDown,
  ]);

  return (
    <div className="mb-4">
      <nav
        aria-label="Progreso del formulario"
        className="overflow-x-auto pb-2"
      >
        <ul className="steps w-full min-w-max py-2" role="list">
          {rendered}
        </ul>
      </nav>
    </div>
  );
}
