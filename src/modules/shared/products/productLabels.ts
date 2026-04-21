export type ProductLabelInput = {
  speciesName: string;
  variantName: string | null;
  bagSize?: string | null;
  color?: string | null;
};

export function buildProductName(input: ProductLabelInput): string {
  const parts = [
    input.speciesName,
    input.variantName ?? undefined,
    input.bagSize ?? undefined,
    input.color ?? undefined,
  ].filter(Boolean) as string[];

  return parts.join(" · ");
}

export function buildProductVariantDisplayName(input: {
  speciesName: string;
  variantName: string | null;
}): string {
  return input.variantName
    ? `${input.speciesName} - ${input.variantName}`
    : input.speciesName;
}
