"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"

const InputSchema = z.object({
  term: z.string().trim().max(80).optional().default(""),
  take: z.number().int().min(1).max(100).optional().default(20),
  skip: z.number().int().min(0).optional().default(0),
})

export type PartyFilterDto = {
  id: string
  name: string
  phone: string | null
}

export type PartyFilterResult = {
  parties: PartyFilterDto[]
  total: number
  hasMore: boolean
}

/**
 * Load parties for filter selection with pagination support.
 * Used by PartyMultiSelector modal.
 */
export async function loadPartiesForFilterAction(
  input: unknown
): Promise<PartyFilterResult> {
  const { term, take, skip } = InputSchema.parse(input)

  const where =
    term.length >= 2
      ? {
          isDeleted: false,
          OR: [
            { name: { contains: term, mode: "insensitive" as const } },
            { phone: { contains: term, mode: "insensitive" as const } },
          ],
        }
      : { isDeleted: false }

  // Get total count for pagination
  const total = await prisma.party.count({ where })

  // Get paginated results
  const parties = await prisma.party.findMany({
    where,
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
    take,
    skip,
  })

  return {
    parties,
    total,
    hasMore: skip + parties.length < total,
  }
}
