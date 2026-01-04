-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('SALES_NOTE', 'PAYMENT', 'SUPPLIER_PURCHASE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE');

-- CreateEnum
CREATE TYPE "AuditChangeKey" AS ENUM ('SALES_NOTE_SUBTOTAL', 'SALES_NOTE_DISCOUNT_TOTAL', 'SALES_NOTE_TOTAL', 'SALES_NOTE_BALANCE_DUE', 'PAYMENT_AMOUNT', 'SUPPLIER_PURCHASE_TOTAL', 'SUPPLIER_PURCHASE_BALANCE_DUE');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "supplierPurchaseId" TEXT;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "rootEntityType" "AuditEntityType",
    "rootEntityId" TEXT,
    "reference" TEXT,
    "actorUserId" TEXT,
    "actorUserName" TEXT,
    "actorUserEmail" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogChange" (
    "id" TEXT NOT NULL,
    "auditLogId" TEXT NOT NULL,
    "key" "AuditChangeKey" NOT NULL,
    "decimalBefore" DECIMAL(18,2),
    "decimalAfter" DECIMAL(18,2),
    "stringBefore" TEXT,
    "stringAfter" TEXT,
    "jsonBefore" JSONB,
    "jsonAfter" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_supplierPurchaseId_idx" ON "Payment"("supplierPurchaseId");

-- CreateIndex
CREATE INDEX "AuditLog_rootEntityType_rootEntityId_createdAt_idx" ON "AuditLog"("rootEntityType", "rootEntityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_eventKey_createdAt_idx" ON "AuditLog"("eventKey", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLogChange_auditLogId_idx" ON "AuditLogChange"("auditLogId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_supplierPurchaseId_fkey" FOREIGN KEY ("supplierPurchaseId") REFERENCES "SupplierPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogChange" ADD CONSTRAINT "AuditLogChange_auditLogId_fkey" FOREIGN KEY ("auditLogId") REFERENCES "AuditLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
