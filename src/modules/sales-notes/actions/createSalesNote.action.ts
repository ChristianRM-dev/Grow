// src/modules/sales-notes/actions/createSalesNote.action.ts
"use server";

import { z } from "zod";
import { SalesNoteFormSchema } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import { createSalesNoteUseCase } from "@/modules/sales-notes/application/createSalesNote.usecase";
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";

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

  console.log(`[createSalesNoteAction] start traceId=${traceId}`);
  salesNoteLogger.info("createSalesNoteAction", "Action invoked", {
    traceId,
    clientRequestId: input.clientRequestId,
    customerMode: input.values?.customer?.mode,
    linesCount: input.values?.lines?.length ?? 0,
    unregisteredLinesCount: input.values?.unregisteredLines?.length ?? 0,
  });

  const parsed = CreateSalesNoteActionSchema.safeParse(input);
  if (!parsed.success) {
    console.warn(
      `[createSalesNoteAction] validation_failed traceId=${traceId}`,
      parsed.error.flatten(),
    );
    salesNoteLogger.warn("createSalesNoteAction", "Input validation failed", {
      traceId,
      fieldErrors: Object.keys(parsed.error.flatten().fieldErrors),
    });
    return { ok: false as const, errors: parsed.error.flatten(), traceId };
  }

  try {
    console.log(
      `[createSalesNoteAction] validated traceId=${traceId} customer.mode=${parsed.data.values.customer.mode}`,
    );
    salesNoteLogger.info("createSalesNoteAction", "Input validated, calling use case", {
      traceId,
      customerMode: parsed.data.values.customer.mode,
    });

    const session = await auth();
    const userId = session?.user?.id;
    salesNoteLogger.info("createSalesNoteAction", "Auth session resolved", {
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

    console.log(
      `[createSalesNoteAction] success traceId=${traceId} salesNoteId=${result.salesNoteId}`,
    );
    salesNoteLogger.info("createSalesNoteAction", "Use case completed successfully", {
      traceId,
      salesNoteId: result.salesNoteId,
      elapsedMs,
    });

    return { ok: true as const, salesNoteId: result.salesNoteId, traceId };
  } catch (err: unknown) {
    const summary = getErrorSummary(err);
    console.error(`[createSalesNoteAction] failed traceId=${traceId}`, summary);
    salesNoteLogger.error("createSalesNoteAction", "Use case failed", {
      traceId,
      errorKind: summary.kind,
    });

    return {
      ok: false as const,
      message: "No se pudo guardar la nota de venta.",
      traceId,
    };
  }
}
