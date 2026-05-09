import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { z } from "zod";
import { DocumentWizard } from "./DocumentWizard";
import type { UseFormDraftReturn } from "@/hooks/useFormDraft.types";

const useFormDraftMock = vi.fn();
const showRecoveryDialogMock = vi.fn();

vi.mock("@/hooks", () => ({
  useFormDraft: (...args: unknown[]) => useFormDraftMock(...args),
}));

vi.mock("@/components/ui/DraftRecovery", () => ({
  useDraftRecoveryDialog: () => ({
    showRecoveryDialog: showRecoveryDialogMock,
  }),
}));

vi.mock("@/components/ui/MultiStepForm/MultiStepForm", () => ({
  MultiStepForm: ({
    form,
    onSubmit,
  }: {
    form: { getValues: () => unknown };
    onSubmit: (values: unknown) => void | Promise<void>;
  }) => (
    <button type="button" onClick={() => void onSubmit(form.getValues())}>
      submit
    </button>
  ),
}));

const schema = z.object({
  customer: z.object({
    mode: z.literal("PUBLIC"),
  }),
  lines: z.array(z.string()).default([]),
  unregisteredLines: z.array(z.string()).default([]),
  reference: z.string().transform((value) => value.trim()),
});

function createDraftState(
  overrides: Partial<
    UseFormDraftReturn<z.input<typeof schema> & Record<string, unknown>>
  > = {},
): UseFormDraftReturn<z.input<typeof schema> & Record<string, unknown>> {
  return {
    hasDraft: false,
    draftTimestamp: null,
    isAutoSaving: false,
    lastSaved: null,
    hasInitialized: true,
    loadDraft: () => null,
    clearDraft: vi.fn(),
    saveDraft: vi.fn(),
    getDraftInfo: () => null,
    ...overrides,
  };
}

describe("DocumentWizard", () => {
  beforeEach(() => {
    useFormDraftMock.mockReset();
    showRecoveryDialogMock.mockReset();
    showRecoveryDialogMock.mockResolvedValue(false);
  });

  it("passes parsed schema output to onSubmit and defaults document arrays", async () => {
    useFormDraftMock.mockReturnValue(createDraftState());
    const onSubmit = vi.fn();

    render(
      <DocumentWizard<typeof schema>
        config={{
          formSchema: schema,
          labels: {
            back: "Atrás",
            next: "Siguiente",
            submit: "Guardar",
            submitting: "Guardando…",
          },
        }}
        steps={[]}
        initialValues={{
          customer: { mode: "PUBLIC" },
          reference: "  REF-001  ",
        }}
        onSubmit={onSubmit}
        submitting={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        customer: { mode: "PUBLIC" },
        lines: [],
        unregisteredLines: [],
        reference: "REF-001",
      }),
    );
  });

  it("restores a draft before submit when recovery is accepted", async () => {
    useFormDraftMock.mockReturnValue(
      createDraftState({
        hasDraft: true,
        draftTimestamp: "2026-01-01T00:00:00.000Z",
        loadDraft: () => ({
          customer: { mode: "PUBLIC" },
          lines: ["line-1"],
          unregisteredLines: [],
          reference: "  draft-ref  ",
        }),
      }),
    );
    showRecoveryDialogMock.mockResolvedValue(true);
    const onSubmit = vi.fn();

    render(
      <DocumentWizard<typeof schema>
        config={{
          formSchema: schema,
          labels: {
            back: "Atrás",
            next: "Siguiente",
            submit: "Guardar",
            submitting: "Guardando…",
          },
          draft: {
            draftKey: "sales-note:new",
            contextLabel: "nota de venta",
            enabled: true,
          },
        }}
        steps={[]}
        initialValues={{
          customer: { mode: "PUBLIC" },
          reference: "ignored",
        }}
        onSubmit={onSubmit}
        submitting={false}
      />,
    );

    await waitFor(() =>
      expect(showRecoveryDialogMock).toHaveBeenCalledOnce(),
    );

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        customer: { mode: "PUBLIC" },
        lines: ["line-1"],
        unregisteredLines: [],
        reference: "draft-ref",
      }),
    );
  });
});
