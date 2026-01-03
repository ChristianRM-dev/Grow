import { prisma } from "@/lib/prisma";
import { toNumber } from "@/modules/shared/utils/toNumber";

export type TopDelinquentCustomerRowDto = {
  partyId: string;
  partyName: string;
  balance: number;
  lastMovementAt: string; // ISO
};

export type DashboardTopDelinquentsDto = {
  rows: TopDelinquentCustomerRowDto[];
};

export async function getDashboardTopDelinquentCustomers(): Promise<DashboardTopDelinquentsDto> {
  const customerPartyRows = await prisma.partyRole.findMany({
    where: {
      role: "CUSTOMER",
      party: { isDeleted: false },
    },
    select: { partyId: true },
  });

  const customerPartyIds = Array.from(
    new Set(customerPartyRows.map((x) => x.partyId))
  );

  if (customerPartyIds.length === 0) return { rows: [] };

  const sums = await prisma.partyLedgerEntry.groupBy({
    by: ["partyId", "side"],
    where: { partyId: { in: customerPartyIds } },
    _sum: { amount: true },
  });

  const maxDates = await prisma.partyLedgerEntry.groupBy({
    by: ["partyId"],
    where: { partyId: { in: customerPartyIds } },
    _max: { occurredAt: true },
  });

  const lastMovementByParty = new Map<string, Date>();
  for (const row of maxDates) {
    const dt = row._max.occurredAt;
    if (dt) lastMovementByParty.set(row.partyId, dt);
  }

  const balanceByParty = new Map<
    string,
    { receivable: number; payable: number }
  >();
  for (const row of sums) {
    const cur = balanceByParty.get(row.partyId) ?? {
      receivable: 0,
      payable: 0,
    };
    const amount = toNumber(row._sum.amount);

    if (row.side === "RECEIVABLE") cur.receivable += amount;
    else cur.payable += amount;

    balanceByParty.set(row.partyId, cur);
  }

  const balances = Array.from(balanceByParty.entries())
    .map(([partyId, v]) => ({
      partyId,
      balance: v.receivable - v.payable,
      lastMovementAt: lastMovementByParty.get(partyId) ?? new Date(0),
    }))
    .filter((x) => x.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  if (balances.length === 0) return { rows: [] };

  const parties = await prisma.party.findMany({
    where: { id: { in: balances.map((x) => x.partyId) } },
    select: { id: true, name: true },
  });

  const nameById = new Map(parties.map((p) => [p.id, p.name]));

  const rows: TopDelinquentCustomerRowDto[] = balances.map((x) => ({
    partyId: x.partyId,
    partyName: nameById.get(x.partyId) ?? "—",
    balance: x.balance,
    lastMovementAt: x.lastMovementAt.toISOString(),
  }));

  return { rows };
}
