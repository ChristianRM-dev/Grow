"use client";

/**
 * SalesNoteUnregisteredLinesStep - Wrapper over the shared UnregisteredLinesStep.
 *
 * Extends the shared component with sales-note-specific features:
 * - "shouldRegister" checkbox column for flagging products to add to catalog
 * - RegisterProductModal for adding pre-filled products to register
 * - "Para registrar" badge and totals info
 */

import React, { useEffect } from "react";
import { useWatch } from "react-hook-form";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNoteFormInput } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import {
  UnregisteredLinesStep,
  SALES_NOTE_UNREGISTERED_CONFIG,
  isUnregisteredRowComplete,
} from "@/components/forms/steps/UnregisteredLinesStep";
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";
import { RegisterProductModal } from "./RegisterProductModal";

type Props = StepComponentProps<SalesNoteFormInput>;

export function SalesNoteUnregisteredLinesStep({ form }: Props) {
  const { register, control } = form;
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const rows = useWatch({ control, name: "unregisteredLines" }) ?? [];

  // Log step mount/unmount
  useEffect(() => {
    salesNoteLogger.info("UnregisteredLinesStep", "Step mounted", {
      currentRowsCount: rows?.length ?? 0,
    });
    return () => {
      const rowsOnUnmount = form.getValues("unregisteredLines");
      salesNoteLogger.info("UnregisteredLinesStep", "Step unmounting", {
        rowsCount: rowsOnUnmount?.length ?? 0,
        toRegisterCount: (rowsOnUnmount ?? []).filter((r: any) => r?.shouldRegister).length,
      });
    };
  }, []);

  const handleModalSubmit = (data: any) => {
    salesNoteLogger.info("UnregisteredLinesStep", "Modal product submitted", {
      productName: data.name,
      quantity: data.quantity,
      shouldRegister: true,
    });
    // Append via the shared component's field array is not accessible here,
    // so we use the form directly to append to the array
    const current = form.getValues("unregisteredLines") ?? [];
    form.setValue("unregisteredLines", [
      ...current,
      {
        name: data.name,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        description: data.description || "",
        shouldRegister: true,
        variantName: data.variantName || undefined,
        bagSize: data.bagSize || undefined,
        color: data.color || undefined,
      },
    ] as any, { shouldDirty: true });
    salesNoteLogger.info("UnregisteredLinesStep", "Product appended to unregistered lines", {
      newTotalCount: current.length + 1,
    });
  };

  return (
    <>
      <UnregisteredLinesStep
        form={form}
        config={SALES_NOTE_UNREGISTERED_CONFIG}
        renderExtraHeaders={() => (
          <th className="w-16">
            <div className="flex items-center gap-2">
              <span className="tooltip" data-tip="Registrar en catálogo">
                📋
              </span>
            </div>
          </th>
        )}
        renderExtraColumns={(index, row) => (
          <td>
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                className="checkbox checkbox-success"
                {...register(`unregisteredLines.${index}.shouldRegister`)}
                disabled={
                  !isUnregisteredRowComplete(
                    row,
                    SALES_NOTE_UNREGISTERED_CONFIG.priceFieldKey,
                  )
                }
                title={
                  !isUnregisteredRowComplete(
                    row,
                    SALES_NOTE_UNREGISTERED_CONFIG.priceFieldKey,
                  )
                    ? "Completa el producto para poder registrarlo"
                    : "Registrar este producto en el catálogo"
                }
              />
            </div>
          </td>
        )}
        renderHeaderBadge={(currentRows) => {
          const toRegister = currentRows.filter(
            (r: any) => r?.shouldRegister === true,
          ).length;
          return toRegister > 0 ? (
            <div className="badge badge-success gap-2">
              {toRegister} para registrar
            </div>
          ) : null;
        }}
        renderExtraTotals={(currentRows) => {
          const toRegister = currentRows.filter(
            (r: any) => r?.shouldRegister === true,
          ).length;
          return toRegister > 0 ? (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm opacity-70">Para registrar</span>
              <span className="font-medium text-success">{toRegister}</span>
            </div>
          ) : null;
        }}
        renderExtraActions={() => (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              salesNoteLogger.info("UnregisteredLinesStep", "Opening RegisterProductModal");
              setIsModalOpen(true);
            }}
          >
            + Agregar producto para registrar
          </button>
        )}
      />

      <RegisterProductModal
        isOpen={isModalOpen}
        onClose={() => {
          salesNoteLogger.info("UnregisteredLinesStep", "Closing RegisterProductModal");
          setIsModalOpen(false);
        }}
        onSubmit={handleModalSubmit}
      />
    </>
  );
}
