"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { SalesNoteWizard } from "@/modules/sales-notes/components/SalesNoteWizard/SalesNoteWizard"
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas"
import { createSalesNoteAction } from "@/modules/sales-notes/actions/createSalesNote.action"
import { toast } from "@/components/ui/Toast/toast"
import { routes } from "@/lib/routes"

const REQUEST_ID_KEY = "sales-note:new:clientRequestId"
const LOG_PREFIX = "[SalesNoteNew]"

type LogEntry = {
  i: number
  atMs: number
  msg: string
  data?: unknown
}

function createLogBuffer() {
  const t0 = performance.now()
  let i = 0
  const buffer: LogEntry[] = []

  function log(msg: string, data?: unknown) {
    const entry: LogEntry = {
      i: ++i,
      atMs: Math.round(performance.now() - t0),
      msg,
      data,
    }
    buffer.push(entry)

    // Keep last 200 entries to avoid memory issues
    if (buffer.length > 200) buffer.shift()

    // Avoid logging huge objects by default
    if (data === undefined)
      console.log(`${LOG_PREFIX} #${entry.i} +${entry.atMs}ms ${msg}`)
    else console.log(`${LOG_PREFIX} #${entry.i} +${entry.atMs}ms ${msg}`, data)
  }

  function warn(msg: string, data?: unknown) {
    log(`WARN: ${msg}`, data)
  }

  function error(msg: string, data?: unknown) {
    log(`ERROR: ${msg}`, data)
  }

  function getHistory() {
    return buffer.slice()
  }

  return { log, warn, error, getHistory }
}

function getOrCreateClientRequestId(
  logger: ReturnType<typeof createLogBuffer>
): string {
  const existing = window.localStorage.getItem(REQUEST_ID_KEY)
  if (existing) {
    logger.log("Using existing clientRequestId", existing)
    return existing
  }

  const id = crypto.randomUUID()
  window.localStorage.setItem(REQUEST_ID_KEY, id)
  logger.log("Created new clientRequestId", id)
  return id
}

function clearClientRequestId(logger: ReturnType<typeof createLogBuffer>) {
  const existing = window.localStorage.getItem(REQUEST_ID_KEY)
  logger.log("Clearing clientRequestId", existing)
  window.localStorage.removeItem(REQUEST_ID_KEY)
  logger.log("clientRequestId cleared")
}

export function SalesNoteNewClient({
  initialValues,
  sourceQuotation,
}: {
  initialValues: SalesNoteFormValues
  sourceQuotation?: { id: string; folio: string }
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Logger buffer lives for the lifetime of this component instance
  const loggerRef = useRef<ReturnType<typeof createLogBuffer> | null>(null)
  if (!loggerRef.current) loggerRef.current = createLogBuffer()
  const logger = loggerRef.current

  // Prevent double-submit before React state updates
  const submitLockRef = useRef(false)
  const clientRequestIdRef = useRef<string | null>(null)

  // One-time mount log (NOT in render loop)
  useEffect(() => {
    logger.log("Mounted", {
      hasSourceQuotation: !!sourceQuotation,
      sourceQuotationFolio: sourceQuotation?.folio ?? null,
      initialLines: initialValues?.lines?.length ?? 0,
      initialUnregisteredLines: initialValues?.unregisteredLines?.length ?? 0,
    })
  }, []) // intentionally once

  useEffect(() => {
    logger.log("Init clientRequestId")
    clientRequestIdRef.current = getOrCreateClientRequestId(logger)
    logger.log("clientRequestIdRef set", clientRequestIdRef.current)
  }, [])

  const handleSubmit = async (values: SalesNoteFormValues) => {
    logger.log("handleSubmit called", {
      submitting,
      locked: submitLockRef.current,
      lines: values.lines?.length ?? 0,
      unregisteredLines: values.unregisteredLines?.length ?? 0,
    })

    if (submitLockRef.current) {
      logger.warn("Submit blocked by lock")
      return
    }

    submitLockRef.current = true
    setSubmitting(true)

    try {
      const clientRequestId = clientRequestIdRef.current
      logger.log("Using clientRequestId", clientRequestId)

      if (!clientRequestId) {
        logger.error("clientRequestId is missing")
        toast.error("No se pudo iniciar la creación. Intenta de nuevo.")
        return
      }

      logger.log("Calling createSalesNoteAction")
      const t0 = performance.now()
      const res = await createSalesNoteAction({ clientRequestId, values })
      logger.log("createSalesNoteAction resolved", {
        ms: Math.round(performance.now() - t0),
        ok: res.ok,
        traceId: (res as any).traceId,
        salesNoteId: res.ok ? res.salesNoteId : null,
        hasErrors: res.ok ? false : !!(res as any).errors,
      })

      if (!res.ok) {
        toast.error("Revisa los campos. Hay errores de validación.")
        return
      }

      toast.success("Guardado exitosamente")

      // Clear idempotency key only on success
      clearClientRequestId(logger)

      const targetUrl = routes.salesNotes.details(res.salesNoteId)
      logger.log("Navigating to targetUrl", targetUrl)

      router.replace(targetUrl)
      logger.log("router.replace invoked")

      // Sometimes helpful in App Router after mutations (optional)
      router.refresh()
      logger.log("router.refresh invoked")

      setTimeout(() => {
        logger.log("500ms after navigation attempt", {
          href: window.location.href,
        })
      }, 500)

      setTimeout(() => {
        logger.log("2000ms after navigation attempt", {
          href: window.location.href,
          historyTail: logger.getHistory().slice(-10),
        })
      }, 2000)
    } catch (error) {
      logger.error("Exception in handleSubmit", error)
      toast.error("Error inesperado. Intenta de nuevo.")
    } finally {
      setSubmitting(false)
      submitLockRef.current = false
      logger.log("Submit finished - state reset", {
        submitting: false,
        locked: false,
      })
    }
  }

  return (
    <>
      {sourceQuotation ? (
        <div className="alert alert-info mb-4">
          <div>
            <h4 className="font-semibold">Cotización origen</h4>
            <p className="text-sm opacity-80">
              Prefill desde la cotización {sourceQuotation.folio}.
            </p>
          </div>
        </div>
      ) : null}

      <SalesNoteWizard
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </>
  )
}
