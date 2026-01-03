// prisma/seeds/users.seed.ts
// Creates initial internal users for Credentials login using bcrypt hashes.

import { PrismaClient, UserRole } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

type SeedUsersOptions = {
  onlyIfEmpty: boolean;
};

function getDefaultPassword(): string {
  // Default password (should be overridden in production by SEED_USERS_DEFAULT_PASSWORD).
  return process.env.SEED_USERS_DEFAULT_PASSWORD?.trim() || "Cambiar123!";
}

function getEmailDomain(): string {
  // Use a safe, non-real domain by default to avoid accidental emails.
  // Recommended: loslaureles.test
  const raw = (process.env.SEED_USERS_EMAIL_DOMAIN || "loslaureles.test")
    .trim()
    .toLowerCase();

  // Basic hardening: remove spaces and leading "@"
  return raw.replace(/\s+/g, "").replace(/^@+/, "");
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

  const emailDomain = getEmailDomain();
  const password = getDefaultPassword();
  const passwordHash = await hashPassword(password);

  const users = [
    { name: "Juan", local: "juan", role: UserRole.ADMIN, isActive: true },
    { name: "Paty", local: "paty", role: UserRole.OPERATOR, isActive: true },
    {
      name: "Sheila",
      local: "sheila",
      role: UserRole.OPERATOR,
      isActive: true,
    },
    { name: "Nancy", local: "nancy", role: UserRole.READ_ONLY, isActive: true },
  ] as const;

  for (const u of users) {
    const email = `${u.local}@${emailDomain}`;

    await prisma.user.upsert({
      where: { email },
      create: {
        name: u.name,
        email,
        role: u.role,
        isActive: u.isActive,
        passwordHash,
      },
      update: {
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        // Avoid accidental password resets in production.
        passwordHash: undefined,
      },
    });
  }

  // Do not print the password in production logs.
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `SEED: Users done. Default password: ${password} (SEED_USERS_DEFAULT_PASSWORD to override).`
    );
  } else {
    console.log("SEED: Users done.");
  }
}
