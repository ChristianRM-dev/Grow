"use client";

import React, { useMemo } from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNotePaymentFormValues } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import { useSalesNotePaymentWizardMeta } from "../SalesNotePaymentWizard.context";
import { moneySafe, toNumberSafe } from "@/modules/shared/utils/formatters";

export function SalesNotePaymentSingleStep({
  form,
}: StepComponentProps<SalesNotePaymentFormValues>) {
  const meta = useSalesNotePaymentWizardMeta();

  const maxAmountNum = useMemo(
    () => toNumberSafe(meta.remaining),
    [meta.remaining]
  );
  const maxAmountText = useMemo(
    () => moneySafe(meta.remaining),
    [meta.remaining]
  );

  const totalText = useMemo(() => moneySafe(meta.total), [meta.total]);
  const paidText = useMemo(() => moneySafe(meta.paid), [meta.paid]);

  const labelPaid = meta.mode === "edit" ? "Pagado (sin este pago)" : "Pagado";

  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  const amountReg = register("amount");
  const isLocked = maxAmountNum <= 0;

  return (
    <div className="space-y-6">
      {/* Header inside the step */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex flex-col gap-1">
            <div className="text-sm opacity-70">
              Nota: <b>{meta.folio}</b> · Cliente: <b>{meta.partyName}</b>
            </div>
            <div className="text-sm opacity-70">
              Total: <b>${totalText}</b> · {labelPaid}: <b>${paidText}</b>
            </div>

            <div className="text-base">
              Máximo permitido:{" "}
              <span
                className={`font-semibold ${isLocked ? "text-warning" : ""}`}
              >
                ${maxAmountText}
              </span>
            </div>

            {meta.mode === "edit" && meta.currentAmount ? (
              <div className="text-xs opacity-70">
                Monto actual: <b>${moneySafe(meta.currentAmount)}</b>
              </div>
            ) : null}

            <div className="text-xs opacity-60">
              Dirección inferida: <b>Entrada</b> (el cliente paga al negocio)
            </div>
          </div>
        </div>
      </div>

      {isLocked ? (
        <div className="alert alert-warning">
          <span>
            No hay saldo pendiente disponible para registrar/editar este pago.
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
            disabled={isLocked}
          >
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="CREDIT">Crédito</option>
            <option value="EXCHANGE">Al cambio</option>
          </select>
          {errors.paymentType?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.paymentType.message)}
            </p>
          ) : null}
        </div>

        {/* Amount clamped to max */}
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
              max={maxAmountNum}
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

                if (n > maxAmountNum) {
                  setValue("amount", maxAmountText, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              disabled={isLocked}
            />
          </div>

          <p className="mt-1 text-xs opacity-60">
            Máximo permitido: <b>${maxAmountText}</b>
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
          disabled={isLocked}
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
          disabled={isLocked}
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
