import { Prisma } from "@/generated/prisma/client";
import { describe, expect, it } from "vitest";
import {
  computeOutstandingBalance,
  decimalToString,
  mapDecimalSumsByKey,
} from "./decimals";

describe("decimals", () => {
  it("computes balances without allowing negative remaining amounts", () => {
    expect(
      computeOutstandingBalance({
        total: new Prisma.Decimal("100.00"),
        paid: new Prisma.Decimal("120.00"),
      }),
    ).toMatchObject({
      total: new Prisma.Decimal("100.00"),
      paid: new Prisma.Decimal("120.00"),
      remaining: new Prisma.Decimal("0"),
      isFullyPaid: true,
    });
  });

  it("indexes grouped decimal sums by key", () => {
    const grouped = [
      {
        salesNoteId: "sn_1",
        _sum: { amount: new Prisma.Decimal("10.50") },
      },
      {
        salesNoteId: "sn_2",
        _sum: { amount: null },
      },
    ] as const;

    const amountsByKey = mapDecimalSumsByKey(grouped, "salesNoteId");

    expect(decimalToString(amountsByKey.get("sn_1"))).toBe("10.5");
    expect(decimalToString(amountsByKey.get("sn_2"))).toBe("0");
  });
});
