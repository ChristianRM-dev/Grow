import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  descriptionFromSnapshotForRegisteredLine,
  getSnapshotDisplayParts,
  inferCustomerModeFromSystemKey,
} from "@/modules/shared/documents/documentSnapshot";
import { buildProductName } from "@/modules/shared/products/productLabels";
import { normalizeDiscountPercent } from "@/modules/shared/utils/discounts";
import {
  decimalToString,
  toNumberSafe,
} from "@/modules/sales-notes/queries/_salesNoteMappers";

export function mapQuotationRowToFormValues(input: {
  party: { id: string; name: string; systemKey: string | null } | null;
  lines: Array<{
    productVariantId: string | null;
    quantity: unknown;
    quotedUnitPrice: unknown;
    discountPercent?: unknown;
    descriptionSnapshot: string | null;
    productVariant: {
      speciesName: string;
      variantName: string | null;
      bagSize: string | null;
      color: string | null;
    } | null;
  }>;
  status?: QuotationFormValues["status"];
}): QuotationFormValues {
  const values: QuotationFormValues = {
    customer: {
      mode: inferCustomerModeFromSystemKey(input.party?.systemKey),
      partyName: input.party?.name ?? "",
      partyMode: "EXISTING",
      existingPartyId: input.party?.id ?? "",
      existingPartyName: input.party?.name ?? "",
    },
    lines: [],
    unregisteredLines: [],
    status: input.status,
  };

  for (const l of input.lines) {
    const quantity = toNumberSafe(l.quantity, 1);
    const unitPrice = decimalToString(l.quotedUnitPrice);
    const snapshot = l.descriptionSnapshot ?? "";

    if (l.productVariantId) {
      const productName = l.productVariant
        ? buildProductName(l.productVariant)
        : "";

      values.lines.push({
        productVariantId: l.productVariantId,
        productName,
        quantity,
        quotedUnitPrice: unitPrice,
        discountPercent: normalizeDiscountPercent(l.discountPercent as number | undefined),
        description: descriptionFromSnapshotForRegisteredLine(
          snapshot,
          productName
        ),
      });
    } else {
      const { description, displayName } = getSnapshotDisplayParts(snapshot);

      values.unregisteredLines.push({
        name: displayName,
        quantity,
        quotedUnitPrice: unitPrice,
        discountPercent: normalizeDiscountPercent(l.discountPercent as number | undefined),
        description,
      });
    }
  }

  return values;
}
