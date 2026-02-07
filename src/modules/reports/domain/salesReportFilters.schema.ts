// src/modules/reports/domain/salesReportFilters.schema.ts
import { z } from "zod"
import { ReportTypeEnum } from "./reportTypes"

export const SalesReportModeEnum = z.enum(["yearMonth", "range"])
export type SalesReportMode = z.infer<typeof SalesReportModeEnum>

export const SalesPaymentStatusEnum = z.enum(["all", "paid", "pending"])
export type SalesPaymentStatus = z.infer<typeof SalesPaymentStatusEnum>

export const PartyFilterModeEnum = z.enum(["include", "exclude"])
export type PartyFilterMode = z.infer<typeof PartyFilterModeEnum>

const YearSchema = z.coerce.number().int().min(2000).max(2100)
const MonthSchema = z.coerce.number().int().min(1).max(12)

// Use YYYY-MM-DD to keep URLs stable and timezone-safe.
const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (usa YYYY-MM-DD)")

// Extra filters fields (multi-party support)
const ExtraFiltersFields = {
  status: SalesPaymentStatusEnum.optional(), // default handled in UI/query
  partyIds: z.array(z.string().trim().min(1)).optional(),
  partyFilterMode: PartyFilterModeEnum.optional(),
} as const

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
      message: "Selecciona al menos un cliente.",
      path: ["partyIds"],
    })
  }
}

export const SalesReportYearMonthFiltersSchema = z
  .object({
    type: z.literal(ReportTypeEnum.SALES),
    mode: z.literal("yearMonth"),
    year: YearSchema,
    month: MonthSchema.optional(),
    ...ExtraFiltersFields,
  })
  .superRefine((val, ctx) => {
    refinePartySelection(val, ctx)
  })

export const SalesReportRangeFiltersSchema = z
  .object({
    type: z.literal(ReportTypeEnum.SALES),
    mode: z.literal("range"),
    from: DateOnlySchema,
    to: DateOnlySchema,
    ...ExtraFiltersFields,
  })
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

export const SalesReportFiltersSchema = z.discriminatedUnion("mode", [
  SalesReportYearMonthFiltersSchema,
  SalesReportRangeFiltersSchema,
])

export type SalesReportFilters = z.infer<typeof SalesReportFiltersSchema>
