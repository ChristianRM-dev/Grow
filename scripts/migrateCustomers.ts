import { PartyRoleType, PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

type LegacyCustomer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

// Create a single Pool in dev to avoid exhausting connections on hot reloads.
const pgPool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pgPool;
}

const adapter = new PrismaPg(pgPool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

/**
 * Builds a notes string from legacy fields (email/address) plus existing notes.
 * We keep it simple and append missing parts.
 */
function mergeNotes(
  existing: string | null,
  nextParts: string[]
): string | null {
  const base = (existing ?? "").trim();
  const parts = nextParts
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !base.includes(p));

  const merged = [base, ...parts].filter(Boolean).join(" | ");
  return merged.length ? merged : null;
}

function normalize(v: string | null | undefined): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

async function main() {
  const filePath = path.join(
    process.cwd(),
    "scripts",
    "legacy",
    "customers.json"
  );
  const raw = fs.readFileSync(filePath, "utf-8");
  const customers = JSON.parse(raw) as LegacyCustomer[];

  let created = 0;
  let updated = 0;
  let roleUpserts = 0;

  for (const c of customers) {
    const name = normalize(c.name);
    if (!name) continue;

    const phone = normalize(c.phone);
    const email = normalize(c.email);
    const address = normalize(c.address);

    const createdAt = new Date(c.createdAt);
    const updatedAt = c.updatedAt ? new Date(c.updatedAt) : null;
    const deletedAt = c.deletedAt ? new Date(c.deletedAt) : null;
    const isDeleted = Boolean(deletedAt);

    const notesParts: string[] = [];
    if (email) notesParts.push(`Email: ${email}`);
    if (address) notesParts.push(`Address: ${address}`);

    // Heurística de dedupe: name + phone.
    // (Si phone viene null, dedupe por name solamente.)
    const existing = await prisma.party.findFirst({
      where: {
        name,
        ...(phone ? { phone } : {}),
        // avoid touching special system parties just in case
        systemKey: null,
      },
      select: { id: true, notes: true },
    });

    if (!existing) {
      await prisma.party.create({
        data: {
          name,
          phone,
          notes: mergeNotes(null, notesParts),
          createdAt,
          updatedAt: updatedAt ?? undefined, // field is optional
          isDeleted,
          deletedAt: deletedAt ?? undefined,
          roles: {
            create: [{ role: PartyRoleType.CUSTOMER }],
          },
        },
      });
      created++;
      continue;
    }

    // Update minimal fields (notes + soft delete flags); keep name/phone stable.
    await prisma.party.update({
      where: { id: existing.id },
      data: {
        notes: mergeNotes(existing.notes, notesParts) ?? undefined,
        // If legacy says deleted, reflect it; if not deleted, keep as-is.
        ...(isDeleted
          ? { isDeleted: true, deletedAt: deletedAt ?? undefined }
          : {}),
        ...(updatedAt ? { updatedAt } : {}),
      },
    });
    updated++;

    // Ensure CUSTOMER role exists (idempotent)
    await prisma.partyRole.upsert({
      where: {
        partyId_role: {
          partyId: existing.id,
          role: PartyRoleType.CUSTOMER,
        },
      },
      create: {
        partyId: existing.id,
        role: PartyRoleType.CUSTOMER,
      },
      update: {},
    });
    roleUpserts++;
  }

  console.log("Done.");
  console.log({ created, updated, roleUpserts });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
