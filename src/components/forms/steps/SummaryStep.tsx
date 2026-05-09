"use client";

/**
 * SummaryStep - Shared summary/review step for document wizards.
 *
 * Used by both Sales Notes and Quotations flows. Displays:
 * - Customer/contact info
 * - Registered product lines table with subtotal
 * - Unregistered product lines table with subtotal (if any)
 * - Grand total
 *
 * Configurable via `SummaryStepConfig` for different price field names,
 * customer label logic, and optional extra sections (e.g., plant counts).
 */

import React, { useMemo } from "react";
import { useWatch, type FieldValues, type UseFormReturn } from "react-hook-form";
import { moneyMX } from "@/modules/shared/utils/formatters";
import { toNumber } from "@/modules/shared/utils/money";
import {
  computeDiscountedLineTotalsNumber,
  formatDiscountLabel,
  hasAnyDiscount,
} from "@/modules/shared/utils/discounts";
import {
  type DocumentCustomerValue,
  type DocumentPriceFieldKey,
  type DocumentRegisteredLine,
  type DocumentUnregisteredLine,
} from "@/components/forms/document-wizard/documentForm.shared";

type SummaryFormShape<
  TLinePriceField extends DocumentPriceFieldKey,
  TUnregisteredPriceField extends DocumentPriceFieldKey,
  TUnregisteredLine extends DocumentUnregisteredLine<TUnregisteredPriceField> = DocumentUnregisteredLine<TUnregisteredPriceField>,
> = FieldValues & {
  customer: DocumentCustomerValue;
  lines?: DocumentRegisteredLine<TLinePriceField>[];
  unregisteredLines?: TUnregisteredLine[];
};

/**
 * Configuration for customizing SummaryStep per document type.
 */
export type SummaryStepConfig<
  TLinePriceField extends DocumentPriceFieldKey,
  TUnregisteredPriceField extends DocumentPriceFieldKey,
> = {
  /** The field key for the price in registered lines */
  linesPriceFieldKey: TLinePriceField;
  /** The field key for the price in unregistered lines */
  unregisteredPriceFieldKey: TUnregisteredPriceField;
  /** Label for the customer section (e.g., "Cliente" or "Contacto") */
  customerSectionLabel: string;
  /** Function to extract customer display label from form values */
  getCustomerLabel: (customer: DocumentCustomerValue) => string;
  /** Label for the unregistered lines section */
  unregisteredSectionLabel: string;
  /** Label for the unregistered subtotal */
  unregisteredSubtotalLabel: string;
};

export const SALES_NOTE_SUMMARY_CONFIG: SummaryStepConfig<
  "unitPrice",
  "unitPrice"
> = {
  linesPriceFieldKey: "unitPrice",
  unregisteredPriceFieldKey: "unitPrice",
  customerSectionLabel: "Cliente",
  getCustomerLabel: (customer) => {
    if (customer.mode === "PUBLIC") return "Venta al público";
    if (customer.partyMode === "NEW") {
      return customer.newParty?.name?.trim() || "\u2014";
    }
    return customer.existingPartyName?.trim() || "\u2014";
  },
  unregisteredSectionLabel: "Productos externos",
  unregisteredSubtotalLabel: "Subtotal externos",
};

export const QUOTATION_SUMMARY_CONFIG: SummaryStepConfig<
  "quotedUnitPrice",
  "quotedUnitPrice"
> = {
  linesPriceFieldKey: "quotedUnitPrice",
  unregisteredPriceFieldKey: "quotedUnitPrice",
  customerSectionLabel: "Contacto",
  getCustomerLabel: (customer) => {
    if (customer.mode === "PUBLIC") return "Venta al público";
    if (customer.partyMode === "NEW") {
      return customer.newParty?.name?.trim() || "\u2014";
    }
    return (
      customer.existingPartyName?.trim() ||
      customer.partyName?.trim() ||
      "\u2014"
    );
  },
  unregisteredSectionLabel: "Productos no registrados",
  unregisteredSubtotalLabel: "Subtotal no registrados",
};

