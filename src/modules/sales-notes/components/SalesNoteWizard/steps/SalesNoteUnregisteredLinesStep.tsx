// src/modules/sales-notes/components/SalesNoteWizard/steps/SalesNoteUnregisteredLinesStep.tsx
"use client";

import React from "react";
import { useFieldArray, useWatch } from "react-hook-form";

import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import {
  SalesNoteFormInput,
  SalesNoteFormValues,
} from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { RegisterProductModal } from "./RegisterProductModal";

type Props = StepComponentProps<SalesNoteFormInput>;

function normalizeMoneyInput(v: string): string {
  return String(v ?? "")
    .trim()
    .replace(/\$/g, "")
    .replace(/\s+/g, "")
    .replace(/,/g, ".");
}

function parseMoney(v: string): number {
  const n = Number(normalizeMoneyInput(v));
  return Number.isFinite(n) ? n : NaN;
}

function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function isPriceLike(v: string) {
  const s = normalizeMoneyInput(v);
  return /^\d+(\.\d{1,2})?$/.test(s) && Number(s) > 0;
}

function isRowComplete(
  row: SalesNoteFormValues["unregisteredLines"][number] | undefined
) {
  if (!row) return false;

  const name = String(row.name ?? "").trim();
  if (!name) return false;

  const qty = Number(row.quantity);
  if (!Number.isFinite(qty) || qty < 1) return false;

  if (!isPriceLike(String(row.unitPrice ?? ""))) return false;

  return true;
}

export function SalesNoteUnregisteredLinesStep({ form }: Props) {
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

  const rows = useWatch({ control, name: "unregisteredLines" }) ?? [];
  const rowsErrors = errors.unregisteredLines;

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const canAddRow =
    rows.length === 0 ? true : rows.every((r) => isRowComplete(r));

  const computedTotals = React.useMemo(() => {
    let subtotal = 0;

    for (const r of rows) {
      const qty = Number(r?.quantity ?? 0);
      const price = parseMoney(String(r?.unitPrice ?? ""));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      subtotal += qty * price;
    }

    const itemsCount = rows.filter(
      (r) => String(r?.name ?? "").trim().length > 0
    ).length;

    const itemsToRegister = rows.filter(
      (r) => r?.shouldRegister === true
    ).length;

    return { subtotal, itemsCount, itemsToRegister };
  }, [rows]);

  const handleModalSubmit = (data: any) => {
    append({
      name: data.name,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      description: data.description || "",
      shouldRegister: true,
      variantName: data.variantName || undefined,
      bagSize: data.bagSize || undefined,
      color: data.color || undefined,
    });
  };

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
            {computedTotals.itemsToRegister > 0 && (
              <div className="badge badge-success gap-2">
                {computedTotals.itemsToRegister} para registrar
              </div>
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="w-16">
                    <div className="flex items-center gap-2">
                      <span
                        className="tooltip"
                        data-tip="Registrar en catálogo"
                      >
                        📋
                      </span>
                    </div>
                  </th>
                  <th>Nombre</th>
                  <th className="w-28">Cantidad</th>
                  <th className="w-32">Precio</th>
                  <th>Descripción (opcional)</th>
                  <th className="w-28 text-right">Total</th>
                  <th className="w-24">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center opacity-70">
                      No hay productos no registrados.
                    </td>
                  </tr>
                ) : null}

                {fields.map((f, index) => {
                  const row = rows[index];
                  const rowErr = rowsErrors?.[index];

                  const qty = Number(row?.quantity ?? 0);
                  const price = parseMoney(String(row?.unitPrice ?? ""));
                  const rowTotal =
                    Number.isFinite(qty) &&
                    qty > 0 &&
                    Number.isFinite(price) &&
                    price > 0
                      ? qty * price
                      : NaN;

                  const isMarkedForRegistration = row?.shouldRegister === true;

                  return (
                    <tr
                      key={f.id}
                      className={isMarkedForRegistration ? "bg-success/10" : ""}
                    >
                      {/* Checkbox para registrar */}
                      <td>
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-success"
                            {...register(
                              `unregisteredLines.${index}.shouldRegister`
                            )}
                            disabled={!isRowComplete(row)}
                            title={
                              !isRowComplete(row)
                                ? "Completa el producto para poder registrarlo"
                                : "Registrar este producto en el catálogo"
                            }
                          />
                        </div>
                      </td>

                      <td className="min-w-[260px]">
                        <input
                          className={`input input-bordered w-full ${
                            rowErr?.name ? "input-error" : ""
                          }`}
                          placeholder="Ej: Tierra preparada"
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
                            {
                              valueAsNumber: true,
                            }
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
                            rowErr?.unitPrice ? "input-error" : ""
                          }`}
                          placeholder="12.50"
                          inputMode="decimal"
                          {...register(
                            `unregisteredLines.${index}.unitPrice` as const,
                            {
                              onChange: (e) => {
                                const raw = String(e.target.value ?? "");
                                const normalized = normalizeMoneyInput(raw);

                                if (normalized !== raw) {
                                  setValue(
                                    `unregisteredLines.${index}.unitPrice`,
                                    normalized,
                                    { shouldDirty: true, shouldValidate: true }
                                  );
                                }
                              },
                            }
                          )}
                        />
                        {rowErr?.unitPrice?.message ? (
                          <p className="mt-1 text-sm text-error">
                            {String(rowErr.unitPrice.message)}
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
                  <span className="font-medium">
                    {computedTotals.itemsCount}
                  </span>
                </div>

                {computedTotals.itemsToRegister > 0 && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm opacity-70">Para registrar</span>
                    <span className="font-medium text-success">
                      {computedTotals.itemsToRegister}
                    </span>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm opacity-70">Subtotal</span>
                  <span className="text-lg font-semibold">
                    {formatMoney(computedTotals.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              + Agregar producto para registrar
            </button>

            <button
              type="button"
              className="btn btn-outline"
              disabled={!canAddRow}
              onClick={() =>
                append({
                  name: "",
                  quantity: 1,
                  unitPrice: "",
                  description: "",
                  shouldRegister: false,
                })
              }
            >
              + Agregar producto simple
            </button>
          </div>

          {!canAddRow ? (
            <p className="mt-2 text-sm opacity-70">
              Completa los productos actuales antes de agregar uno nuevo.
            </p>
          ) : null}
        </div>
      </div>

      <RegisterProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
