"use client";

/**
 * ProductLinesStep - Shared registered product lines step for document wizards.
 *
 * Used by both Sales Notes and Quotations flows. Handles:
 * - Product autocomplete search via searchProductVariantsAction
 * - Row management (add/remove) with useFieldArray
 * - Per-row price, quantity, and description editing
 * - Totals computation
 *
 * Configurable via `ProductLinesStepConfig` to handle different price field
 * names (unitPrice vs quotedUnitPrice) and column labels.
 */

import React, { useRef, useState } from "react";
import { useFieldArray, type FieldValues, type UseFormReturn } from "react-hook-form";
import {
  searchProductVariantsAction,
  type ProductVariantLookupDto,
} from "@/modules/products/actions/searchProductVariants.action";
import { moneyMX } from "@/modules/shared/utils/formatters";
import { parseMoney, isPriceLike } from "@/modules/shared/utils/money";

/**
 * Configuration for customizing ProductLinesStep per document type.
 */
export type ProductLinesStepConfig = {
  /** The field key for the price within each line (e.g., "unitPrice" or "quotedUnitPrice") */
  priceFieldKey: string;
  /** The column header label for the price column (e.g., "Precio" or "Precio cotizado") */
  priceColumnLabel: string;
  /** Description text below the heading */
  description: string;
  /** Default empty row for appending */
  emptyRow: Record<string, any>;
};

export const SALES_NOTE_LINES_CONFIG: ProductLinesStepConfig = {
  priceFieldKey: "unitPrice",
  priceColumnLabel: "Precio",
  description:
    "Agrega productos del catálogo y ajusta cantidades y precios. Este paso es opcional.",
  emptyRow: {
    productVariantId: "",
    productName: "",
    quantity: 1,
    unitPrice: "",
    description: "",
  },
};

export const QUOTATION_LINES_CONFIG: ProductLinesStepConfig = {
  priceFieldKey: "quotedUnitPrice",
  priceColumnLabel: "Precio cotizado",
  description:
    "Agrega productos del catálogo y ajusta cantidades y precios cotizados. Este paso es opcional.",
  emptyRow: {
    productVariantId: "",
    productName: "",
    quantity: 1,
    quotedUnitPrice: "",
    description: "",
  },
};

type ProductLinesStepProps<TForm extends FieldValues> = {
  form: UseFormReturn<TForm>;
  config: ProductLinesStepConfig;
};

