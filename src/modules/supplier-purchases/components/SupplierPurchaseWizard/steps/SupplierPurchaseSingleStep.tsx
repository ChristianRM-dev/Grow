"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";

import type { SupplierPurchaseFormValues } from "@/modules/supplier-purchases/forms/supplierPurchaseForm.schemas";
import {
  searchPartiesAction,
  type PartyLookupDto,
} from "@/modules/parties/actions/searchParties.action";

import { phoneMX } from "@/modules/shared/utils/formatters";

type Props = StepComponentProps<SupplierPurchaseFormValues>;

export function SupplierPurchaseSingleStep({ form }: Props) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const supplier = watch("supplier");
  const supplierId = watch("supplier.partyId");
  const supplierName = watch("supplier.partyName");
  const supplierPhone = watch("supplier.partyPhone");

  // Autocomplete local state
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PartyLookupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const label = String(supplierName ?? "").trim();
    return label || "";
  }, [supplierName]);

  const debounceRef = useRef<number | null>(null);

  // Hydrate term when selection exists and dropdown is not open
  useEffect(() => {
    const label = String(supplierName ?? "").trim();
    if (!supplierId || !label) return;

    if (!open && term.trim() !== label) {
      setTerm(label);
    }
  }, [supplierId, supplierName, open, term]);

  // Autocomplete search (debounced)
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

  return (
    <div className="space-y-6">
      {/* Row 1: Proveedor + Total */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Proveedor (autocomplete) */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Proveedor</span>
          </label>

          <div className="relative">
            <input
              className={`input input-bordered w-full ${
                errors.supplier?.partyId ? "input-error" : ""
              }`}
              placeholder="Escribe al menos 2 letras…"
              value={term}
              onChange={(e) => {
                const next = e.target.value;
                setTerm(next);

                // Editing invalidates any previous selection
                if (supplierId) {
                  setValue("supplier.partyId", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue("supplier.partyName", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue("supplier.partyPhone", "", { shouldDirty: true });
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
                <ul className="menu">
                  {results.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()} // ✅ critical
                        onClick={() => {
                          setValue("supplier.partyId", p.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue("supplier.partyName", p.name, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue("supplier.partyPhone", p.phone ?? "", {
                            shouldDirty: true,
                          });

                          setTerm(p.name);
                          setOpen(false);
                        }}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs opacity-70">
                            {p.phone ? phoneMX(p.phone) : "Sin teléfono"}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {supplierId ? (
            <div className="mt-3">
              <span className="badge badge-success">
                Proveedor seleccionado
              </span>
              {selectedLabel ? (
                <span className="ml-2 text-sm opacity-70">
                  {selectedLabel}
                  {supplierPhone ? ` · ${phoneMX(supplierPhone)}` : ""}
                </span>
              ) : null}
            </div>
          ) : null}

          {errors.supplier?.partyId?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.supplier.partyId.message)}
            </p>
          ) : null}

          {/* Hidden fields to keep RHF values */}
          <input type="hidden" {...register("supplier.partyId")} />
          <input type="hidden" {...register("supplier.partyName")} />
          <input type="hidden" {...register("supplier.partyPhone")} />
        </div>

        {/* Total */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Total</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-70">
              $
            </span>
            <input
              className={`input input-bordered w-full pl-10 ${
                errors.total ? "input-error" : ""
              }`}
              placeholder="0.00"
              inputMode="decimal"
              {...register("total")}
            />
          </div>
          {errors.total?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.total.message)}
            </p>
          ) : null}
        </div>
      </div>

      {/* Row 2: Folio + Fecha */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Folio */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Folio del proveedor</span>
          </label>
          <input
            className={`input input-bordered w-full ${
              errors.supplierFolio ? "input-error" : ""
            }`}
            placeholder="Ej: FAC-1234"
            {...register("supplierFolio")}
          />
          {errors.supplierFolio?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.supplierFolio.message)}
            </p>
          ) : null}
        </div>

        {/* Fecha */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Fecha</span>
          </label>
          <input
            type="date"
            className={`input input-bordered w-full ${
              errors.occurredAt ? "input-error" : ""
            }`}
            {...register("occurredAt")}
          />
          {errors.occurredAt?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.occurredAt.message)}
            </p>
          ) : null}
        </div>
      </div>

      {/* Notes (full width) */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Notas (opcional)</span>
        </label>
        <textarea
          className={`textarea textarea-bordered w-full ${
            errors.notes ? "textarea-error" : ""
          }`}
          placeholder="Información adicional"
          rows={4}
          {...register("notes")}
        />
        {errors.notes?.message ? (
          <p className="mt-2 text-sm text-error">
            {String(errors.notes.message)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
