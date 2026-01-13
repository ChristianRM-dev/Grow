// src/modules/reports/domain/salesReportFilters.schema.ts
import { z } from "zod";
import { ReportTypeEnum } from "./reportTypes";

export const SalesReportModeEnum = z.enum(["yearMonth", "range"]);
export type SalesReportMode = z.infer<typeof SalesReportModeEnum>;

export const SalesPaymentStatusEnum = z.enum(["all", "paid", "pending"]);
export type SalesPaymentStatus = z.infer<typeof SalesPaymentStatusEnum>;

const YearSchema = z.coerce.number().int().min(2000).max(2100);
const MonthSchema = z.coerce.number().int().min(1).max(12);

// Use YYYY-MM-DD to keep URLs stable and timezone-safe.
const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (usa YYYY-MM-DD)");

// Extra filters fields (ONLY fields; no .and/.intersection)
const ExtraFiltersFields = {
  status: SalesPaymentStatusEnum.optional(), // default handled in UI/query
  partyId: z.string().trim().min(1).optional(),
  partyName: z.string().trim().min(1).optional(), // only for client hydration
} as const;

function refinePartySelection(
  val: { partyId?: string; partyName?: string },
  ctx: z.RefinementCtx
) {
  // If partyName is present, require partyId (avoid label-only state)
  if (val.partyName && !val.partyId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecciona un cliente válido.",
      path: ["partyId"],
    });
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
    refinePartySelection(val, ctx);
  });

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
      });
    }

    refinePartySelection(val, ctx);
  });

export const SalesReportFiltersSchema = z.discriminatedUnion("mode", [
  SalesReportYearMonthFiltersSchema,
  SalesReportRangeFiltersSchema,
]);

export type SalesReportFilters = z.infer<typeof SalesReportFiltersSchema>;
