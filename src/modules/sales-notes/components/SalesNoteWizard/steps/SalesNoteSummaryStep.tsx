"use client";

import React, { useMemo } from "react";
import { useWatch } from "react-hook-form";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import {
  SalesNoteFormInput,
  SalesNoteFormValues,
} from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { moneyMX } from "@/modules/shared/utils/formatters";

// type Props = StepComponentProps<SalesNoteFormValues>;
type Props = StepComponentProps<SalesNoteFormInput>;

function toNumber(v: string): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
}

export function SalesNoteSummaryStep({ form }: Props) {
  const values = useWatch({ control: form.control }) as SalesNoteFormValues;

  const customerLabel = useMemo(() => {
    if (values.customer.mode === "PUBLIC") return "Venta al público";

    if (values.customer.partyMode === "NEW") {
      return values.customer.newParty?.name?.trim() || "—";
    }

    return values.customer.existingPartyName?.trim() || "—";
  }, [values.customer]);

  /**
   * Calculate total quantity of registered plants
   */
  const registeredPlantsCount = useMemo(() => {
    return (values.lines ?? []).reduce((sum, line) => {
      const qty = Number(line.quantity ?? 0);
      return sum + (Number.isFinite(qty) && qty > 0 ? qty : 0);
    }, 0);
  }, [values.lines]);

  /**
   * Calculate subtotal for registered products
   */
  const productsSubtotal = useMemo(() => {
    let total = 0;
    for (const r of values.lines ?? []) {
      const qty = Number(r.quantity ?? 0);
      const price = toNumber(String(r.unitPrice ?? ""));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      total += qty * price;
    }
    return total;
  }, [values.lines]);

  /**
   * Calculate total quantity of unregistered plants
   */
  const unregisteredPlantsCount = useMemo(() => {
    return (values.unregisteredLines ?? []).reduce((sum, line) => {
      const qty = Number(line.quantity ?? 0);
      return sum + (Number.isFinite(qty) && qty > 0 ? qty : 0);
    }, 0);
  }, [values.unregisteredLines]);

  /**
   * Calculate subtotal for unregistered products
   */
  const unregisteredSubtotal = useMemo(() => {
    let total = 0;
    for (const r of values.unregisteredLines ?? []) {
      const qty = Number(r.quantity ?? 0);
      const price = toNumber(String(r.unitPrice ?? ""));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      total += qty * price;
    }
    return total;
  }, [values.unregisteredLines]);

  const grandTotal = productsSubtotal + unregisteredSubtotal;
  const totalPlants = registeredPlantsCount + unregisteredPlantsCount;

  return (
    <div className="w-full space-y-4">
      {/* Customer */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">Resumen</h3>

          <div className="mt-2">
            <div className="text-sm opacity-70">Cliente</div>
            <div className="text-base font-medium">{customerLabel}</div>
          </div>
        </div>
      </div>

      {/* Total plants summary card */}
      <div className="card border-l-4 border-l-success bg-success/10">
        <div className="card-body py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium opacity-70">
                Total de plantas
              </div>
              {totalPlants > 0 && (
                <div className="mt-1 text-xs opacity-60">
                  {registeredPlantsCount > 0 && (
                    <span>{registeredPlantsCount} registradas</span>
                  )}
                  {registeredPlantsCount > 0 && unregisteredPlantsCount > 0 && (
                    <span className="mx-1">·</span>
                  )}
                  {unregisteredPlantsCount > 0 && (
                    <span>{unregisteredPlantsCount} externas</span>
                  )}
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-success">{totalPlants}</div>
          </div>
        </div>
      </div>

      {/* Registered products */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Productos registrados</h4>
            <div className="badge badge-success badge-lg">
              {registeredPlantsCount} plantas
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="w-24 text-right">Cantidad</th>
                  <th className="w-28 text-right">Precio</th>
                  <th>Descripción</th>
                  <th className="w-28 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(values.lines ?? []).map((r, idx) => {
                  const qty = Number(r.quantity ?? 0);
                  const price = toNumber(String(r.unitPrice ?? ""));
                  const rowTotal =
                    Number.isFinite(qty) &&
                    qty > 0 &&
                    Number.isFinite(price) &&
                    price > 0
                      ? qty * price
                      : NaN;

                  return (
                    <tr key={`${r.productVariantId}-${idx}`}>
                      <td>{r.productName || "—"}</td>
                      <td className="text-right">{qty || 0}</td>
                      <td className="text-right">{moneyMX(price)}</td>
                      <td>{r.description?.trim() || "—"}</td>
                      <td className="text-right font-medium">
                        {moneyMX(rowTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-sm rounded-box border border-base-300 bg-base-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-70">Subtotal productos</span>
                <span className="text-lg font-semibold">
                  {moneyMX(productsSubtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unregistered products (optional) */}
      {(values.unregisteredLines?.length ?? 0) > 0 ? (
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Productos externos</h4>
              <div className="badge badge-warning badge-lg">
                {unregisteredPlantsCount} plantas
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th className="w-24 text-right">Cantidad</th>
                    <th className="w-28 text-right">Precio</th>
                    <th>Descripción</th>
                    <th className="w-28 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(values.unregisteredLines ?? []).map((r, idx) => {
                    const qty = Number(r.quantity ?? 0);
                    const price = toNumber(String(r.unitPrice ?? ""));
                    const rowTotal =
                      Number.isFinite(qty) &&
                      qty > 0 &&
                      Number.isFinite(price) &&
                      price > 0
                        ? qty * price
                        : NaN;

                    return (
                      <tr key={`${r.name}-${idx}`}>
                        <td>{r.name || "—"}</td>
                        <td className="text-right">{qty || 0}</td>
                        <td className="text-right">{moneyMX(price)}</td>
                        <td>{r.description?.trim() || "—"}</td>
                        <td className="text-right font-medium">
                          {moneyMX(rowTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-sm rounded-box border border-base-300 bg-base-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-70">Subtotal externos</span>
                  <span className="text-lg font-semibold">
                    {moneyMX(unregisteredSubtotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Grand total */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-70">Total general</span>
            <span className="text-2xl font-bold">{moneyMX(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
