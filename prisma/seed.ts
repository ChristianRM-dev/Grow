// prisma/seed.ts
import { prisma } from "../src/lib/prisma";
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

  if (isProd && !allowProd) {
    console.log("SEED: Blocked in production (SEED_ALLOW_PROD=false).");
    return;
  }

  const onlyIfEmpty = envBool("SEED_ONLY_IF_EMPTY", true);

  console.log("SEED: Starting...");

  if (envBool("SEED_USERS", false)) {
    await seedUsers(prisma as any, { onlyIfEmpty });
  } else {
    console.log("SEED: Skipping users (SEED_USERS=false).");
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
