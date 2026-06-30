import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSalesNoteUseCase } from "./createSalesNote.usecase";

const {
  prismaMock,
  resolvePartyIdForCustomerSelectionMock,
  generateMonthlyFolioMock,
  ensureSingleLedgerEntryForSourceMock,
  createAuditLogMock,
} = vi.hoisted(() => ({
  prismaMock: {
    salesNote: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  resolvePartyIdForCustomerSelectionMock: vi.fn(),
  generateMonthlyFolioMock: vi.fn(),
  ensureSingleLedgerEntryForSourceMock: vi.fn(),
  createAuditLogMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/parties/application/resolvePartyIdForCustomerSelection", () => ({
  resolvePartyIdForCustomerSelection: (...args: unknown[]) =>
    resolvePartyIdForCustomerSelectionMock(...args),
}));

vi.mock("@/modules/shared/folio/monthlyFolio", () => ({
  generateMonthlyFolio: (...args: unknown[]) => generateMonthlyFolioMock(...args),
}));

vi.mock("@/modules/shared/ledger/partyLedger", () => ({
  ensureSingleLedgerEntryForSource: (...args: unknown[]) =>
    ensureSingleLedgerEntryForSourceMock(...args),
}));

vi.mock("@/modules/shared/audit/createAuditLog.helper", () => ({
  createAuditLog: (...args: unknown[]) => createAuditLogMock(...args),
}));

describe("createSalesNoteUseCase", () => {
  beforeEach(() => {
    prismaMock.salesNote.findUnique.mockReset();
    prismaMock.$transaction.mockReset();
    resolvePartyIdForCustomerSelectionMock.mockReset();
    generateMonthlyFolioMock.mockReset();
    ensureSingleLedgerEntryForSourceMock.mockReset();
    createAuditLogMock.mockReset();
  });

  it("returns the existing sales note on the idempotency fast path", async () => {
    prismaMock.salesNote.findUnique.mockResolvedValue({ id: "sales-note-1" });

    const result = await createSalesNoteUseCase(
      {
        customer: { mode: "PUBLIC" },
        lines: [],
        unregisteredLines: [],
      },
      { traceId: "trace-1" },
      "user-1",
      "request-1",
    );

    expect(result).toEqual({
      salesNoteId: "sales-note-1",
      newProductsRegistered: 0,
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("creates the sales note and persists its lines inside the transaction", async () => {
    prismaMock.salesNote.findUnique.mockResolvedValue(null);
    resolvePartyIdForCustomerSelectionMock.mockResolvedValue("party-1");
    generateMonthlyFolioMock.mockResolvedValue("SN-2026-04-01");
    ensureSingleLedgerEntryForSourceMock.mockResolvedValue({
      id: "ledger-1",
      created: true,
    });
    createAuditLogMock.mockResolvedValue({ id: "audit-1" });

    const tx = {
      salesNote: {
        create: vi.fn().mockResolvedValue({
          id: "sales-note-1",
          folio: "SN-2026-04-01",
          createdAt: new Date("2026-04-17T10:00:00.000Z"),
        }),
        findUnique: vi.fn().mockResolvedValue({
          id: "sales-note-1",
          folio: "SN-2026-04-01",
          partyId: "party-1",
          total: { toString: () => "18" },
          clientRequestId: "request-1",
          _count: { lines: 1 },
        }),
      },
      salesNoteLine: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      productVariant: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await createSalesNoteUseCase(
      {
        customer: { mode: "PUBLIC" },
        lines: [
          {
            productVariantId: "variant-1",
            productName: "Rosa",
            quantity: 2,
            unitPrice: "10.00",
            discountPercent: 10,
            description: "Roja",
          },
        ],
        unregisteredLines: [],
      },
      { traceId: "trace-2" },
      "user-1",
      "request-1",
    );

    expect(result).toEqual({
      salesNoteId: "sales-note-1",
      newProductsRegistered: 0,
    });
    expect(tx.salesNote.create).toHaveBeenCalledOnce();
    expect(tx.salesNoteLine.createMany).toHaveBeenCalledOnce();
    expect(ensureSingleLedgerEntryForSourceMock).toHaveBeenCalledOnce();
    expect(createAuditLogMock).toHaveBeenCalledOnce();
  });

  it("forces registration of all unregistered lines when the sales note comes from a quotation", async () => {
    prismaMock.salesNote.findUnique.mockResolvedValue(null);
    resolvePartyIdForCustomerSelectionMock.mockResolvedValue("party-1");
    generateMonthlyFolioMock.mockResolvedValue("SN-2026-04-02");
    ensureSingleLedgerEntryForSourceMock.mockResolvedValue({
      id: "ledger-2",
      created: true,
    });
    createAuditLogMock.mockResolvedValue({ id: "audit-2" });

    const tx = {
      salesNote: {
        create: vi.fn().mockResolvedValue({
          id: "sales-note-2",
          folio: "SN-2026-04-02",
          createdAt: new Date("2026-04-17T11:00:00.000Z"),
        }),
        findUnique: vi.fn().mockResolvedValue({
          id: "sales-note-2",
          folio: "SN-2026-04-02",
          partyId: "party-1",
          total: { toString: () => "25" },
          clientRequestId: "request-2",
          _count: { lines: 1 },
        }),
      },
      salesNoteLine: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      productVariant: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "created-variant-1",
          defaultPrice: { toString: () => "25" },
        }),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    const result = await createSalesNoteUseCase(
      {
        customer: { mode: "PUBLIC" },
        lines: [],
        unregisteredLines: [
          {
            name: "Tierra preparada",
            quantity: 1,
            unitPrice: "25.00",
            discountPercent: 0,
            description: "Saco grande",
            shouldRegister: false,
          },
        ],
      },
      { traceId: "trace-3" },
      "user-1",
      "request-2",
      "quotation-1",
    );

    expect(result).toEqual({
      salesNoteId: "sales-note-2",
      newProductsRegistered: 1,
    });
    expect(tx.productVariant.create).toHaveBeenCalledOnce();
    expect(tx.salesNoteLine.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          productVariantId: "created-variant-1",
          descriptionSnapshot: "Tierra preparada — Saco grande",
        }),
      ],
    });
  });
});
