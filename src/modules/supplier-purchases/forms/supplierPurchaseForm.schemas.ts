import { z } from "zod";

const decimalString = z
  .string()
  .trim()
  .min(1, "El total es requerido")
  .refine(
    (v) => /^\d+(\.\d{1,2})?$/.test(v),
    "Formato inválido (ej: 12 o 12.50)"
  )
  .refine((v) => Number(v) > 0, "El total debe ser mayor a 0");

const dateString = z
  .string()
  .trim()
  .min(1, "La fecha es requerida")
  .refine(
    (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
    "Formato inválido (YYYY-MM-DD)"
  );

export const SupplierPartySelectionSchema = z.object({
  partyId: z.string().trim().min(1, "El proveedor es requerido"),
  partyName: z.string().trim().optional().or(z.literal("")),
  partyPhone: z.string().trim().optional().or(z.literal("")),
});

export const SupplierPurchaseFinalSchema = z.object({
  supplier: SupplierPartySelectionSchema,
  supplierFolio: z
    .string()
    .trim()
    .min(1, "El folio es requerido")
    .max(80, "Máximo 80 caracteres"),
  total: decimalString,
  notes: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  occurredAt: dateString,
});

export type SupplierPurchaseFormValues = z.infer<
  typeof SupplierPurchaseFinalSchema
>;
