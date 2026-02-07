"use client";

import React, { useEffect, useState } from "react"
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { QuotationFormInput } from "@/modules/quotations/forms/quotationForm.schemas"
import { PartyAutocomplete } from "@/modules/reports/components/PartyAutocomplete"

type Props = StepComponentProps<QuotationFormInput>;

export function QuotationCustomerStep({ form }: Props) {
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

  // Hydrate term from existingPartyName when selection exists (edit scenario)
  useEffect(() => {
    const label = String(existingPartyName ?? "").trim()
    if (existingPartyId && label && term.trim().length === 0) {
      setTerm(label)
    }
  }, [existingPartyId, existingPartyName, term])

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="font-semibold">Contacto</h3>
        <p className="text-sm opacity-70">
          Selecciona el contacto para la cotización.
        </p>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
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
            <span className="label-text">Con contacto</span>
          </label>
        </div>

        {mode === "PARTY" ? (
          <div className="mt-4">
            <h4 className="font-semibold">Tipo de contacto</h4>
            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  className="radio radio-primary"
                  value="EXISTING"
                  {...register("customer.partyMode")}
                />
                <span className="label-text">Elegir contacto registrado</span>
              </label>

              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="radio"
                  className="radio radio-primary"
                  value="NEW"
                  {...register("customer.partyMode")}
                />
                <span className="label-text">Registrar nuevo contacto</span>
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
                  label="Buscar contacto"
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
                      placeholder="Ej: Florería San José"
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
        ) : null}
      </div>
    </div>
  )
}
