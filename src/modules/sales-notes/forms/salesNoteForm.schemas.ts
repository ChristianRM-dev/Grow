import { z } from "zod";

export const CustomerModeEnum = z.enum(["PUBLIC", "PARTY"]);
export const PartyModeEnum = z.enum(["EXISTING", "NEW"]);

/**
 * NOTE:
 * This schema must be permissive because RHF defaultValues often include
 * an object for newParty even when the user is not in "NEW" party mode.
 * We enforce required fields conditionally in the step superRefine.
 */
export const NewPartySchema = z.object({
  name: z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

  export const SalesNoteCustomerStepSchema = z
    .object({
      mode: CustomerModeEnum,
      partyMode: PartyModeEnum.optional(),
      existingPartyId: z.string().optional(),
      existingPartyName: z.string().optional(), // ✅ NEW (solo para UI/summary)
      newParty: NewPartySchema.optional(),
    })
    .superRefine((v, ctx) => {
      if (v.mode === "PUBLIC") return;

      if (!v.partyMode) {
        ctx.addIssue({
          code: "custom",
          path: ["partyMode"],
          message: "Selecciona una opción",
        });
        return;
      }

      if (v.partyMode === "EXISTING") {
        const id = v.existingPartyId?.trim() ?? "";
        if (!id) {
          ctx.addIssue({
            code: "custom",
            path: ["existingPartyId"],
            message: "Selecciona un cliente",
          });
        }
        return;
      }

      const name = v.newParty?.name?.trim() ?? "";
      if (!name) {
        ctx.addIssue({
          code: "custom",
          path: ["newParty", "name"],
          message: "El nombre es requerido",
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

export const SalesNoteLineSchema = z.object({
  productVariantId: z.string().trim().min(1, "Selecciona un producto"),
  productName: z.string().trim().min(1, "Selecciona un producto"),
  quantity: z.number().int().min(1, "Cantidad mínima 1"),
  unitPrice: decimalString,
  description: z
    .string()
    .trim()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .or(z.literal("")),
});

export const SalesNoteLinesStepSchema = z
  .array(SalesNoteLineSchema)
  .min(1, "Agrega al menos un producto")
  .superRefine((lines, ctx) => {
    const seen = new Set<string>();
    for (let i = 0; i < lines.length; i++) {
      const id = lines[i]?.productVariantId?.trim();
      if (!id) continue;
      if (seen.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: [i, "productVariantId"],
          message: "Producto duplicado",
        });
      }
      seen.add(id);
    }
  });

export const SalesNoteUnregisteredLineSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  quantity: z.number().int().min(1, "Cantidad mínima 1"),
  unitPrice: decimalString,
  description: z
    .string()
    .trim()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .or(z.literal("")),
});

export const SalesNoteUnregisteredLinesStepSchema = z
  .array(SalesNoteUnregisteredLineSchema)
  // IMPORTANT: optional step -> empty array is valid
  .default([]);

export const SalesNoteFormSchema = z.object({
  customer: SalesNoteCustomerStepSchema,
  lines: SalesNoteLinesStepSchema,
  unregisteredLines: SalesNoteUnregisteredLinesStepSchema,
});

export type SalesNoteFormValues = z.infer<typeof SalesNoteFormSchema>;
