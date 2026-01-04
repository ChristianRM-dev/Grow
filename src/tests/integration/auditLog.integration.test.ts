import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createSalesNotePaymentUseCase } from "@/modules/sales-notes/application/createSalesNotePayment.usecase";
import { createSalesNoteUseCase } from "@/modules/sales-notes/application/createSalesNote.usecase";
import { createPartyPaymentOutUseCase } from "@/modules/payments/application/createPartyPaymentOut.usecase";
import { createSupplierPurchaseUseCase } from "@/modules/supplier-purchases/application/createSupplierPurchase.usecase";
import { getSupplierPurchaseDetailsById } from "@/modules/supplier-purchases/queries/getSupplierPurchaseDetails.query";
import {
  createTestCustomerParty,
  createTestProductVariant,
  createTestSupplierParty,
  resetDatabase,
} from "./testDb";

const decimalToNumber = (value: Prisma.Decimal | null | undefined) =>
  value ? value.toNumber() : null;

describe("Audit log flows", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("creates an audit log when creating a sales note", async () => {
    const customer = await createTestCustomerParty();
    const variant = await createTestProductVariant();

    const result = await createSalesNoteUseCase(
      {
        customer: {
          mode: "PARTY",
          partyMode: "EXISTING",
          existingPartyId: customer.id,
        },
        lines: [
          {
            productVariantId: variant.id,
            productName: variant.speciesName,
            quantity: 2,
            unitPrice: "50",
            description: "Test line",
          },
        ],
        unregisteredLines: [],
      },
      { traceId: "trace-sales-note" }
    );

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        eventKey: "salesNote.created",
        entityId: result.salesNoteId,
      },
      include: { changes: true },
    });

    assert.strictEqual(auditLogs.length, 1);
    const [log] = auditLogs;
    const changes = Object.fromEntries(
      log.changes.map((c) => [c.key, c])
    ) as Record<string, (typeof log.changes)[number]>;

    assert.strictEqual(log.rootEntityType, "SALES_NOTE");
    assert.strictEqual(
      decimalToNumber(changes.SALES_NOTE_TOTAL.decimalAfter),
      100
    );
    assert.strictEqual(
      decimalToNumber(changes.SALES_NOTE_SUBTOTAL.decimalAfter),
      100
    );

    const meta = log.meta as Record<string, unknown> | null;
    assert.ok(meta);
    assert.strictEqual(meta["linesCount"], 1);
    assert.strictEqual(meta["traceId"], "trace-sales-note");
  });

  it("creates an audit log when creating a sales note payment with balance change", async () => {
    const customer = await createTestCustomerParty();
    const variant = await createTestProductVariant();

    const note = await createSalesNoteUseCase(
      {
        customer: {
          mode: "PARTY",
          partyMode: "EXISTING",
          existingPartyId: customer.id,
        },
        lines: [
          {
            productVariantId: variant.id,
            productName: variant.speciesName,
            quantity: 1,
            unitPrice: "120",
            description: "Pago parcial",
          },
        ],
        unregisteredLines: [],
      },
      { traceId: "trace-payment-note" }
    );

    const payment = await createSalesNotePaymentUseCase(
      {
        salesNoteId: note.salesNoteId,
        values: {
          paymentType: "CASH",
          amount: "40",
          reference: "",
          notes: "",
        },
      },
      { traceId: "trace-payment-create" }
    );

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        eventKey: "salesNote.payment.created",
        entityId: payment.paymentId,
      },
      include: { changes: true },
    });

    assert.strictEqual(auditLogs.length, 1);
    const [log] = auditLogs;
    const changes = Object.fromEntries(
      log.changes.map((c) => [c.key, c])
    ) as Record<string, (typeof log.changes)[number]>;

    assert.strictEqual(
      decimalToNumber(changes.PAYMENT_AMOUNT.decimalAfter),
      40
    );
    assert.strictEqual(
      decimalToNumber(changes.SALES_NOTE_BALANCE_DUE.decimalBefore),
      120
    );
    assert.strictEqual(
      decimalToNumber(changes.SALES_NOTE_BALANCE_DUE.decimalAfter),
      80
    );
  });

  it("creates supplier purchase payment audit logs with FK balance tracking", async () => {
    const supplier = await createTestSupplierParty();

    const purchase = await createSupplierPurchaseUseCase(
      {
        partyId: supplier.id,
        supplierFolio: "SP-100",
        total: "200",
        notes: "Test purchase",
      },
      { traceId: "trace-supplier-purchase" }
    );

    const payment = await createPartyPaymentOutUseCase(
      {
        partyId: supplier.id,
        supplierPurchaseId: purchase.supplierPurchaseId,
        paymentType: "CASH",
        amount: "50",
        reference: "Pago SP-100",
      },
      { traceId: "trace-supplier-payment" }
    );

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        eventKey: "supplierPurchase.payment.created",
        rootEntityId: purchase.supplierPurchaseId,
      },
      include: { changes: true },
    });

    assert.strictEqual(auditLogs.length, 1);
    const [log] = auditLogs;
    const changes = Object.fromEntries(
      log.changes.map((c) => [c.key, c])
    ) as Record<string, (typeof log.changes)[number]>;

    assert.strictEqual(log.entityId, payment.paymentId);
    assert.strictEqual(
      decimalToNumber(changes.PAYMENT_AMOUNT.decimalAfter),
      50
    );
    assert.strictEqual(
      decimalToNumber(changes.SUPPLIER_PURCHASE_BALANCE_DUE.decimalBefore),
      200
    );
    assert.strictEqual(
      decimalToNumber(changes.SUPPLIER_PURCHASE_BALANCE_DUE.decimalAfter),
      150
    );
  });

  it("reads supplier purchase payments by FK", async () => {
    const supplier = await createTestSupplierParty();

    const purchase = await createSupplierPurchaseUseCase(
      {
        partyId: supplier.id,
        supplierFolio: "SP-200",
        total: "300",
      },
      { traceId: "trace-supplier-query" }
    );

    // Payment linked via FK
    const fkPayment = await createPartyPaymentOutUseCase(
      {
        partyId: supplier.id,
        supplierPurchaseId: purchase.supplierPurchaseId,
        paymentType: "CASH",
        amount: "60",
        reference: "FK payment",
      },
      { traceId: "trace-fk-payment" }
    );

    const fkDetails = await getSupplierPurchaseDetailsById(
      purchase.supplierPurchaseId
    );

    assert.ok(fkDetails);
    assert.strictEqual(fkDetails.payments.length, 1);
    assert.strictEqual(fkDetails.payments[0]?.id, fkPayment.paymentId);
    assert.strictEqual(fkDetails.paidTotal, "60");
  });

  it("falls back to legacy reference token when supplierPurchaseId is missing", async () => {
    const supplier = await createTestSupplierParty();

    const purchaseLegacy = await createSupplierPurchaseUseCase(
      {
        partyId: supplier.id,
        supplierFolio: "SP-201",
        total: "300",
      },
      { traceId: "trace-supplier-query-legacy" }
    );

    const legacyReference = `Pago manual SP:${purchaseLegacy.supplierPurchaseId}`;
    const legacyPayment = await createPartyPaymentOutUseCase(
      {
        partyId: supplier.id,
        paymentType: "CASH",
        amount: "75",
        reference: legacyReference,
      },
      { traceId: "trace-legacy-payment" }
    );

    const legacyDetails = await getSupplierPurchaseDetailsById(
      purchaseLegacy.supplierPurchaseId
    );

    assert.ok(legacyDetails);
    assert.strictEqual(legacyDetails.payments.length, 1);
    assert.strictEqual(legacyDetails.payments[0]?.id, legacyPayment.paymentId);
    assert.strictEqual(legacyDetails.paidTotal, "75");
  });
});
