"use client";

import { useEffect, useMemo, useState } from "react";
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

export function ReportsPageClient({
  initialState,
  hasInvalidParams,
}: {
  initialState: ReportsPageState;
  hasInvalidParams: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep local state, but URL is source of truth.
  const [selectedType, setSelectedType] = useState<ReportType | "">(
    initialState.type ?? ""
  );

  const currentUrlState = useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString());
    return parseReportsPageState(sp);
  }, [searchParams]);

  // If URL changes externally (back/forward), sync dropdown.
  useEffect(() => {
    if (currentUrlState && currentUrlState.type !== undefined) {
      setSelectedType(currentUrlState.type);
    }
    if (currentUrlState && currentUrlState.type === undefined) {
      setSelectedType("");
    }
  }, [currentUrlState]);

  function updateUrlState(next: ReportsPageState) {
    const sp = serializeReportsPageState(next);
    const qs = sp.toString();
    router.replace(qs ? `/reports?${qs}` : "/reports");
  }

  function handleTypeChange(nextType: ReportType | "") {
    setSelectedType(nextType);

    if (!nextType) {
      // Clear params entirely
      updateUrlState({ type: undefined });
      return;
    }

    // When selecting a type for the first time, set a sensible default mode.
    if (nextType === ReportTypeEnum.SALES) {
      // Default to yearMonth without choosing year yet (we will pick after loading years in Phase 2)
      // We cannot validate SalesReportFilters without a year, so keep only {type} in URL for now.
      updateUrlState({ type: nextType } as any);
      return;
    }

    updateUrlState({ type: nextType } as any);
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
        <label className="form-control w-full max-w-md">
          <div className="label">
            <span className="label-text">Tipo de reporte</span>
          </div>

          <select
            className="select select-bordered"
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
        </label>
      </div>

      {selectedType === ReportTypeEnum.SALES ? (
        <SalesReportPanelClient />
      ) : null}
    </div>
  );
}
