"use client";

import React, { useCallback, useMemo } from "react";
import type { StepStatus } from "./MultiStepForm.types";

export type StepperItem = {
  id: string;
  title: string;
  status: StepStatus; // "active" | "error" | "completed" | "skipped" | "pending"
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

  const getStepClass = useCallback(
    (item: StepperItem) => {
      const isActive = item.id === currentStepId;

      // Class precedence (important):
      // error > active > completed > skipped > pending
      // This avoids "confusing" colors when state updates overlap.
      const variant =
        item.status === "error"
          ? "step-error"
          : isActive
          ? "step-primary"
          : item.status === "completed"
          ? "step-success"
          : item.status === "skipped"
          ? "step-neutral"
          : "";

      return ["step", variant].filter(Boolean).join(" ");
    },
    [currentStepId]
  );

  const canClick = useCallback(
    (stepId: string) =>
      Boolean(allowFreeNavigation) ||
      visitedIds.has(stepId) ||
      stepId === currentStepId,
    [allowFreeNavigation, currentStepId, visitedIds]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLLIElement>, stepId: string) => {
      if (!canClick(stepId)) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onStepClick(stepId);
      }
    },
    [canClick, onStepClick]
  );

  const rendered = useMemo(() => {
    return items.map((item) => {
      const clickable = canClick(item.id);

      return (
        <li
          key={item.id}
          className={getStepClass(item)}
          onClick={() => (clickable ? onStepClick(item.id) : null)}
          onKeyDown={(e) => handleKeyDown(e, item.id)}
          tabIndex={clickable ? 0 : -1}
          aria-current={item.id === currentStepId ? "step" : undefined}
          title={item.title}
          style={{ cursor: clickable ? "pointer" : "default" }}
        >
          {item.title}
        </li>
      );
    });
  }, [
    canClick,
    currentStepId,
    getStepClass,
    handleKeyDown,
    items,
    onStepClick,
  ]);

  return (
    <div className="mb-4">
      <div className="overflow-x-auto pb-2">
        {/* Avoid h-full (size-full) here; it can cause inconsistent rendering */}
        <ul className="steps w-full min-w-max py-2">{rendered}</ul>
      </div>
    </div>
  );
}
