"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import {
  searchPartiesAction,
  type PartyLookupDto,
} from "@/modules/parties/actions/searchParties.action";

type Props = StepComponentProps<SalesNoteFormValues>;

export function SalesNoteCustomerStep({ form }: Props) {
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

  // Autocomplete local state
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PartyLookupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const customerErrors = errors.customer;

  const selectedLabel = useMemo(() => {
    // IMPORTANT: do not depend on `results` for selection display
    const label = String(existingPartyName ?? "").trim();
    return label || "";
  }, [existingPartyName]);

  const debounceRef = useRef<number | null>(null);

  // Clean state when switching modes
  useEffect(() => {
    if (mode === "PUBLIC") {
      setValue("customer.partyMode", undefined);
      setValue("customer.existingPartyId", "");
      setValue("customer.existingPartyName", "");
      setValue("customer.newParty.name", "");
      setValue("customer.newParty.phone", "");
      setValue("customer.newParty.notes", "");
      setTerm("");
      setResults([]);
      setOpen(false);
      return;
    }

    // mode === "PARTY"
    if (!partyMode) {
      setValue("customer.partyMode", "EXISTING");
    }
  }, [mode, partyMode, setValue]);

  // Clean state when switching partyMode
  useEffect(() => {
    if (mode !== "PARTY") return;
    if (!partyMode) return;

    if (partyMode === "EXISTING") {
      setValue("customer.newParty.name", "");
      setValue("customer.newParty.phone", "");
      setValue("customer.newParty.notes", "");

      // If we already have a selected party (edit scenario), show it in the input
      const label = String(existingPartyName ?? "").trim();
      if (existingPartyId && label && term.trim().length === 0) {
        setTerm(label);
      }
      return;
    }

    // partyMode === "NEW"
    setValue("customer.existingPartyId", "");
    setValue("customer.existingPartyName", "");
    setTerm("");
    setResults([]);
    setOpen(false);
  }, [mode, partyMode, setValue, existingPartyId, existingPartyName, term]);

  // Hydrate term from existingPartyName when selection exists (edit + no typing)
  useEffect(() => {
    if (mode !== "PARTY" || partyMode !== "EXISTING") return;

    const label = String(existingPartyName ?? "").trim();
    if (!existingPartyId || !label) return;

    // If user hasn't typed anything (or term is out-of-sync), sync it.
    // We avoid overriding while dropdown is open (user typing).
    if (!open && term.trim() !== label) {
      setTerm(label);
    }
  }, [existingPartyId, existingPartyName, mode, partyMode, open, term]);

  // Autocomplete search (debounced)
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

            {/* EXISTING */}
            {partyMode === "EXISTING" ? (
              <div className="mt-4">
                <label className="label">
                  <span className="label-text">Buscar cliente</span>
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

                      // Editing invalidates any previous selection.
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
                    aria-label="Buscar cliente"
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
                      Cliente seleccionado
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

            {/* NEW */}
            {partyMode === "NEW" ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Nombre</span>
                  </label>
                  <input
                    className={`input input-bordered ${
                      customerErrors?.newParty?.name ? "input-error" : ""
                    }`}
                    placeholder="Nombre del cliente"
                    {...register("customer.newParty.name")}
                  />
                  {customerErrors?.newParty?.name?.message ? (
                    <p className="mt-1 text-sm text-error">
                      {String(customerErrors.newParty.name.message)}
                    </p>
                  ) : null}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Teléfono (opcional)</span>
                  </label>
                  <input
                    className={`input input-bordered ${
                      customerErrors?.newParty?.phone ? "input-error" : ""
                    }`}
                    placeholder="Ej: 555-123-4567"
                    {...register("customer.newParty.phone")}
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Notas (opcional)</span>
                  </label>
                  <textarea
                    className={`textarea textarea-bordered ${
                      customerErrors?.newParty?.notes ? "textarea-error" : ""
                    }`}
                    placeholder="Información adicional"
                    {...register("customer.newParty.notes")}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
