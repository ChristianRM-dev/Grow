"use client";

import React, { useMemo } from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SupplierPurchasePaymentFormValues } from "@/modules/supplier-purchases/forms/supplierPurchasePaymentForm.schemas";
import { useSupplierPurchasePaymentWizardMeta } from "../SupplierPurchasePaymentWizard.context";
import { money } from "@/modules/shared/utils/formatters";

function toNumberSafe(v: string): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

export function SupplierPurchasePaymentSingleStep({
  form,
}: StepComponentProps<SupplierPurchasePaymentFormValues>) {
  const meta = useSupplierPurchasePaymentWizardMeta();

  const totalText = useMemo(
    () => money(meta.purchaseTotal),
    [meta.purchaseTotal]
  );
  const paidText = useMemo(() => money(meta.paidTotal), [meta.paidTotal]);
  const remainingText = useMemo(
    () => money(meta.remainingTotal),
    [meta.remainingTotal]
  );

  const maxAmountNum = useMemo(
    () => toNumberSafe(meta.remainingTotal),
    [meta.remainingTotal]
  );
  const maxAmountText = useMemo(
    () => money(meta.remainingTotal),
    [meta.remainingTotal]
  );

  const isLocked = maxAmountNum <= 0;

  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  const amountReg = register("amount");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex flex-col gap-1">
            <div className="text-sm opacity-70">
              Compra: <b>{meta.supplierFolio}</b> · Proveedor:{" "}
              <b>{meta.partyName}</b>
            </div>

            <div className="text-sm opacity-70">
              Total: <b>${totalText}</b> ·{" "}
              {meta.mode === "edit" ? (
                <>
                  Pagado (sin este pago): <b>${paidText}</b>
                </>
              ) : (
                <>
                  Pagado: <b>${paidText}</b>
                </>
              )}
            </div>

            <div className="text-base">
              {meta.mode === "edit" ? "Máximo permitido" : "Resta por pagar"}:{" "}
              <span
                className={`font-semibold ${isLocked ? "text-success" : ""}`}
              >
                ${remainingText}
              </span>
            </div>

            {meta.mode === "edit" && meta.currentAmount ? (
              <div className="text-xs opacity-70">
                Monto actual: <b>${money(meta.currentAmount)}</b>
              </div>
            ) : null}

            <div className="text-xs opacity-60">
              Dirección inferida: <b>Salida</b> (el negocio paga al proveedor)
            </div>
          </div>
        </div>
      </div>

      {isLocked ? (
        <div className="alert alert-success">
          <span>
            {meta.mode === "edit"
              ? "No hay saldo disponible para editar este pago."
              : "Esta compra ya está completamente pagada."}
          </span>
        </div>
      ) : null}

      {isLocked ? (
        <div className="alert alert-success">
          <span>Esta compra ya está completamente pagada.</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Tipo de pago */}
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
            <option value="Exchange">Al cambio</option>
          </select>
          {errors.paymentType?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.paymentType.message)}
            </p>
          ) : null}
        </div>

        {/* Monto (clamp a restante) */}
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

      {/* Fecha + Referencia */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Fecha</span>
          </label>
          <input
            type="date"
            className={`input input-bordered w-full ${
              errors.occurredAt ? "input-error" : ""
            }`}
            {...register("occurredAt")}
            disabled={isLocked}
          />
          {errors.occurredAt?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.occurredAt.message)}
            </p>
          ) : null}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">
              Referencia (opcional)
            </span>
          </label>
          <input
            className={`input input-bordered w-full ${
              errors.reference ? "input-error" : ""
            }`}
            placeholder={`Ej: transferencia`}
            {...register("reference")}
            disabled={isLocked}
          />
          {errors.reference?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.reference.message)}
            </p>
          ) : null}
        </div>
      </div>

      {/* Notas */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Notas (opcional)</span>
        </label>
        <textarea
          className={`textarea textarea-bordered w-full ${
            errors.notes ? "textarea-error" : ""
          }`}
          placeholder="Información adicional"
          rows={4}
          {...register("notes")}
          disabled={isLocked}
        />
        {errors.notes?.message ? (
          <p className="mt-2 text-sm text-error">
            {String(errors.notes.message)}
          </p>
        ) : null}
      </div>

      {/* Hidden */}
      <input type="hidden" {...register("partyId")} />
      <input type="hidden" {...register("supplierPurchaseId")} />
      <input type="hidden" {...register("supplierFolio")} />
    </div>
  );
}
