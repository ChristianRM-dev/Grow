"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ReportTypeEnum } from "@/modules/reports/domain/reportTypes";
import {
  parseReportsPageState,
  serializeReportsPageState,
} from "@/modules/reports/domain/reportSearchParams";
import { PurchasesReportFiltersSchema } from "@/modules/reports/domain/purchasesReportFilters.schema";
import { monthLabelMX } from "@/modules/shared/utils/formatters";
import {
  firstDayOfMonthDateOnly,
  todayDateOnly,
} from "@/modules/shared/utils/dateOnly";

import {
  searchPartiesAction,
  type PartyLookupDto,
} from "@/modules/parties/actions/searchParties.action";

type Mode = "yearMonth" | "range";
type PaymentStatus = "all" | "paid" | "pending";

export function PurchasesReportPanelClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlState = useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString());
    return parseReportsPageState(sp);
  }, [searchParams]);

  const [mode, setMode] = useState<Mode>("yearMonth");

  const [years, setYears] = useState<number[]>([]);
  const [months, setMonths] = useState<number[]>([]);

  const [draftYear, setDraftYear] = useState<number | null>(null);
  const [draftMonth, setDraftMonth] = useState<number | null>(null);

  const [draftFrom, setDraftFrom] = useState<string>(firstDayOfMonthDateOnly());
  const [draftTo, setDraftTo] = useState<string>(todayDateOnly());

  // NEW: extra filters
  const [draftStatus, setDraftStatus] = useState<PaymentStatus>("all");
  const [draftPartyId, setDraftPartyId] = useState("");
  const [draftPartyName, setDraftPartyName] = useState("");

  // Autocomplete
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PartyLookupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingMonths, setLoadingMonths] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Load years
  useEffect(() => {
    let isMounted = true;

    async function loadYears() {
      setLoadingYears(true);
      setError(null);

      try {
        const res = await fetch("/reports/purchases/available-years", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP_${res.status}`);

        const data = (await res.json()) as { years: number[] };
        if (!isMounted) return;

        const list = data.years ?? [];
        setYears(list);

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

  // Sync draft from URL
  useEffect(() => {
    if (!urlState) return;
    if (urlState.type !== ReportTypeEnum.PURCHASES) return;

    if (urlState.mode === "yearMonth") {
      setMode("yearMonth");
      setDraftYear(urlState.year);
      setDraftMonth(typeof urlState.month === "number" ? urlState.month : null);
    } else if (urlState.mode === "range") {
      setMode("range");
      setDraftFrom(urlState.from);
      setDraftTo(urlState.to);
    }

    // extras
    const u: any = urlState;
    setDraftStatus((u.status as PaymentStatus) ?? "all");
    setDraftPartyId(u.partyId ?? "");
    setDraftPartyName(u.partyName ?? "");

    const name = String(u.partyName ?? "").trim();
    const id = String(u.partyId ?? "").trim();
    if (id && name && term.trim().length === 0 && !open) {
      setTerm(name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlState]);

  // Load months when year changes
  useEffect(() => {
    let isMounted = true;

    async function loadMonths(selectedYear: number) {
      setLoadingMonths(true);
      setError(null);

      try {
        const res = await fetch(
          `/reports/purchases/available-months?year=${encodeURIComponent(
            String(selectedYear)
          )}`,
          { method: "GET", cache: "no-store" }
        );

        if (!res.ok) throw new Error(`HTTP_${res.status}`);

        const data = (await res.json()) as { months: number[] };
        if (!isMounted) return;

        const list = data.months ?? [];
        setMonths(list);

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

    setDraftMonth(null);
    loadMonths(draftYear);

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftYear]);

  // Autocomplete search
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      const q = term.trim();
      if (q.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const rows = await searchPartiesAction({ term: q, take: 10 });
        setResults(rows);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [term]);

  function handleModeChange(nextMode: Mode) {
    setMode(nextMode);
    setError(null);

    if (nextMode === "yearMonth") {
      setDraftFrom(firstDayOfMonthDateOnly());
      setDraftTo(todayDateOnly());
      return;
    }

    setDraftMonth(null);
  }

  const draftCandidate = useMemo(() => {
    if (mode === "yearMonth") {
      return {
        type: ReportTypeEnum.PURCHASES,
        mode: "yearMonth" as const,
        year: draftYear ?? undefined,
        month: draftMonth ?? undefined,

        status: draftStatus,
        partyId: draftPartyId || undefined,
        partyName: draftPartyName || undefined,
      };
    }

    return {
      type: ReportTypeEnum.PURCHASES,
      mode: "range" as const,
      from: draftFrom,
      to: draftTo,

      status: draftStatus,
      partyId: draftPartyId || undefined,
      partyName: draftPartyName || undefined,
    };
  }, [
    mode,
    draftYear,
    draftMonth,
    draftFrom,
    draftTo,
    draftStatus,
    draftPartyId,
    draftPartyName,
  ]);

  const validation = useMemo(() => {
    return PurchasesReportFiltersSchema.safeParse(draftCandidate);
  }, [draftCandidate]);

  const canGenerate = validation.success;

  function generateReport() {
    const parsed = PurchasesReportFiltersSchema.safeParse(draftCandidate);
    if (!parsed.success) {
      setError("Revisa los filtros: hay valores inválidos.");
      return;
    }

    const sp = serializeReportsPageState(parsed.data);
    const qs = sp.toString();
    router.replace(qs ? `/reports?${qs}` : "/reports");
  }

  function clearFilters() {
    setError(null);
    setMode("yearMonth");
    setDraftMonth(null);

    setDraftStatus("all");
    setDraftPartyId("");
    setDraftPartyName("");
    setTerm("");
    setResults([]);
    setOpen(false);

    if (years.length > 0) setDraftYear(years[0]);
    else setDraftYear(null);

    setDraftFrom(firstDayOfMonthDateOnly());
    setDraftTo(todayDateOnly());

    router.replace("/reports?type=purchases");
  }

  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Reporte de Compras</h2>
        <p className="mt-1 text-sm opacity-70">
          Define el período y (opcional) filtra por estado de pago y/o
          proveedor.
        </p>
      </div>

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : null}

      {/* Date mode tabs */}
      <div role="tablist" className="tabs tabs-border">
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
          Rango
        </button>
      </div>

      {/* Date selectors */}
      {mode === "yearMonth" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </div>
      )}

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
            <option value="paid">Pagadas</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>

        {/* Supplier autocomplete */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Proveedor</span>
          </label>

          <div className="relative">
            <input
              className="input input-bordered w-full"
              placeholder="Escribe al menos 2 letras…"
              value={term}
              onChange={(e) => {
                const next = e.target.value;
                setTerm(next);

                if (draftPartyId) {
                  setDraftPartyId("");
                  setDraftPartyName("");
                }
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => window.setTimeout(() => setOpen(false), 150)}
              aria-label="Buscar proveedor"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70">
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <span>⌄</span>
              )}
            </div>

            {open && results.length > 0 ? (
              <div className="absolute z-50 mt-2 w-full rounded-box border border-base-300 bg-base-100 shadow">
                <ul className="menu menu-sm w-full">
                  {results.map((p) => (
                    <li key={p.id} className="w-full">
                      <button
                        type="button"
                        className="w-full justify-start text-left"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setDraftPartyId(p.id);
                          setDraftPartyName(p.name);
                          setTerm(p.name);
                          setOpen(false);
                        }}
                      >
                        <div className="flex flex-col items-start min-w-0">
                          <span className="font-medium truncate">{p.name}</span>
                          {p.phone ? (
                            <span className="text-xs opacity-70 truncate">
                              {p.phone}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {draftPartyId ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="badge badge-success">
                Proveedor seleccionado
              </span>
              <span className="text-sm opacity-70">{draftPartyName}</span>

              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setDraftPartyId("");
                  setDraftPartyName("");
                  setTerm("");
                  setResults([]);
                }}
              >
                Quitar
              </button>
            </div>
          ) : null}
        </div>
      </div>

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
