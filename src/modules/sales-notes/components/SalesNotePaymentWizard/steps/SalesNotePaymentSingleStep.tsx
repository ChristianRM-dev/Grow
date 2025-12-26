"use client";

import React, { useMemo } from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import { useSalesNotePaymentWizardMeta } from "../SalesNotePaymentWizard.context";

function toNumberSafe(v: string): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(v: string): string {
  const n = toNumberSafe(v);
  return n.toFixed(2);
}

export function SalesNotePaymentSingleStep({
  form,
}: StepComponentProps<SalesNotePaymentFormValues>) {
  const meta = useSalesNotePaymentWizardMeta();

  const remainingNum = useMemo(
    () => toNumberSafe(meta.remaining),
    [meta.remaining]
  );
  const remainingText = useMemo(
    () => formatMoney(meta.remaining),
    [meta.remaining]
  );

  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  const amountReg = register("amount");

  return (
    <div className="space-y-6">
      {/* Header moved here (no duplicate page title) */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex flex-col gap-1">
            <div className="text-sm opacity-70">
              Nota: <b>{meta.folio}</b> · Cliente: <b>{meta.partyName}</b>
            </div>
            <div className="text-sm opacity-70">
              Total: <b>${formatMoney(meta.total)}</b> · Pagado:{" "}
              <b>${formatMoney(meta.paid)}</b>
            </div>
            <div className="text-base">
              Restante:{" "}
              <span
                className={`font-semibold ${
                  remainingNum <= 0 ? "text-warning" : ""
                }`}
              >
                ${remainingText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {remainingNum <= 0 ? (
        <div className="alert alert-warning">
          <span>
            Esta nota ya está liquidada. No puedes registrar un pago adicional.
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Payment Type */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Tipo de pago</span>
          </label>
          <select
            className={`select select-bordered w-full ${
              errors.paymentType ? "select-error" : ""
            }`}
            {...register("paymentType")}
          >
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="CREDIT">Crédito</option>
            <option value="Exchange">Al cambio</option>
          </select>
          {errors.paymentType?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.paymentType.message)}
            </p>
          ) : null}
        </div>

        {/* Amount (clamped to remaining) */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Monto</span>
          </label>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-70">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              max={remainingNum}
              className={`input input-bordered w-full pl-10 ${
                errors.amount ? "input-error" : ""
              }`}
              placeholder="0.00"
              inputMode="decimal"
              {...amountReg}
              onChange={(e) => {
                amountReg.onChange(e);

                const raw = e.target.value;
                const n = Number(raw);
                if (!Number.isFinite(n)) return;

                if (remainingNum > 0 && n > remainingNum) {
                  setValue("amount", remainingText, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              disabled={remainingNum <= 0}
            />
          </div>

          <p className="mt-1 text-xs opacity-60">
            Máximo permitido: <b>${remainingText}</b>
          </p>

          {errors.amount?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.amount.message)}
            </p>
          ) : null}
        </div>
      </div>

      {/* Reference */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Referencia (opcional)</span>
        </label>
        <input
          className={`input input-bordered w-full ${
            errors.reference ? "input-error" : ""
          }`}
          placeholder="Ej: folio transferencia"
          {...register("reference")}
          disabled={remainingNum <= 0}
        />
        {errors.reference?.message ? (
          <p className="mt-2 text-sm text-error">
            {String(errors.reference.message)}
          </p>
        ) : null}
      </div>

      {/* Notes */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Notas (opcional)</span>
        </label>
        <textarea
          className={`textarea textarea-bordered w-full ${
            errors.notes ? "textarea-error" : ""
          }`}
          placeholder="Información adicional"
          {...register("notes")}
          disabled={remainingNum <= 0}
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
