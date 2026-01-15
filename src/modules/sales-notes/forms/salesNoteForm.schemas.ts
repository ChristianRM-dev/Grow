import { z } from "zod";

export const CustomerModeEnum = z.enum(["PUBLIC", "PARTY"]);
export const PartyModeEnum = z.enum(["EXISTING", "NEW"]);

export const NewPartySchema = z.object({
  name: z.string().trim().max(120, "Máximo 120 caracteres").optional(),
  phone: z.string().trim().max(30, "Máximo 30 caracteres").optional(),
  notes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

export const SalesNoteCustomerStepSchema = z.object({
  mode: CustomerModeEnum,
  partyMode: PartyModeEnum.optional(),
  existingPartyId: z.string().optional(),
  existingPartyName: z.string().optional(),
  newParty: NewPartySchema.optional(),
});

const normalizeMoneyString = (v: string) =>
  String(v ?? "")
    .trim()
    .replace(/\$/g, "")
    .replace(/\s+/g, "")
    .replace(/,/g, ".");

const decimalString = z
  .string()
  .transform((v) => normalizeMoneyString(v))
  .refine((v) => v.length > 0, "El precio es requerido")
  .refine(
    (v) => /^\d+(\.\d{1,2})?$/.test(v),
    "Formato inválido (ej: 12 o 12.50)"
  )
  .refine((v) => Number(v) > 0, "El precio debe ser mayor a 0");

export const SalesNoteLineSchema = z.object({
  productVariantId: z.string().trim().min(1, "Selecciona un producto"),
  productName: z.string().trim().min(1, "Selecciona un producto"),
  quantity: z.number().int().min(1, "Cantidad mínima 1"),
  unitPrice: decimalString,
  description: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
});

export const SalesNoteUnregisteredLineSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  quantity: z.number().int().min(1, "Cantidad mínima 1"),
  unitPrice: decimalString,
  description: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
  // 👇 Nuevos campos
  shouldRegister: z.boolean().default(false),
  // Campos opcionales para registro completo
  variantName: z.string().trim().max(120).optional(),
  bagSize: z.string().trim().max(60).optional(),
  color: z.string().trim().max(60).optional(),
});

export const SalesNoteLinesStepSchema = z
  .array(SalesNoteLineSchema)
  .default([]);

export const SalesNoteUnregisteredLinesStepSchema = z
  .array(SalesNoteUnregisteredLineSchema)
  .default([]);

// Define el esquema sin transformaciones complejas
export const SalesNoteFormSchema = z.object({
  customer: SalesNoteCustomerStepSchema,
  lines: SalesNoteLinesStepSchema, // ✅ Quita .optional().default([])
  unregisteredLines: SalesNoteUnregisteredLinesStepSchema, // ✅ Agrega .default([])
});

// Define un tipo TypeScript manualmente para evitar problemas de inferencia
// Elimina el tipo manual y usa el inferido de Zod
export type SalesNoteFormValues = z.output<typeof SalesNoteFormSchema>;
export type SalesNoteFormInput = z.input<typeof SalesNoteFormSchema>;


