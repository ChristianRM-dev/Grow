import { z } from "zod";
import { QuotationStatus } from "@/generated/prisma/client";

export const QuotationCustomerSchema = z.object({
  partyId: z.string().trim().min(1, "Selecciona un contacto"),
  partyName: z.string().trim().min(1, "Selecciona un contacto"),
});

const decimalString = z
  .string()
  .trim()
  .min(1, "El precio es requerido")
  .refine(
    (v) => /^\d+(\.\d{1,2})?$/.test(v),
    "Formato inválido (ej: 12 o 12.50)"
  )
  .refine((v) => Number(v) > 0, "El precio debe ser mayor a 0");

export const QuotationLineSchema = z.object({
  productVariantId: z.string().trim().min(1, "Selecciona un producto"),
  productName: z.string().trim().min(1, "Selecciona un producto"),
  quantity: z.number().int().min(1, "Cantidad mínima 1"),
  quotedUnitPrice: decimalString,
  description: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
});

export const QuotationLinesStepSchema = z
  .array(QuotationLineSchema)
  .min(1, "Agrega al menos un producto");

export const QuotationUnregisteredLineSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  quantity: z.number().int().min(1, "Cantidad mínima 1"),
  quotedUnitPrice: decimalString,
  description: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
});

export const QuotationUnregisteredLinesStepSchema = z.array(
  QuotationUnregisteredLineSchema
);

export const QuotationFormSchema = z.object({
  customer: QuotationCustomerSchema,
  lines: QuotationLinesStepSchema,
  unregisteredLines: QuotationUnregisteredLinesStepSchema,
  status: z.nativeEnum(QuotationStatus).optional(),
});

export type QuotationFormValues = {
  customer: {
    partyId: string;
    partyName: string;
  };
  lines: Array<{
    productVariantId: string;
    productName: string;
    quantity: number;
    quotedUnitPrice: string;
    description?: string;
  }>;
  unregisteredLines: Array<{
    name: string;
    quantity: number;
    quotedUnitPrice: string;
    description?: string;
  }>;
  status?: (typeof QuotationStatus)[keyof typeof QuotationStatus];
};
