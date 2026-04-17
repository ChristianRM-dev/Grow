"use client";

/**
 * UnregisteredLinesStep - Shared unregistered product lines step for document wizards.
 *
 * Used by both Sales Notes and Quotations flows. Handles:
 * - Row management (add/remove) for products not in the catalog
 * - Per-row name, quantity, price, discount, description editing
 * - Totals computation
 *
 * Configurable via `UnregisteredLinesStepConfig` for different price field
 * names and optional extra features (e.g., product registration in Sales Notes).
 */

import React, { useMemo } from "react";
import {
  useFieldArray,
  useWatch,
  type ArrayPath,
  type FieldArray,
  type FieldPath,
  type PathValue,
  type UseFormReturn,
} from "react-hook-form";
import { moneyMX } from "@/modules/shared/utils/formatters";
import {
  parseMoney,
  isPriceLike,
  normalizeMoneyInput,
} from "@/modules/shared/utils/money";
import {
  computeDiscountedLineTotalsNumber,
  LINE_DISCOUNT_OPTIONS,
} from "@/modules/shared/utils/discounts";
import {
  type DocumentFormShape,
  type DocumentPriceFieldKey,
  type DocumentUnregisteredLine,
  type UnregisteredLineFieldKey,
  unregisteredLineFieldPath,
} from "@/components/forms/document-wizard/documentForm.shared";

type FieldErrorLike = { message?: string };
type UnregisteredLineError<TLine extends object> = Partial<
  Record<UnregisteredLineFieldKey<TLine>, FieldErrorLike>
>;

/**
 * Configuration for customizing UnregisteredLinesStep per document type.
 */
export type UnregisteredLinesStepConfig<
  TPriceField extends DocumentPriceFieldKey,
  TLine extends DocumentUnregisteredLine<TPriceField>,
> = {
  /** The field key for the price within each unregistered line */
  priceFieldKey: TPriceField;
  /** The column header label for the price column */
  priceColumnLabel: string;
  /** Placeholder for the name input */
  namePlaceholder: string;
  /** Default empty row for appending */
  emptyRow: TLine;
  /** Whether to normalize money input on change (remove $, commas, etc.) */
  normalizePrice: boolean;
  /** Label for the add button */
  addButtonLabel: string;
};

type SalesNoteUnregisteredLine = DocumentUnregisteredLine<"unitPrice"> & {
  shouldRegister: boolean;
  variantName?: string;
  bagSize?: string;
  color?: string;
};

export const SALES_NOTE_UNREGISTERED_CONFIG: UnregisteredLinesStepConfig<
  "unitPrice",
  SalesNoteUnregisteredLine
> = {
  priceFieldKey: "unitPrice",
  priceColumnLabel: "Precio",
  namePlaceholder: "Ej: Tierra preparada",
  emptyRow: {
    name: "",
    quantity: 1,
    unitPrice: "",
    discountPercent: 0,
    description: "",
    shouldRegister: false,
  },
  normalizePrice: true,
  addButtonLabel: "+ Agregar producto simple",
};

export const QUOTATION_UNREGISTERED_CONFIG: UnregisteredLinesStepConfig<
  "quotedUnitPrice",
  DocumentUnregisteredLine<"quotedUnitPrice">
> = {
  priceFieldKey: "quotedUnitPrice",
  priceColumnLabel: "Precio cotizado",
  namePlaceholder: "Ej: Servicio de instalación",
  emptyRow: {
    name: "",
    quantity: 1,
    quotedUnitPrice: "",
    discountPercent: 0,
    description: "",
  },
  normalizePrice: false,
  addButtonLabel: "Agregar producto no registrado",
};

type UnregisteredLinesStepProps<
  TForm extends DocumentFormShape<TPriceField, TLine>,
  TPriceField extends DocumentPriceFieldKey,
  TLine extends DocumentUnregisteredLine<TPriceField>,
> = {
  form: UseFormReturn<TForm>;
  config: UnregisteredLinesStepConfig<TPriceField, TLine>;
  renderExtraHeaders?: () => React.ReactNode;
  renderExtraColumns?: (
    index: number,
    row: TLine | undefined,
  ) => React.ReactNode;
  renderExtraActions?: () => React.ReactNode;
  renderExtraTotals?: (rows: readonly TLine[]) => React.ReactNode;
  renderHeaderBadge?: (rows: readonly TLine[]) => React.ReactNode;
};

function isRowCompleteGeneric<
  TPriceField extends DocumentPriceFieldKey,
  TLine extends DocumentUnregisteredLine<TPriceField>,
>(row: TLine | undefined, priceFieldKey: TPriceField): boolean {
  if (!row) return false;

  const name = String(row.name ?? "").trim();
  if (!name) return false;

  const qty = Number(row.quantity);
  if (!Number.isFinite(qty) || qty < 1) return false;

  return isPriceLike(String(row[priceFieldKey] ?? ""));
}

export function UnregisteredLinesStep<
  TForm extends DocumentFormShape<TPriceField, TLine>,
  TPriceField extends DocumentPriceFieldKey,
  TLine extends DocumentUnregisteredLine<TPriceField>,
