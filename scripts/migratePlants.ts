import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

type LegacyPlant = {
  id: string;
  name: string;
  price: number | string;
  stock: number;
  categoryId: string | null;
  presentationType: string | null; // e.g. "BAG"
  presentationDetails: string | null; // e.g. "60"
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

function normalize(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

/**
 * Maps legacy presentation fields to the new ProductVariant.bagSize string.
 * Keep it simple and human-readable for UI/print.
 */
function mapBagSize(
  presentationType: string | null,
  details: string | null
): string | null {
  const type = normalize(presentationType)?.toUpperCase();
  const det = normalize(details);

  if (!type && !det) return null;

  // Common examples:
  // BAG + "60" -> "Bolsa 60"
  // POT + "10" -> "Maceta 10"
  // If unknown type, just keep details.
  if (type === "BAG") return det ? `Bolsa ${det}` : "Bolsa";
  if (type === "POT") return det ? `Maceta ${det}` : "Maceta";
  if (type === "BOX") return det ? `Caja ${det}` : "Caja";

  // Fallback
  if (det) return `${type ?? "Presentación"} ${det}`;
  return type;
}

async function main() {
  const filePath = path.join(process.cwd(), "scripts", "legacy", "plants.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const plants = JSON.parse(raw) as LegacyPlant[];

  let created = 0;
  let updated = 0;

  for (const p of plants) {
    const name = normalize(p.name);
    if (!name) continue;

    // Safe default: keep full legacy name as speciesName.
    // (If later you want: split into speciesName + variantName, we can add heuristics.)
    const speciesName = name;
    const variantName: string | null = null;

    const bagSize = mapBagSize(p.presentationType, p.presentationDetails);

    const createdAt = new Date(p.createdAt);
    const updatedAt = p.updatedAt ? new Date(p.updatedAt) : null;
    const deletedAt = p.deletedAt ? new Date(p.deletedAt) : null;
    const isDeleted = Boolean(deletedAt);

    // Prisma Decimal: prefer string to avoid float issues
    const defaultPrice = String(p.price);

    // Dedup key (best-effort): same speciesName + variantName + bagSize
    const existing = await prisma.productVariant.findFirst({
      where: {
        speciesName,
        variantName: variantName ?? null,
        bagSize: bagSize ?? null,
        // color is not in legacy payload (keep null)
        color: null,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.productVariant.create({
        data: {
          speciesName,
          variantName: variantName ?? undefined,
          bagSize: bagSize ?? undefined,
          color: undefined,
          defaultPrice,
          isActive: !isDeleted, // optional but useful
          isDeleted,
          deletedAt: deletedAt ?? undefined,
          createdAt,
          ...(updatedAt ? { updatedAt } : {}),
        },
      });
      created++;
      continue;
    }

    await prisma.productVariant.update({
      where: { id: existing.id },
      data: {
        defaultPrice,
        // Keep bagSize synced in case legacy changed presentation
        bagSize: bagSize ?? undefined,
        ...(isDeleted
          ? {
              isDeleted: true,
              deletedAt: deletedAt ?? undefined,
              isActive: false,
            }
          : {}),
        ...(updatedAt ? { updatedAt } : {}),
      },
    });
    updated++;
  }

  console.log("Done.");
  console.log({ created, updated });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
