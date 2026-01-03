"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ReportTypeEnum } from "@/modules/reports/domain/reportTypes";
import {
  parseReportsPageState,
  serializeReportsPageState,
} from "@/modules/reports/domain/reportSearchParams";
import { SalesReportFiltersSchema } from "@/modules/reports/domain/salesReportFilters.schema";

type Mode = "yearMonth" | "range";

function todayDateOnly(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function firstDayOfMonthDateOnly(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

export function SalesReportPanelClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ----- URL state (source of truth for "generated" report filters) -----
  const urlState = useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString());
    return parseReportsPageState(sp);
  }, [searchParams]);

  // ----- Draft state (user edits here; URL only updates on "Generate") -----
  const [mode, setMode] = useState<Mode>("yearMonth");

  const [years, setYears] = useState<number[]>([]);
  const [months, setMonths] = useState<number[]>([]);

  const [draftYear, setDraftYear] = useState<number | null>(null);
  const [draftMonth, setDraftMonth] = useState<number | null>(null);

  const [draftFrom, setDraftFrom] = useState<string>(firstDayOfMonthDateOnly());
  const [draftTo, setDraftTo] = useState<string>(todayDateOnly());

  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingMonths, setLoadingMonths] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ----- Load years lazily (only when this panel is rendered) -----
  useEffect(() => {
    let isMounted = true;

    async function loadYears() {
      setLoadingYears(true);
      setError(null);

      try {
        const res = await fetch("/reports/sales/available-years", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP_${res.status}`);

        const data = (await res.json()) as { years: number[] };
        if (!isMounted) return;

        const list = data.years ?? [];
        setYears(list);

        // If we don't have a draft year yet, use the most recent available year.
        if (draftYear === null && list.length > 0) {
          setDraftYear(list[0]);
        }
      } catch {
        if (!isMounted) return;
        setError("No se pudieron cargar los años disponibles.");
      } finally {
        if (!isMounted) return;
        setLoadingYears(false);
      }
    }

    loadYears();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Sync draft from URL when URL has valid sales filters -----
  useEffect(() => {
    if (!urlState) return;

    if (urlState.type !== ReportTypeEnum.SALES) return;

    // If URL has valid filters, reflect them in the draft.
    if (urlState.mode === "yearMonth") {
      setMode("yearMonth");
      setDraftYear(urlState.year);
      setDraftMonth(typeof urlState.month === "number" ? urlState.month : null);
      return;
    }

    if (urlState.mode === "range") {
      setMode("range");
      setDraftFrom(urlState.from);
      setDraftTo(urlState.to);
      return;
    }
  }, [urlState]);

  // ----- Load months when draftYear changes -----
  useEffect(() => {
    let isMounted = true;

    async function loadMonths(selectedYear: number) {
      setLoadingMonths(true);
      setError(null);

      try {
        const res = await fetch(
          `/reports/sales/available-months?year=${encodeURIComponent(
            String(selectedYear)
          )}`,
          { method: "GET", cache: "no-store" }
        );

        if (!res.ok) throw new Error(`HTTP_${res.status}`);

        const data = (await res.json()) as { months: number[] };
        if (!isMounted) return;

        const list = data.months ?? [];
        setMonths(list);

        // If current draft month is not available for this year, clear it.
        if (draftMonth !== null && !list.includes(draftMonth)) {
          setDraftMonth(null);
        }
      } catch {
        if (!isMounted) return;
        setError("No se pudieron cargar los meses disponibles.");
        setMonths([]);
      } finally {
        if (!isMounted) return;
        setLoadingMonths(false);
      }
    }

    if (draftYear === null) {
      setMonths([]);
      setDraftMonth(null);
      return;
    }

    // Changing year should reset month selection (user can re-pick).
    setDraftMonth(null);
    loadMonths(draftYear);

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftYear]);

  // ----- Mode switch: keep mutual exclusion clear -----
  function handleModeChange(nextMode: Mode) {
    setMode(nextMode);
    setError(null);

    if (nextMode === "yearMonth") {
      // Clear range draft (optional, but keeps intent clear)
      setDraftFrom(firstDayOfMonthDateOnly());
      setDraftTo(todayDateOnly());
      return;
    }

    // range
    setDraftMonth(null);
  }

  // ----- Validation for enabling "Generate" -----
  const draftCandidate = useMemo(() => {
    if (mode === "yearMonth") {
      return {
        type: ReportTypeEnum.SALES,
        mode: "yearMonth" as const,
        year: draftYear ?? undefined,
        month: draftMonth ?? undefined,
      };
    }

    return {
      type: ReportTypeEnum.SALES,
      mode: "range" as const,
      from: draftFrom,
      to: draftTo,
    };
  }, [mode, draftYear, draftMonth, draftFrom, draftTo]);

  const validation = useMemo(() => {
    const parsed = SalesReportFiltersSchema.safeParse(draftCandidate);
    return parsed;
  }, [draftCandidate]);

  const canGenerate = validation.success;

  function generateReport() {
    const parsed = SalesReportFiltersSchema.safeParse(draftCandidate);
    if (!parsed.success) {
      setError("Revisa los filtros: hay valores inválidos.");
      return;
    }

    const sp = serializeReportsPageState(parsed.data);
    const qs = sp.toString();
    router.replace(qs ? `/reports?${qs}` : "/reports");
  }

  function clearFilters() {
    // Keep type=sales, reset to a safe draft (yearMonth with latest year if available)
    setError(null);
    setMode("yearMonth");
    setDraftMonth(null);

    if (years.length > 0) {
      setDraftYear(years[0]);
    } else {
      setDraftYear(null);
    }

    setDraftFrom(firstDayOfMonthDateOnly());
    setDraftTo(todayDateOnly());

    router.replace("/reports?type=sales");
  }

  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Reporte de Ventas</h2>
        <p className="mt-1 text-sm opacity-70">
          Elige un método para definir el período. Solo se usa uno a la vez.
        </p>
      </div>

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : null}

      {/* Tabs for mutually exclusive modes */}
      <div role="tablist" className="tabs tabs-boxed">
        <button
          role="tab"
          className={`tab ${mode === "yearMonth" ? "tab-active" : ""}`}
          onClick={() => handleModeChange("yearMonth")}
          type="button"
        >
          Año / Mes
        </button>

        <button
          role="tab"
          className={`tab ${mode === "range" ? "tab-active" : ""}`}
          onClick={() => handleModeChange("range")}
          type="button"
        >
          Rango personalizado
        </button>
      </div>

      {mode === "yearMonth" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="form-control">
            <div className="label">
              <span className="label-text">Año</span>
            </div>

            <select
              className="select select-bordered"
              value={draftYear ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setDraftYear(v ? Number(v) : null);
              }}
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
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Mes (opcional)</span>
            </div>

            <select
              className="select select-bordered"
              value={draftMonth ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setDraftMonth(v ? Number(v) : null);
              }}
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
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="form-control">
            <div className="label">
              <span className="label-text">Desde</span>
            </div>

            <input
              type="date"
              className="input input-bordered"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Hasta</span>
            </div>

            <input
              type="date"
              className="input input-bordered"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
            />
          </label>

          <div className="md:col-span-2 text-sm opacity-70">
            Usa un rango específico. El reporte incluirá ventas creadas dentro
            del período.
          </div>
        </div>
      )}

      {/* Inline validation feedback (optional, but helpful) */}
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
    </div>
  );
}
