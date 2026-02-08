"use client";

/**
 * UnregisteredLinesStep - Shared unregistered product lines step for document wizards.
 *
 * Used by both Sales Notes and Quotations flows. Handles:
 * - Row management (add/remove) for products not in the catalog
 * - Per-row name, quantity, price, description editing
 * - Totals computation
 *
 * Configurable via `UnregisteredLinesStepConfig` for different price field
 * names and optional extra features (e.g., product registration in Sales Notes).
 *
 * Sales Notes extends this with a "shouldRegister" checkbox column and a
 * RegisterProductModal via the `extraColumns` and `extraActions` render props.
 */

import React, { useMemo } from "react";
import { useFieldArray, useWatch, type FieldValues, type UseFormReturn } from "react-hook-form";
import { moneyMX } from "@/modules/shared/utils/formatters";
import { parseMoney, isPriceLike, normalizeMoneyInput } from "@/modules/shared/utils/money";

/**
 * Configuration for customizing UnregisteredLinesStep per document type.
 */
export type UnregisteredLinesStepConfig = {
  /** The field key for the price within each unregistered line */
  priceFieldKey: string;
  /** The column header label for the price column */
  priceColumnLabel: string;
  /** Placeholder for the name input */
  namePlaceholder: string;
  /** Default empty row for appending */
  emptyRow: Record<string, any>;
  /** Whether to normalize money input on change (remove $, commas, etc.) */
  normalizePrice: boolean;
  /** Label for the add button */
  addButtonLabel: string;
};

export const SALES_NOTE_UNREGISTERED_CONFIG: UnregisteredLinesStepConfig = {
  priceFieldKey: "unitPrice",
  priceColumnLabel: "Precio",
  namePlaceholder: "Ej: Tierra preparada",
  emptyRow: {
    name: "",
    quantity: 1,
    unitPrice: "",
    description: "",
    shouldRegister: false,
  },
  normalizePrice: true,
  addButtonLabel: "+ Agregar producto simple",
};

export const QUOTATION_UNREGISTERED_CONFIG: UnregisteredLinesStepConfig = {
  priceFieldKey: "quotedUnitPrice",
  priceColumnLabel: "Precio cotizado",
  namePlaceholder: "Ej: Servicio de instalación",
  emptyRow: {
    name: "",
    quantity: 1,
    quotedUnitPrice: "",
    description: "",
  },
  normalizePrice: false,
  addButtonLabel: "Agregar producto no registrado",
};

type UnregisteredLinesStepProps<TForm extends FieldValues> = {
  form: UseFormReturn<TForm>;
  config: UnregisteredLinesStepConfig;
  /**
   * Optional render prop for extra table header columns (e.g., registration checkbox column).
   * Returns JSX for additional <th> elements to prepend before the Name column.
   */
  renderExtraHeaders?: () => React.ReactNode;
  /**
   * Optional render prop for extra table body columns per row.
   * Returns JSX for additional <td> elements to prepend before the Name column.
   */
  renderExtraColumns?: (index: number, row: any) => React.ReactNode;
  /**
   * Optional render prop for extra action buttons (e.g., "Agregar producto para registrar").
   */
  renderExtraActions?: () => React.ReactNode;
  /**
   * Optional render prop for extra totals info (e.g., "X para registrar" badge).
   */
  renderExtraTotals?: (rows: any[]) => React.ReactNode;
  /**
   * Optional render prop for header badge (e.g., "X para registrar" badge).
   */
  renderHeaderBadge?: (rows: any[]) => React.ReactNode;
};

function isRowCompleteGeneric(
  row: any,
  priceFieldKey: string,
): boolean {
  if (!row) return false;
  const name = String(row.name ?? "").trim();
  if (!name) return false;
  const qty = Number(row.quantity);
  if (!Number.isFinite(qty) || qty < 1) return false;
  if (!isPriceLike(String(row[priceFieldKey] ?? ""))) return false;
  return true;
}

export function UnregisteredLinesStep<TForm extends FieldValues>({
  form,
  config,
  renderExtraHeaders,
  renderExtraColumns,
  renderExtraActions,
  renderExtraTotals,
  renderHeaderBadge,
}: UnregisteredLinesStepProps<TForm>) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "unregisteredLines" as any,
  });

  const rows = (useWatch({ control, name: "unregisteredLines" as any }) ?? []) as any[];
  const rowsErrors = (errors as any).unregisteredLines;

  const canAddRow =
    rows.length === 0
      ? true
      : rows.every((r) => isRowCompleteGeneric(r, config.priceFieldKey));

  const computedTotals = useMemo(() => {
    let subtotal = 0;

    for (const r of rows) {
      const qty = Number(r?.quantity ?? 0);
      const price = parseMoney(String(r?.[config.priceFieldKey] ?? ""));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      subtotal += qty * price;
    }

    const itemsCount = rows.filter(
      (r) => String(r?.name ?? "").trim().length > 0,
    ).length;

    return { subtotal, itemsCount };
  }, [rows, config.priceFieldKey]);

  const hasExtraColumns = !!renderExtraHeaders;
  const totalColSpan = hasExtraColumns ? 7 : 6;

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

                {fields.map((f, index) => {
                  const row = rows[index];
                  const rowErr = rowsErrors?.[index];

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
                    <tr key={f.id}>
                      {renderExtraColumns?.(index, row)}

                      {/* Name */}
                      <td className="min-w-[260px]">
                        <input
                          className={`input input-bordered w-full ${
                            rowErr?.name ? "input-error" : ""
                          }`}
                          placeholder={config.namePlaceholder}
                          {...register(
                            `unregisteredLines.${index}.name` as any,
                          )}
                        />
                        {rowErr?.name?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr.name.message)}
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
                            `unregisteredLines.${index}.quantity` as any,
                            { valueAsNumber: true },
                          )}
                        />
                        {rowErr?.quantity?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr.quantity.message)}
                          </p>
                        ) : null}
                      </td>

                      {/* Price */}
                      <td>
                        <input
                          className={`input input-bordered w-28 ${
                            rowErr?.[config.priceFieldKey] ? "input-error" : ""
                          }`}
                          placeholder="12.50"
                          inputMode="decimal"
                          {...register(
                            `unregisteredLines.${index}.${config.priceFieldKey}` as any,
                            config.normalizePrice
                              ? {
                                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const raw = String(e.target.value ?? "");
                                    const normalized = normalizeMoneyInput(raw);
                                    if (normalized !== raw) {
                                      setValue(
                                        `unregisteredLines.${index}.${config.priceFieldKey}` as any,
                                        normalized as any,
                                        {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        },
                                      );
                                    }
                                  },
                                }
                              : {
                                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                    setValue(
                                      `unregisteredLines.${index}.${config.priceFieldKey}` as any,
                                      String(e.target.value ?? "") as any,
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      },
                                    );
                                  },
                                },
                          )}
                        />
                        {rowErr?.[config.priceFieldKey]?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr[config.priceFieldKey].message)}
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
                          {...register(
                            `unregisteredLines.${index}.description` as any,
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
                  <span className="text-lg font-semibold">
                    {moneyMX(computedTotals.subtotal)}
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
              onClick={() => append(config.emptyRow as any)}
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
