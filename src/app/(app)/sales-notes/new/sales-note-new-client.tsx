"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { SalesNoteWizard } from "@/modules/sales-notes/components/SalesNoteWizard/SalesNoteWizard"
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas"
import { createSalesNoteAction } from "@/modules/sales-notes/actions/createSalesNote.action"
import { toast } from "@/components/ui/Toast/toast"
import { routes } from "@/lib/routes"

const REQUEST_ID_KEY = "sales-note:new:clientRequestId"
const LOG_PREFIX = "[SalesNoteNew]"

function getOrCreateClientRequestId(): string {
  const existing = window.localStorage.getItem(REQUEST_ID_KEY)
  if (existing) {
    console.log(`${LOG_PREFIX} Using existing clientRequestId:`, existing)
    return existing
  }

  const id = crypto.randomUUID()
  window.localStorage.setItem(REQUEST_ID_KEY, id)
  console.log(`${LOG_PREFIX} Created new clientRequestId:`, id)
  return id
}

function clearClientRequestId() {
  const existing = window.localStorage.getItem(REQUEST_ID_KEY)
  console.log(`${LOG_PREFIX} Clearing clientRequestId:`, existing)
  window.localStorage.removeItem(REQUEST_ID_KEY)
  console.log(`${LOG_PREFIX} clientRequestId cleared successfully`)
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

  // Prevent double-submit before React state updates
  const submitLockRef = useRef(false)
  const clientRequestIdRef = useRef<string | null>(null)

  console.log(`${LOG_PREFIX} Component mounted`, {
    hasSourceQuotation: !!sourceQuotation,
    sourceQuotationFolio: sourceQuotation?.folio,
  })

  useEffect(() => {
    console.log(`${LOG_PREFIX} useEffect: Initializing clientRequestId`)
    clientRequestIdRef.current = getOrCreateClientRequestId()
    console.log(
      `${LOG_PREFIX} clientRequestIdRef.current set to:`,
      clientRequestIdRef.current
    )
  }, [])

  const handleSubmit = async (values: SalesNoteFormValues) => {
    console.log(`${LOG_PREFIX} handleSubmit called`)
    console.log(`${LOG_PREFIX} submitLockRef.current:`, submitLockRef.current)

    if (submitLockRef.current) {
      console.warn(`${LOG_PREFIX} Submit blocked by lock`)
      return
    }

    submitLockRef.current = true
    console.log(`${LOG_PREFIX} Submit lock acquired`)

    setSubmitting(true)
    console.log(`${LOG_PREFIX} submitting state set to true`)

    try {
      const clientRequestId = clientRequestIdRef.current
      console.log(`${LOG_PREFIX} Using clientRequestId:`, clientRequestId)

      if (!clientRequestId) {
        console.error(`${LOG_PREFIX} ERROR: clientRequestId is null/undefined`)
        toast.error("No se pudo iniciar la creación. Intenta de nuevo.")
        return
      }

      console.log(`${LOG_PREFIX} Calling createSalesNoteAction...`)
      const res = await createSalesNoteAction({
        clientRequestId,
        values,
      })

      console.log(`${LOG_PREFIX} Action response:`, {
        ok: res.ok,
        salesNoteId: res.ok ? res.salesNoteId : undefined,
        errors: res.ok ? undefined : res.errors,
      })

      if (!res.ok) {
        console.error(`${LOG_PREFIX} Action failed with errors:`, res.errors)
        toast.error("Revisa los campos. Hay errores de validación.")
        return
      }

      console.log(
        `${LOG_PREFIX} Action succeeded. SalesNoteId:`,
        res.salesNoteId
      )
      toast.success("Guardado exitosamente")

      // ✅ Aquí se borra la requestId: solo en éxito
      console.log(`${LOG_PREFIX} About to clear clientRequestId...`)
      clearClientRequestId()

      const targetUrl = routes.salesNotes.details(res.salesNoteId)
      console.log(`${LOG_PREFIX} Navigating to:`, targetUrl)

      router.replace(targetUrl)
      console.log(`${LOG_PREFIX} router.replace called`)

      // Log adicional para verificar si el replace realmente ejecuta
      setTimeout(() => {
        console.log(
          `${LOG_PREFIX} 500ms after router.replace - current location:`,
          window.location.href
        )
      }, 500)
    } catch (error) {
      console.error(`${LOG_PREFIX} EXCEPTION in handleSubmit:`, error)
      toast.error("Error inesperado. Intenta de nuevo.")
    } finally {
      console.log(`${LOG_PREFIX} finally block - resetting states`)
      setSubmitting(false)
      submitLockRef.current = false
      console.log(`${LOG_PREFIX} submitting=false, lock released`)
    }
  }

  console.log(`${LOG_PREFIX} Render - submitting:`, submitting)

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
