"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";

import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import {
  searchProductVariantsAction,
  type ProductVariantLookupDto,
} from "@/modules/products/actions/searchProductVariants.action";

type Props = StepComponentProps<SalesNoteFormValues>;

function moneyTotal(qty: number, price: string) {
  const p = Number(price);
  if (!Number.isFinite(p) || p <= 0) return "—";
  const t = qty * p;
  return `$${t.toFixed(2)}`;
}

function isPriceLike(v: string) {
  const s = v.trim();
  return /^\d+(\.\d{1,2})?$/.test(s) && Number(s) > 0;
}

export function SalesNoteLinesStep({ form }: Props) {
  const {
    control,
    register,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  // Ensure at least one row exists (UX-friendly)
  useEffect(() => {
    const current = getValues("lines");
    if (!current || current.length === 0) {
      append({
        productVariantId: "",
        productName: "",
        quantity: 1,
        unitPrice: "",
        description: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lines = watch("lines") ?? [];

  // Build excludeIds list to avoid selecting duplicates
  const selectedIds = useMemo(() => {
    return lines
      .map((l) => l?.productVariantId?.trim())
      .filter((x): x is string => Boolean(x));
  }, [lines]);

  // Per-row autocomplete UI state
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [loadingRow, setLoadingRow] = useState<Record<string, boolean>>({});
  const [resultsRow, setResultsRow] = useState<
    Record<string, ProductVariantLookupDto[]>
  >({});
  const [termRow, setTermRow] = useState<Record<string, string>>({});
  const debounceRef = useRef<Record<string, number | null>>({});

  const linesErrors: any = errors.lines;

  const isRowComplete = (idx: number) => {
    const row = lines[idx];
    if (!row) return false;
    if (!row.productVariantId?.trim()) return false;
    if (!row.productName?.trim()) return false;
    if (!Number.isFinite(row.quantity) || row.quantity < 1) return false;
    if (!isPriceLike(String(row.unitPrice ?? ""))) return false;
    return true;
  };

  const canAddRow = useMemo(() => {
    if (!lines || lines.length === 0) return true;
    return lines.every((_, idx) => isRowComplete(idx));
  }, [lines]);

  const handleSearch = (rowKey: string, term: string, excludeIds: string[]) => {
    // debounce per row key
    const existing = debounceRef.current[rowKey];
    if (existing) window.clearTimeout(existing);

    debounceRef.current[rowKey] = window.setTimeout(async () => {
      const q = term.trim();
      if (q.length < 2) {
        setResultsRow((p) => ({ ...p, [rowKey]: [] }));
        return;
      }

      setLoadingRow((p) => ({ ...p, [rowKey]: true }));
      try {
        const rows = await searchProductVariantsAction({
          term: q,
          excludeIds,
          take: 10,
        });
        setResultsRow((p) => ({ ...p, [rowKey]: rows }));
      } finally {
        setLoadingRow((p) => ({ ...p, [rowKey]: false }));
      }
    }, 300);
  };

  const selectProduct = (
    index: number,
    rowKey: string,
    p: ProductVariantLookupDto
  ) => {
    // Selecting a product sets defaults (price, qty, description)
    setValue(`lines.${index}.productVariantId`, p.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`lines.${index}.productName`, p.label, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`lines.${index}.unitPrice`, p.defaultPrice, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`lines.${index}.quantity`, 1, {
      shouldDirty: true,
      shouldValidate: true,
    });

    // Model doesn't have description; we use suggestion from bagSize/color
    if (p.descriptionSuggestion) {
      setValue(`lines.${index}.description`, p.descriptionSuggestion, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    setTermRow((prev) => ({ ...prev, [rowKey]: p.label }));
    setOpenRow(null);
  };

  const clearSelectionIfTyped = (index: number) => {
    const currentId = lines[index]?.productVariantId?.trim();
    if (currentId) {
      setValue(`lines.${index}.productVariantId`, "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`lines.${index}.productName`, "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="w-full">
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">Productos</h3>
          <p className="text-sm opacity-70">
            Agrega productos y ajusta cantidades y precios.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="w-28">Cantidad</th>
                  <th className="w-32">Precio</th>
                  <th>Descripción (opcional)</th>
                  <th className="w-28 text-right">Total</th>
                  <th className="w-24">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {fields.map((f, index) => {
                  const rowKey = f.id;
                  const row = lines[index];
                  const term = termRow[rowKey] ?? row?.productName ?? "";

                  const rowErr = linesErrors?.[index];

                  const excludeIdsForRow = selectedIds.filter(
                    (id) => id !== row?.productVariantId
                  );

                  return (
                    <tr key={rowKey}>
                      {/* Product autocomplete */}
                      <td className="min-w-[320px]">
                        <div className="relative">
                          <input
                            className={`input input-bordered w-full ${
                              rowErr?.productVariantId ? "input-error" : ""
                            }`}
                            placeholder="Buscar producto (2+ letras)…"
                            value={term}
                            onChange={(e) => {
                              const next = e.target.value;
                              setTermRow((p) => ({ ...p, [rowKey]: next }));
                              clearSelectionIfTyped(index);
                              handleSearch(rowKey, next, excludeIdsForRow);
                            }}
                            onFocus={() => {
                              setOpenRow(rowKey);
                              handleSearch(rowKey, term, excludeIdsForRow);
                            }}
                            onBlur={() =>
                              window.setTimeout(() => setOpenRow(null), 150)
                            }
                            aria-label="Buscar producto"
                          />

                          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70">
                            {loadingRow[rowKey] ? (
                              <span className="loading loading-spinner loading-sm" />
                            ) : (
                              <span>⌄</span>
                            )}
                          </div>

                          {/* dropdown */}
                          {openRow === rowKey &&
                          (resultsRow[rowKey]?.length ?? 0) > 0 ? (
                            <div className="absolute z-50 mt-2 w-full rounded-box border border-base-300 bg-base-100 shadow">
                              <ul className="menu">
                                {(resultsRow[rowKey] ?? []).map((p) => (
                                  <li key={p.id}>
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() =>
                                        selectProduct(index, rowKey, p)
                                      }
                                    >
                                      <div className="flex w-full items-center justify-between gap-3">
                                        <span className="font-medium">
                                          {p.label}
                                        </span>
                                        <span className="text-xs opacity-70">
                                          ${p.defaultPrice}
                                        </span>
                                      </div>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>

                        {/* hidden fields */}
                        <input
                          type="hidden"
                          {...register(
                            `lines.${index}.productVariantId` as const
                          )}
                        />
                        <input
                          type="hidden"
                          {...register(`lines.${index}.productName` as const)}
                        />

                        {rowErr?.productVariantId?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr.productVariantId.message)}
                          </p>
                        ) : null}
                      </td>

                      {/* Quantity */}
                      <td>
                        <input
                          type="number"
                          min={1}
                          className={`input input-bordered w-24 ${
                            rowErr?.quantity ? "input-error" : ""
                          }`}
                          {...register(`lines.${index}.quantity` as const, {
                            valueAsNumber: true,
                          })}
                        />
                        {rowErr?.quantity?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr.quantity.message)}
                          </p>
                        ) : null}
                      </td>

                      {/* Unit price */}
                      <td>
                        <input
                          className={`input input-bordered w-28 ${
                            rowErr?.unitPrice ? "input-error" : ""
                          }`}
                          placeholder="12.50"
                          inputMode="decimal"
                          {...register(`lines.${index}.unitPrice` as const)}
                        />
                        {rowErr?.unitPrice?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr.unitPrice.message)}
                          </p>
                        ) : null}
                      </td>

                      {/* Description */}
                      <td className="min-w-[240px]">
                        <input
                          className={`input input-bordered w-full ${
                            rowErr?.description ? "input-error" : ""
                          }`}
                          placeholder="Opcional"
                          {...register(`lines.${index}.description` as const)}
                        />
                        {rowErr?.description?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr.description.message)}
                          </p>
                        ) : null}
                      </td>

                      {/* Total */}
                      <td className="text-right font-medium">
                        {moneyTotal(
                          Number(row?.quantity ?? 0),
                          String(row?.unitPrice ?? "")
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            if (fields.length <= 1) {
                              // keep at least one row; just clear it
                              setValue(`lines.0.productVariantId`, "");
                              setValue(`lines.0.productName`, "");
                              setValue(`lines.0.quantity`, 1);
                              setValue(`lines.0.unitPrice`, "");
                              setValue(`lines.0.description`, "");
                              setTermRow((p) => ({ ...p, [rowKey]: "" }));
                              return;
                            }
                            remove(index);
                          }}
                          aria-label="Eliminar"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Array-level error (min 1) */}
            {typeof linesErrors?.message === "string" ? (
              <p className="mt-3 text-sm text-error">{linesErrors.message}</p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="btn btn-outline"
              disabled={!canAddRow}
              onClick={() => {
                append({
                  productVariantId: "",
                  productName: "",
                  quantity: 1,
                  unitPrice: "",
                  description: "",
                });
              }}
            >
              Agregar producto
            </button>
          </div>

          {!canAddRow ? (
            <p className="mt-2 text-sm opacity-70">
              Completa todos los productos antes de agregar uno nuevo.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
