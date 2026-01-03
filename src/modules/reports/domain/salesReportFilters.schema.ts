import { z } from "zod";
import { ReportTypeEnum } from "./reportTypes";

export const SalesReportModeEnum = z.enum(["yearMonth", "range"]);
export type SalesReportMode = z.infer<typeof SalesReportModeEnum>;

const YearSchema = z.coerce.number().int().min(2000).max(2100);
const MonthSchema = z.coerce.number().int().min(1).max(12);

// Use YYYY-MM-DD to keep URLs stable and timezone-safe.
const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (usa YYYY-MM-DD)");

export const SalesReportYearMonthFiltersSchema = z.object({
  type: z.literal(ReportTypeEnum.SALES),
  mode: z.literal("yearMonth"),
  year: YearSchema,
  month: MonthSchema.optional(),
});

export const SalesReportRangeFiltersSchema = z
  .object({
    type: z.literal(ReportTypeEnum.SALES),
    mode: z.literal("range"),
    from: DateOnlySchema,
    to: DateOnlySchema,
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
  });

export const SalesReportFiltersSchema = z.discriminatedUnion("mode", [
  SalesReportYearMonthFiltersSchema,
  SalesReportRangeFiltersSchema,
]);

export type SalesReportFilters = z.infer<typeof SalesReportFiltersSchema>;
