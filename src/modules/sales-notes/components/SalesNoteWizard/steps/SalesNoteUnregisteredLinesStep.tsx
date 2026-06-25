"use client";

/**
 * SalesNoteUnregisteredLinesStep - Wrapper over the shared UnregisteredLinesStep.
 *
 * Extends the shared component with sales-note-specific features:
 * - "shouldRegister" checkbox column for flagging products to add to catalog
 * - RegisterProductModal for adding pre-filled products to register
 * - "Para registrar" badge and totals info
 */

import React, { useEffect, useMemo } from "react";
import { useWatch } from "react-hook-form";
import type { StepComponentProps } from "@/components/ui/MultiStepForm/MultiStepForm.types";
import type { SalesNoteFormInput } from "@/modules/sales-notes/forms/salesNoteForm.schemas";
import {
  UnregisteredLinesStep,
  SALES_NOTE_UNREGISTERED_CONFIG,
  isUnregisteredRowComplete,
} from "@/components/forms/steps/UnregisteredLinesStep";
import { salesNoteLogger } from "@/modules/sales-notes/utils/salesNoteLogger";
import {
  RegisterProductModal,
  type RegisterProductFormValues,
} from "./RegisterProductModal";

type Props = StepComponentProps<SalesNoteFormInput>;
type SalesNoteUnregisteredLinesStepProps = Props & {
  forceRegisterAll?: boolean;
  sourceQuotationFolio?: string;
};

export function SalesNoteUnregisteredLinesStep({
  form,
  forceRegisterAll = false,
  sourceQuotationFolio,
}: SalesNoteUnregisteredLinesStepProps) {
  const { register, control } = form;
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const rows = useWatch({ control, name: "unregisteredLines" }) ?? [];

  const unregisteredConfig = useMemo(
    () =>
      forceRegisterAll
        ? {
            ...SALES_NOTE_UNREGISTERED_CONFIG,
            emptyRow: {
              ...SALES_NOTE_UNREGISTERED_CONFIG.emptyRow,
              shouldRegister: true,
            },
          }
        : SALES_NOTE_UNREGISTERED_CONFIG,
    [forceRegisterAll],
  );

  // Log step mount/unmount
  useEffect(() => {
    salesNoteLogger.info("UnregisteredLinesStep", "Step mounted", {
      currentRowsCount: rows?.length ?? 0,
    });
    return () => {
      const rowsOnUnmount = form.getValues("unregisteredLines");
      salesNoteLogger.info("UnregisteredLinesStep", "Step unmounting", {
        rowsCount: rowsOnUnmount?.length ?? 0,
        toRegisterCount:
          (rowsOnUnmount ?? []).filter((row) => row?.shouldRegister).length,
      });
    };
  }, []);

  useEffect(() => {
    if (!forceRegisterAll) return;

    const currentRows = form.getValues("unregisteredLines") ?? [];
    if (currentRows.length === 0) return;
    if (currentRows.every((row) => row?.shouldRegister === true)) return;

    form.setValue(
      "unregisteredLines",
      currentRows.map((row) => ({
        ...row,
        shouldRegister: true,
      })),
      { shouldDirty: false },
    );
  }, [forceRegisterAll, form, rows]);

  const handleModalSubmit = (data: RegisterProductFormValues) => {
    salesNoteLogger.info("UnregisteredLinesStep", "Modal product submitted", {
      productName: data.name,
      quantity: data.quantity,
      shouldRegister: true,
    });

    const current = form.getValues("unregisteredLines") ?? [];
    form.setValue("unregisteredLines", [
      ...current,
      {
        name: data.name,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        discountPercent: 0,
        description: data.description || "",
        shouldRegister: true,
        variantName: data.variantName || undefined,
        bagSize: data.bagSize || undefined,
        color: data.color || undefined,
      },
    ], { shouldDirty: true });
    salesNoteLogger.info(
      "UnregisteredLinesStep",
      "Product appended to unregistered lines",
      {
        newTotalCount: current.length + 1,
      },
    );
  };

  return (
    <>
      {forceRegisterAll ? (
        <div className="alert alert-info mb-4">
          <div>
            <h4 className="font-semibold">Registro automático</h4>
            <p className="text-sm opacity-80">
              {sourceQuotationFolio
                ? `Todos los productos no registrados de la cotización ${sourceQuotationFolio} se registrarán automáticamente al guardar esta nota.`
                : "Todos los productos no registrados se registrarán automáticamente al guardar esta nota."}
            </p>
          </div>
        </div>
      ) : null}

      <UnregisteredLinesStep
        form={form}
        config={unregisteredConfig}
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
                  forceRegisterAll ||
                  !isUnregisteredRowComplete(
                    row,
                    unregisteredConfig.priceFieldKey,
                  )
                }
                title={
                  forceRegisterAll
                    ? "Este producto se registrará automáticamente porque la nota viene de una cotización"
                    : !isUnregisteredRowComplete(
                          row,
                          unregisteredConfig.priceFieldKey,
                        )
                    ? "Completa el producto para poder registrarlo"
                    : "Registrar este producto en el catálogo"
                }
              />
            </div>
          </td>
        )}
        renderHeaderBadge={(currentRows) => {
          if (forceRegisterAll) {
            return currentRows.length > 0 ? (
              <div className="badge badge-info gap-2">
                {currentRows.length} se registran
              </div>
            ) : null;
          }

          const toRegister = currentRows.filter(
            (row) => row.shouldRegister === true,
          ).length;
          return toRegister > 0 ? (
            <div className="badge badge-success gap-2">
              {toRegister} para registrar
            </div>
          ) : null;
        }}
        renderExtraTotals={(currentRows) => {
          if (forceRegisterAll) {
            return currentRows.length > 0 ? (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm opacity-70">Se registrarán</span>
                <span className="font-medium text-info">{currentRows.length}</span>
              </div>
            ) : null;
          }

          const toRegister = currentRows.filter(
            (row) => row.shouldRegister === true,
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
