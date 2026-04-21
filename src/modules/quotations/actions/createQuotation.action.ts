"use server";

import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { QuotationFormSchema } from "@/modules/quotations/forms/quotationForm.schemas";
import { createQuotationUseCase } from "@/modules/quotations/application/createQuotation.usecase";
import { createScopedLogger } from "@/modules/shared/observability/scopedLogger";

const CreateQuotationActionSchema = QuotationFormSchema;

export type CreateQuotationActionInput = z.infer<
  typeof CreateQuotationActionSchema
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

export async function createQuotationAction(input: unknown) {
  const traceId = `q_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const logger = createScopedLogger("createQuotationAction", { traceId });

  logger.debug("start", { traceId });

  const parsed = CreateQuotationActionSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn("validation_failed", {
      traceId,
      fieldErrors: Object.keys(parsed.error.flatten().fieldErrors),
    });
    return { ok: false as const, errors: parsed.error.flatten(), traceId };
  }

  try {
    const result = await createQuotationUseCase(parsed.data, { traceId });

    logger.info("success", {
      traceId,
      quotationId: result.quotationId,
    });

    return { ok: true as const, quotationId: result.quotationId, traceId };
  } catch (err: unknown) {
    const summary = getErrorSummary(err);
    logger.error("failed", {
      traceId,
      errorKind: summary.kind,
      detail: summary,
    });

    return {
      ok: false as const,
      message: "No se pudo guardar la cotización.",
      traceId,
    };
  }
}
