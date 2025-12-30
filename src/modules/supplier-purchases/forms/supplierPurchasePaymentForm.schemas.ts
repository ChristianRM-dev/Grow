import { z } from "zod";

const decimalString = z
  .string()
  .trim()
  .min(1, "El monto es requerido")
  .refine(
    (v) => /^\d+(\.\d{1,2})?$/.test(v),
    "Formato inválido (ej: 12 o 12.50)"
  )
  .refine((v) => Number(v) > 0, "El monto debe ser mayor a 0");

const dateString = z
  .string()
  .trim()
  .min(1, "La fecha es requerida")
  .refine(
    (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
    "Formato inválido (YYYY-MM-DD)"
  );

export const SupplierPurchasePaymentFinalSchema = z.object({
  supplierPurchaseId: z.string().trim().min(1, "La compra es requerida"),
  supplierFolio: z.string().trim().min(1, "El folio es requerido"),
  partyId: z.string().trim().min(1, "El proveedor es requerido"),

  paymentType: z.enum(["CASH", "TRANSFER", "CREDIT", "Exchange"], {
    message: "Selecciona un tipo de pago",
  }),

  amount: decimalString,
  occurredAt: dateString,

  reference: z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type SupplierPurchasePaymentFormValues = z.infer<
  typeof SupplierPurchasePaymentFinalSchema
>;
