import { z } from "zod";

/**
 * NOTE: Keep form values serializable and UI-friendly.
 * We keep defaultPrice as string to avoid float issues and to allow user input like "12.50".
 */
const decimalString = z
  .string()
  .trim()
  .min(1, "El precio es requerido")
  .refine(
    (v) => /^\d+(\.\d{1,2})?$/.test(v),
    "Formato inválido (ej: 12 o 12.50)"
  )
  .refine((v) => Number(v) > 0, "El precio debe ser mayor a 0");

export const ProductVariantBasicSchema = z.object({
  speciesName: z.string().trim().min(1, "La especie es requerida"),
  variantName: z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean(),
});

export const ProductVariantDetailsSchema = z.object({
  bagSize: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres")
    .optional()
    .or(z.literal("")),
  color: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres")
    .optional()
    .or(z.literal("")),
  defaultPrice: decimalString,
});

export const ProductVariantFinalSchema = ProductVariantBasicSchema.merge(
  ProductVariantDetailsSchema
);

export type ProductVariantFormValues = z.infer<
  typeof ProductVariantFinalSchema
>;
