import type { PrismaClient } from "../../src/generated/prisma/client";
import { PartyRoleType } from "../../src/generated/prisma/client";

type SeedPublicPartyOptions = {
  // If you want to allow changing name/notes without recreating the record.
  updateIfExists: boolean;
};

export async function seedPublicParty(
  prisma: PrismaClient,
  opts: SeedPublicPartyOptions
) {
  console.log("SEED: Public Party...");

  const systemKey = "WALK_IN_PUBLIC";
  const name = "Público";

  const party = await prisma.party.upsert({
    where: { systemKey },
    create: {
      systemKey,
      name,
      notes: "Cliente mostrador (ventas a público en general).",
      roles: {
        create: [{ role: PartyRoleType.CUSTOMER }],
      },
    },
    update: opts.updateIfExists
      ? {
          name,
          notes: "Cliente mostrador (ventas a público en general).",
          isDeleted: false,
          deletedAt: null,
        }
      : {},
    select: { id: true },
  });

  // Ensure CUSTOMER role exists (idempotent)
  await prisma.partyRole.upsert({
    where: {
      partyId_role: { partyId: party.id, role: PartyRoleType.CUSTOMER },
    },
    create: { partyId: party.id, role: PartyRoleType.CUSTOMER },
    update: {},
  });

  console.log(`SEED: Public Party OK (systemKey=${systemKey}).`);
}
