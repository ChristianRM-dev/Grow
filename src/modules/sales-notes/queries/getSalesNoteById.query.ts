import { prisma } from "@/lib/prisma";
import { assertNotSoftDeleted } from "@/modules/shared/queries/softDeleteHelpers";
import {
  buildProductName,
  decimalToString,
  descriptionFromSnapshotForRegisteredLine,
  inferCustomerModeFromSystemKey,
  splitSnapshot,
  toNumberSafe,
} from "./_salesNoteMappers";

export type SalesNoteDetailsLineDto = {
  kind: "REGISTERED" | "UNREGISTERED";
  productVariantId: string | null;
  name: string; // productName or free-name
  quantity: number;
  unitPrice: string; // keep as string for display
  description: string;
  lineTotal: string; // formatted plain "123.45"
};

export type SalesNoteDetailsDto = {
  id: string;
  createdAt: string;
  updatedAt: string | null;

  customer: {
    mode: "PUBLIC" | "PARTY";
    label: string; // "Venta al público" OR party name
    partyId: string | null;
  };

  lines: SalesNoteDetailsLineDto[];

  subtotalRegistered: string;
  subtotalUnregistered: string;
  totalGeneral: string;
};

function moneyMultiply(qty: number, unitPriceStr: string): number {
  const price = Number(String(unitPriceStr ?? "").trim());
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  return qty * price;
}

function toMoneyString(n: number): string {
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export async function getSalesNoteById(
  id: string
): Promise<SalesNoteDetailsDto | null> {
  const row = await prisma.salesNote.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      isDeleted: true, // ← Necesario para verificar

      party: {
        select: {
          id: true,
          name: true,
          systemKey: true,
        },
      },

      lines: {
        select: {
          id: true,
          productVariantId: true,
          quantity: true,
          unitPrice: true,
          descriptionSnapshot: true,

          productVariant: {
            select: {
              speciesName: true,
              variantName: true,
              bagSize: true,
              color: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  // Redirigir a 404 si está eliminada
  assertNotSoftDeleted(row, "Nota de venta");

  const mode = inferCustomerModeFromSystemKey(row.party?.systemKey);
  const customerLabel =
    mode === "PUBLIC" ? "Venta al público" : row.party?.name ?? "—";

  let subtotalRegistered = 0;
  let subtotalUnregistered = 0;

  const lines: SalesNoteDetailsLineDto[] = row.lines.map((l) => {
    const quantity = toNumberSafe(l.quantity, 1);
    const unitPrice = decimalToString(l.unitPrice);
    const snapshot = l.descriptionSnapshot ?? "";

    if (l.productVariantId) {
      const productName = l.productVariant
        ? buildProductName(l.productVariant)
        : "—";
      const description = descriptionFromSnapshotForRegisteredLine(
        snapshot,
        productName
      );

      const lineTotal = moneyMultiply(quantity, unitPrice);
      subtotalRegistered += lineTotal;

      return {
        kind: "REGISTERED",
        productVariantId: l.productVariantId,
        name: productName,
        quantity,
        unitPrice,
        description,
        lineTotal: toMoneyString(lineTotal),
      };
    }

    // UNREGISTERED
    const { name, description } = splitSnapshot(snapshot);
    const lineTotal = moneyMultiply(quantity, unitPrice);
    subtotalUnregistered += lineTotal;

    return {
      kind: "UNREGISTERED",
      productVariantId: null,
      name: name || snapshot || "—",
      quantity,
      unitPrice,
      description,
      lineTotal: toMoneyString(lineTotal),
    };
  });

  const totalGeneral = subtotalRegistered + subtotalUnregistered;

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,

    customer: {
      mode,
      label: customerLabel,
      partyId: row.party?.id ?? null,
    },

    lines,

    subtotalRegistered: toMoneyString(subtotalRegistered),
    subtotalUnregistered: toMoneyString(subtotalUnregistered),
    totalGeneral: toMoneyString(totalGeneral),
  };
}
