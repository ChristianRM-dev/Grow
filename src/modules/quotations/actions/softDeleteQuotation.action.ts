"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const SoftDeleteQuotationInputSchema = z.object({
  id: z.string().min(1),
});

export type SoftDeleteQuotationInput = z.infer<
  typeof SoftDeleteQuotationInputSchema
>;

export async function softDeleteQuotationAction(
  input: SoftDeleteQuotationInput,
) {
  const { id } = SoftDeleteQuotationInputSchema.parse(input);

  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado.");
  }

  if (session.user.role === "READ_ONLY") {
    throw new Error("No tienes permisos para realizar esta acción.");
  }

  return await prisma.$transaction(async (tx) => {
    const now = new Date();
    const quotation = await tx.quotation.findUnique({
      where: { id },
      select: {
        id: true,
        folio: true,
        isDeleted: true,
        status: true,
      },
    });

    if (!quotation) {
      throw new Error("Cotización no encontrada.");
    }

    if (quotation.isDeleted) {
      return { ok: true as const, alreadyDeleted: true };
    }

    await tx.quotation.update({
      where: { id },
      data: {
        status: "CONVERTED",
        isDeleted: true,
        deletedAt: now,
      },
    });

    revalidatePath("/quotations");
    revalidatePath(`/quotations/${id}`);
    revalidatePath("/sales-notes/new");

    return { ok: true as const, alreadyDeleted: false };
  });
}
