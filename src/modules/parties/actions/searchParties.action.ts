"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const InputSchema = z.object({
  term: z.string().trim().max(80).optional().default(""),
  take: z.number().int().min(1).max(25).optional().default(10),
});

export type PartyLookupDto = {
  id: string;
  name: string;
  phone: string | null;
};

export async function searchPartiesAction(
  input: unknown
): Promise<PartyLookupDto[]> {
  const { term, take } = InputSchema.parse(input);

  const where =
    term.length >= 2
      ? {
          isDeleted: false,
          name: { contains: term, mode: "insensitive" as const },
        }
      : { isDeleted: false };

  const rows = await prisma.party.findMany({
    where,
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
    take,
  });

  return rows;
}
