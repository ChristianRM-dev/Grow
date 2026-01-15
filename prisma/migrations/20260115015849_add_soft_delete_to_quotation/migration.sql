-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Quotation_isDeleted_idx" ON "Quotation"("isDeleted");
