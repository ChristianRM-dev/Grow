// src/modules/quotations/forms/quotationForm.schemas.ts
import { z } from "zod";

// Keep enum values as const arrays so we can reuse them for typing and UI.
// User-visible messages remain in Spanish.
export const QuotationStatusValues = [
  "DRAFT",
  "SENT",
  "CONVERTED",
  "CANCELLED",
] as const;

export type QuotationStatusValue = (typeof QuotationStatusValues)[number];

export const QuotationStatusSchema = z.enum(QuotationStatusValues, {
  message: "Selecciona un estatus",
});

export const CustomerModeEnum = z.enum(["PUBLIC", "PARTY"]);
export const PartyModeEnum = z.enum(["EXISTING", "NEW"]);

/**
 * NOTE:
 * This schema is intentionally permissive because form defaultValues
 * may include newParty even when not in NEW mode.
 * Required fields are enforced via superRefine in the customer schema.
 */
export const NewPartySchema = z.object({
  name: z.string().trim().max(120, "Máximo 120 caracteres").optional(),
  phone: z.string().trim().max(30, "Máximo 30 caracteres").optional(),
  notes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

export const QuotationCustomerSchema = z
  .object({
    mode: CustomerModeEnum,
    partyName: z.string(),
    partyMode: PartyModeEnum.optional(),
    existingPartyId: z.string().trim().optional(),
    existingPartyName: z.string().trim().optional(),
    newParty: NewPartySchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode !== "PARTY") return;

    if (!val.partyMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona tipo de contacto",
        path: ["partyMode"],
      });
      return;
    }

    if (val.partyMode === "NEW") {
      const name = val.newParty?.name?.trim() ?? "";
      if (name.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El nombre es requerido",
          path: ["newParty", "name"],
        });
      }
      return;
    }

    // partyMode === "EXISTING"
    const id = val.existingPartyId?.trim() ?? "";
    const name = val.existingPartyName?.trim() ?? "";

    if (id.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona un contacto",
        path: ["existingPartyId"],
      });
    }

    if (name.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona un contacto",
        path: ["existingPartyName"],
      });
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

export const QuotationUnregisteredLineSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  quantity: z.number().int().min(1, "Cantidad mínima 1"),
  quotedUnitPrice: decimalString,
  description: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
});

export const QuotationLinesStepSchema = z
  .array(QuotationLineSchema)
  .default([]);

export const QuotationUnregisteredLinesStepSchema = z
  .array(QuotationUnregisteredLineSchema)
  .default([]);

// ✅ NO uses .optional() cuando ya tienes .default()
export const QuotationFormSchema = z.object({
  customer: QuotationCustomerSchema,
  lines: QuotationLinesStepSchema, // ✅ Quita .optional().default([])
  unregisteredLines: QuotationUnregisteredLinesStepSchema, // ✅ Agrega .default([])
  status: QuotationStatusSchema.optional(),
});

export type QuotationFormValues = z.infer<typeof QuotationFormSchema>;

