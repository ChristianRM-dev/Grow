-- AlterTable
ALTER TABLE "PartyLedgerEntry" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SupplierPurchase" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "PartyLedgerEntry_isDeleted_idx" ON "PartyLedgerEntry"("isDeleted");

-- CreateIndex
CREATE INDEX "Payment_isDeleted_idx" ON "Payment"("isDeleted");

-- CreateIndex
CREATE INDEX "SupplierPurchase_isDeleted_idx" ON "SupplierPurchase"("isDeleted");
