"use client";

import React from "react";

import type { QuotationDetailsDto } from "@/modules/quotations/queries/getQuotationDetails.query";
import { money } from "@/modules/shared/utils/formatters";
import { splitSnapshot } from "@/modules/sales-notes/queries/_salesNoteMappers";

export function QuotationDetailsClient({
  dto,
}: {
  dto: QuotationDetailsDto;
}) {
  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="font-semibold">Resumen</h3>

          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-box border border-base-300 bg-base-200 p-4">
              <div className="text-sm opacity-70">Total</div>
              <div className="text-2xl font-bold">${money(dto.total)}</div>
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
                  <th>Descripción</th>
                  <th className="w-28 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {dto.registeredLines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center opacity-70">
                      No hay productos registrados.
                    </td>
                  </tr>
                ) : null}

                {dto.registeredLines.map((l) => {
                  const { name, description } = splitSnapshot(
                    l.descriptionSnapshot
                  );
                  const displayName = name || l.descriptionSnapshot || "—";
                  const displayDescription = description || "—";

                  return (
                    <tr key={l.id}>
                      <td>{displayName}</td>
                      <td className="text-right">{l.quantity}</td>
                      <td className="text-right">${money(l.quotedUnitPrice)}</td>
                      <td>{displayDescription}</td>
                      <td className="text-right font-semibold">
                        ${money(l.lineTotal)}
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
                    <th>Descripción</th>
                    <th className="w-28 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dto.externalLines.map((l) => {
                    const { name, description } = splitSnapshot(
                      l.descriptionSnapshot
                    );
                    const displayName = name || l.descriptionSnapshot || "—";
                    const displayDescription = description || "—";

                    return (
                      <tr key={l.id}>
                        <td>{displayName}</td>
                        <td className="text-right">{l.quantity}</td>
                        <td className="text-right">
                          ${money(l.quotedUnitPrice)}
                        </td>
                        <td>{displayDescription}</td>
                        <td className="text-right font-semibold">
                          ${money(l.lineTotal)}
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
