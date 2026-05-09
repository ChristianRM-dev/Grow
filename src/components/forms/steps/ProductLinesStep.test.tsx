import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm, useWatch } from "react-hook-form";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { QuotationFormInput } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  ProductLinesStep,
  QUOTATION_LINES_CONFIG,
} from "./ProductLinesStep";

const searchProductVariantsActionMock = vi.fn();

vi.mock("@/modules/products/actions/searchProductVariants.action", () => ({
  searchProductVariantsAction: (...args: unknown[]) =>
    searchProductVariantsActionMock(...args),
}));

function QuotationLinesHarness() {
  const form = useForm<QuotationFormInput>({
    defaultValues: {
      customer: {
        mode: "PUBLIC",
        partyName: "",
      },
      lines: [],
      unregisteredLines: [],
    },
  });
  const values = useWatch({ control: form.control });

  return (
    <>
      <ProductLinesStep form={form} config={QUOTATION_LINES_CONFIG} />
      <pre data-testid="values">{JSON.stringify(values)}</pre>
    </>
  );
}

describe("ProductLinesStep", () => {
  beforeEach(() => {
    searchProductVariantsActionMock.mockReset();
  });

  it("adds and removes rows", async () => {
    render(<QuotationLinesHarness />);

    fireEvent.click(screen.getByRole("button", { name: /Agregar primer producto/i }));

    await waitFor(() => {
      const values = JSON.parse(screen.getByTestId("values").textContent ?? "{}");
      expect(values.lines).toHaveLength(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      const values = JSON.parse(screen.getByTestId("values").textContent ?? "{}");
      expect(values.lines).toHaveLength(0);
    });
  });

  it("populates the configured price field after selecting a product", async () => {
    searchProductVariantsActionMock.mockResolvedValue([
      {
        id: "variant-1",
        label: "Rosa Premium",
        defaultPrice: "45.00",
        descriptionSuggestion: "Bolsa 5L",
      },
    ]);

    render(<QuotationLinesHarness />);

    fireEvent.click(screen.getByRole("button", { name: /Agregar primer producto/i }));

    const searchInput = screen.getByLabelText("Buscar producto");
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: "ro" } });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Rosa Premium/i }),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Rosa Premium/i }));

    await waitFor(() => {
      const values = JSON.parse(screen.getByTestId("values").textContent ?? "{}");
      expect(values.lines[0]).toMatchObject({
        productVariantId: "variant-1",
        productName: "Rosa Premium",
        quotedUnitPrice: "45.00",
        quantity: 1,
        description: "Bolsa 5L",
      });
    });
  });
});
