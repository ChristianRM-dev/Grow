// src/modules/parties/queries/getPartyById.query.ts
import { prisma } from "@/lib/prisma";
import { assertNotSoftDeleted } from "@/modules/shared/queries/softDeleteHelpers";

export type PartyEditDto = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  roles: {
    isCustomer: boolean;
    isSupplier: boolean;
  };
};

export async function getPartyById(id: string): Promise<PartyEditDto | null> {
  const row = await prisma.party.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      notes: true,
      isDeleted: true, // 👈 Needed for assertNotSoftDeleted
      roles: {
        select: {
          role: true,
        },
      },
    },
  });

  // 👇 Throws notFound() if deleted or doesn't exist
  assertNotSoftDeleted(row, "Contacto");

  // Map roles array to boolean flags
  const isCustomer = row.roles.some((r) => r.role === "CUSTOMER");
  const isSupplier = row.roles.some((r) => r.role === "SUPPLIER");

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    notes: row.notes,
    roles: {
      isCustomer,
      isSupplier,
    },
  };
}
