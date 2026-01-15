-- AlterTable
ALTER TABLE "SalesNote" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "SalesNote_isDeleted_idx" ON "SalesNote"("isDeleted");