export function ProductLinesStep<TForm extends FieldValues>({
  form,
  config,
}: ProductLinesStepProps<TForm>) {
  const {
    control,
    register,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines" as any,
  });

  const lines = (watch("lines" as any) ?? []) as any[];

  const selectedIds = (lines ?? [])
    .map((l: any) => l?.productVariantId?.trim())
    .filter((x: any): x is string => Boolean(x));

  // Per-row autocomplete UI state
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [loadingRow, setLoadingRow] = useState<Record<string, boolean>>({});
  const [resultsRow, setResultsRow] = useState<
    Record<string, ProductVariantLookupDto[]>
  >({});
  const [termRow, setTermRow] = useState<Record<string, string>>({});
  const debounceRef = useRef<Record<string, number | null>>({});

  const linesErrors = (errors as any).lines;

  const isRowComplete = (idx: number) => {
    const row = (getValues as any)(`lines.${idx}`);
    if (!row) return false;
    if (!row.productVariantId?.trim()) return false;
    if (!row.productName?.trim()) return false;
    const qty = Number(row.quantity);
    if (!Number.isFinite(qty) || qty < 1) return false;
    if (!isPriceLike(String(row[config.priceFieldKey] ?? ""))) return false;
    return true;
  };

  const canAddRow =
    fields.length === 0 ? true : fields.every((_, idx) => isRowComplete(idx));

  const computedTotals = (() => {
    let subtotal = 0;
    for (const r of lines) {
      const qty = Number(r?.quantity ?? 0);
      const price = parseMoney(String(r?.[config.priceFieldKey] ?? ""));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      subtotal += qty * price;
    }
    return {
      subtotal,
      itemsCount: lines.length,
    };
  })();

  const handleSearch = (rowKey: string, term: string, excludeIds: string[]) => {
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

  const setField = (path: string, value: any, options?: any) => {
    setValue(path as any, value, options);
  };

  const selectProduct = async (
    index: number,
    rowKey: string,
    p: ProductVariantLookupDto,
  ) => {
    const opts = { shouldDirty: true, shouldValidate: true };
    setField(`lines.${index}.productVariantId`, p.id, opts);
    setField(`lines.${index}.productName`, p.label, opts);
    setField(`lines.${index}.${config.priceFieldKey}`, p.defaultPrice, opts);
    setField(`lines.${index}.quantity`, 1, opts);
    if (p.descriptionSuggestion) {
      setField(`lines.${index}.description`, p.descriptionSuggestion, opts);
    }

    setTermRow((prev) => ({ ...prev, [rowKey]: p.label }));
    setOpenRow(null);

    await trigger([
      `lines.${index}.productVariantId`,
      `lines.${index}.productName`,
      `lines.${index}.quantity`,
      `lines.${index}.${config.priceFieldKey}`,
      `lines.${index}.description`,
    ] as any);
  };

  const clearSelectionIfTyped = (index: number) => {
    const currentId = (
      (getValues as any)(`lines.${index}.productVariantId`) ?? ""
    ).trim();
    if (currentId) {
      const opts = { shouldDirty: true, shouldValidate: true };
      setField(`lines.${index}.productVariantId`, "", opts);
      setField(`lines.${index}.productName`, "", opts);
    }
  };

  return (
    <div className="w-full">
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">Productos Registrados</h3>
          <p className="text-sm opacity-70">{config.description}</p>

          <div className="mt-4 -mx-4 md:mx-0 overflow-x-auto md:overflow-x-visible">
            <div className="min-w-[860px] md:min-w-0 px-4 md:px-0">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="w-28">Cantidad</th>
                    <th className="w-32">{config.priceColumnLabel}</th>
                    <th>Descripción (opcional)</th>
                    <th className="w-28 text-right">Total</th>
                    <th className="w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 opacity-70">
                          <span>No hay productos agregados</span>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              append(config.emptyRow as any);
                            }}
                          >
                            Agregar primer producto
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    fields.map((f, index) => {
                      const rowKey = f.id;
                      const row = lines[index];
                      const term = termRow[rowKey] ?? row?.productName ?? "";
                      const rowErr = linesErrors?.[index];
                      const excludeIdsForRow = selectedIds.filter(
                        (id) => id !== row?.productVariantId,
                      );

                      const qty = Number(row?.quantity ?? 0);
                      const price = parseMoney(
                        String(row?.[config.priceFieldKey] ?? ""),
                      );
                      const rowTotal =
                        Number.isFinite(qty) &&
                        qty > 0 &&
                        Number.isFinite(price) &&
                        price > 0
                          ? qty * price
                          : NaN;

                      return (
                        <tr key={rowKey}>
                          {/* Product autocomplete */}
                          <td className="w-[380px] max-w-[380px]">
                            <div className="relative">
                              <input
                                className={`input input-bordered w-full ${
                                  rowErr?.productVariantId ? "input-error" : ""
                                }`}
                                placeholder="Buscar producto (2+ letras)…"
                                value={term}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  setTermRow((p) => ({
                                    ...p,
                                    [rowKey]: next,
                                  }));
                                  clearSelectionIfTyped(index);
                                  handleSearch(
                                    rowKey,
                                    next,
                                    excludeIdsForRow,
                                  );
                                }}
                                onFocus={() => {
                                  setOpenRow(rowKey);
                                  handleSearch(
                                    rowKey,
                                    term,
                                    excludeIdsForRow,
                                  );
                                }}
                                onBlur={() =>
                                  window.setTimeout(
                                    () => setOpenRow(null),
                                    150,
                                  )
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

                              {/* Dropdown */}
                              {openRow === rowKey &&
                              (resultsRow[rowKey]?.length ?? 0) > 0 ? (
                                <div className="absolute z-50 mt-2 w-full rounded-box border border-base-300 bg-base-100 shadow">
                                  <ul className="menu menu-sm w-full">
                                    {(resultsRow[rowKey] ?? []).map((p) => (
                                      <li key={p.id} className="w-full">
                                        <button
                                          type="button"
                                          className="w-full justify-start text-left"
                                          onMouseDown={(e) =>
                                            e.preventDefault()
                                          }
                                          onClick={() =>
                                            selectProduct(index, rowKey, p)
                                          }
                                        >
                                          <div className="flex w-full items-center justify-between gap-3 min-w-0">
                                            <span className="font-medium truncate">
                                              {p.label}
                                            </span>
                                            <span className="text-xs opacity-70 whitespace-nowrap">
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

                            {/* Hidden fields */}
                            <input
                              type="hidden"
                              {...register(
                                `lines.${index}.productVariantId` as any,
                              )}
                            />
                            <input
                              type="hidden"
                              {...register(
                                `lines.${index}.productName` as any,
                              )}
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
                              {...register(
                                `lines.${index}.quantity` as any,
                                { valueAsNumber: true },
                              )}
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
                                rowErr?.[config.priceFieldKey] ? "input-error" : ""
                              }`}
                              placeholder="12.50"
                              inputMode="decimal"
                              {...register(
                                `lines.${index}.${config.priceFieldKey}` as any,
                              )}
                            />
                            {rowErr?.[config.priceFieldKey]?.message ? (
                              <p className="mt-1 text-sm text-error">
                                {String(
                                  rowErr[config.priceFieldKey].message,
                                )}
                              </p>
                            ) : null}
                          </td>

                          {/* Description */}
                          <td className="w-[320px] max-w-[320px]">
                            <input
                              className={`input input-bordered w-full ${
                                rowErr?.description ? "input-error" : ""
                              }`}
                              placeholder="Opcional"
                              {...register(
                                `lines.${index}.description` as any,
                              )}
                            />
                            {rowErr?.description?.message ? (
                              <p className="mt-1 text-sm text-error">
                                {String(rowErr.description.message)}
                              </p>
                            ) : null}
                          </td>

                          {/* Total */}
                          <td className="text-right font-medium">
                            {moneyMX(rowTotal)}
                          </td>

                          {/* Actions */}
                          <td>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => remove(index)}
                              aria-label="Eliminar"
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Array-level error */}
            {typeof linesErrors?.message === "string" ? (
              <p className="mt-3 text-sm text-error">{linesErrors.message}</p>
            ) : null}

            {/* Totals section */}
            {fields.length > 0 ? (
              <div className="mt-4 flex justify-end">
                <div className="w-full max-w-sm rounded-box border border-base-300 bg-base-100 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Productos</span>
                    <span className="font-medium">
                      {computedTotals.itemsCount}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm opacity-70">Subtotal</span>
                    <span className="text-lg font-semibold">
                      {moneyMX(computedTotals.subtotal)}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Add product button */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="btn btn-outline"
              disabled={!canAddRow}
              onClick={() => {
                append(config.emptyRow as any);
              }}
            >
              {fields.length === 0
                ? "Agregar producto"
                : "Agregar otro producto"}
            </button>
          </div>

          {!canAddRow && fields.length > 0 ? (
            <p className="mt-2 text-sm opacity-70">
              Completa todos los productos antes de agregar uno nuevo.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
