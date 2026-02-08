// src/modules/sales-notes/components/SalesNoteWizard/steps/RegisterProductModal.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";

const RegisterProductSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  quantity: z.number().int().min(1, "Cantidad mínima 1"),
  unitPrice: z.string().trim().min(1, "El precio es requerido"),
  description: z.string().trim().max(200).optional(),
  variantName: z.string().trim().max(120).optional(),
  bagSize: z.string().trim().max(60).optional(),
  color: z.string().trim().max(60).optional(),
  shouldRegister: z.boolean(),
});

type RegisterProductFormValues = z.infer<typeof RegisterProductSchema>;

interface RegisterProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RegisterProductFormValues) => void;
  initialData?: Partial<RegisterProductFormValues>;
}

export function RegisterProductModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: RegisterProductModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterProductFormValues>({
    resolver: zodResolver(RegisterProductSchema),
    defaultValues: {
      name: initialData?.name || "",
      quantity: initialData?.quantity || 1,
      unitPrice: initialData?.unitPrice || "",
      description: initialData?.description || "",
      variantName: initialData?.variantName || "",
      bagSize: initialData?.bagSize || "",
      color: initialData?.color || "",
      shouldRegister: initialData?.shouldRegister ?? true, // Siempre tiene valor
    },
  });

  // Log modal visibility changes
  useEffect(() => {
    if (isOpen) {
      salesNoteLogger.info("RegisterProductModal", "Modal opened");
    }
  }, [isOpen]);

  const handleFormSubmit = (data: RegisterProductFormValues) => {
    salesNoteLogger.info("RegisterProductModal", "Form submitted", {
      productName: data.name,
      quantity: data.quantity,
      hasVariant: !!data.variantName,
      hasBagSize: !!data.bagSize,
      hasColor: !!data.color,
      hasDescription: !!data.description,
    });
    onSubmit(data);
    reset();
    onClose();
  };

  const handleCancel = () => {
    salesNoteLogger.info("RegisterProductModal", "Form cancelled by user");
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="text-lg font-bold mb-4">
          Agregar producto para registrar
        </h3>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Primera fila: Nombre y Precio */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
            {/* Nombre (speciesName en ProductVariant) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Nombre del producto
                </span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <input
                className={`input input-bordered w-full ${
                  errors.name ? "input-error" : ""
                }`}
                placeholder="Ej: Rosa, Tulipán, Tierra preparada"
                {...register("name")}
              />
              {errors.name?.message && (
                <p className="mt-1 text-sm text-error">{errors.name.message}</p>
              )}
            </div>

            {/* Precio */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Precio unitario</span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  className={`input input-bordered w-full pl-10 ${
                    errors.unitPrice ? "input-error" : ""
                  }`}
                  placeholder="0.00"
                  inputMode="decimal"
                  {...register("unitPrice")}
                />
              </div>
              {errors.unitPrice?.message && (
                <p className="mt-1 text-sm text-error">
                  {errors.unitPrice.message}
                </p>
              )}
            </div>
          </div>

          {/* Segunda fila: Cantidad y Variante */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
            {/* Cantidad */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Cantidad</span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <input
                type="number"
                min={1}
                className={`input input-bordered w-full ${
                  errors.quantity ? "input-error" : ""
                }`}
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity?.message && (
                <p className="mt-1 text-sm text-error">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Variante */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Variante</span>
                <span className="label-text-alt">Opcional</span>
              </label>
              <input
                className={`input input-bordered w-full ${
                  errors.variantName ? "input-error" : ""
                }`}
                placeholder="Ej: Mini, Premium, Deluxe"
                {...register("variantName")}
              />
              {errors.variantName?.message && (
                <p className="mt-1 text-sm text-error">
                  {errors.variantName.message}
                </p>
              )}
            </div>
          </div>

          {/* Tercera fila: Tamaño y Color */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
            {/* Tamaño de bolsa */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Tamaño de bolsa</span>
                <span className="label-text-alt">Opcional</span>
              </label>
              <input
                className={`input input-bordered w-full ${
                  errors.bagSize ? "input-error" : ""
                }`}
                placeholder="Ej: 1L, 5L, 10L"
                {...register("bagSize")}
              />
              {errors.bagSize?.message && (
                <p className="mt-1 text-sm text-error">
                  {errors.bagSize.message}
                </p>
              )}
            </div>

            {/* Color */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Color</span>
                <span className="label-text-alt">Opcional</span>
              </label>
              <input
                className={`input input-bordered w-full ${
                  errors.color ? "input-error" : ""
                }`}
                placeholder="Ej: Rojo, Blanco, Multicolor"
                {...register("color")}
              />
              {errors.color?.message && (
                <p className="mt-1 text-sm text-error">
                  {errors.color.message}
                </p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Descripción</span>
              <span className="label-text-alt">Opcional</span>
            </label>
            <textarea
              className={`textarea textarea-bordered w-full ${
                errors.description ? "textarea-error" : ""
              }`}
              placeholder="Detalles adicionales del producto"
              rows={3}
              {...register("description")}
            />
            {errors.description?.message && (
              <p className="mt-1 text-sm text-error">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Info box */}
          <div className="alert alert-info mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">
              Este producto se agregará a la venta y se registrará
              automáticamente en el catálogo.
            </span>
          </div>

          {/* Botones */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCancel}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Agregar producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
