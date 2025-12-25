import type { PrismaClient } from "../../src/generated/prisma/client";
import { faker } from "@faker-js/faker";
import { Prisma } from "../../src/generated/prisma/client";

type SeedProductsOptions = {
  onlyIfEmpty: boolean;
  count: number;
};

const speciesPool = [
  "Agave",
  "Aloe vera",
  "Bugambilia",
  "Cítrico",
  "Ficus",
  "Jazmín",
  "Lavanda",
  "Nopal",
  "Palma",
  "Romero",
  "Rosal",
  "Suculenta mixta",
];

const bagSizes = ["1L", "3L", "5L", "10L", "Bolsa", "Maceta"] as const;
const colors = ["Roja", "Negra", "Verde", "Azul", "Blanca"] as const;

export async function seedProducts(
  prisma: PrismaClient,
  opts: SeedProductsOptions
) {
  console.log("SEED: ProductVariants...");

  if (opts.onlyIfEmpty) {
    const existing = await prisma.productVariant.count();
    if (existing > 0) {
      console.log("SEED: ProductVariants skipped (db not empty).");
      return;
    }
  }

  const items = Array.from({ length: opts.count }).map(() => {
    const speciesName = faker.helpers.arrayElement(speciesPool);
    const bagSize = faker.helpers.arrayElement(bagSizes);
    const color = faker.helpers.arrayElement(colors);

    const variantName = faker.helpers.arrayElement([
      `${bagSize} - ${color}`,
      `${bagSize}`,
      `Especial - ${color}`,
      null,
    ]);

    const price = faker.number.float({ min: 15, max: 1500, fractionDigits: 2 });

    return {
      speciesName,
      variantName: variantName ?? undefined,
      bagSize,
      color,
      defaultPrice: new Prisma.Decimal(price.toFixed(2)),
      isActive: faker.datatype.boolean({ probability: 0.92 }),
    };
  });

  await prisma.productVariant.createMany({
    data: items,
  });

  console.log(`SEED: ProductVariants done (${items.length}).`);
}
