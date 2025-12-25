// prisma/seed.ts
import { prisma } from "../src/lib/prisma";
import { seedParties } from "./seeds/parties.seed";
import { seedProducts } from "./seeds/products.seed";
import { seedPublicParty } from "./seeds/publicParty.seed";
import { seedUsers } from "./seeds/users.seed";

function envBool(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

async function main() {
  const seedEnabled = envBool("SEED_ENABLED", false);
  if (!seedEnabled) {
    console.log("SEED: Disabled (SEED_ENABLED=false).");
    return;
  }

  const isProd = process.env.NODE_ENV === "production";
  const allowProd = envBool("SEED_ALLOW_PROD", false);

  const partiesCount = Number(process.env.SEED_PARTIES_COUNT ?? "40");
  const productsCount = Number(process.env.SEED_PRODUCTS_COUNT ?? "60");

  if (isProd && !allowProd) {
    console.log("SEED: Blocked in production (SEED_ALLOW_PROD=false).");
    return;
  }

  const onlyIfEmpty = envBool("SEED_ONLY_IF_EMPTY", true);

  console.log("SEED: Starting...");

  // Always recommended to run first so other seeds can reference it.
  if (envBool("SEED_PUBLIC_PARTY", false)) {
    await seedPublicParty(prisma as any, {
      updateIfExists: envBool("SEED_PUBLIC_PARTY_UPDATE", true),
    });
  } else {
    console.log("SEED: Skipping public party (SEED_PUBLIC_PARTY=false).");
  }

  if (envBool("SEED_USERS", false)) {
    await seedUsers(prisma as any, { onlyIfEmpty });
  } else {
    console.log("SEED: Skipping users (SEED_USERS=false).");
  }

  if (envBool("SEED_PARTIES", false)) {
    await seedParties(prisma as any, { onlyIfEmpty, count: partiesCount });
  } else {
    console.log("SEED: Skipping parties (SEED_PARTIES=false).");
  }

  if (envBool("SEED_PRODUCTS", false)) {
    await seedProducts(prisma as any, { onlyIfEmpty, count: productsCount });
  } else {
    console.log("SEED: Skipping products (SEED_PRODUCTS=false).");
  }

  console.log("SEED: Done.");
}

main()
  .catch((err) => {
    console.error("SEED: Failed.", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
