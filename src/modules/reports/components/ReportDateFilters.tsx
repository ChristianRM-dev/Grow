"use client"

import { monthLabelMX } from "@/modules/shared/utils/formatters"

type Mode = "yearMonth" | "range"

interface ReportDateFiltersProps {
  mode: Mode
  onModeChange: (mode: Mode) => void

  // Year/Month mode
  years: number[]
  months: number[]
  draftYear: number | null
  setDraftYear: (year: number | null) => void
  draftMonth: number | null
  setDraftMonth: (month: number | null) => void
  loadingYears: boolean
  loadingMonths: boolean

  // Range mode
  draftFrom: string
  setDraftFrom: (from: string) => void
  draftTo: string
  setDraftTo: (to: string) => void
}

export function ReportDateFilters({
  mode,
  onModeChange,
  years,
  months,
  draftYear,
  setDraftYear,
  draftMonth,
  setDraftMonth,
  loadingYears,
  loadingMonths,
  draftFrom,
  setDraftFrom,
  draftTo,
  setDraftTo,
}: ReportDateFiltersProps) {
  return (
    <>
      {/* Date mode tabs */}
      <div role="tablist" className="tabs tabs-border">
        <button
          role="tab"
          className={`tab ${mode === "yearMonth" ? "tab-active" : ""}`}
          onClick={() => onModeChange("yearMonth")}
          type="button"
        >
          Año / Mes
        </button>

        <button
          role="tab"
          className={`tab ${mode === "range" ? "tab-active" : ""}`}
          onClick={() => onModeChange("range")}
          type="button"
        >
          Rango
        </button>
      </div>

      {/* Date selectors */}
      {mode === "yearMonth" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Year */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Año</span>
            </label>

            <select
              className="select select-bordered w-full"
              value={draftYear ?? ""}
              onChange={(e) =>
                setDraftYear(e.target.value ? Number(e.target.value) : null)
              }
              disabled={loadingYears}
            >
              <option value="">
                {loadingYears ? "Cargando…" : "Selecciona…"}
              </option>

              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Mes (opcional)</span>
            </label>

            <select
              className="select select-bordered w-full"
              value={draftMonth ?? ""}
              onChange={(e) =>
                setDraftMonth(e.target.value ? Number(e.target.value) : null)
              }
              disabled={draftYear === null || loadingMonths}
            >
              <option value="">
                {draftYear === null
                  ? "Selecciona un año…"
                  : loadingMonths
                    ? "Cargando…"
                    : "Todo el año"}
              </option>

              {months.map((m) => (
                <option key={m} value={String(m)}>
                  {monthLabelMX(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Desde</span>
            </label>

            <input
              type="date"
              className="input input-bordered w-full"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Hasta</span>
            </label>

            <input
              type="date"
              className="input input-bordered w-full"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 text-sm opacity-70">
            Usa un rango específico. El reporte incluirá registros creados
            dentro del período.
          </div>
        </div>
      )}
    </>
  )
}
