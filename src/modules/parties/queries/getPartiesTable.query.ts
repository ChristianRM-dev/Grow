import { prisma } from "@/lib/prisma";
import { Prisma, PartyRoleType } from "@/generated/prisma/client";
import { parseTableSearchParams } from "@/modules/shared/tables/parseTableSearchParams";
import type { ParsedTableQuery } from "@/modules/shared/tables/parseTableSearchParams";

export type PartyRowDto = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt: string; // ISO
  isCustomer: boolean;
  isSupplier: boolean;
};

function toPrismaOrderBy(
  q: ParsedTableQuery
): Prisma.PartyOrderByWithRelationInput[] | undefined {
  const sortField = (q.sortField ?? "createdAt").trim();
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  const allowed: Record<string, Prisma.PartyOrderByWithRelationInput> = {
    createdAt: { createdAt: sortOrder },
    name: { name: sortOrder },
    phone: { phone: sortOrder },
  };

  return [allowed[sortField] ?? { createdAt: sortOrder }];
}

function toWhere(q: ParsedTableQuery): Prisma.PartyWhereInput {
  const term = (q.search ?? "").trim();
  const base: Prisma.PartyWhereInput = { isDeleted: false };

  if (!term) return base;

  return {
    ...base,
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      { notes: { contains: term, mode: "insensitive" } },
    ],
  };
}

export async function getPartiesTableQuery(rawSearchParams: unknown) {
  const q = parseTableSearchParams(rawSearchParams);

  const where = toWhere(q);
  const orderBy = toPrismaOrderBy(q);

  const skip = (q.page - 1) * q.pageSize;
  const take = q.pageSize;

  const [totalItems, rows] = await Promise.all([
    prisma.party.count({ where }),
    prisma.party.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        createdAt: true,
        roles: { select: { role: true } },
      },
    }),
  ]);

  const data: PartyRowDto[] = rows.map((r) => {
    const roles = new Set(r.roles.map((x) => x.role));
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      isCustomer: roles.has(PartyRoleType.CUSTOMER),
      isSupplier: roles.has(PartyRoleType.SUPPLIER),
    };
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / q.pageSize));

  return {
    data,
    pagination: {
      page: q.page,
      pageSize: q.pageSize,
      totalPages,
      totalItems,
    },
  };
}
