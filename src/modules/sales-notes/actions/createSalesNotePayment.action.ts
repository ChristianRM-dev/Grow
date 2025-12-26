"use server";

import { z } from "zod";
import { SalesNotePaymentFormSchema } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import { createSalesNotePaymentUseCase } from "@/modules/sales-notes/application/createSalesNotePayment.usecase";

const CreateSalesNotePaymentActionSchema = z.object({
  salesNoteId: z.string().min(1),
  values: SalesNotePaymentFormSchema,
});

export async function createSalesNotePaymentAction(
  input: z.infer<typeof CreateSalesNotePaymentActionSchema>
) {
  const parsed = CreateSalesNotePaymentActionSchema.parse(input);
  return createSalesNotePaymentUseCase(parsed);
}
