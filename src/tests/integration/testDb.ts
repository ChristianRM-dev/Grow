import { Prisma, PartyRoleType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function resetDatabase() {
  await prisma.auditLogChange.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.partyLedgerEntry.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.salesNoteLine.deleteMany();
  await prisma.salesNote.deleteMany();
  await prisma.supplierPurchase.deleteMany();
  await prisma.quotationLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.partyRole.deleteMany();
  await prisma.party.deleteMany();
  await prisma.folioSequence.deleteMany();
  await prisma.productVariant.deleteMany();
}

export async function createTestCustomerParty() {
  return prisma.party.create({
    data: {
      name: "Test Customer",
      roles: { create: [{ role: PartyRoleType.CUSTOMER }] },
    },
    select: { id: true, name: true },
  });
}

export async function createTestSupplierParty() {
  return prisma.party.create({
    data: {
      name: "Test Supplier",
      roles: { create: [{ role: PartyRoleType.SUPPLIER }] },
    },
    select: { id: true, name: true },
  });
}

export async function createTestProductVariant() {
  return prisma.productVariant.create({
    data: {
      speciesName: "Picea",
      variantName: "Azul",
      bagSize: "3L",
      color: "Verde",
      defaultPrice: new Prisma.Decimal(25),
    },
    select: { id: true, speciesName: true },
  });
}
