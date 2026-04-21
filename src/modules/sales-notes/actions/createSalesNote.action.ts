// src/modules/sales-notes/actions/createSalesNote.action.ts
"use server";

import { z } from "zod";
import { SalesNoteFormSchema } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { createSalesNoteUseCase } from "@/modules/sales-notes/application/createSalesNote.usecase";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { createScopedLogger } from "@/modules/shared/observability/scopedLogger";

const CreateSalesNoteActionSchema = z.object({
  clientRequestId: z.string().uuid(),
  values: SalesNoteFormSchema,
});

export type CreateSalesNoteActionInput = z.infer<
  typeof CreateSalesNoteActionSchema
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

export async function createSalesNoteAction(input: CreateSalesNoteActionInput) {
  const traceId = `sn_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const logger = createScopedLogger("createSalesNoteAction", { traceId });

  logger.debug("start", {
    traceId,
    clientRequestId: input.clientRequestId,
    customerMode: input.values?.customer?.mode,
    linesCount: input.values?.lines?.length ?? 0,
    unregisteredLinesCount: input.values?.unregisteredLines?.length ?? 0,
  });

  const parsed = CreateSalesNoteActionSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn("validation_failed", {
      traceId,
      fieldErrors: Object.keys(parsed.error.flatten().fieldErrors),
    });
    return { ok: false as const, errors: parsed.error.flatten(), traceId };
  }

  try {
    logger.debug("validated", {
      traceId,
      customerMode: parsed.data.values.customer.mode,
    });

    const session = await auth();
    const userId = session?.user?.id;
    logger.debug("auth_session_resolved", {
      traceId,
      hasUserId: !!userId,
    });

    const t0 = performance.now();
    const result = await createSalesNoteUseCase(
      parsed.data.values,
      { traceId },
      userId,
      parsed.data.clientRequestId,
    );
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
      message: "No se pudo guardar la nota de venta.",
      traceId,
    };
  }
}
