"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm";
import {
  defineFormStep,
  prefixIssuePathMapper,
} from "@/components/ui/MultiStepForm/stepBuilders";

import {
  SalesNoteFormSchema,
  SalesNoteCustomerStepSchema,
  type SalesNoteFormValues,
  SalesNoteLinesStepSchema,
  SalesNoteUnregisteredLinesStepSchema,
} from "@/modules/sales-notes/forms/salesNoteForm.schemas";

import { SalesNoteCustomerStep } from "./steps/SalesNoteCustomerStep";
import { SalesNoteLinesStep } from "./steps/SalesNoteLinesStep";
import { SalesNoteUnregisteredLinesStep } from "./steps/SalesNoteUnregisteredLinesStep";
import { SalesNoteSummaryStep } from "./steps/SalesNoteSummaryStep";

export function SalesNoteWizard(props: {
  onSubmit: (values: SalesNoteFormValues) => Promise<void>;
  submitting?: boolean;
}) {
  const { onSubmit, submitting } = props;

  const form = useForm<SalesNoteFormValues>({
    resolver: zodResolver(SalesNoteFormSchema),
    shouldUnregister: false, // ✅ wizard
    defaultValues: {
      customer: {
        mode: "PUBLIC",
        partyMode: "EXISTING",
        existingPartyName: "",
        existingPartyId: "",
        newParty: { name: "", phone: "", notes: "" },
      },
      lines: [
        {
          productVariantId: "",
          productName: "",
          quantity: 1,
          unitPrice: "",
          description: "",
        },
      ],
      unregisteredLines: [],
    },
    mode: "onSubmit",
  });

  const Step = defineFormStep<SalesNoteFormValues>();

  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: "customer",
        title: "Cliente",
        fieldPaths: [
          "customer.mode",
          "customer.partyMode",
          "customer.existingPartyId",
          "customer.newParty.name",
          "customer.newParty.phone",
          "customer.newParty.notes",
        ],
        validator: {
          schema: SalesNoteCustomerStepSchema,
          getStepValues: (v) => v.customer,
          mapIssuePathToFieldPath:
            prefixIssuePathMapper<SalesNoteFormValues>("customer"),
        },
        Component: SalesNoteCustomerStep,
      }),
      Step.withValidator({
        id: "lines",
        title: "Productos",
        fieldPaths: ["lines"],
        validator: {
          schema: SalesNoteLinesStepSchema,
          getStepValues: (v) => v.lines,
        },
        Component: SalesNoteLinesStep,
      }),
      {
        id: "unregisteredLines",
        kind: "step",
        title: "Productos no registrados",
        fieldPaths: ["unregisteredLines"],
        validator: {
          schema: SalesNoteUnregisteredLinesStepSchema,
          getStepValues: (v) => v.unregisteredLines,
          mapIssuePathToFieldPath: (issuePath) =>
            `unregisteredLines.${issuePath.map(String).join(".")}` as any,
        },
        Component: SalesNoteUnregisteredLinesStep,
      },
      {
        id: "summary",
        kind: "summary",
        title: "Resumen",
        fieldPaths: [],
        Component: SalesNoteSummaryStep,
        labels: {
          submit: "Guardar",
          submitting: "Guardando…",
          next: "Siguiente",
          back: "Atrás",
        },
      },
    ] as const;
  }, [Step]);

  return (
    <MultiStepForm<SalesNoteFormValues>
      config={{
        title: "Nueva nota de venta",
        description: "Captura el cliente. Más pasos se agregarán después.",
        showProgress: true,
        allowDraftSave: false,
        labels: {
          back: "Atrás",
          next: "Siguiente",
          submit: "Guardar",
          submitting: "Guardando…",
        },
      }}
      steps={steps}
      form={form}
      // finalSchema={SalesNoteFormSchema} // opcional; ya está en resolver
      onSubmit={onSubmit} // ✅ usa el handler real del cliente
      onEvent={(e) => {
        // Helpful during debugging
        console.log("SalesNoteWizard::event", e);
      }}
    />
  );
}
