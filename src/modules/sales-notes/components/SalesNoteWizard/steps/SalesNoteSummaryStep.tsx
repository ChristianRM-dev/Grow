"use client";

/**
 * SalesNoteSummaryStep - Wrapper over the shared SummaryStep.
 *
 * Extends the shared component with sales-note-specific features:
 * - Total plants count card (registered + unregistered)
 * - Plant count badges on section headers
 */

import React, { useMemo } from "react";
import { useWatch } from "react-hook-form";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNoteFormInput } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import {
  SummaryStep,
  SALES_NOTE_SUMMARY_CONFIG,
} from "@/components/forms/steps/SummaryStep";

type Props = StepComponentProps<SalesNoteFormInput>;

export function SalesNoteSummaryStep({ form }: Props) {
  const values = useWatch({ control: form.control }) as any;

  const registeredPlantsCount = useMemo(() => {
    return (values.lines ?? []).reduce((sum: number, line: any) => {
      const qty = Number(line.quantity ?? 0);
      return sum + (Number.isFinite(qty) && qty > 0 ? qty : 0);
    }, 0);
  }, [values.lines]);

  const unregisteredPlantsCount = useMemo(() => {
    return (values.unregisteredLines ?? []).reduce(
      (sum: number, line: any) => {
        const qty = Number(line.quantity ?? 0);
        return sum + (Number.isFinite(qty) && qty > 0 ? qty : 0);
      },
      0,
    );
  }, [values.unregisteredLines]);

  const totalPlants = registeredPlantsCount + unregisteredPlantsCount;

  return (
    <SummaryStep
      form={form}
      config={SALES_NOTE_SUMMARY_CONFIG}
      renderExtraInfo={() => (
        <div className="card border-l-4 border-l-success bg-success/10">
          <div className="card-body py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-70">
                  Total de plantas
                </div>
                {totalPlants > 0 && (
                  <div className="mt-1 text-xs opacity-60">
                    {registeredPlantsCount > 0 && (
                      <span>{registeredPlantsCount} registradas</span>
                    )}
                    {registeredPlantsCount > 0 &&
                      unregisteredPlantsCount > 0 && (
                        <span className="mx-1">·</span>
                      )}
                    {unregisteredPlantsCount > 0 && (
                      <span>{unregisteredPlantsCount} externas</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-success">
                {totalPlants}
              </div>
            </div>
          </div>
        </div>
      )}
      renderRegisteredHeader={(lines) => (
        <div className="badge badge-success badge-lg">
          {registeredPlantsCount} plantas
        </div>
      )}
      renderUnregisteredHeader={(lines) => (
        <div className="badge badge-warning badge-lg">
          {unregisteredPlantsCount} plantas
        </div>
      )}
    />
  );
}