type SummaryStepProps<
  TForm extends SummaryFormShape<
    TLinePriceField,
    TUnregisteredPriceField,
    TUnregisteredLine
  >,
  TLinePriceField extends DocumentPriceFieldKey,
  TUnregisteredPriceField extends DocumentPriceFieldKey,
  TUnregisteredLine extends DocumentUnregisteredLine<TUnregisteredPriceField>,
> = {
  form: UseFormReturn<TForm>;
  config: SummaryStepConfig<TLinePriceField, TUnregisteredPriceField>;
  /** Optional render prop for extra content between customer and products sections */
  renderExtraInfo?: (values: TForm) => React.ReactNode;
  /** Optional render prop for extra badges/info in the registered products section header */
  renderRegisteredHeader?: (
    lines: readonly DocumentRegisteredLine<TLinePriceField>[],
  ) => React.ReactNode;
  /** Optional render prop for extra badges/info in the unregistered products section header */
  renderUnregisteredHeader?: (lines: readonly TUnregisteredLine[]) => React.ReactNode;
};

function sumLineTotals<
  TPriceField extends DocumentPriceFieldKey,
  TLine extends {
    quantity: number;
    discountPercent?: number;
    description?: string;
  } & Record<TPriceField, string>,
>(
  lines: readonly TLine[],
  priceFieldKey: TPriceField,
): { subtotal: number; discountTotal: number; total: number } {
  let subtotal = 0;
  let discountTotal = 0;
  let total = 0;

  for (const line of lines) {
    const rowTotals = computeDiscountedLineTotalsNumber({
      quantity: Number(line?.quantity ?? 0),
      unitPrice: toNumber(String(line?.[priceFieldKey] ?? "")),
      discountPercent: line?.discountPercent,
    });

    if (!Number.isFinite(rowTotals.subtotal)) continue;

    subtotal += rowTotals.subtotal;
    discountTotal += rowTotals.discountAmount;
    total += rowTotals.lineTotal;
  }

  return { subtotal, discountTotal, total };
}

export function SummaryStep<
  TForm extends SummaryFormShape<
    TLinePriceField,
    TUnregisteredPriceField,
    TUnregisteredLine
  >,
  TLinePriceField extends DocumentPriceFieldKey,
  TUnregisteredPriceField extends DocumentPriceFieldKey,
  TUnregisteredLine extends DocumentUnregisteredLine<TUnregisteredPriceField>,
