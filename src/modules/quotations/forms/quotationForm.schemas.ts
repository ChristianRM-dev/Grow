import { z } from "zod";

// Define el enum localmente en lugar de importarlo de Prisma
export const QuotationStatus = z.enum([
  "DRAFT",
  "SENT",
  "CONVERTED",
  "CANCELLED",
]);

export const CustomerModeEnum = z.enum(["PUBLIC", "PARTY"]);

export const QuotationCustomerSchema = z
  .object({
    mode: CustomerModeEnum,
    existingPartyId: z.string().trim().optional(),
    existingPartyName: z.string().trim().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === "PARTY") {
      if (!val.existingPartyId || val.existingPartyId.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona un contacto",
          path: ["existingPartyId"],
        });
      }
      if (!val.existingPartyName || val.existingPartyName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona un contacto",
          path: ["existingPartyName"],
        });
      }
    }
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
  status: QuotationStatus.optional(),
});

export type QuotationFormValues = {
  customer: {
    mode: "PUBLIC" | "PARTY";
    existingPartyId?: string;
    existingPartyName?: string;
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
