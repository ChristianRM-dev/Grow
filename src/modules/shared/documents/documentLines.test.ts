import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import {
  buildRegisteredDocumentLinePayloads,
  buildUnregisteredDocumentLinePayloads,
  calculateDocumentTotals,
  persistDocumentLines,
  registerProductVariantsFromUnregisteredLines,
} from "./documentLines";

describe("documentLines", () => {
  it("builds payloads and calculates totals for registered and unregistered lines", () => {
    const registeredLines = buildRegisteredDocumentLinePayloads(
      [
        {
          productVariantId: "variant-1",
          productName: "Rosa",
          quantity: 2,
          unitPrice: "10.00",
          discountPercent: 10,
          description: "Roja",
        },
      ],
      "unitPrice",
    );

    const unregisteredLines = buildUnregisteredDocumentLinePayloads(
      [
        {
          name: "Tierra preparada",
          quantity: 1,
          unitPrice: "5.50",
          discountPercent: 0,
          description: "Saco",
        },
      ],
      "unitPrice",
    );

    const totals = calculateDocumentTotals([
      ...registeredLines,
      ...unregisteredLines,
    ]);

    expect(registeredLines[0].descriptionSnapshot).toBe("Rosa — Roja");
    expect(registeredLines[0].unitPrice.toString()).toBe("10");
    expect(unregisteredLines[0].productVariantId).toBeNull();
    expect(totals.subtotal.toString()).toBe("25.5");
    expect(totals.discountTotal.toString()).toBe("2");
    expect(totals.total.toString()).toBe("23.5");
  });

  it("reuses existing products and creates missing ones from unregistered lines", async () => {
    const tx = {
      productVariant: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: "existing-variant" })
          .mockResolvedValueOnce(null),
        create: vi.fn().mockResolvedValue({
          id: "created-variant",
          defaultPrice: new Prisma.Decimal("30.00"),
        }),
      },
    } as unknown as Prisma.TransactionClient;

    const logger = { log: vi.fn() };

    const result = await registerProductVariantsFromUnregisteredLines(
      tx,
      [
        {
          shouldRegister: true,
          name: "Bugambilia",
          quantity: 2,
          unitPrice: "15.00",
          discountPercent: 0,
          description: "",
        },
        {
          shouldRegister: true,
          name: "Jazmín",
          quantity: 1,
          unitPrice: "30.00",
          discountPercent: 0,
          description: "",
          variantName: "Premium",
        },
      ],
      "unitPrice",
      logger,
    );

    expect(result.get(0)).toBe("existing-variant");
    expect(result.get(1)).toBe("created-variant");
    expect(tx.productVariant.create).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith("product_registered", {
      index: 1,
      productId: "created-variant",
      name: "Jazmín",
      defaultPrice: "30",
    });
  });

  it("persists lines through the provided callbacks", async () => {
    const deleteExisting = vi.fn().mockResolvedValue(undefined);
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const logger = { log: vi.fn() };

    await persistDocumentLines({
      payloads: [{ id: "line-1" }, { id: "line-2" }],
      deleteExisting,
      createMany,
      logger,
      startMessage: "lines_replace_start",
    });

    expect(deleteExisting).toHaveBeenCalledOnce();
    expect(createMany).toHaveBeenCalledWith([{ id: "line-1" }, { id: "line-2" }]);
    expect(logger.log).toHaveBeenNthCalledWith(1, "lines_replace_start");
    expect(logger.log).toHaveBeenLastCalledWith("lines_createMany_done", {
      count: 2,
    });
  });
});
