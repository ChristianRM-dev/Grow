// src/modules/parties/actions/updateParty.action.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { routes } from "@/lib/routes";
import {
  PartyFinalSchema,
  PartyFormValues,
} from "@/modules/parties/forms/partyForm.schemas";
import { z } from "zod";

const UpdateInputSchema = z.object({
  id: z.string().min(1),
  values: PartyFinalSchema,
});

type UpdatePartyInput = z.infer<typeof UpdateInputSchema>;

type UpdateResult = { id: string };

function emptyToNull(value: string | undefined | null) {
  const v = (value ?? "").trim();
  return v.length === 0 ? null : v;
}

export async function updatePartyAction(input: unknown): Promise<UpdateResult> {
  // Validate input
  const parsed = UpdateInputSchema.parse(input);
  const { id, values } = parsed;

  // Build role enums based on boolean flags
  const roleEnums: ("CUSTOMER" | "SUPPLIER")[] = [];
  if (values.roles.isCustomer) roleEnums.push("CUSTOMER");
  if (values.roles.isSupplier) roleEnums.push("SUPPLIER");

  // Update Party and replace roles in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update basic fields
    const party = await tx.party.update({
      where: { id },
      data: {
        name: values.name.trim(),
        phone: emptyToNull(values.phone),
        notes: emptyToNull(values.notes),
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    // Delete existing roles
    await tx.partyRole.deleteMany({
      where: { partyId: id },
    });

    // Create new roles
    if (roleEnums.length > 0) {
      await tx.partyRole.createMany({
        data: roleEnums.map((role) => ({
          partyId: id,
          role,
        })),
      });
    }

    return party;
  });

  // Revalidate the parties list page
  revalidatePath(routes.parties.list());

  return { id: updated.id };
}
