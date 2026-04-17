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
import type {
  FieldPath,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import { PartyAutocomplete } from "@/modules/reports/components/PartyAutocomplete";
import {
  customerFieldPath,
  type DocumentCustomerFieldPath,
  type DocumentCustomerValue,
  type DocumentFormShape,
  type DocumentPriceFieldKey,
} from "@/components/forms/document-wizard/documentForm.shared";

type FieldErrorLike = { message?: string };
type CustomerFieldErrors = {
  partyMode?: FieldErrorLike;
  existingPartyId?: FieldErrorLike;
  existingPartyName?: FieldErrorLike;
  newParty?: {
    name?: FieldErrorLike;
    phone?: FieldErrorLike;
    notes?: FieldErrorLike;
  };
};

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

type CustomerStepProps<
  TForm extends DocumentFormShape<TPriceField>,
  TPriceField extends DocumentPriceFieldKey,
> = {
  form: UseFormReturn<TForm>;
  config: CustomerStepConfig;
};

export function CustomerStep<
  TForm extends DocumentFormShape<TPriceField>,
  TPriceField extends DocumentPriceFieldKey,
>({ form, config }: CustomerStepProps<TForm, TPriceField>) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const customerModePath = customerFieldPath<TForm>("mode");
  const customerPartyModePath = customerFieldPath<TForm>("partyMode");
  const customerExistingPartyIdPath = customerFieldPath<TForm>("existingPartyId");
  const customerExistingPartyNamePath = customerFieldPath<TForm>(
    "existingPartyName",
  );

  const mode = watch(customerModePath);
  const partyMode = watch(customerPartyModePath);
  const existingPartyId = watch(customerExistingPartyIdPath);
  const existingPartyName = watch(customerExistingPartyNamePath);

  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);

  const customerErrors = errors.customer as CustomerFieldErrors | undefined;

  const setField = <TPath extends FieldPath<TForm>>(
    path: TPath,
    value: PathValue<TForm, TPath>,
    options?: Parameters<UseFormReturn<TForm>["setValue"]>[2],
  ) => {
    setValue(path, value, options);
  };

  const setCustomerField = <TPath extends DocumentCustomerFieldPath>(
    path: TPath,
    value: PathValue<TForm, FieldPath<TForm>>,
    options?: Parameters<UseFormReturn<TForm>["setValue"]>[2],
  ) => {
    const fieldPath = customerFieldPath<TForm>(path);
    setField(fieldPath, value as PathValue<TForm, typeof fieldPath>, options);
  };

  useEffect(() => {
    if (!config.clearFieldsOnModeSwitch) return;

    if (mode === "PUBLIC") {
      setCustomerField("partyMode", undefined as PathValue<TForm, FieldPath<TForm>>);
      setCustomerField(
        "existingPartyId",
        "" as PathValue<TForm, FieldPath<TForm>>,
      );
      setCustomerField(
        "existingPartyName",
        "" as PathValue<TForm, FieldPath<TForm>>,
      );
      setCustomerField("newParty.name", "" as PathValue<TForm, FieldPath<TForm>>);
      setCustomerField(
        "newParty.phone",
        "" as PathValue<TForm, FieldPath<TForm>>,
      );
      setCustomerField(
        "newParty.notes",
        "" as PathValue<TForm, FieldPath<TForm>>,
      );
      setTerm("");
      setOpen(false);
      return;
    }

    if (!partyMode) {
      setCustomerField(
        "partyMode",
        "EXISTING" as PathValue<TForm, FieldPath<TForm>>,
      );
    }
  }, [mode, partyMode, config.clearFieldsOnModeSwitch]);

  useEffect(() => {
    if (!config.clearFieldsOnModeSwitch) return;
    if (mode !== "PARTY" || !partyMode) return;

    if (partyMode === "EXISTING") {
      setCustomerField("newParty.name", "" as PathValue<TForm, FieldPath<TForm>>);
      setCustomerField(
        "newParty.phone",
        "" as PathValue<TForm, FieldPath<TForm>>,
      );
      setCustomerField(
        "newParty.notes",
        "" as PathValue<TForm, FieldPath<TForm>>,
      );

      const label = String(existingPartyName ?? "").trim();
      if (existingPartyId && label && term.trim().length === 0) {
        setTerm(label);
      }
      return;
    }

    setCustomerField(
      "existingPartyId",
      "" as PathValue<TForm, FieldPath<TForm>>,
    );
    setCustomerField(
      "existingPartyName",
      "" as PathValue<TForm, FieldPath<TForm>>,
    );
    setTerm("");
    setOpen(false);
  }, [
    mode,
    partyMode,
    existingPartyId,
    existingPartyName,
    term,
    config.clearFieldsOnModeSwitch,
  ]);

  useEffect(() => {
    if (config.clearFieldsOnModeSwitch) {
      if (mode !== "PARTY" || partyMode !== "EXISTING") return;
      const label = String(existingPartyName ?? "").trim();
      if (!existingPartyId || !label) return;
      if (!open && term.trim() !== label) {
        setTerm(label);
      }
      return;
    }

    const label = String(existingPartyName ?? "").trim();
    if (existingPartyId && label && term.trim().length === 0) {
      setTerm(label);
    }
  }, [
    existingPartyId,
    existingPartyName,
    mode,
    partyMode,
    open,
    term,
    config.clearFieldsOnModeSwitch,
  ]);

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">{config.heading}</h3>
          {config.description ? (
            <p className="text-sm opacity-70">{config.description}</p>
          ) : null}

          <div
            className={`flex flex-col gap-2 md:flex-row md:items-center ${
              config.description ? "mt-4" : ""
            }`}
          >
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="radio"
                className="radio radio-primary"
                value="PUBLIC"
                {...register(customerFieldPath<TForm>("mode"))}
              />
              <span className="label-text">Venta al público</span>
            </label>

            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="radio"
                className="radio radio-primary"
                value="PARTY"
                {...register(customerFieldPath<TForm>("mode"))}
              />
              <span className="label-text">{config.partyRadioLabel}</span>
            </label>
          </div>

          {mode === "PARTY" ? (
            <div className="mt-4">
              <h4 className="font-semibold">{config.partyTypeHeading}</h4>

              <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="radio"
                    className="radio radio-primary"
                    value="EXISTING"
                    {...register(customerFieldPath<TForm>("partyMode"))}
                  />
                  <span className="label-text">
                    {config.existingPartyLabel}
                  </span>
                </label>

                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="radio"
                    className="radio radio-primary"
                    value="NEW"
                    {...register(customerFieldPath<TForm>("partyMode"))}
                  />
                  <span className="label-text">{config.newPartyLabel}</span>
                </label>
              </div>

              {customerErrors?.partyMode?.message ? (
                <p className="mt-2 text-sm text-error">
                  {String(customerErrors.partyMode.message)}
                </p>
              ) : null}

              {partyMode === "EXISTING" ? (
                <div className="mt-4">
                  <PartyAutocomplete
                    label={config.searchLabel}
                    placeholder="Escribe al menos 2 letras…"
                    selectedId={existingPartyId || ""}
                    selectedName={existingPartyName || ""}
                    onSelect={(id, name) => {
                      setField(
                        customerFieldPath<TForm>("existingPartyId"),
                        id as PathValue<TForm, FieldPath<TForm>>,
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      );
                      setField(
                        customerFieldPath<TForm>("existingPartyName"),
                        name as PathValue<TForm, FieldPath<TForm>>,
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      );
                    }}
                    onClear={() => {
                      setCustomerField(
                        "existingPartyId",
                        "" as PathValue<TForm, FieldPath<TForm>>,
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      );
                      setCustomerField(
                        "existingPartyName",
                        "" as PathValue<TForm, FieldPath<TForm>>,
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      );
                    }}
                    value={term}
                    onChange={(value) => {
                      setTerm(value);
                      setOpen(value.trim().length > 0);
                    }}
                  />

                  <input
                    type="hidden"
                    {...register(customerFieldPath<TForm>("existingPartyId"))}
                  />
                  <input
                    type="hidden"
                    {...register(
                      customerFieldPath<TForm>("existingPartyName"),
                    )}
                  />

                  {customerErrors?.existingPartyId?.message ? (
                    <p className="mt-1 text-sm text-error">
                      {String(customerErrors.existingPartyId.message)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {partyMode === "NEW" ? (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="label">
                      <span className="label-text">Nombre</span>
                    </label>
                    <input
                      className={`input input-bordered w-full ${
                        customerErrors?.newParty?.name ? "input-error" : ""
                      }`}
                      placeholder={config.namePlaceholder}
                      {...register(customerFieldPath<TForm>("newParty.name"))}
                    />
                    {customerErrors?.newParty?.name?.message ? (
                      <p className="mt-1 text-sm text-error">
                        {String(customerErrors.newParty.name.message)}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Teléfono</span>
                    </label>
                    <input
                      className={`input input-bordered w-full ${
                        customerErrors?.newParty?.phone ? "input-error" : ""
                      }`}
                      placeholder="Ej: 55 1234 5678"
                      {...register(customerFieldPath<TForm>("newParty.phone"))}
                    />
                    {customerErrors?.newParty?.phone?.message ? (
                      <p className="mt-1 text-sm text-error">
                        {String(customerErrors.newParty.phone.message)}
                      </p>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">
                      <span className="label-text">Notas</span>
                    </label>
                    <textarea
                      className={`textarea textarea-bordered w-full ${
                        customerErrors?.newParty?.notes ? "textarea-error" : ""
                      }`}
                      placeholder="Opcional"
                      rows={3}
                      {...register(customerFieldPath<TForm>("newParty.notes"))}
                    />
                    {customerErrors?.newParty?.notes?.message ? (
                      <p className="mt-1 text-sm text-error">
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
