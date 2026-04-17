"use client";

/**
 * ProductLinesStep - Shared registered product lines step for document wizards.
 *
 * Used by both Sales Notes and Quotations flows. Handles:
 * - Product autocomplete search via searchProductVariantsAction
 * - Row management (add/remove) with useFieldArray
 * - Per-row price, quantity, discount, and description editing
 * - Totals computation
 *
 * Configurable via `ProductLinesStepConfig` to handle different price field
 * names (unitPrice vs quotedUnitPrice) and column labels.
 */

import React, { useRef, useState } from "react";
import {
  useFieldArray,
  type ArrayPath,
  type FieldArray,
  type FieldPath,
  type PathValue,
  type UseFormReturn,
} from "react-hook-form";
import {
  searchProductVariantsAction,
  type ProductVariantLookupDto,
} from "@/modules/products/actions/searchProductVariants.action";
import { moneyMX } from "@/modules/shared/utils/formatters";
import { parseMoney, isPriceLike } from "@/modules/shared/utils/money";
import {
  computeDiscountedLineTotalsNumber,
  LINE_DISCOUNT_OPTIONS,
} from "@/modules/shared/utils/discounts";
import {
  lineFieldPath,
  type DocumentFormShape,
  type DocumentPriceFieldKey,
  type DocumentRegisteredLine,
  type RegisteredLineFieldKey,
} from "@/components/forms/document-wizard/documentForm.shared";

type FieldErrorLike = { message?: string };
type RegisteredLineError<TPriceField extends DocumentPriceFieldKey> = Partial<
  Record<RegisteredLineFieldKey<TPriceField>, FieldErrorLike>
>;

/**
 * Configuration for customizing ProductLinesStep per document type.
 */
export type ProductLinesStepConfig<TPriceField extends DocumentPriceFieldKey> = {
  /** The field key for the price within each line (e.g., "unitPrice" or "quotedUnitPrice") */
  priceFieldKey: TPriceField;
  /** The column header label for the price column (e.g., "Precio" or "Precio cotizado") */
  priceColumnLabel: string;
  /** Description text below the heading */
  description: string;
  /** Default empty row for appending */
  emptyRow: DocumentRegisteredLine<TPriceField>;
};

export const SALES_NOTE_LINES_CONFIG: ProductLinesStepConfig<"unitPrice"> = {
  priceFieldKey: "unitPrice",
  priceColumnLabel: "Precio",
  description:
    "Agrega productos del catálogo y ajusta cantidades, precios y descuentos. Este paso es opcional.",
  emptyRow: {
    productVariantId: "",
    productName: "",
    quantity: 1,
    unitPrice: "",
    discountPercent: 0,
    description: "",
  },
};

export const QUOTATION_LINES_CONFIG: ProductLinesStepConfig<"quotedUnitPrice"> =
  {
    priceFieldKey: "quotedUnitPrice",
    priceColumnLabel: "Precio cotizado",
    description:
      "Agrega productos del catálogo y ajusta cantidades, precios cotizados y descuentos. Este paso es opcional.",
    emptyRow: {
      productVariantId: "",
      productName: "",
      quantity: 1,
      quotedUnitPrice: "",
      discountPercent: 0,
      description: "",
    },
  };

type ProductLinesStepProps<
  TForm extends DocumentFormShape<TPriceField>,
  TPriceField extends DocumentPriceFieldKey,
> = {
  form: UseFormReturn<TForm>;
  config: ProductLinesStepConfig<TPriceField>;
};

function isRowComplete<TPriceField extends DocumentPriceFieldKey>(
  row: DocumentRegisteredLine<TPriceField> | undefined,
  priceFieldKey: TPriceField,
) {
  if (!row) return false;
  if (!row.productVariantId?.trim()) return false;
  if (!row.productName?.trim()) return false;

  const qty = Number(row.quantity);
  if (!Number.isFinite(qty) || qty < 1) return false;

  return isPriceLike(String(row[priceFieldKey] ?? ""));
}

