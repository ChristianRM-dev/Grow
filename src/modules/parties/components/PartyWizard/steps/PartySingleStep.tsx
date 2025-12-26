"use client";

import React from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { PartyFormValues } from "@/modules/parties/forms/partyForm.schemas";

export function PartySingleStep({ form }: StepComponentProps<PartyFormValues>) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Name */}
        <div className="form-control md:col-span-2">
          <label className="label">
            <span className="label-text font-medium">Nombre</span>
          </label>
          <input
            className={`input input-bordered w-full ${
              errors.name ? "input-error" : ""
            }`}
            placeholder="Ej: Vivero Los Laureles"
            {...register("name")}
          />
          {errors.name?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.name.message)}
            </p>
          ) : null}
        </div>

        {/* Phone */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Teléfono (opcional)</span>
          </label>
          <input
            className={`input input-bordered w-full ${
              errors.phone ? "input-error" : ""
            }`}
            placeholder="Ej: 8112345678"
            inputMode="tel"
            {...register("phone")}
          />
          {errors.phone?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.phone.message)}
            </p>
          ) : null}
        </div>

        {/* Roles */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Tipo</span>
          </label>

          <div className="flex flex-col gap-2">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox"
                {...register("roles.isCustomer")}
              />
              <span className="label-text">Cliente</span>
            </label>

            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox"
                {...register("roles.isSupplier")}
              />
              <span className="label-text">Proveedor</span>
            </label>
          </div>

          {/* The refine error is attached to roles */}
          {(errors.roles as any)?.message ? (
            <p className="mt-2 text-sm text-error">
              {String((errors.roles as any).message)}
            </p>
          ) : null}
        </div>
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
          rows={4}
          {...register("notes")}
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
