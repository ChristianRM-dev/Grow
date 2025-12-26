"use server";

import { prisma } from "@/lib/prisma";
import { PartyRoleType } from "@/generated/prisma/client";
import { PartyFinalSchema } from "@/modules/parties/forms/partyForm.schemas";

type CreatePartyResult = {
  id: string;
};

function emptyToNull(value: string | undefined | null) {
  const v = (value ?? "").trim();
  return v.length === 0 ? null : v;
}

export async function createPartyAction(
  input: unknown
): Promise<CreatePartyResult> {
  const values = PartyFinalSchema.parse(input);

  const created = await prisma.party.create({
    data: {
      name: values.name.trim(),
      phone: emptyToNull(values.phone),
      notes: emptyToNull(values.notes),
      roles: {
        createMany: {
          data: [
            ...(values.roles.isCustomer
              ? [{ role: PartyRoleType.CUSTOMER }]
              : []),
            ...(values.roles.isSupplier
              ? [{ role: PartyRoleType.SUPPLIER }]
              : []),
          ],
          skipDuplicates: true,
        },
      },
    },
    select: { id: true },
  });

  return { id: created.id };
}
