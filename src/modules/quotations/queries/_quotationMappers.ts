import type { QuotationFormValues } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  buildProductName,
  decimalToString,
  descriptionFromSnapshotForRegisteredLine,
  splitSnapshot,
  toNumberSafe,
} from "@/modules/sales-notes/queries/_salesNoteMappers";
import { inferCustomerModeFromSystemKey } from "@/modules/sales-notes/queries/_salesNoteMappers";

export function mapQuotationRowToFormValues(input: {
  party: { id: string; name: string; systemKey: string | null } | null;
  lines: Array<{
    productVariantId: string | null;
    quantity: unknown;
    quotedUnitPrice: unknown;
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
        description: descriptionFromSnapshotForRegisteredLine(
          snapshot,
          productName
        ),
      });
    } else {
      const { name, description } = splitSnapshot(snapshot);

      values.unregisteredLines.push({
        name: name || snapshot || "—",
        quantity,
        quotedUnitPrice: unitPrice,
        description,
      });
    }
  }



  return values;
}
