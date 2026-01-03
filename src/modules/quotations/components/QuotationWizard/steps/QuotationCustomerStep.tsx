"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  searchPartiesAction,
  type PartyLookupDto,
} from "@/modules/parties/actions/searchParties.action";

type Props = StepComponentProps<QuotationFormValues>;

export function QuotationCustomerStep({ form }: Props) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const mode = watch("customer.mode");
  const partyMode = watch("customer.partyMode");
  const existingPartyId = watch("customer.existingPartyId");
  const existingPartyName = watch("customer.existingPartyName");

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PartyLookupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debounceRef = useRef<number | null>(null);

  const selectedLabel = useMemo(() => {
    const label = String(existingPartyName ?? "").trim();
    return label || "";
  }, [existingPartyName]);

  useEffect(() => {
    const label = String(existingPartyName ?? "").trim();
    if (existingPartyId && label && term.trim().length === 0) {
      setTerm(label);
    }
  }, [existingPartyId, existingPartyName, term]);

  useEffect(() => {
    if (mode !== "PARTY" || partyMode !== "EXISTING") return;

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
  }, [mode, partyMode, term]);

  const customerErrors = errors.customer;

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

            {partyMode === "EXISTING" ? (
              <div className="mt-4">
                <label className="label">
                  <span className="label-text">Buscar contacto</span>
                </label>

                <div className="relative">
                  <input
                    className={`input input-bordered w-full ${
                      customerErrors?.existingPartyId ? "input-error" : ""
                    }`}
                    placeholder="Escribe al menos 2 letras…"
                    value={term}
                    onChange={(e) => {
                      const next = e.target.value;
                      setTerm(next);

                      if (existingPartyId) {
                        setValue("customer.existingPartyId", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setValue("customer.existingPartyName", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => window.setTimeout(() => setOpen(false), 150)}
                    aria-label="Buscar contacto"
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
                                setValue("customer.existingPartyId", p.id, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                setValue("customer.existingPartyName", p.name, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });

                                setTerm(p.name);
                                setOpen(false);
                              }}
                            >
                              <div className="flex flex-col items-start min-w-0">
                                <span className="font-medium truncate">
                                  {p.name}
                                </span>
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

                {existingPartyId ? (
                  <div className="mt-3">
                    <span className="badge badge-success">
                      Contacto seleccionado
                    </span>
                    {selectedLabel ? (
                      <span className="ml-2 text-sm opacity-70">
                        {selectedLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {customerErrors?.existingPartyId?.message ? (
                  <p className="mt-2 text-sm text-error">
                    {String(customerErrors.existingPartyId.message)}
                  </p>
                ) : null}

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
  );
}
