import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { ZodSchema } from "zod"

import { ReportTypeEnum } from "@/modules/reports/domain/reportTypes"
import {
  parseReportsPageState,
  serializeReportsPageState,
} from "@/modules/reports/domain/reportSearchParams"
import {
  firstDayOfMonthDateOnly,
  todayDateOnly,
} from "@/modules/shared/utils/dateOnly"

type Mode = "yearMonth" | "range"
type PaymentStatus = "all" | "paid" | "pending"
type PartyFilterMode = "include" | "exclude" | null

interface UseReportFiltersConfig {
  reportType: ReportTypeEnum
  schema: ZodSchema
  yearsEndpoint: string
  monthsEndpoint: string
}

export function useReportFilters({
  reportType,
  schema,
  yearsEndpoint,
  monthsEndpoint,
}: UseReportFiltersConfig) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ----- URL state (source of truth for "generated" report filters) -----
  const urlState = useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString())
    return parseReportsPageState(sp)
  }, [searchParams])

  // ----- Draft state -----
  const [mode, setMode] = useState<Mode>("yearMonth")

  const [years, setYears] = useState<number[]>([])
  const [months, setMonths] = useState<number[]>([])

  const [draftYear, setDraftYear] = useState<number | null>(null)
  const [draftMonth, setDraftMonth] = useState<number | null>(null)

  const [draftFrom, setDraftFrom] = useState<string>(firstDayOfMonthDateOnly())
  const [draftTo, setDraftTo] = useState<string>(todayDateOnly())

  // Extra filters
  const [draftStatus, setDraftStatus] = useState<PaymentStatus>("all")

  // Multi-party filter (NEW)
  const [draftPartyIds, setDraftPartyIds] = useState<string[]>([])
  const [draftPartyFilterMode, setDraftPartyFilterMode] =
    useState<PartyFilterMode>(null)

  const [loadingYears, setLoadingYears] = useState(false)
  const [loadingMonths, setLoadingMonths] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // ----- Load years lazily -----
  useEffect(() => {
    let isMounted = true

    async function loadYears() {
      setLoadingYears(true)
      setError(null)

      try {
        const res = await fetch(yearsEndpoint, {
          method: "GET",
          cache: "no-store",
        })

        if (!res.ok) throw new Error(`HTTP_${res.status}`)

        const data = (await res.json()) as { years: number[] }
        if (!isMounted) return

        const list = data.years ?? []
        setYears(list)

        // Default to most recent available year if not already selected
        if (draftYear === null && list.length > 0) {
          setDraftYear(list[0])
        }
      } catch {
        if (!isMounted) return
        setError("No se pudieron cargar los años disponibles.")
      } finally {
        if (!isMounted) return
        setLoadingYears(false)
      }
    }

    loadYears()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearsEndpoint])

  // ----- Sync draft from URL when URL has valid filters -----
  useEffect(() => {
    if (!urlState) return
    if (urlState.type !== reportType) return

    // If URL is "selected but not generated yet" (mode missing), do nothing.
    if (!("mode" in urlState) || !urlState.mode) return

    // Date mode
    if (urlState.mode === "yearMonth") {
      setMode("yearMonth")
      setDraftYear(urlState.year)
      setDraftMonth(typeof urlState.month === "number" ? urlState.month : null)
    } else if (urlState.mode === "range") {
      setMode("range")
      setDraftFrom(urlState.from)
      setDraftTo(urlState.to)
    }

    // Extra filters
    const u: any = urlState
    setDraftStatus((u.status as PaymentStatus) ?? "all")

    // Multi-party filter (NEW)
    setDraftPartyIds(u.partyIds ?? [])
    setDraftPartyFilterMode(u.partyFilterMode ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlState, reportType])

  // ----- Load months when draftYear changes -----
  useEffect(() => {
    let isMounted = true

    async function loadMonths(selectedYear: number) {
      setLoadingMonths(true)
      setError(null)

      try {
        const res = await fetch(
          `${monthsEndpoint}?year=${encodeURIComponent(String(selectedYear))}`,
          { method: "GET", cache: "no-store" }
        )

        if (!res.ok) throw new Error(`HTTP_${res.status}`)

        const data = (await res.json()) as { months: number[] }
        if (!isMounted) return

        const list = data.months ?? []
        setMonths(list)

        // If current draft month is not available for this year, clear it.
        if (draftMonth !== null && !list.includes(draftMonth)) {
          setDraftMonth(null)
        }
      } catch {
        if (!isMounted) return
        setError("No se pudieron cargar los meses disponibles.")
        setMonths([])
      } finally {
        if (!isMounted) return
        setLoadingMonths(false)
      }
    }

    if (draftYear === null) {
      setMonths([])
      setDraftMonth(null)
      return
    }

    // Changing year resets month selection
    setDraftMonth(null)
    loadMonths(draftYear)

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftYear, monthsEndpoint])

  // ----- Mode switch handler -----
  function handleModeChange(nextMode: Mode) {
    setMode(nextMode)
    setError(null)

    if (nextMode === "yearMonth") {
      setDraftFrom(firstDayOfMonthDateOnly())
      setDraftTo(todayDateOnly())
      return
    }

    setDraftMonth(null)
  }

  // ----- Draft candidate -----
  const draftCandidate = useMemo(() => {
    const extra = {
      status: draftStatus,
      partyIds: draftPartyIds.length > 0 ? draftPartyIds : undefined,
      partyFilterMode: draftPartyFilterMode ?? undefined,
    }

    if (mode === "yearMonth") {
      return {
        type: reportType,
        mode: "yearMonth" as const,
        year: draftYear ?? undefined,
        month: draftMonth ?? undefined,
        ...extra,
      }
    }

    return {
      type: reportType,
      mode: "range" as const,
      from: draftFrom,
      to: draftTo,
      ...extra,
    }
  }, [
    reportType,
    mode,
    draftYear,
    draftMonth,
    draftFrom,
    draftTo,
    draftStatus,
    draftPartyIds,
    draftPartyFilterMode,
  ])

  const validation = useMemo(() => {
    return schema.safeParse(draftCandidate)
  }, [draftCandidate, schema])

  const canGenerate = validation.success

  function generateReport() {
    const parsed = schema.safeParse(draftCandidate)
    if (!parsed.success) {
      setError("Revisa los filtros: hay valores inválidos.")
      return
    }

    const sp = serializeReportsPageState(parsed.data)
    const qs = sp.toString()
    router.replace(qs ? `/reports?${qs}` : "/reports")
  }

  function clearFilters() {
    setError(null)
    setMode("yearMonth")
    setDraftMonth(null)

    setDraftStatus("all")
    setDraftPartyIds([])
    setDraftPartyFilterMode(null)

    if (years.length > 0) setDraftYear(years[0])
    else setDraftYear(null)

    setDraftFrom(firstDayOfMonthDateOnly())
    setDraftTo(todayDateOnly())

    router.replace(`/reports?type=${reportType.toLowerCase()}`)
  }

  return {
    // Mode
    mode,
    handleModeChange,

    // Date states
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

    // Extra filters
    draftStatus,
    setDraftStatus,

    // Multi-party filter (NEW)
    draftPartyIds,
    setDraftPartyIds,
    draftPartyFilterMode,
    setDraftPartyFilterMode,

    // Loading states
    loadingYears,
    loadingMonths,

    // Error
    error,
    setError,

    // Validation
    validation,
    canGenerate,

    // Actions
    generateReport,
    clearFilters,

    // For autocomplete sync
    urlState,
  }
}
