import { z } from "zod";

/**
 * IMPORTANT:
 * Do NOT import Prisma enums in files used by Client Components (Turbopack).
 * Keep enum values as string literals.
 */
export const PaymentTypeEnum = z.enum([
  "CASH",
  "TRANSFER",
  "CREDIT",
  "Exchange",
]);

const moneyString = z
  .string()
  .trim()
  .min(1, "El monto es requerido")
  .refine(
    (v) => /^\d+(\.\d{1,2})?$/.test(v),
    "Formato inválido (ej: 120 o 120.50)"
  )
  .refine((v) => Number(v) > 0, "El monto debe ser mayor a 0");

export const SalesNotePaymentFormSchema = z.object({
  paymentType: PaymentTypeEnum,
  amount: moneyString,
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

export type SalesNotePaymentFormValues = z.infer<
  typeof SalesNotePaymentFormSchema
>;
