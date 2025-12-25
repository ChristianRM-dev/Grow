"use client";

import React from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { ProductVariantFormValues } from "@/modules/products/forms/productVariantForm.schemas";

export function ProductVariantSingleStep({
  form,
}: StepComponentProps<ProductVariantFormValues>) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      {/* Primera fila: Especie y Precio */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Especie - Ocupa más espacio */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Especie</span>
          </label>
          <input
            className={`input input-bordered w-full ${
              errors.speciesName ? "input-error" : ""
            }`}
            placeholder="Ejemplo: Rosa, Tulipán, Girasol"
            {...register("speciesName")}
          />
          {errors.speciesName?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.speciesName.message)}
            </p>
          ) : null}
        </div>

        {/* Precio */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Precio por defecto</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              className={`input input-bordered w-full pl-10 ${
                errors.defaultPrice ? "input-error" : ""
              }`}
              placeholder="0.00"
              inputMode="decimal"
              {...register("defaultPrice")}
            />
          </div>
          {errors.defaultPrice?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.defaultPrice.message)}
            </p>
          ) : null}
        </div>
      </div>

      {/* Segunda fila: Resto de campos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Variante */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Variante</span>
          </label>
          <input
            className={`input input-bordered w-full ${
              errors.variantName ? "input-error" : ""
            }`}
            placeholder="Ejemplo: Mini, Premium, Deluxe"
            {...register("variantName")}
          />
          {errors.variantName?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.variantName.message)}
            </p>
          ) : null}
        </div>

        {/* Tamaño de bolsa */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Tamaño de bolsa</span>
          </label>
          <input
            className={`input input-bordered w-full ${
              errors.bagSize ? "input-error" : ""
            }`}
            placeholder="Ejemplo: 1L, 5L, 10L"
            {...register("bagSize")}
          />
          {errors.bagSize?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.bagSize.message)}
            </p>
          ) : null}
        </div>

        {/* Color */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Color</span>
          </label>
          <input
            className={`input input-bordered w-full ${
              errors.color ? "input-error" : ""
            }`}
            placeholder="Ejemplo: Rojo, Blanco, Multicolor"
            {...register("color")}
          />
          {errors.color?.message ? (
            <p className="mt-2 text-sm text-error">
              {String(errors.color.message)}
            </p>
          ) : null}
        </div>
      </div>

      {/* Nota sobre campos opcionales */}
      <div className="mt-4 text-sm text-gray-500 border-t pt-4">
        <p>
          Nota: Los campos marcados como Opcional pueden dejarse en blanco si no
          aplican para esta variante.
        </p>
      </div>
    </div>
  );
}
