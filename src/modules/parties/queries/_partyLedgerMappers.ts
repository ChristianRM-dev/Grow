import {
  PartyLedgerSide,
  PartyLedgerSourceType,
  type Prisma,
} from "@/generated/prisma/client";
import {
  decimalOrZero,
  decimalToString,
} from "@/modules/shared/utils/decimals";

export function buildPartyLedgerSummary(
  grouped: readonly {
    side: PartyLedgerSide;
    _sum: { amount: Prisma.Decimal | null };
  }[],
) {
  const receivable = decimalOrZero(
    grouped.find((group) => group.side === PartyLedgerSide.RECEIVABLE)?._sum
      .amount,
  );
  const payable = decimalOrZero(
    grouped.find((group) => group.side === PartyLedgerSide.PAYABLE)?._sum.amount,
  );
  const net = receivable.sub(payable);

  return {
    receivableTotal: decimalToString(receivable),
    payableTotal: decimalToString(payable),
    netTotal: decimalToString(net),
  };
}

export function mapPartyLedgerRows<
  TRow extends {
    id: string;
    occurredAt: Date;
    side: PartyLedgerSide;
    sourceType: PartyLedgerSourceType;
    sourceId: string | null;
    reference: string;
    amount: Prisma.Decimal;
    notes: string | null;
  },
>(rows: readonly TRow[]) {
  return rows.map((row) => ({
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    side: row.side,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    reference: row.reference,
    amount: decimalToString(row.amount),
    notes: row.notes,
  }));
}
