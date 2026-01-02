import { z } from "zod";
import { QuotationStatus } from "@/generated/prisma/client";

export const CustomerModeEnum = z.enum(["PUBLIC", "PARTY"]);
export const PartyModeEnum = z.enum(["EXISTING", "NEW"]);

export const NewPartySchema = z.object({
  name: z.string().trim().max(120, "Máximo 120 caracteres").optional(),
  phone: z.string().trim().max(30, "Máximo 30 caracteres").optional(),
  notes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

export const QuotationCustomerSchema = z
  .object({
    mode: CustomerModeEnum,
    partyMode: PartyModeEnum.optional(),
    existingPartyId: z.string().trim().optional(),
    existingPartyName: z.string().trim().optional(),
    newParty: NewPartySchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === "PARTY") {
      if (!val.partyMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona tipo de contacto",
          path: ["partyMode"],
        });
        return;
      }

      if (val.partyMode === "NEW") {
        if (!val.newParty?.name || val.newParty.name.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El nombre es requerido",
            path: ["newParty", "name"],
          });
        }
        return;
      }

      // partyMode === EXISTING
      if (!val.existingPartyId || val.existingPartyId.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona un contacto",
          path: ["existingPartyId"],
        });
      }
      if (
        !val.existingPartyName ||
        val.existingPartyName.trim().length === 0
      ) {
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
  status: z.nativeEnum(QuotationStatus).optional(),
});

export type QuotationFormValues = {
  customer: {
    mode: "PUBLIC" | "PARTY";
    partyMode?: "EXISTING" | "NEW";
    existingPartyId?: string;
    existingPartyName?: string;
    newParty?: {
      name?: string;
      phone?: string;
      notes?: string;
    };
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
