import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";

export function buildProductName(input: {
  speciesName: string;
  variantName: string | null;
  bagSize: string | null;
  color: string | null;
}): string {
  const parts = [
    input.speciesName,
    input.variantName ?? undefined,
    input.bagSize ?? undefined,
    input.color ?? undefined,
  ].filter(Boolean) as string[];

  return parts.join(" · ");
}

export function inferCustomerModeFromSystemKey(
  systemKey: string | null | undefined
): "PUBLIC" | "PARTY" {
  const key = (systemKey ?? "").toUpperCase();
  if (key === "PUBLIC" || key === "WALK_IN_PUBLIC" || key === "WALKIN_PUBLIC") {
    return "PUBLIC";
  }
  return "PARTY";
}

/**
 * Your DB stores a snapshot string like:
 *   "Name — Description"
 * Sometimes description can be empty, or snapshot can be just the name.
 */
export function splitSnapshot(snapshot: string): {
  name: string;
  description: string;
} {
  const s = String(snapshot ?? "").trim();
  if (!s) return { name: "", description: "" };

  const sep = " — ";
  const idx = s.indexOf(sep);
  if (idx < 0) return { name: s, description: "" };

  const name = s.slice(0, idx).trim();
  const description = s.slice(idx + sep.length).trim();
  return { name, description };
}

/**
 * If snapshot includes the productName prefix (common in your create use case),
 * strip it so the form "description" field doesn't show duplicated names.
 */
export function descriptionFromSnapshotForRegisteredLine(
  snapshot: string,
  productName: string
): string {
  const s = String(snapshot ?? "").trim();
  const pn = String(productName ?? "").trim();
  if (!s) return "";

  const sep = " — ";
  const prefix = pn ? `${pn}${sep}` : "";

  if (prefix && s.startsWith(prefix)) {
    return s.slice(prefix.length).trim();
  }

  // Fallback: if it's "name — desc", return desc
  const { description } = splitSnapshot(s);
  return description || "";
}

export function toNumberSafe(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function decimalToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toFixed(2);

  // Prisma Decimal has toString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyVal = value as any;
  if (typeof anyVal?.toString === "function") return anyVal.toString();
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
        description: descriptionFromSnapshotForRegisteredLine(
          snapshot,
          productName
        ),
      });
    } else {
      // Unregistered -> name is stored inside descriptionSnapshot
      const { name, description } = splitSnapshot(snapshot);

      values.unregisteredLines.push({
        name: name || snapshot || "—",
        quantity,
        unitPrice,
        description,
        shouldRegister: false,
      });
    }
  }


  return values;
}
