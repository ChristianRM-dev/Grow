import { describe, expect, it } from "vitest";
import {
  buildProductName,
  buildProductVariantDisplayName,
} from "./productLabels";

describe("productLabels", () => {
  it("builds the rich product name used in document snapshots", () => {
    expect(
      buildProductName({
        speciesName: "Rosal",
        variantName: "Roja",
        bagSize: "3L",
        color: "Vino",
      }),
    ).toBe("Rosal · Roja · 3L · Vino");
  });

  it("builds a compact product label for product screens", () => {
    expect(
      buildProductVariantDisplayName({
        speciesName: "Rosal",
        variantName: "Roja",
      }),
    ).toBe("Rosal - Roja");
  });
});
