"use client";

/**
 * CustomerStep - Shared customer/contact selection step for document wizards.
 *
 * Used by both Sales Notes ("Cliente") and Quotations ("Contacto") flows.
 * Supports:
 * - PUBLIC mode (no customer) vs PARTY mode (with customer)
 * - EXISTING party selection via PartyAutocomplete
 * - NEW party inline form (name, phone, notes)
 *
 * Configurable via `CustomerStepConfig` to customize labels per document type.
 */

import React, { useEffect, useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { PartyAutocomplete } from "@/modules/reports/components/PartyAutocomplete";

/**
 * Configuration for customizing CustomerStep labels per document type.
 */
export type CustomerStepConfig = {
  /** Heading label (e.g., "Cliente" or "Contacto") */
  heading: string;
  /** Description text below heading (optional) */
  description?: string;
  /** Label for the PARTY radio (e.g., "Con cliente" or "Con contacto") */
  partyRadioLabel: string;
  /** Section heading for party type selection (e.g., "Tipo de cliente" or "Tipo de contacto") */
  partyTypeHeading: string;
  /** Label for EXISTING party radio (e.g., "Elegir cliente registrado") */
  existingPartyLabel: string;
  /** Label for NEW party radio (e.g., "Registrar nuevo cliente") */
  newPartyLabel: string;
  /** Label for the autocomplete search (e.g., "Buscar cliente") */
  searchLabel: string;
  /** Placeholder for the new party name input */
  namePlaceholder: string;
  /**
   * Whether to clear fields on mode switch (Sales Notes behavior).
   * If false, only hydrates from existing values (Quotations behavior).
   */
  clearFieldsOnModeSwitch: boolean;
};

export const SALES_NOTE_CUSTOMER_CONFIG: CustomerStepConfig = {
  heading: "Cliente",
  partyRadioLabel: "Con cliente",
  partyTypeHeading: "Tipo de cliente",
  existingPartyLabel: "Elegir cliente registrado",
  newPartyLabel: "Registrar nuevo cliente",
  searchLabel: "Buscar cliente",
  namePlaceholder: "Ej: Vivero Los Laureles",
  clearFieldsOnModeSwitch: true,
};

export const QUOTATION_CUSTOMER_CONFIG: CustomerStepConfig = {
  heading: "Contacto",
  description: "Selecciona el contacto para la cotización.",
  partyRadioLabel: "Con contacto",
  partyTypeHeading: "Tipo de contacto",
  existingPartyLabel: "Elegir contacto registrado",
  newPartyLabel: "Registrar nuevo contacto",
  searchLabel: "Buscar contacto",
  namePlaceholder: "Ej: Florería San José",
  clearFieldsOnModeSwitch: false,
};

type CustomerStepProps<TForm extends FieldValues> = {
  form: UseFormReturn<TForm>;
  config: CustomerStepConfig;
};

export function CustomerStep<TForm extends FieldValues>({
  form,
  config,
}: CustomerStepProps<TForm>) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // Use `any` for dynamic field paths since the form type varies
  const mode = watch("customer.mode" as any);
  const partyMode = watch("customer.partyMode" as any);
  const existingPartyId = watch("customer.existingPartyId" as any) as string | undefined;
  const existingPartyName = watch("customer.existingPartyName" as any) as string | undefined;

  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);

  const customerErrors = (errors as any).customer;

  // Set field value with correct typing bypass
  const setField = (path: string, value: any, options?: any) => {
    setValue(path as any, value, options);
  };

  // Clean state when switching modes (Sales Notes behavior)
  useEffect(() => {
    if (!config.clearFieldsOnModeSwitch) return;

    if (mode === "PUBLIC") {
      setField("customer.partyMode", undefined);
      setField("customer.existingPartyId", "");
      setField("customer.existingPartyName", "");
      setField("customer.newParty.name", "");
      setField("customer.newParty.phone", "");
      setField("customer.newParty.notes", "");
      setTerm("");
      setOpen(false);
      return;
    }

    // mode === "PARTY"
    if (!partyMode) {
      setField("customer.partyMode", "EXISTING");
    }
  }, [mode, partyMode, config.clearFieldsOnModeSwitch]);

  // Clean state when switching partyMode (Sales Notes behavior)
  useEffect(() => {
    if (!config.clearFieldsOnModeSwitch) return;
    if (mode !== "PARTY") return;
    if (!partyMode) return;

    if (partyMode === "EXISTING") {
      setField("customer.newParty.name", "");
      setField("customer.newParty.phone", "");
      setField("customer.newParty.notes", "");

      const label = String(existingPartyName ?? "").trim();
      if (existingPartyId && label && term.trim().length === 0) {
        setTerm(label);
      }
      return;
    }

    // partyMode === "NEW"
    setField("customer.existingPartyId", "");
    setField("customer.existingPartyName", "");
    setTerm("");
    setOpen(false);
  }, [mode, partyMode, existingPartyId, existingPartyName, term, config.clearFieldsOnModeSwitch]);

  // Hydrate term from existingPartyName when selection exists (edit scenario)
  useEffect(() => {
    if (config.clearFieldsOnModeSwitch) {
      // Already handled in the effects above for Sales Notes
      if (mode !== "PARTY" || partyMode !== "EXISTING") return;
      const label = String(existingPartyName ?? "").trim();
      if (!existingPartyId || !label) return;
      if (!open && term.trim() !== label) {
        setTerm(label);
      }
    } else {
      // Quotation behavior: simple hydration
      const label = String(existingPartyName ?? "").trim();
      if (existingPartyId && label && term.trim().length === 0) {
        setTerm(label);
      }
    }
  }, [existingPartyId, existingPartyName, mode, partyMode, open, term, config.clearFieldsOnModeSwitch]);

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* Mode: PUBLIC vs PARTY */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">{config.heading}</h3>
          {config.description && (
            <p className="text-sm opacity-70">{config.description}</p>
          )}

          <div className={`flex flex-col gap-2 md:flex-row md:items-center ${config.description ? "mt-4" : ""}`}>
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="radio"
                className="radio radio-primary"
                value="PUBLIC"
                {...register("customer.mode" as any)}
              />
              <span className="label-text">Venta al público</span>
            </label>

            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="radio"
                className="radio radio-primary"
                value="PARTY"
                {...register("customer.mode" as any)}
              />
              <span className="label-text">{config.partyRadioLabel}</span>
            </label>
          </div>

          {/* PARTY block - rendered inside same card for Quotation layout */}
          {mode === "PARTY" ? (
            <div className="mt-4">
              <h4 className="font-semibold">{config.partyTypeHeading}</h4>

              <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="radio"
                    className="radio radio-primary"
                    value="EXISTING"
                    {...register("customer.partyMode" as any)}
                  />
                  <span className="label-text">{config.existingPartyLabel}</span>
                </label>

                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="radio"
                    className="radio radio-primary"
                    value="NEW"
                    {...register("customer.partyMode" as any)}
                  />
                  <span className="label-text">{config.newPartyLabel}</span>
                </label>
              </div>

              {customerErrors?.partyMode?.message ? (
                <p className="mt-2 text-sm text-error">
                  {String(customerErrors.partyMode.message)}
                </p>
              ) : null}

              {/* EXISTING - PartyAutocomplete */}
              {partyMode === "EXISTING" ? (
                <div className="mt-4">
                  <PartyAutocomplete
                    label={config.searchLabel}
                    placeholder="Escribe al menos 2 letras…"
                    selectedId={existingPartyId || ""}
                    selectedName={existingPartyName || ""}
                    onSelect={(id, name) => {
                      setField("customer.existingPartyId", id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setField("customer.existingPartyName", name, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    onClear={() => {
                      setField("customer.existingPartyId", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setField("customer.existingPartyName", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    value={term}
                    onChange={setTerm}
                  />

                  {customerErrors?.existingPartyId?.message ? (
                    <p className="mt-2 text-sm text-error">
                      {String(customerErrors.existingPartyId.message)}
                    </p>
                  ) : null}

                  {/* Hidden inputs for react-hook-form */}
                  <input
                    type="hidden"
                    {...register("customer.existingPartyId" as any)}
                  />
                  <input
                    type="hidden"
                    {...register("customer.existingPartyName" as any)}
                  />
                </div>
              ) : null}

              {/* NEW party form */}
              {partyMode === "NEW" ? (
                <div className="mt-4 space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Name */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Nombre</span>
                      </label>
                      <input
                        className={`input input-bordered w-full ${
                          customerErrors?.newParty?.name ? "input-error" : ""
                        }`}
                        placeholder={config.namePlaceholder}
                        {...register("customer.newParty.name" as any)}
                      />
                      {customerErrors?.newParty?.name?.message ? (
                        <p className="mt-2 text-sm text-error">
                          {String(customerErrors.newParty.name.message)}
                        </p>
                      ) : null}
                    </div>

                    {/* Phone */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">
                          Teléfono (opcional)
                        </span>
                      </label>
                      <input
                        className={`input input-bordered w-full ${
                          customerErrors?.newParty?.phone ? "input-error" : ""
                        }`}
                        placeholder="Ej: 8112345678"
                        inputMode="tel"
                        {...register("customer.newParty.phone" as any)}
                      />
                      {customerErrors?.newParty?.phone?.message ? (
                        <p className="mt-2 text-sm text-error">
                          {String(customerErrors.newParty.phone.message)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Notas (opcional)
                      </span>
                    </label>
                    <textarea
                      className={`textarea textarea-bordered w-full ${
                        customerErrors?.newParty?.notes ? "textarea-error" : ""
                      }`}
                      placeholder="Información adicional"
                      rows={4}
                      {...register("customer.newParty.notes" as any)}
                    />
                    {customerErrors?.newParty?.notes?.message ? (
                      <p className="mt-2 text-sm text-error">
                        {String(customerErrors.newParty.notes.message)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
