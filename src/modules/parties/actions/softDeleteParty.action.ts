"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const SoftDeletePartyInputSchema = z.object({
  id: z.string().min(1),
});

export type SoftDeletePartyInput = z.infer<typeof SoftDeletePartyInputSchema>;

export async function softDeletePartyAction(input: SoftDeletePartyInput) {
  console.info("softDeletePartyAction", input);
  // Validate input at the boundary
  const { id } = SoftDeletePartyInputSchema.parse(input);

  // Session guard (adjust if your auth/session shape differs)
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado.");
  }

  // Prevent deleting special system parties (e.g., walk-in public)
  const party = await prisma.party.findUnique({
    where: { id },
    select: { id: true, systemKey: true, isDeleted: true },
  });

  if (!party) {
    throw new Error("Contacto no encontrado.");
  }

  if (party.systemKey) {
    throw new Error("No se puede eliminar un contacto del sistema.");
  }

  // Idempotent soft-delete
  if (!party.isDeleted) {
    await prisma.party.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  // Revalidate list and details pages
  revalidatePath("/parties");
  revalidatePath(`/parties/${id}`);

  return { ok: true as const };
}
