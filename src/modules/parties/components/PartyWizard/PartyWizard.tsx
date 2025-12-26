"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { MultiStepForm } from "@/components/ui/MultiStepForm/MultiStepForm";
import { defineFormStep } from "@/components/ui/MultiStepForm/stepBuilders";

import {
  PartyFinalSchema,
  type PartyFormValues,
} from "@/modules/parties/forms/partyForm.schemas";

import { PartySingleStep } from "./steps/PartySingleStep";

type PartyWizardProps = {
  initialValues?: Partial<PartyFormValues>;
  onSubmit: (values: PartyFormValues) => Promise<void> | void;
  submitting: boolean;
};

export function PartyWizard({
  initialValues,
  onSubmit,
  submitting,
}: PartyWizardProps) {
  const form = useForm<PartyFormValues>({
    resolver: zodResolver(PartyFinalSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  const Step = defineFormStep<PartyFormValues>();

  const steps = useMemo(() => {
    return [
      Step.withValidator({
        id: "party",
        title: "Contacto",
        fieldPaths: [
          "name",
          "phone",
          "notes",
          "roles.isCustomer",
          "roles.isSupplier",
        ],
        validator: {
          schema: PartyFinalSchema,
          getStepValues: (v) => v,
        },
        Component: PartySingleStep,
        labels: { next: "Guardar", submit: "Guardar" },
      }),
    ] as const;
  }, [Step]);

  return (
    <MultiStepForm<PartyFormValues>
      config={{
        showProgress: false,
        allowFreeNavigation: false,
        allowDraftSave: false,
        labels: {
          back: "Atrás",
          next: "Guardar",
          submit: "Guardar",
          submitting: submitting ? "Guardando…" : "Guardando…",
        },
      }}
      steps={steps}
      form={form}
      finalSchema={PartyFinalSchema}
      onSubmit={onSubmit}
    />
  );
}
