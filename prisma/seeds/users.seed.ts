// prisma/seeds/users.seed.ts
// Creates initial internal users for Credentials login using bcrypt hashes.

import { PrismaClient, UserRole } from "@/generated/prisma/client";

import bcrypt from "bcryptjs";

type SeedUsersOptions = {
  onlyIfEmpty: boolean;
};

function getDefaultPassword(): string {
  // Default dev password (can be overridden by SEED_USERS_DEFAULT_PASSWORD).
  return process.env.SEED_USERS_DEFAULT_PASSWORD?.trim() || "Cambiar123!";
}

async function hashPassword(raw: string): Promise<string> {
  const saltRounds = Number(process.env.SEED_BCRYPT_ROUNDS ?? "12");
  return bcrypt.hash(raw, saltRounds);
}

export async function seedUsers(prisma: PrismaClient, opts: SeedUsersOptions) {
  console.log("SEED: Users...");

  if (opts.onlyIfEmpty) {
    const existing = await prisma.user.count();
    if (existing > 0) {
      console.log("SEED: Users skipped (db not empty).");
      return;
    }
  }

  const password = getDefaultPassword();
  const passwordHash = await hashPassword(password);

  const users = [
    {
      name: "Juan",
      email: "juan@grow.local",
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      name: "Paty",
      email: "paty@grow.local",
      role: UserRole.OPERATOR,
      isActive: true,
    },
    {
      name: "Sheila",
      email: "sheila@grow.local",
      role: UserRole.OPERATOR,
      isActive: true,
    },
    {
      name: "Nancy",
      email: "nancy@grow.local",
      role: UserRole.READ_ONLY,
      isActive: true,
    },
  ] as const;

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        passwordHash,
      },
      update: {
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        // Only set passwordHash if user doesn't have one yet (avoid accidental resets).
        passwordHash: undefined,
      },
    });
  }

  console.log(
    `SEED: Users done. Default password: ${password} (SEED_USERS_DEFAULT_PASSWORD to override).`
  );
}
