"use server";

import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { QuotationFormSchema } from "@/modules/quotations/forms/quotationForm.schemas";
import { updateQuotationUseCase } from "@/modules/quotations/application/updateQuotation.usecase";

const UpdateQuotationActionSchema = z.object({
  id: z.string().min(1),
  values: QuotationFormSchema,
});

export type UpdateQuotationActionInput = z.infer<
  typeof UpdateQuotationActionSchema
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

export async function updateQuotationAction(input: unknown) {
  const traceId = `q_upd_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  console.log(`[updateQuotationAction] start traceId=${traceId}`);

  const parsed = UpdateQuotationActionSchema.safeParse(input);
  if (!parsed.success) {
    console.warn(
      `[updateQuotationAction] validation_failed traceId=${traceId}`,
      parsed.error.flatten()
    );
    return { ok: false as const, errors: parsed.error.flatten(), traceId };
  }

  const { id, values } = parsed.data;

  try {
    const result = await updateQuotationUseCase(id, values, { traceId });

    console.log(
      `[updateQuotationAction] success traceId=${traceId} quotationId=${result.quotationId}`
    );

    return { ok: true as const, quotationId: result.quotationId, traceId };
  } catch (err: unknown) {
    const summary = getErrorSummary(err);
    console.error(`[updateQuotationAction] failed traceId=${traceId}`, summary);

    return {
      ok: false as const,
      message: "No se pudo actualizar la cotización.",
      traceId,
    };
  }
}
