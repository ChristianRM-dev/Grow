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

  const selectedPartyId = watch("customer.partyId");
  const selectedPartyName = watch("customer.partyName");

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PartyLookupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debounceRef = useRef<number | null>(null);

  const selectedLabel = useMemo(() => {
    const label = String(selectedPartyName ?? "").trim();
    return label || "";
  }, [selectedPartyName]);

  useEffect(() => {
    const label = String(selectedPartyName ?? "").trim();
    if (selectedPartyId && label && term.trim().length === 0) {
      setTerm(label);
    }
  }, [selectedPartyId, selectedPartyName, term]);

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

  const customerErrors = errors.customer;

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="font-semibold">Contacto</h3>
        <p className="text-sm opacity-70">
          Selecciona el contacto para la cotización.
        </p>

        <div className="mt-4">
          <label className="label">
            <span className="label-text">Buscar contacto</span>
          </label>

          <div className="relative">
            <input
              className={`input input-bordered w-full ${
                customerErrors?.partyId ? "input-error" : ""
              }`}
              placeholder="Escribe al menos 2 letras…"
              value={term}
              onChange={(e) => {
                const next = e.target.value;
                setTerm(next);

                if (selectedPartyId) {
                  setValue("customer.partyId", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue("customer.partyName", "", {
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
                          setValue("customer.partyId", p.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue("customer.partyName", p.name, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });

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

          {selectedPartyId ? (
            <div className="mt-3">
              <span className="badge badge-success">Contacto seleccionado</span>
              {selectedLabel ? (
                <span className="ml-2 text-sm opacity-70">{selectedLabel}</span>
              ) : null}
            </div>
          ) : null}

          {customerErrors?.partyId?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(customerErrors.partyId.message)}
            </p>
          ) : null}

          <input type="hidden" {...register("customer.partyId")} />
          <input type="hidden" {...register("customer.partyName")} />
        </div>
      </div>
    </div>
  );
}