>({
  form,
  config,
  renderExtraHeaders,
  renderExtraColumns,
  renderExtraActions,
  renderExtraTotals,
  renderHeaderBadge,
}: UnregisteredLinesStepProps<TForm, TPriceField, TLine>) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = form;

  const unregisteredLinesArrayPath = "unregisteredLines" as ArrayPath<TForm>;
  const unregisteredLinesFieldPath = "unregisteredLines" as FieldPath<TForm>;
  const priceFieldKey =
    config.priceFieldKey as unknown as UnregisteredLineFieldKey<TLine>;
  const nameFieldKey = "name" as UnregisteredLineFieldKey<TLine>;
  const quantityFieldKey = "quantity" as UnregisteredLineFieldKey<TLine>;
  const discountFieldKey = "discountPercent" as UnregisteredLineFieldKey<TLine>;
  const descriptionFieldKey = "description" as UnregisteredLineFieldKey<TLine>;

  const { fields, append, remove } = useFieldArray({
    control,
    name: unregisteredLinesArrayPath,
  });

  const rows = (useWatch({ control, name: unregisteredLinesFieldPath }) ??
    []) as unknown as TLine[];
  const rowsErrors = errors.unregisteredLines as
    | UnregisteredLineError<TLine>[]
    | undefined;

  const canAddRow =
    rows.length === 0
      ? true
      : rows.every((row) => isRowCompleteGeneric(row, config.priceFieldKey));

  const computedTotals = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let total = 0;

    for (const row of rows) {
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

    const itemsCount = rows.filter(
      (row) => String(row?.name ?? "").trim().length > 0,
    ).length;

    return { subtotal, discountTotal, total, itemsCount };
  }, [rows, config.priceFieldKey]);

  const setField = <TPath extends FieldPath<TForm>>(
    path: TPath,
    value: PathValue<TForm, TPath>,
    options?: Parameters<UseFormReturn<TForm>["setValue"]>[2],
  ) => {
    setValue(path, value, options);
  };

  const hasExtraColumns = Boolean(renderExtraHeaders);
  const totalColSpan = hasExtraColumns ? 8 : 7;

  return (
    <div className="w-full">
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Productos no registrados</h3>
              <p className="text-sm opacity-70">
                Opcional. Úsalo para artículos que no están en el catálogo.
              </p>
            </div>
            {renderHeaderBadge?.(rows)}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  {renderExtraHeaders?.()}
                  <th>Nombre</th>
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
                    <td
                      colSpan={totalColSpan}
                      className="py-10 text-center opacity-70"
                    >
                      No hay productos no registrados.
                    </td>
                  </tr>
                ) : null}

                {fields.map((field, index) => {
                  const row = rows[index];
                  const rowErr = rowsErrors?.[index];
                  const rowTotals = computeDiscountedLineTotalsNumber({
                    quantity: Number(row?.quantity ?? 0),
                    unitPrice: parseMoney(
                      String(row?.[config.priceFieldKey] ?? ""),
                    ),
                    discountPercent: row?.discountPercent,
                  });

                  return (
                    <tr key={field.id}>
                      {renderExtraColumns?.(index, row)}

                      <td className="min-w-[260px]">
                        <input
                          className={`input input-bordered w-full ${
                            rowErr?.name ? "input-error" : ""
                          }`}
                          placeholder={config.namePlaceholder}
                          {...register(
                            unregisteredLineFieldPath<TForm, TLine>(
                              index,
                              nameFieldKey,
                            ),
                          )}
                        />
                        {rowErr?.name?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr.name.message)}
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
                            unregisteredLineFieldPath<TForm, TLine>(
                              index,
                              quantityFieldKey,
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
                            unregisteredLineFieldPath<TForm, TLine>(
                              index,
                              priceFieldKey,
                            ),
                            config.normalizePrice
                              ? {
                                  onChange: (
                                    event: React.ChangeEvent<HTMLInputElement>,
                                  ) => {
                                    const raw = String(event.target.value ?? "");
                                    const normalized = normalizeMoneyInput(raw);
                                    if (normalized === raw) return;

                                    const path =
                                      unregisteredLineFieldPath<TForm, TLine>(
                                        index,
                                        priceFieldKey,
                                      );

                                    setField(
                                      path,
                                      normalized as PathValue<TForm, typeof path>,
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      },
                                    );
                                  },
                                }
                              : {
                                  onChange: (
                                    event: React.ChangeEvent<HTMLInputElement>,
                                  ) => {
                                    const path =
                                      unregisteredLineFieldPath<TForm, TLine>(
                                        index,
                                        priceFieldKey,
                                      );

                                    setField(
                                      path,
                                      String(
                                        event.target.value ?? "",
                                      ) as PathValue<TForm, typeof path>,
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      },
                                    );
                                  },
                                },
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
                            unregisteredLineFieldPath<TForm, TLine>(
                              index,
                              discountFieldKey,
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
                            unregisteredLineFieldPath<TForm, TLine>(
                              index,
                              descriptionFieldKey,
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
                })}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-sm rounded-box border border-base-300 bg-base-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-70">Productos</span>
                  <span className="font-medium">
                    {computedTotals.itemsCount}
                  </span>
                </div>

                {renderExtraTotals?.(rows)}

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
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            {renderExtraActions?.()}

            <button
              type="button"
              className="btn btn-outline"
              disabled={!canAddRow}
              onClick={() =>
                append(
                  config.emptyRow as FieldArray<
                    TForm,
                    typeof unregisteredLinesArrayPath
                  >,
                )
              }
            >
              {config.addButtonLabel}
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

/**
 * Re-export isRowComplete for use by feature-specific extensions
 * (e.g., Sales Notes' shouldRegister checkbox disabling logic).
 */
export { isRowCompleteGeneric as isUnregisteredRowComplete };
