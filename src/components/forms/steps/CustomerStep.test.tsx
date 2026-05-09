import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm, useWatch } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import type { SalesNoteFormInput } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import type { QuotationFormInput } from "@/modules/quotations/forms/quotationForm.schemas";
import {
  CustomerStep,
  QUOTATION_CUSTOMER_CONFIG,
  SALES_NOTE_CUSTOMER_CONFIG,
} from "./CustomerStep";

vi.mock("@/modules/reports/components/PartyAutocomplete", () => ({
  PartyAutocomplete: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <input
      aria-label="party-autocomplete"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

function SalesNoteCustomerHarness({
  defaultValues,
}: {
  defaultValues: Partial<SalesNoteFormInput>;
}) {
  const form = useForm<SalesNoteFormInput>({
    defaultValues,
  });
  const values = useWatch({ control: form.control });

  return (
    <>
      <CustomerStep form={form} config={SALES_NOTE_CUSTOMER_CONFIG} />
      <pre data-testid="values">{JSON.stringify(values)}</pre>
    </>
  );
}

function QuotationCustomerHarness({
  defaultValues,
}: {
  defaultValues: Partial<QuotationFormInput>;
}) {
  const form = useForm<QuotationFormInput>({
    defaultValues,
  });

  return <CustomerStep form={form} config={QUOTATION_CUSTOMER_CONFIG} />;
}

describe("CustomerStep", () => {
  it("clears existing and new party fields when switching Sales Notes to PUBLIC", async () => {
    render(
      <SalesNoteCustomerHarness
        defaultValues={{
          customer: {
            mode: "PARTY",
            partyMode: "EXISTING",
            existingPartyId: "party-1",
            existingPartyName: "Cliente Laureles",
            newParty: {
              name: "Temporal",
              phone: "5512345678",
              notes: "Pendiente",
            },
          },
          lines: [],
          unregisteredLines: [],
        }}
      />,
    );

    fireEvent.click(screen.getByLabelText("Venta al público"));

    await waitFor(() => {
      const values = JSON.parse(screen.getByTestId("values").textContent ?? "{}");
      expect(values.customer.mode).toBe("PUBLIC");
      expect(values.customer.existingPartyId).toBe("");
      expect(values.customer.existingPartyName).toBe("");
      expect(values.customer.newParty.name).toBe("");
      expect(values.customer.newParty.phone).toBe("");
      expect(values.customer.newParty.notes).toBe("");
    });
  });

  it("hydrates the existing party name for quotations without clearing it", async () => {
    render(
      <QuotationCustomerHarness
        defaultValues={{
          customer: {
            mode: "PARTY",
            partyMode: "EXISTING",
            existingPartyId: "party-1",
            existingPartyName: "Florería San José",
            partyName: "Florería San José",
          },
          lines: [],
          unregisteredLines: [],
        }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("party-autocomplete")).toHaveValue(
        "Florería San José",
      ),
    );
  });
});
