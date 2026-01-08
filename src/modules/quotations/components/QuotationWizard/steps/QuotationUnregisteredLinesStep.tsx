"use client";

import React from "react";
import { useFieldArray, useWatch } from "react-hook-form";

import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";

function parseMoney(v: string): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
}

function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function isPriceLike(v: string) {
  const s = String(v ?? "").trim();
  return /^\d+(\.\d{1,2})?$/.test(s) && Number(s) > 0;
}

function isRowComplete(
  row: QuotationFormValues["unregisteredLines"][number] | undefined
) {
  if (!row) return false;

  const name = String(row.name ?? "").trim();
  if (!name) return false;

  const qty = Number(row.quantity);
  if (!Number.isFinite(qty) || qty < 1) return false;

  if (!isPriceLike(String(row.quotedUnitPrice ?? ""))) return false;

  return true;
}

type Props = StepComponentProps<QuotationFormValues>;

export function QuotationUnregisteredLinesStep({ form }: Props) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "unregisteredLines",
  });

  // ✅ ensures re-render when any value inside unregisteredLines changes
  const rows = useWatch({ control, name: "unregisteredLines" }) ?? [];
  const rowsErrors = errors.unregisteredLines;

  const canAddRow =
    rows.length === 0 ? true : rows.every((r) => isRowComplete(r));

  const totals = React.useMemo(() => {
    let subtotal = 0;

    for (const r of rows) {
      const qty = Number(r?.quantity ?? 0);
      const price = parseMoney(String(r?.quotedUnitPrice ?? ""));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      subtotal += qty * price;
    }

    // If you want "Productos" to match the SalesNote behavior:
    // count only rows with a name, not empty drafts.
    const itemsCount = rows.filter(
      (r) => String(r?.name ?? "").trim().length > 0
    ).length;

    return { subtotal, itemsCount };
  }, [rows]);

  return (
    <div className="w-full">
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">Productos no registrados</h3>
          <p className="text-sm opacity-70">
            Opcional. Úsalo para artículos que no están en el catálogo.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th className="w-28">Cantidad</th>
                  <th className="w-32">Precio cotizado</th>
                  <th>Descripción (opcional)</th>
                  <th className="w-28 text-right">Total</th>
                  <th className="w-24">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center opacity-70">
                      No hay productos no registrados.
                    </td>
                  </tr>
                ) : null}

                {fields.map((f, index) => {
                  const row = rows[index];
                  const rowErr = rowsErrors?.[index];

                  const qty = Number(row?.quantity ?? 0);
                  const price = parseMoney(String(row?.quotedUnitPrice ?? ""));
                  const rowTotal =
                    Number.isFinite(qty) &&
                    qty > 0 &&
                    Number.isFinite(price) &&
                    price > 0
                      ? qty * price
                      : NaN;

                  return (
                    <tr key={f.id}>
                      <td className="min-w-[260px]">
                        <input
                          className={`input input-bordered w-full ${
                            rowErr?.name ? "input-error" : ""
                          }`}
                          placeholder="Ej: Servicio de instalación"
                          {...register(
                            `unregisteredLines.${index}.name` as const
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
                            `unregisteredLines.${index}.quantity` as const,
                            { valueAsNumber: true }
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
                            rowErr?.quotedUnitPrice ? "input-error" : ""
                          }`}
                          placeholder="12.50"
                          inputMode="decimal"
                          {...register(
                            `unregisteredLines.${index}.quotedUnitPrice` as const,
                            {
                              onChange: (e) => {
                                // If later you normalize $ or comma, do it here.
                                // For now we just ensure validation recalculations are kept in sync.
                                setValue(
                                  `unregisteredLines.${index}.quotedUnitPrice`,
                                  String(e.target.value ?? ""),
                                  { shouldDirty: true, shouldValidate: true }
                                );
                              },
                            }
                          )}
                        />
                        {rowErr?.quotedUnitPrice?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr.quotedUnitPrice.message)}
                          </p>
                        ) : null}
                      </td>

                      <td className="min-w-[240px]">
                        <input
                          className={`input input-bordered w-full ${
                            rowErr?.description ? "input-error" : ""
                          }`}
                          placeholder="Opcional"
                          {...register(
                            `unregisteredLines.${index}.description` as const
                          )}
                        />
                        {rowErr?.description?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr.description.message)}
                          </p>
                        ) : null}
                      </td>

                      <td className="text-right font-medium">
                        {formatMoney(rowTotal)}
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
                  <span className="font-medium">{totals.itemsCount}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm opacity-70">Subtotal</span>
                  <span className="text-lg font-semibold">
                    {formatMoney(totals.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="btn btn-outline"
              disabled={!canAddRow}
              onClick={() =>
                append({
                  name: "",
                  quantity: 1,
                  quotedUnitPrice: "",
                  description: "",
                })
              }
            >
              Agregar producto no registrado
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
