"use client";

import React, { useMemo } from "react";
import type { QuotationDetailsDto } from "@/modules/quotations/queries/getQuotationDetails.query";
import { getSnapshotDisplayParts } from "@/modules/shared/documents/documentSnapshot";
import { moneyMX } from "@/modules/shared/utils/formatters";
import {
  formatDiscountLabel,
  hasAnyDiscount,
} from "@/modules/shared/utils/discounts";

export function QuotationDetailsClient({
  dto,
}: {
  dto: QuotationDetailsDto;
}) {
  const totalPlants = useMemo(() => {
    const registeredTotal = dto.registeredLines.reduce(
      (sum, line) => sum + Number(line.quantity),
      0,
    );
    const externalTotal = dto.externalLines.reduce(
      (sum, line) => sum + Number(line.quantity),
      0,
    );
    return registeredTotal + externalTotal;
  }, [dto.registeredLines, dto.externalLines]);

  const showDiscountColumn = hasAnyDiscount([
    ...dto.registeredLines,
    ...dto.externalLines,
  ]);

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="font-semibold">Resumen</h3>

          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-box border border-base-300 bg-base-200 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm opacity-70">Subtotal</span>
                  <span className="font-medium">${moneyMX(dto.subtotal)}</span>
                </div>
                {Number(dto.discountTotal) > 0 ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm opacity-70">Descuento</span>
                    <span className="font-medium text-success">
                      -${moneyMX(dto.discountTotal)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm opacity-70">Total</span>
                  <span className="text-2xl font-bold">
                    ${moneyMX(dto.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-box border border-base-300 bg-base-200 p-4">
              <div className="text-sm opacity-70">Productos registrados</div>
              <div className="text-lg font-semibold">
                {dto.registeredLines.length}
              </div>
            </div>

            <div className="rounded-box border border-base-300 bg-base-200 p-4">
              <div className="text-sm opacity-70">Productos no registrados</div>
              <div className="text-lg font-semibold">
                {dto.externalLines.length}
              </div>
            </div>

            <div className="card border-l-4 border-l-success bg-success/10">
              <div className="card-body p-4">
                <div className="text-sm font-medium opacity-70">
                  Total de plantas agregadas
                </div>
                <div className="text-2xl font-bold text-success">
                  {totalPlants}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-semibold">Productos registrados</h3>

          <div className="mt-3 overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="w-28 text-right">Cantidad</th>
                  <th className="w-28 text-right">Precio</th>
                  {showDiscountColumn ? (
                    <th className="w-24 text-right">Descuento</th>
                  ) : null}
                  <th>Descripción</th>
                  <th className="w-28 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {dto.registeredLines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={showDiscountColumn ? 6 : 5}
                      className="py-10 text-center opacity-70"
                    >
                      No hay productos registrados.
                    </td>
                  </tr>
                ) : null}

                {dto.registeredLines.map((l) => {
                  const { displayDescription, displayName } =
                    getSnapshotDisplayParts(l.descriptionSnapshot);

                  return (
                    <tr key={l.id}>
                      <td>{displayName}</td>
                      <td className="text-right">{l.quantity}</td>
                      <td className="text-right">
                        ${moneyMX(l.quotedUnitPrice)}
                      </td>
                      {showDiscountColumn ? (
                        <td className="text-right">
                          {formatDiscountLabel(l.discountPercent)}
                        </td>
                      ) : null}
                      <td>{displayDescription}</td>
                      <td className="text-right font-semibold">
                        ${moneyMX(l.lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {dto.externalLines.length > 0 ? (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="font-semibold">Productos no registrados</h3>

            <div className="mt-3 overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th className="w-28 text-right">Cantidad</th>
                    <th className="w-28 text-right">Precio</th>
                    {showDiscountColumn ? (
                      <th className="w-24 text-right">Descuento</th>
                    ) : null}
                    <th>Descripción</th>
                    <th className="w-28 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dto.externalLines.map((l) => {
                    const { displayDescription, displayName } =
                      getSnapshotDisplayParts(l.descriptionSnapshot);

                    return (
                      <tr key={l.id}>
                        <td>{displayName}</td>
                        <td className="text-right">{l.quantity}</td>
                        <td className="text-right">
                          ${moneyMX(l.quotedUnitPrice)}
                        </td>
                        {showDiscountColumn ? (
                          <td className="text-right">
                            {formatDiscountLabel(l.discountPercent)}
                          </td>
                        ) : null}
                        <td>{displayDescription}</td>
                        <td className="text-right font-semibold">
                          ${moneyMX(l.lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