export function ProductLinesStep<
  TForm extends DocumentFormShape<TPriceField>,
  TPriceField extends DocumentPriceFieldKey,
>({ form, config }: ProductLinesStepProps<TForm, TPriceField>) {
  const {
    control,
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const linesArrayPath = "lines" as ArrayPath<TForm>;
  const linesFieldPath = "lines" as FieldPath<TForm>;
  const priceFieldKey =
    config.priceFieldKey as unknown as RegisteredLineFieldKey<TPriceField>;

  const { fields, append, remove } = useFieldArray({
    control,
    name: linesArrayPath,
  });

  const lines = (watch(linesFieldPath) ?? []) as unknown as DocumentRegisteredLine<TPriceField>[];
  const selectedIds = lines
    .map((line) => line?.productVariantId?.trim())
    .filter((value): value is string => Boolean(value));

  // Per-row autocomplete UI state
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [loadingRow, setLoadingRow] = useState<Record<string, boolean>>({});
  const [resultsRow, setResultsRow] = useState<
    Record<string, ProductVariantLookupDto[]>
  >({});
  const [termRow, setTermRow] = useState<Record<string, string>>({});
  const debounceRef = useRef<Record<string, number | null>>({});

  const linesErrors = errors.lines as RegisteredLineError<TPriceField>[] | undefined;

  const canAddRow =
    fields.length === 0
      ? true
      : lines.every((row) => isRowComplete(row, config.priceFieldKey));

  const computedTotals = (() => {
    let subtotal = 0;
    let discountTotal = 0;
    let total = 0;

    for (const row of lines) {
      const totals = computeDiscountedLineTotalsNumber({
        quantity: Number(row?.quantity ?? 0),
        unitPrice: parseMoney(String(row?.[config.priceFieldKey] ?? "")),
        discountPercent: row?.discountPercent,
      });

      if (!Number.isFinite(totals.subtotal)) continue;

      subtotal += totals.subtotal;
      discountTotal += totals.discountAmount;
      total += totals.lineTotal;
    }

    return {
      subtotal,
      discountTotal,
      total,
      itemsCount: lines.length,
    };
  })();

  const handleSearch = (rowKey: string, term: string, excludeIds: string[]) => {
    const existingTimeout = debounceRef.current[rowKey];
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    debounceRef.current[rowKey] = window.setTimeout(async () => {
      const query = term.trim();
      if (query.length < 2) {
        setResultsRow((prev) => ({ ...prev, [rowKey]: [] }));
        return;
      }

      setLoadingRow((prev) => ({ ...prev, [rowKey]: true }));
      try {
        const rows = await searchProductVariantsAction({
          term: query,
          excludeIds,
          take: 10,
        });
        setResultsRow((prev) => ({ ...prev, [rowKey]: rows }));
      } finally {
        setLoadingRow((prev) => ({ ...prev, [rowKey]: false }));
      }
    }, 300);
  };

  const setField = <TPath extends FieldPath<TForm>>(
    path: TPath,
    value: PathValue<TForm, TPath>,
    options?: Parameters<UseFormReturn<TForm>["setValue"]>[2],
  ) => {
    setValue(path, value, options);
  };

  const selectProduct = async (
    index: number,
    rowKey: string,
    product: ProductVariantLookupDto,
  ) => {
    const opts = { shouldDirty: true, shouldValidate: true };
    const productVariantIdPath = lineFieldPath<TForm, TPriceField>(
      index,
      "productVariantId",
    );
    const productNamePath = lineFieldPath<TForm, TPriceField>(
      index,
      "productName",
    );
    const pricePath = lineFieldPath<TForm, TPriceField>(
      index,
      priceFieldKey,
    );
    const quantityPath = lineFieldPath<TForm, TPriceField>(index, "quantity");
    const descriptionPath = lineFieldPath<TForm, TPriceField>(
      index,
      "description",
    );

    setField(
      productVariantIdPath,
      product.id as PathValue<TForm, typeof productVariantIdPath>,
      opts,
    );
    setField(
      productNamePath,
      product.label as PathValue<TForm, typeof productNamePath>,
      opts,
    );
    setField(
      pricePath,
      product.defaultPrice as PathValue<TForm, typeof pricePath>,
      opts,
    );
    setField(quantityPath, 1 as PathValue<TForm, typeof quantityPath>, opts);

    if (product.descriptionSuggestion) {
      setField(
        descriptionPath,
        product.descriptionSuggestion as PathValue<TForm, typeof descriptionPath>,
        opts,
      );
    }

    setTermRow((prev) => ({ ...prev, [rowKey]: product.label }));
    setOpenRow(null);

    await trigger([
      productVariantIdPath,
      productNamePath,
      quantityPath,
      pricePath,
      descriptionPath,
    ]);
  };

  const clearSelectionIfTyped = (index: number) => {
    const row = lines[index];
    const currentId = row?.productVariantId?.trim() ?? "";
    if (!currentId) return;

    const opts = { shouldDirty: true, shouldValidate: true };
    const productVariantIdPath = lineFieldPath<TForm, TPriceField>(
      index,
      "productVariantId",
    );
    const productNamePath = lineFieldPath<TForm, TPriceField>(
      index,
      "productName",
    );

    setField(
      productVariantIdPath,
      "" as PathValue<TForm, typeof productVariantIdPath>,
      opts,
    );
    setField(
      productNamePath,
      "" as PathValue<TForm, typeof productNamePath>,
      opts,
    );
  };

  return (
    <div className="w-full">
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">Productos Registrados</h3>
          <p className="text-sm opacity-70">{config.description}</p>

          <div className="mt-4 -mx-4 overflow-x-auto md:mx-0 md:overflow-x-visible">
            <div className="min-w-[980px] px-4 md:min-w-0 md:px-0">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="w-28">Cantidad</th>
                    <th className="w-32">{config.priceColumnLabel}</th>
                    <th className="w-28">Descuento</th>
                    <th>Descripción (opcional)</th>
                    <th className="w-28 text-right">Total</th>
                    <th className="w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-70">
                          <span>No hay productos agregados</span>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() =>
                              append(
                                config.emptyRow as FieldArray<TForm, typeof linesArrayPath>,
                              )
                            }
                          >
                            Agregar primer producto
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    fields.map((field, index) => {
                      const rowKey = field.id;
                      const row = lines[index];
                      const rowErr = linesErrors?.[index];
                      const term = termRow[rowKey] ?? row?.productName ?? "";
                      const excludeIdsForRow = selectedIds.filter(
                        (id) => id !== row?.productVariantId,
                      );
                      const rowTotals = computeDiscountedLineTotalsNumber({
                        quantity: Number(row?.quantity ?? 0),
                        unitPrice: parseMoney(
                          String(row?.[config.priceFieldKey] ?? ""),
                        ),
                        discountPercent: row?.discountPercent,
                      });

                      return (
                        <tr key={rowKey}>
                          <td className="w-[380px] max-w-[380px]">
                            <div className="relative">
                              <input
                                className={`input input-bordered w-full ${
                                  rowErr?.productVariantId ? "input-error" : ""
                                }`}
                                placeholder="Buscar producto (2+ letras)…"
                                value={term}
                                onChange={(event) => {
                                  const next = event.target.value;
                                  setTermRow((prev) => ({
                                    ...prev,
                                    [rowKey]: next,
                                  }));
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

                              {openRow === rowKey &&
                              (resultsRow[rowKey]?.length ?? 0) > 0 ? (
                                <div className="absolute z-50 mt-2 w-full rounded-box border border-base-300 bg-base-100 shadow">
                                  <ul className="menu menu-sm w-full">
                                    {(resultsRow[rowKey] ?? []).map((product) => (
                                      <li key={product.id} className="w-full">
                                        <button
                                          type="button"
                                          className="w-full justify-start text-left"
                                          onMouseDown={(event) =>
                                            event.preventDefault()
                                          }
                                          onClick={() =>
                                            selectProduct(index, rowKey, product)
                                          }
                                        >
                                          <div className="flex min-w-0 w-full items-center justify-between gap-3">
                                            <span className="truncate font-medium">
                                              {product.label}
                                            </span>
                                            <span className="whitespace-nowrap text-xs opacity-70">
                                              ${product.defaultPrice}
                                            </span>
                                          </div>
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>

                            <input
                              type="hidden"
                              {...register(
                                lineFieldPath<TForm, TPriceField>(
                                  index,
                                  "productVariantId",
                                ),
                              )}
                            />
                            <input
                              type="hidden"
                              {...register(
                                lineFieldPath<TForm, TPriceField>(
                                  index,
                                  "productName",
                                ),
                              )}
                            />

                            {rowErr?.productVariantId?.message ? (
                              <p className="mt-1 text-sm text-error">
                                {String(rowErr.productVariantId.message)}
                              </p>
                            ) : null}
                          </td>

                          <td>
                            <input
                              type="number"
                              min={1}
                              className={`input input-bordered w-24 ${
                                rowErr?.quantity ? "input-error" : ""
                              }`}
                              {...register(
                                lineFieldPath<TForm, TPriceField>(
                                  index,
                                  "quantity",
                                ),
                                { valueAsNumber: true },
                              )}
                            />
                            {rowErr?.quantity?.message ? (
                              <p className="mt-1 text-sm text-error">
                                {String(rowErr.quantity.message)}
                              </p>
                            ) : null}
                          </td>

                          <td>
                            <input
                              className={`input input-bordered w-28 ${
                                rowErr?.[priceFieldKey]
                                  ? "input-error"
                                  : ""
                              }`}
                              placeholder="12.50"
                              inputMode="decimal"
                              {...register(
                                lineFieldPath<TForm, TPriceField>(
                                  index,
                                  priceFieldKey,
                                ),
                              )}
                            />
                            {rowErr?.[priceFieldKey]?.message ? (
                              <p className="mt-1 text-sm text-error">
                                {String(rowErr[priceFieldKey]?.message)}
                              </p>
                            ) : null}
                          </td>

                          <td>
                            <select
                              className="select select-bordered w-24"
                              {...register(
                                lineFieldPath<TForm, TPriceField>(
                                  index,
                                  "discountPercent",
                                ),
                                {
                                  setValueAs: (value) => Number(value),
                                },
                              )}
                            >
                              {LINE_DISCOUNT_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}%
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="min-w-[240px]">
                            <input
                              className={`input input-bordered w-full ${
                                rowErr?.description ? "input-error" : ""
                              }`}
                              placeholder="Opcional"
                              {...register(
                                lineFieldPath<TForm, TPriceField>(
                                  index,
                                  "description",
                                ),
                              )}
                            />
                            {rowErr?.description?.message ? (
                              <p className="mt-1 text-sm text-error">
                                {String(rowErr.description.message)}
                              </p>
                            ) : null}
                          </td>

                          <td className="text-right font-medium">
                            {moneyMX(rowTotals.lineTotal)}
                          </td>

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
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-sm rounded-box border border-base-300 bg-base-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-70">Productos</span>
                <span className="font-medium">{computedTotals.itemsCount}</span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm opacity-70">Subtotal</span>
                <span className="font-medium">
                  {moneyMX(computedTotals.subtotal)}
                </span>
              </div>

              {computedTotals.discountTotal > 0 ? (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm opacity-70">Descuento</span>
                  <span className="font-medium text-success">
                    -{moneyMX(computedTotals.discountTotal)}
                  </span>
                </div>
              ) : null}

              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm opacity-70">Total</span>
                <span className="text-lg font-semibold">
                  {moneyMX(computedTotals.total)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="btn btn-outline"
              disabled={!canAddRow}
              onClick={() =>
                append(
                  config.emptyRow as FieldArray<TForm, typeof linesArrayPath>,
                )
              }
            >
              + Agregar producto
            </button>
          </div>

          {!canAddRow ? (
            <p className="mt-2 text-sm opacity-70">
              Completa los productos actuales antes de agregar uno nuevo.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
