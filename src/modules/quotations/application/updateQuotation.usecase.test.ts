import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateQuotationUseCase } from "./updateQuotation.usecase";

const { prismaMock, resolvePartyIdForCustomerSelectionMock } = vi.hoisted(
  () => ({
    prismaMock: {
      $transaction: vi.fn(),
    },
    resolvePartyIdForCustomerSelectionMock: vi.fn(),
  }),
);

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/parties/application/resolvePartyIdForCustomerSelection", () => ({
  resolvePartyIdForCustomerSelection: (...args: unknown[]) =>
    resolvePartyIdForCustomerSelectionMock(...args),
}));

describe("updateQuotationUseCase", () => {
  beforeEach(() => {
    prismaMock.$transaction.mockReset();
    resolvePartyIdForCustomerSelectionMock.mockReset();
  });

  it("replaces quotation lines and updates the status", async () => {
    resolvePartyIdForCustomerSelectionMock.mockResolvedValue("party-1");

    const tx = {
      quotation: {
        findUnique: vi.fn().mockResolvedValue({
          id: "quotation-1",
          status: "DRAFT",
        }),
        update: vi.fn().mockResolvedValue({ id: "quotation-1" }),
      },
      quotationLine: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await updateQuotationUseCase("quotation-1", {
      customer: {
        mode: "PARTY",
        partyMode: "EXISTING",
        existingPartyId: "party-1",
        existingPartyName: "Cliente 1",
        partyName: "Cliente 1",
      },
      lines: [
        {
          productVariantId: "variant-1",
          productName: "Rosa",
          quantity: 1,
          quotedUnitPrice: "12.00",
          discountPercent: 0,
          description: "Roja",
        },
      ],
      unregisteredLines: [
        {
          name: "Servicio de instalación",
          quantity: 1,
          quotedUnitPrice: "8.00",
          discountPercent: 0,
          description: "",
        },
      ],
      status: "SENT",
    });

    expect(result).toEqual({ quotationId: "quotation-1" });
    expect(tx.quotation.update).toHaveBeenCalledOnce();
    expect(tx.quotationLine.deleteMany).toHaveBeenCalledOnce();
    expect(tx.quotationLine.createMany).toHaveBeenCalledOnce();
    expect(resolvePartyIdForCustomerSelectionMock).toHaveBeenCalledOnce();
  });
});
