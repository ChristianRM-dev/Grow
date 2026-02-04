/*
  Warnings:

  - A unique constraint covering the columns `[clientRequestId]` on the table `SalesNote` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SalesNote" ADD COLUMN     "clientRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SalesNote_clientRequestId_key" ON "SalesNote"("clientRequestId");
