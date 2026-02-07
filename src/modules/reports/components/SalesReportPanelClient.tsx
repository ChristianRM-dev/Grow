// src/modules/reports/components/SalesReportPanelClient.tsx
"use client";

import { useState } from "react"

import { ReportTypeEnum } from "@/modules/reports/domain/reportTypes"
import { SalesReportFiltersSchema } from "@/modules/reports/domain/salesReportFilters.schema";
import { useReportFilters } from "@/modules/reports/hooks/useReportFilters"
import { ReportDateFilters } from "@/modules/reports/components/ReportDateFilters"
import { PartyMultiSelector } from "@/modules/reports/components/PartyMultiSelector"
import { PartyMultiSelectorButton } from "@/modules/reports/components/PartyMultiSelectorButton"

type PaymentStatus = "all" | "paid" | "pending";

export function SalesReportPanelClient() {
  const {
    mode,
    handleModeChange,
    years,
    months,
    draftYear,
    setDraftYear,
    draftMonth,
    setDraftMonth,
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    draftStatus,
    setDraftStatus,
    draftPartyIds,
    setDraftPartyIds,
    draftPartyFilterMode,
    setDraftPartyFilterMode,
    loadingYears,
    loadingMonths,
    error,
    validation,
    canGenerate,
    generateReport,
    clearFilters,
  } = useReportFilters({
    reportType: ReportTypeEnum.SALES,
    schema: SalesReportFiltersSchema,
    yearsEndpoint: "/reports/sales/available-years",
    monthsEndpoint: "/reports/sales/available-months",
  })

  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false)

  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Reporte de Ventas</h2>
        <p className="mt-1 text-sm opacity-70">
          Define el período y (opcional) filtra por estado de pago y/o clientes.
        </p>
      </div>

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : null}

      <ReportDateFilters
        mode={mode}
        onModeChange={handleModeChange}
        years={years}
        months={months}
        draftYear={draftYear}
        setDraftYear={setDraftYear}
        draftMonth={draftMonth}
        setDraftMonth={setDraftMonth}
        loadingYears={loadingYears}
        loadingMonths={loadingMonths}
        draftFrom={draftFrom}
        setDraftFrom={setDraftFrom}
        draftTo={draftTo}
        setDraftTo={setDraftTo}
      />

      {/* EXTRA FILTERS */}
      <div className="rounded-box border border-base-300 bg-base-200 p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Filtros opcionales</h3>
          <p className="text-sm opacity-70">Se aplican junto con el período.</p>
        </div>

        {/* Payment status */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Estado de pago</span>
          </label>

          <select
            className="select select-bordered w-full"
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value as PaymentStatus)}
          >
            <option value="all">Todos</option>
            <option value="paid">Pagados</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>

        {/* Multi-party selector */}
        <PartyMultiSelectorButton
          label="Clientes"
          selectedCount={draftPartyIds.length}
          mode={draftPartyFilterMode}
          onClick={() => setIsPartyModalOpen(true)}
        />
      </div>

      {/* Inline validation feedback */}
      {!validation.success ? (
        <div className="alert alert-warning">
          <span>Falta completar filtros válidos para generar el reporte.</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button type="button" className="btn btn-ghost" onClick={clearFilters}>
          Limpiar
        </button>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!canGenerate}
          onClick={generateReport}
        >
          Generar reporte
        </button>
      </div>

      {/* Party selection modal */}
      <PartyMultiSelector
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        selectedIds={draftPartyIds}
        mode={draftPartyFilterMode ?? "include"}
        onConfirm={(ids, mode) => {
          setDraftPartyIds(ids)
          setDraftPartyFilterMode(ids.length > 0 ? mode : null)
        }}
        title="Seleccionar clientes para el reporte"
      />
    </div>
  )
}
