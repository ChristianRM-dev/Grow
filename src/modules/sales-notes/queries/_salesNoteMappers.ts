import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import {
  descriptionFromSnapshotForRegisteredLine,
  getSnapshotDisplayParts,
  inferCustomerModeFromSystemKey,
} from "@/modules/shared/documents/documentSnapshot";
import { buildProductName } from "@/modules/shared/products/productLabels";
import { normalizeDiscountPercent } from "@/modules/shared/utils/discounts";

export function toNumberSafe(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function decimalToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toFixed(2);

  if (
    typeof value === "object" &&
    value !== null &&
    typeof value.toString === "function"
  ) {
    return value.toString();
  }

  return "";
}

/**
 * Maps DB row (party + lines) into RHF form shape.
 * This is used ONLY by the Edit query.
 */
export function mapSalesNoteRowToFormValues(input: {
  party: {
    id: string;
    name: string;
    phone: string | null;
    notes: string | null;
    systemKey: string | null;
  } | null;
  lines: Array<{
    productVariantId: string | null;
    quantity: unknown;
    unitPrice: unknown;
    discountPercent?: unknown;
    descriptionSnapshot: string | null;
    productVariant: {
      speciesName: string;
      variantName: string | null;
      bagSize: string | null;
      color: string | null;
    } | null;
  }>;
}): SalesNoteFormValues {
  const party = input.party;
  const customerMode = inferCustomerModeFromSystemKey(party?.systemKey);

  const values: SalesNoteFormValues = {
    customer: {
      mode: customerMode,
      // Stable UI defaults. Schema allows optional but wizard expects this shape.
      partyMode: "EXISTING",
      existingPartyId: party?.id ?? "",
      existingPartyName: party?.name ?? "",
      newParty: {
        name: "",
        phone: "",
        notes: "",
      },
    },
    lines: [],
    unregisteredLines: [],
  };

  for (const l of input.lines) {
    const quantity = toNumberSafe(l.quantity, 1);
    const unitPrice = decimalToString(l.unitPrice);
    const snapshot = l.descriptionSnapshot ?? "";

    if (l.productVariantId) {
      const productName = l.productVariant
        ? buildProductName(l.productVariant)
        : "";

      values.lines.push({
        productVariantId: l.productVariantId,
        productName,
        quantity,
        unitPrice,
        discountPercent: normalizeDiscountPercent(l.discountPercent as number | undefined),
        description: descriptionFromSnapshotForRegisteredLine(
          snapshot,
          productName
        ),
      });
    } else {
      // Unregistered -> name is stored inside descriptionSnapshot
      const { description, displayName } = getSnapshotDisplayParts(snapshot);

      values.unregisteredLines.push({
        name: displayName,
        quantity,
        unitPrice,
        discountPercent: normalizeDiscountPercent(l.discountPercent as number | undefined),
        description,
        shouldRegister: false,
      });
    }
  }

  return values;
}
