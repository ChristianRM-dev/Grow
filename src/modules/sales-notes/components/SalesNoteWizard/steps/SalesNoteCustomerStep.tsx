"use client";

import React, { useEffect, useState } from "react"
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNoteFormInput } from "@/modules/sales-notes/forms/salesNoteForm.schemas"
import { PartyAutocomplete } from "@/modules/reports/components/PartyAutocomplete"

type Props = StepComponentProps<SalesNoteFormInput>;

export function SalesNoteCustomerStep({ form }: Props) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form

  const mode = watch("customer.mode")
  const partyMode = watch("customer.partyMode")
  const existingPartyId = watch("customer.existingPartyId")
  const existingPartyName = watch("customer.existingPartyName")

  // Local state for autocomplete input sync
  const [term, setTerm] = useState("")
  const [open, setOpen] = useState(false)

  const customerErrors = errors.customer

  // Clean state when switching modes
  useEffect(() => {
    if (mode === "PUBLIC") {
      setValue("customer.partyMode", undefined)
      setValue("customer.existingPartyId", "")
      setValue("customer.existingPartyName", "")
      setValue("customer.newParty.name", "")
      setValue("customer.newParty.phone", "")
      setValue("customer.newParty.notes", "")
      setTerm("")
      setOpen(false)
      return
    }

    // mode === "PARTY"
    if (!partyMode) {
      setValue("customer.partyMode", "EXISTING")
    }
  }, [mode, partyMode, setValue])

  // Clean state when switching partyMode
  useEffect(() => {
    if (mode !== "PARTY") return
    if (!partyMode) return

    if (partyMode === "EXISTING") {
      setValue("customer.newParty.name", "")
      setValue("customer.newParty.phone", "")
      setValue("customer.newParty.notes", "")

      // If we already have a selected party (edit scenario), show it in the input
      const label = String(existingPartyName ?? "").trim()
      if (existingPartyId && label && term.trim().length === 0) {
        setTerm(label)
      }
      return
    }

    // partyMode === "NEW"
    setValue("customer.existingPartyId", "")
    setValue("customer.existingPartyName", "")
    setTerm("")
    setOpen(false)
  }, [mode, partyMode, setValue, existingPartyId, existingPartyName, term])

  // Hydrate term from existingPartyName when selection exists (edit + no typing)
  useEffect(() => {
    if (mode !== "PARTY" || partyMode !== "EXISTING") return

    const label = String(existingPartyName ?? "").trim()
    if (!existingPartyId || !label) return

    // If user hasn't typed anything (or term is out-of-sync), sync it.
    // We avoid overriding while dropdown is open (user typing).
    if (!open && term.trim() !== label) {
      setTerm(label)
    }
  }, [existingPartyId, existingPartyName, mode, partyMode, open, term])

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Mode: PUBLIC vs PARTY */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">Cliente</h3>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="radio"
                className="radio radio-primary"
                value="PUBLIC"
                {...register("customer.mode")}
              />
              <span className="label-text">Venta al público</span>
            </label>

            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="radio"
                className="radio radio-primary"
                value="PARTY"
                {...register("customer.mode")}
              />
              <span className="label-text">Con cliente</span>
            </label>
          </div>
        </div>
      </div>

      {/* PARTY block */}
      {mode === "PARTY" ? (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="font-semibold">Tipo de cliente</h3>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  className="radio radio-primary"
                  value="EXISTING"
                  {...register("customer.partyMode")}
                />
                <span className="label-text">Elegir cliente registrado</span>
              </label>

              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  className="radio radio-primary"
                  value="NEW"
                  {...register("customer.partyMode")}
                />
                <span className="label-text">Registrar nuevo cliente</span>
              </label>
            </div>

            {customerErrors?.partyMode?.message ? (
              <p className="mt-2 text-sm text-error">
                {String(customerErrors.partyMode.message)}
              </p>
            ) : null}

            {/* EXISTING - Using PartyAutocomplete Component */}
            {partyMode === "EXISTING" ? (
              <div className="mt-4">
                <PartyAutocomplete
                  label="Buscar cliente"
                  placeholder="Escribe al menos 2 letras…"
                  selectedId={existingPartyId || ""}
                  selectedName={existingPartyName || ""}
                  onSelect={(id, name) => {
                    setValue("customer.existingPartyId", id, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    setValue("customer.existingPartyName", name, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  onClear={() => {
                    setValue("customer.existingPartyId", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    setValue("customer.existingPartyName", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  value={term}
                  onChange={setTerm}
                />

                {customerErrors?.existingPartyId?.message ? (
                  <p className="mt-2 text-sm text-error">
                    {String(customerErrors.existingPartyId.message)}
                  </p>
                ) : null}

                {/* Hidden inputs for react-hook-form */}
                <input
                  type="hidden"
                  {...register("customer.existingPartyId")}
                />
                <input
                  type="hidden"
                  {...register("customer.existingPartyName")}
                />
              </div>
            ) : null}

            {/* NEW */}
            {partyMode === "NEW" ? (
              <div className="mt-4 space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Nombre</span>
                    </label>
                    <input
                      className={`input input-bordered w-full ${
                        customerErrors?.newParty?.name ? "input-error" : ""
                      }`}
                      placeholder="Ej: Vivero Los Laureles"
                      {...register("customer.newParty.name")}
                    />
                    {customerErrors?.newParty?.name?.message ? (
                      <p className="mt-2 text-sm text-error">
                        {String(customerErrors.newParty.name.message)}
                      </p>
                    ) : null}
                  </div>

                  {/* Phone */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Teléfono (opcional)
                      </span>
                    </label>
                    <input
                      className={`input input-bordered w-full ${
                        customerErrors?.newParty?.phone ? "input-error" : ""
                      }`}
                      placeholder="Ej: 8112345678"
                      inputMode="tel"
                      {...register("customer.newParty.phone")}
                    />
                    {customerErrors?.newParty?.phone?.message ? (
                      <p className="mt-2 text-sm text-error">
                        {String(customerErrors.newParty.phone.message)}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Notes */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Notas (opcional)
                    </span>
                  </label>
                  <textarea
                    className={`textarea textarea-bordered w-full ${
                      customerErrors?.newParty?.notes ? "textarea-error" : ""
                    }`}
                    placeholder="Información adicional"
                    rows={4}
                    {...register("customer.newParty.notes")}
                  />
                  {customerErrors?.newParty?.notes?.message ? (
                    <p className="mt-2 text-sm text-error">
                      {String(customerErrors.newParty.notes.message)}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
