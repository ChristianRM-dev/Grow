import {
  PartyLedgerSide,
  PartyLedgerSourceType,
  Prisma,
} from "@/generated/prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildPartyLedgerSummary,
  mapPartyLedgerRows,
} from "./_partyLedgerMappers";

describe("partyLedgerMappers", () => {
  it("builds receivable, payable and net totals", () => {
    expect(
      buildPartyLedgerSummary([
        {
          side: PartyLedgerSide.RECEIVABLE,
          _sum: { amount: new Prisma.Decimal("125.00") },
        },
        {
          side: PartyLedgerSide.PAYABLE,
          _sum: { amount: new Prisma.Decimal("40.00") },
        },
      ]),
    ).toEqual({
      receivableTotal: "125",
      payableTotal: "40",
      netTotal: "85",
    });
  });

  it("maps ledger rows into serializable values", () => {
    const rows = mapPartyLedgerRows([
      {
        id: "entry_1",
        occurredAt: new Date("2026-04-21T12:00:00.000Z"),
        side: PartyLedgerSide.RECEIVABLE,
        sourceType: PartyLedgerSourceType.SALES_NOTE,
        sourceId: "sn_1",
        reference: "N-001",
        amount: new Prisma.Decimal("50.00"),
        notes: "Parcial",
      },
    ]);

    expect(rows).toEqual([
      {
        id: "entry_1",
        occurredAt: "2026-04-21T12:00:00.000Z",
        side: PartyLedgerSide.RECEIVABLE,
        sourceType: PartyLedgerSourceType.SALES_NOTE,
        sourceId: "sn_1",
        reference: "N-001",
        amount: "50",
        notes: "Parcial",
      },
    ]);
  });
});
