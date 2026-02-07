// src/modules/reports/domain/purchasesReportFilters.schema.ts
import { z } from "zod"
import { ReportTypeEnum } from "@/modules/reports/domain/reportTypes"

export const PurchasesReportModeEnum = z.enum(["yearMonth", "range"])
export type PurchasesReportMode = z.infer<typeof PurchasesReportModeEnum>

export const PurchasesPaymentStatusEnum = z.enum(["all", "paid", "pending"])
export type PurchasesPaymentStatus = z.infer<typeof PurchasesPaymentStatusEnum>

export const PartyFilterModeEnum = z.enum(["include", "exclude"])
export type PartyFilterMode = z.infer<typeof PartyFilterModeEnum>

const YearSchema = z.coerce.number().int().min(2000).max(2100)
const MonthSchema = z.coerce.number().int().min(1).max(12)

const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (usa YYYY-MM-DD)")

// Extra filters fields (multi-party support)
const PurchasesExtraFiltersSchema = {
  status: PurchasesPaymentStatusEnum.optional(), // default handled in UI/query
  partyIds: z.array(z.string().trim().min(1)).optional(),
  partyFilterMode: PartyFilterModeEnum.optional(),
}

function refinePartySelection(
  val: { partyIds?: string[]; partyFilterMode?: string },
  ctx: z.RefinementCtx
) {
  // If partyIds is present and not empty, require partyFilterMode
  if (val.partyIds && val.partyIds.length > 0 && !val.partyFilterMode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecciona un modo de filtro (incluir o excluir).",
      path: ["partyFilterMode"],
    })
  }

  // If partyFilterMode is present, require at least one partyId
  if (val.partyFilterMode && (!val.partyIds || val.partyIds.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecciona al menos un proveedor.",
      path: ["partyIds"],
    })
  }
}

export const PurchasesReportYearMonthFiltersSchema = z
  .object({
    type: z.literal(ReportTypeEnum.PURCHASES),
    mode: z.literal("yearMonth"),
    year: YearSchema,
    month: MonthSchema.optional(),
  })
  .extend(PurchasesExtraFiltersSchema)
  .superRefine((val, ctx) => {
    refinePartySelection(val, ctx)
  })

export const PurchasesReportRangeFiltersSchema = z
  .object({
    type: z.literal(ReportTypeEnum.PURCHASES),
    mode: z.literal("range"),
    from: DateOnlySchema,
    to: DateOnlySchema,
  })
  .extend(PurchasesExtraFiltersSchema)
  .superRefine((val, ctx) => {
    if (val.from > val.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "El rango es inválido: 'Desde' debe ser menor o igual que 'Hasta'.",
        path: ["from"],
      })
    }

    refinePartySelection(val, ctx)
  })

export const PurchasesReportFiltersSchema = z.discriminatedUnion("mode", [
  PurchasesReportYearMonthFiltersSchema,
  PurchasesReportRangeFiltersSchema,
])

export type PurchasesReportFilters = z.infer<typeof PurchasesReportFiltersSchema>
