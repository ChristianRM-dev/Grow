// src/modules/reports/domain/purchasesReportFilters.schema.ts
import { z } from "zod";
import { ReportTypeEnum } from "@/modules/reports/domain/reportTypes";

export const PurchasesReportModeEnum = z.enum(["yearMonth", "range"]);
export type PurchasesReportMode = z.infer<typeof PurchasesReportModeEnum>;

const YearSchema = z.coerce.number().int().min(2000).max(2100);
const MonthSchema = z.coerce.number().int().min(1).max(12);

// Usar YYYY-MM-DD para mantener URLs estables y seguras contra zonas horarias
const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (usa YYYY-MM-DD)");

export const PurchasesReportYearMonthFiltersSchema = z.object({
  type: z.literal(ReportTypeEnum.PURCHASES),
  mode: z.literal("yearMonth"),
  year: YearSchema,
  month: MonthSchema.optional(),
});

export const PurchasesReportRangeFiltersSchema = z
  .object({
    type: z.literal(ReportTypeEnum.PURCHASES),
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

export const PurchasesReportFiltersSchema = z.discriminatedUnion("mode", [
  PurchasesReportYearMonthFiltersSchema,
  PurchasesReportRangeFiltersSchema,
]);

export type PurchasesReportFilters = z.infer<
  typeof PurchasesReportFiltersSchema
>;
