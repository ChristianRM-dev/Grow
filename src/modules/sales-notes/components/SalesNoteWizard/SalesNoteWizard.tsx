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
} from "@/modules/sales-notes/forms/salesNoteForm.schemas";

import { SalesNoteCustomerStep } from "./steps/SalesNoteCustomerStep";
import { SalesNoteLinesStep } from "./steps/SalesNoteLinesStep";

export function SalesNoteWizard() {
  const form = useForm<SalesNoteFormValues>({
    resolver: zodResolver(SalesNoteFormSchema),
    defaultValues: {
      customer: {
        mode: "PUBLIC",
        partyMode: "EXISTING",
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
    ] as const;
  }, [Step]);

  return (
    <MultiStepForm<SalesNoteFormValues>
      config={{
        title: "Nueva nota de venta",
        description: "Captura el cliente. Más pasos se agregarán después.",
        showProgress: false,
        allowDraftSave: false,
        labels: {
          back: "Atrás",
          next: "Siguiente",
          submit: "Siguiente",
          submitting: "Procesando…",
        },
      }}
      steps={steps}
      form={form}
      finalSchema={SalesNoteFormSchema}
      // No server save yet (demo only)
      onSubmit={async (values) => {
        console.log("salesNote::demo_submit", values);
        alert("Demo: paso 1 válido ✅");
      }}
    />
  );
}