>({
  form,
  config,
  renderExtraInfo,
  renderRegisteredHeader,
  renderUnregisteredHeader,
}: SummaryStepProps<
  TForm,
  TLinePriceField,
  TUnregisteredPriceField,
  TUnregisteredLine
>) {
  const values = useWatch({ control: form.control }) as TForm;

  const customerLabel = useMemo(
    () => config.getCustomerLabel(values.customer),
    [values.customer, config],
  );

  const registeredTotals = useMemo(
    () => sumLineTotals(values.lines ?? [], config.linesPriceFieldKey),
    [values.lines, config.linesPriceFieldKey],
  );

  const unregisteredTotals = useMemo(
    () =>
      sumLineTotals(
        values.unregisteredLines ?? [],
        config.unregisteredPriceFieldKey,
      ),
    [values.unregisteredLines, config.unregisteredPriceFieldKey],
  );

  const grandSubtotal = registeredTotals.subtotal + unregisteredTotals.subtotal;
  const grandDiscount =
    registeredTotals.discountTotal + unregisteredTotals.discountTotal;
  const grandTotal = registeredTotals.total + unregisteredTotals.total;
  const showDiscountColumn = hasAnyDiscount([
    ...(values.lines ?? []),
    ...(values.unregisteredLines ?? []),
  ]);

  return (
    <div className="w-full space-y-4">
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">Resumen</h3>

          <div className="mt-2">
            <div className="text-sm opacity-70">
              {config.customerSectionLabel}
            </div>
            <div className="text-base font-medium">{customerLabel}</div>
          </div>
        </div>
      </div>

      {renderExtraInfo?.(values)}

      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Productos registrados</h4>
            {renderRegisteredHeader?.(values.lines ?? [])}
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="w-24 text-right">Cantidad</th>
                  <th className="w-28 text-right">Precio</th>
                  {showDiscountColumn ? (
                    <th className="w-24 text-right">Descuento</th>
                  ) : null}
                  <th>Descripción</th>
                  <th className="w-28 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(values.lines ?? []).map((line, idx) => {
                  const rowTotals = computeDiscountedLineTotalsNumber({
                    quantity: Number(line.quantity ?? 0),
                    unitPrice: toNumber(
                      String(line[config.linesPriceFieldKey] ?? ""),
                    ),
                    discountPercent: line.discountPercent,
                  });

                  return (
                    <tr key={`${line.productVariantId}-${idx}`}>
                      <td>{line.productName || "\u2014"}</td>
                      <td className="text-right">
                        {Number(line.quantity ?? 0) || 0}
                      </td>
                      <td className="text-right">
                        {moneyMX(
                          toNumber(String(line[config.linesPriceFieldKey] ?? "")),
                        )}
                      </td>
                      {showDiscountColumn ? (
                        <td className="text-right">
                          {formatDiscountLabel(line.discountPercent)}
                        </td>
                      ) : null}
                      <td>{line.description?.trim() || "\u2014"}</td>
                      <td className="text-right font-medium">
                        {moneyMX(rowTotals.lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-sm rounded-box border border-base-300 bg-base-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-70">Subtotal productos</span>
                <span className="font-medium">
                  {moneyMX(registeredTotals.subtotal)}
                </span>
              </div>
              {registeredTotals.discountTotal > 0 ? (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm opacity-70">Descuento</span>
                  <span className="font-medium text-success">
                    -{moneyMX(registeredTotals.discountTotal)}
                  </span>
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm opacity-70">Total productos</span>
                <span className="text-lg font-semibold">
                  {moneyMX(registeredTotals.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(values.unregisteredLines?.length ?? 0) > 0 ? (
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                {config.unregisteredSectionLabel}
              </h4>
              {renderUnregisteredHeader?.(values.unregisteredLines ?? [])}
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th className="w-24 text-right">Cantidad</th>
                    <th className="w-28 text-right">Precio</th>
                    {showDiscountColumn ? (
                      <th className="w-24 text-right">Descuento</th>
                    ) : null}
                    <th>Descripción</th>
                    <th className="w-28 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(values.unregisteredLines ?? []).map((line, idx) => {
                    const rowTotals = computeDiscountedLineTotalsNumber({
                      quantity: Number(line.quantity ?? 0),
                      unitPrice: toNumber(
                        String(line[config.unregisteredPriceFieldKey] ?? ""),
                      ),
                      discountPercent: line.discountPercent,
                    });

                    return (
                      <tr key={`${line.name}-${idx}`}>
                        <td>{line.name || "\u2014"}</td>
                        <td className="text-right">
                          {Number(line.quantity ?? 0) || 0}
                        </td>
                        <td className="text-right">
                          {moneyMX(
                            toNumber(
                              String(
                                line[config.unregisteredPriceFieldKey] ?? "",
                              ),
                            ),
                          )}
                        </td>
                        {showDiscountColumn ? (
                          <td className="text-right">
                            {formatDiscountLabel(line.discountPercent)}
                          </td>
                        ) : null}
                        <td>{line.description?.trim() || "\u2014"}</td>
                        <td className="text-right font-medium">
                          {moneyMX(rowTotals.lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-sm rounded-box border border-base-300 bg-base-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-70">
                    {config.unregisteredSubtotalLabel}
                  </span>
                  <span className="font-medium">
                    {moneyMX(unregisteredTotals.subtotal)}
                  </span>
                </div>
                {unregisteredTotals.discountTotal > 0 ? (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm opacity-70">Descuento</span>
                    <span className="font-medium text-success">
                      -{moneyMX(unregisteredTotals.discountTotal)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm opacity-70">Total</span>
                  <span className="text-lg font-semibold">
                    {moneyMX(unregisteredTotals.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-70">Subtotal general</span>
              <span className="font-medium">{moneyMX(grandSubtotal)}</span>
            </div>
            {grandDiscount > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-70">Descuento</span>
                <span className="font-medium text-success">
                  -{moneyMX(grandDiscount)}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-70">Total general</span>
              <span className="text-2xl font-bold">{moneyMX(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
