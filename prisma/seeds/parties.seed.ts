import type { PrismaClient } from "../../src/generated/prisma/client";
import { PartyRoleType } from "../../src/generated/prisma/client";
import { faker } from "@faker-js/faker";

type SeedPartiesOptions = {
  onlyIfEmpty: boolean;
  count: number;
};

export async function seedParties(
  prisma: PrismaClient,
  opts: SeedPartiesOptions
) {
  console.log("SEED: Parties...");

  if (opts.onlyIfEmpty) {
    const existing = await prisma.party.count();
    if (existing > 1) {
      console.log("SEED: Parties skipped (db not empty).");
      return;
    }
  }

  const partiesData = Array.from({ length: opts.count }).map(() => {
    const isCompany = faker.datatype.boolean();
    const name = isCompany ? faker.company.name() : faker.person.fullName();

    const phone = faker.phone.number();

    const rolePick = faker.helpers.arrayElement([
      "CUSTOMER",
      "SUPPLIER",
      "BOTH",
    ] as const);

    const roles =
      rolePick === "CUSTOMER"
        ? [{ role: PartyRoleType.CUSTOMER }]
        : rolePick === "SUPPLIER"
        ? [{ role: PartyRoleType.SUPPLIER }]
        : [{ role: PartyRoleType.CUSTOMER }, { role: PartyRoleType.SUPPLIER }];

    return {
      name,
      phone,
      notes: faker.lorem.sentence(),
      roles,
    };
  });

  for (const p of partiesData) {
    const created = await prisma.party.create({
      data: {
        name: p.name,
        phone: p.phone,
        notes: p.notes,
        roles: { create: p.roles },
      },
    });

    // Avoid unused variable warning: kept to show relationship if you need it later.
    void created;
  }

  console.log(`SEED: Parties done. Created ${opts.count} parties.`);
}
