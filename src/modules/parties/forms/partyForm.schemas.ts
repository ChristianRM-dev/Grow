import { z } from "zod";

export const PartyRolesSchema = z
  .object({
    isCustomer: z.boolean(),
    isSupplier: z.boolean(),
  })
  .refine((v) => v.isCustomer || v.isSupplier, {
    message: "Selecciona al menos un tipo: Cliente o Proveedor",
  });

export const PartyFinalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .max(120, "Máximo 120 caracteres"),
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
  roles: PartyRolesSchema,
});

export type PartyFormValues = z.infer<typeof PartyFinalSchema>;
