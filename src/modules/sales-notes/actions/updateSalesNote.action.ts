"use server";

import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { SalesNoteFormSchema } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { updateSalesNoteUseCase } from "@/modules/sales-notes/application/updateSalesNote.usecase";
import { createScopedLogger } from "@/modules/shared/observability/scopedLogger";

const UpdateSalesNoteActionSchema = z.object({
  id: z.string().min(1),
  values: SalesNoteFormSchema,
});

export type UpdateSalesNoteActionInput = z.infer<
  typeof UpdateSalesNoteActionSchema
>;

function getErrorSummary(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return { kind: "PrismaKnown", code: err.code, meta: err.meta };
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return { kind: "PrismaValidation", message: err.message };
  }
  if (err instanceof Error) {
    return { kind: "Error", message: err.message, stack: err.stack };
  }
  return { kind: "Unknown", message: String(err) };
}

export async function updateSalesNoteAction(input: unknown) {
  const traceId = `sn_upd_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const logger = createScopedLogger("updateSalesNoteAction", { traceId });

  logger.debug("start", { traceId });

  const parsed = UpdateSalesNoteActionSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn("validation_failed", {
      traceId,
      fieldErrors: Object.keys(parsed.error.flatten().fieldErrors),
    });
    return { ok: false as const, errors: parsed.error.flatten(), traceId };
  }

  const { id, values } = parsed.data;

  try {
    logger.debug("validated", {
      traceId,
      salesNoteId: id,
      customerMode: values.customer.mode,
      linesCount: values.lines?.length ?? 0,
      unregisteredLinesCount: values.unregisteredLines?.length ?? 0,
    });

    const t0 = performance.now();
    const result = await updateSalesNoteUseCase(id, values, { traceId });
    const elapsedMs = Math.round(performance.now() - t0);

    logger.info("success", {
      traceId,
      salesNoteId: result.salesNoteId,
      elapsedMs,
    });

    return { ok: true as const, salesNoteId: result.salesNoteId, traceId };
  } catch (err: unknown) {
    const summary = getErrorSummary(err);
    logger.error("failed", {
      traceId,
      errorKind: summary.kind,
      detail: summary,
    });

    return {
      ok: false as const,
      message: "No se pudo actualizar la nota de venta.",
      traceId,
    };
  }
}
