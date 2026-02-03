"use server";

import { z } from "zod";
import { softDeleteSalesNotePaymentUseCase } from "@/modules/sales-notes/application/softDeleteSalesNotePayment.usecase";

const SoftDeleteSalesNotePaymentActionSchema = z.object({
  salesNoteId: z.string().min(1),
  paymentId: z.string().min(1),
});

export async function softDeleteSalesNotePaymentAction(
  input: z.infer<typeof SoftDeleteSalesNotePaymentActionSchema>,
) {
  const parsed = SoftDeleteSalesNotePaymentActionSchema.parse(input);
  return softDeleteSalesNotePaymentUseCase(parsed);
}
