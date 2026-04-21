import { prisma } from "@/lib/prisma";
import { Prisma, PaymentDirection } from "@/generated/prisma/client"
import {
  parseTableSearchParams,
  type ParsedTableQuery,
} from "@/modules/shared/tables/parseTableSearchParams";
import { excludeSoftDeletedPayments } from "@/modules/shared/queries/softDeleteHelpers"
import {
  computeOutstandingBalance,
  decimalToString,
  mapDecimalSumsByKey,
} from "@/modules/shared/utils/decimals";

export type SupplierPurchaseRowDto = {
  id: string
  supplierName: string
  supplierFolio: string

  total: string // Decimal -> string
  paidTotal: string // Decimal -> string
  remainingTotal: string // Decimal -> string
  isFullyPaid: boolean

  createdAt: string // ISO
  occurredAt: Date
}

function toPrismaOrderBy(
  q: ParsedTableQuery
): Prisma.SupplierPurchaseOrderByWithRelationInput[] | undefined {
  const sortField = (q.sortField ?? "createdAt").trim();
  const sortOrder = (q.sortOrder ?? "desc") as Prisma.SortOrder;

  const allowed: Record<
    string,
    Prisma.SupplierPurchaseOrderByWithRelationInput
  > = {
    createdAt: { createdAt: sortOrder },
    supplierFolio: { supplierFolio: sortOrder },
    total: { total: sortOrder },
    supplierName: { party: { name: sortOrder } },
    occurredAt: { occurredAt: sortOrder },
  }

  return [allowed[sortField] ?? { createdAt: sortOrder }];
}

function toWhere(q: ParsedTableQuery): Prisma.SupplierPurchaseWhereInput {
  const term = (q.search ?? "").trim();

  const baseWhere: Prisma.SupplierPurchaseWhereInput = {
    isDeleted: false,
  };

  if (!term) return baseWhere;

  return {
    ...baseWhere,
    OR: [
      { supplierFolio: { contains: term, mode: "insensitive" } },
      { party: { name: { contains: term, mode: "insensitive" } } },
      { notes: { contains: term, mode: "insensitive" } },
    ],
  };
}

export async function getSupplierPurchasesTableQuery(rawSearchParams: unknown) {
  const q = parseTableSearchParams(rawSearchParams);

  const where = toWhere(q);
  const orderBy = toPrismaOrderBy(q);

  const skip = (q.page - 1) * q.pageSize;
  const take = q.pageSize;

  const [totalItems, rows] = await Promise.all([
    prisma.supplierPurchase.count({ where }),
    prisma.supplierPurchase.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        supplierFolio: true,
        total: true,
        createdAt: true,
        occurredAt: true,
        party: { select: { name: true } },
      },
    }),
  ]);

  const ids = rows.map((r) => r.id)

  // IMPORTANT:
  // For supplier purchases, payments are usually money going OUT.
  // If your domain stores them as IN, switch this to PaymentDirection.IN.
  const paidGroups = ids.length
    ? await prisma.payment.groupBy({
        by: ["supplierPurchaseId"],
        where: {
          supplierPurchaseId: { in: ids },
          direction: PaymentDirection.OUT,
          ...excludeSoftDeletedPayments,
        },
        _sum: { amount: true },
      })
    : []

  const paidByPurchaseId = mapDecimalSumsByKey(
    paidGroups,
    "supplierPurchaseId",
  )

  const data: SupplierPurchaseRowDto[] = rows.map((r) => {
    const { isFullyPaid, paid, remaining, total } = computeOutstandingBalance({
      total: r.total as Prisma.Decimal,
      paid: paidByPurchaseId.get(r.id),
    })

    return {
      id: r.id,
      supplierName: r.party.name,
      supplierFolio: r.supplierFolio,
      total: decimalToString(total),
      paidTotal: decimalToString(paid),
      remainingTotal: decimalToString(remaining),
      isFullyPaid,
      createdAt: r.createdAt.toISOString(),
      occurredAt: r.occurredAt,
    }
  })

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
