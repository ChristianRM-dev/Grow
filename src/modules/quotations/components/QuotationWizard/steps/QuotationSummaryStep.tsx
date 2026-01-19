"use client";

import React, { useMemo } from "react";
import { useWatch } from "react-hook-form";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { QuotationFormInput, QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
import { moneyMX } from "@/modules/shared/utils/formatters";

// type Props = StepComponentProps<QuotationFormValues>;
type Props = StepComponentProps<QuotationFormInput>;

function toNumber(v: string): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : NaN;
}



export function QuotationSummaryStep({ form }: Props) {
  const values = useWatch({ control: form.control }) as QuotationFormValues;

  const contactLabel = useMemo(() => {
    return values.customer.partyName?.trim() || "—";
  }, [values.customer.partyName]);

  const registeredSubtotal = useMemo(() => {
    let total = 0;
    for (const r of values.lines ?? []) {
      const qty = Number(r.quantity ?? 0);
      const price = toNumber(String(r.quotedUnitPrice ?? ""));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      total += qty * price;
    }
    return total;
  }, [values.lines]);

  const externalSubtotal = useMemo(() => {
    let total = 0;
    for (const r of values.unregisteredLines ?? []) {
      const qty = Number(r.quantity ?? 0);
      const price = toNumber(String(r.quotedUnitPrice ?? ""));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      total += qty * price;
    }
    return total;
  }, [values.unregisteredLines]);

  const grandTotal = registeredSubtotal + externalSubtotal;

  return (
    <div className="w-full space-y-4">
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">Resumen</h3>

          <div className="mt-2">
            <div className="text-sm opacity-70">Contacto</div>
            <div className="text-base font-medium">{contactLabel}</div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h4 className="font-semibold">Productos registrados</h4>

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
                  const price = toNumber(String(r.quotedUnitPrice ?? ""));
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
                  {moneyMX(registeredSubtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(values.unregisteredLines?.length ?? 0) > 0 ? (
        <div className="card bg-base-200">
          <div className="card-body">
            <h4 className="font-semibold">Productos no registrados</h4>

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
                    const price = toNumber(String(r.quotedUnitPrice ?? ""));
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
                  <span className="text-sm opacity-70">
                    Subtotal no registrados
                  </span>
                  <span className="text-lg font-semibold">
                    {moneyMX(externalSubtotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
