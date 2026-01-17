-- AlterTable
ALTER TABLE "SalesNote" ADD COLUMN     "createdByUserId" TEXT;

-- CreateIndex
CREATE INDEX "SalesNote_createdByUserId_idx" ON "SalesNote"("createdByUserId");

-- AddForeignKey
ALTER TABLE "SalesNote" ADD CONSTRAINT "SalesNote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
