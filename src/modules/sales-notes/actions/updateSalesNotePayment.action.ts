"use server";

import { z } from "zod";
import { SalesNotePaymentFormSchema } from "@/modules/sales-notes/forms/salesNotePaymentForm.schemas";
import { updateSalesNotePaymentUseCase } from "@/modules/sales-notes/application/updateSalesNotePayment.usecase";

const InputSchema = z.object({
  salesNoteId: z.string().min(1),
  paymentId: z.string().min(1),
  values: SalesNotePaymentFormSchema,
});

export async function updateSalesNotePaymentAction(
  input: z.infer<typeof InputSchema>
) {
  const parsed = InputSchema.parse(input);
  return updateSalesNotePaymentUseCase(parsed);
}
