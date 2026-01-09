"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  REPORT_TYPE_OPTIONS,
  ReportTypeEnum,
  type ReportType,
} from "@/modules/reports/domain/reportTypes";
import {
  parseReportsPageState,
  serializeReportsPageState,
  type ReportsPageState,
} from "@/modules/reports/domain/reportSearchParams";
import { SalesReportPanelClient } from "./SalesReportPanelClient";
import { PurchasesReportPanelClient } from "./PurchasesReportPanelClient";

export function ReportsPageClient({
  initialState,
  hasInvalidParams,
}: {
  initialState: ReportsPageState;
  hasInvalidParams: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentUrlState = useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString());
    return parseReportsPageState(sp);
  }, [searchParams]);

  // URL is source of truth. If URL params are invalid (null), fall back to initialState.
  const effectiveState: ReportsPageState = currentUrlState ?? initialState;

  const selectedType: ReportType | "" = effectiveState.type ?? "";

  function updateUrlState(next: ReportsPageState) {
    const sp = serializeReportsPageState(next);
    const qs = sp.toString();
    router.replace(qs ? `/reports?${qs}` : "/reports");
  }

  function handleTypeChange(nextType: ReportType | "") {
    if (!nextType) {
      updateUrlState({ type: undefined });
      return;
    }

    if (nextType === ReportTypeEnum.SALES) {
      // Keep only type until user generates valid filters.
      updateUrlState({ type: nextType, mode: undefined });
      return;
    }

    updateUrlState({ type: nextType, mode: undefined });
  }

  return (
    <div className="space-y-4">
      {hasInvalidParams ? (
        <div className="alert alert-warning">
          <span>
            Los filtros en la URL no son válidos. Ajusta el tipo de reporte y
            vuelve a generar.
          </span>
        </div>
      ) : null}

      <div className="rounded-box border border-base-300 bg-base-100 p-4">
        <div className="form-control w-full max-w-md">
          <label className="label">
            <span className="label-text font-medium">Tipo de reporte</span>
          </label>

          <select
            className="select select-bordered w-full"
            value={selectedType}
            onChange={(e) =>
              handleTypeChange((e.target.value as ReportType) || "")
            }
          >
            <option value="">Selecciona…</option>
            {REPORT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedType === ReportTypeEnum.SALES ? (
        <SalesReportPanelClient />
      ) : null}

      {selectedType === ReportTypeEnum.PURCHASES ? (
        <PurchasesReportPanelClient />
      ) : null}
    </div>
  );
}
