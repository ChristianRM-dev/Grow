import type { FieldPath, FieldValues } from "react-hook-form";

export type DocumentPriceFieldKey = "unitPrice" | "quotedUnitPrice";
export type DocumentCustomerMode = "PUBLIC" | "PARTY";
export type DocumentPartyMode = "EXISTING" | "NEW";

export type DocumentNewPartyValue = {
  name?: string;
  phone?: string;
  notes?: string;
};

export type DocumentCustomerValue = {
  mode: DocumentCustomerMode;
  partyMode?: DocumentPartyMode;
  existingPartyId?: string;
  existingPartyName?: string;
  partyName?: string;
  newParty?: DocumentNewPartyValue;
};

type DocumentPriceRecord<TPriceField extends DocumentPriceFieldKey> =
  Partial<Record<DocumentPriceFieldKey, string>> &
    (TPriceField extends DocumentPriceFieldKey
      ? {
          [K in TPriceField]: string;
        }
      : never);

export type DocumentRegisteredLine<TPriceField extends DocumentPriceFieldKey> = {
  productVariantId: string;
  productName: string;
  quantity: number;
  discountPercent?: number;
  description?: string;
} & DocumentPriceRecord<TPriceField>;

export type DocumentUnregisteredLine<
  TPriceField extends DocumentPriceFieldKey,
> = {
  name: string;
  quantity: number;
  discountPercent?: number;
  description?: string;
} & DocumentPriceRecord<TPriceField>;

export type DocumentFormShape<
  TPriceField extends DocumentPriceFieldKey,
  TUnregisteredLine extends DocumentUnregisteredLine<TPriceField> = DocumentUnregisteredLine<TPriceField>,
> = FieldValues & {
  customer: DocumentCustomerValue;
  lines?: DocumentRegisteredLine<TPriceField>[];
  unregisteredLines?: TUnregisteredLine[];
};

export type DocumentCustomerFieldPath =
  | "mode"
  | "partyMode"
  | "existingPartyId"
  | "existingPartyName"
  | "partyName"
  | "newParty.name"
  | "newParty.phone"
  | "newParty.notes";

export type RegisteredLineFieldKey<TPriceField extends DocumentPriceFieldKey> =
  Extract<keyof DocumentRegisteredLine<TPriceField>, string>;

export type UnregisteredLineFieldKey<TLine extends object> = Extract<
  keyof TLine,
  string
>;

function issuePathToPathSuffix(issuePath: readonly PropertyKey[]) {
  return issuePath
    .map((segment) =>
      typeof segment === "symbol"
        ? segment.description ?? segment.toString()
        : String(segment),
    )
    .join(".");
}

export function customerFieldPath<TForm extends FieldValues>(
  path: DocumentCustomerFieldPath,
): FieldPath<TForm> {
  return `customer.${path}` as FieldPath<TForm>;
}

export function lineFieldPath<
  TForm extends FieldValues,
  TPriceField extends DocumentPriceFieldKey,
>(
  index: number,
  field: RegisteredLineFieldKey<TPriceField>,
): FieldPath<TForm> {
  return `lines.${index}.${field}` as FieldPath<TForm>;
}

export function unregisteredLineFieldPath<
  TForm extends FieldValues,
  TLine extends object,
>(
  index: number,
  field: UnregisteredLineFieldKey<TLine>,
): FieldPath<TForm> {
  return `unregisteredLines.${index}.${field}` as FieldPath<TForm>;
}

export function arrayIssuePathToFieldPath<TForm extends FieldValues>(
  arrayName: "lines" | "unregisteredLines",
  issuePath: readonly PropertyKey[],
): FieldPath<TForm> {
  const suffix = issuePathToPathSuffix(issuePath);
  return (suffix ? `${arrayName}.${suffix}` : arrayName) as FieldPath<TForm>;
}
