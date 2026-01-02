"use client";

import React from "react";
import Link from "next/link";

import type { SalesNoteDetailsDto } from "@/modules/sales-notes/queries/getSalesNoteDetails.query";
import { routes } from "@/lib/routes";
import { dateMX, money } from "@/modules/shared/utils/formatters";

export function SalesNoteDetailsClient({ dto }: { dto: SalesNoteDetailsDto }) {
  const canAddPayment = !dto.isFullyPaid;

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="text-sm opacity-70">Total</div>
            <div className="text-2xl font-semibold">${money(dto.total)}</div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <div className="text-sm opacity-70">Pagado</div>
            <div className="text-2xl font-semibold">
              ${money(dto.paidTotal)}
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <div className="text-sm opacity-70">Pendiente</div>
            <div className="text-2xl font-semibold">
              ${money(dto.remainingTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body space-y-4">
          <h2 className="text-lg font-semibold">Productos</h2>

          <div>
            <h3 className="font-medium">Registrados</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Precio</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dto.registeredLines.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center opacity-70">
                        No hay productos registrados
                      </td>
                    </tr>
                  ) : (
                    dto.registeredLines.map((l) => (
                      <tr key={l.id}>
                        <td>{l.descriptionSnapshot}</td>
                        <td className="text-right">{l.quantity}</td>
                        <td className="text-right">${money(l.unitPrice)}</td>
                        <td className="text-right">${money(l.lineTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-medium">Externos</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Precio</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dto.externalLines.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center opacity-70">
                        No hay productos externos
                      </td>
                    </tr>
                  ) : (
                    dto.externalLines.map((l) => (
                      <tr key={l.id}>
                        <td>{l.descriptionSnapshot}</td>
                        <td className="text-right">{l.quantity}</td>
                        <td className="text-right">${money(l.unitPrice)}</td>
                        <td className="text-right">${money(l.lineTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-base-300 pt-2 text-sm opacity-80">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">${money(dto.subtotal)}</span>
            </div>
            {/* <div className="flex justify-between">
              <span>Descuento</span>
              <span className="font-medium">${money(dto.discountTotal)}</span>
            </div> */}
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">${money(dto.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Pagos</h2>

            <Link
              href={routes.salesNotes.payments.new(dto.id)}
              className={`btn btn-primary btn-sm ${
                canAddPayment ? "" : "btn-disabled"
              }`}
              aria-disabled={!canAddPayment}
            >
              Registrar pago
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th className="text-right">Monto</th>
                  <th>Referencia</th>
                  <th>Notas</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dto.payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center opacity-70">
                      No hay pagos registrados
                    </td>
                  </tr>
                ) : (
                  dto.payments.map((p) => (
                    <tr key={p.id}>
                      <td>{dateMX(p.occurredAt)}</td>
                      <td>{p.paymentType}</td>
                      <td className="text-right">${money(p.amount)}</td>
                      <td>{p.reference ?? "—"}</td>
                      <td className="max-w-[320px] truncate">
                        {p.notes ?? "—"}
                      </td>
                      <td className="text-right">
                        <Link
                          className="btn btn-ghost btn-sm"
                          href={routes.salesNotes.payments.edit(dto.id, p.id)}
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {dto.isFullyPaid ? (
            <div className="alert alert-success">
              <span>Esta nota de venta está completamente pagada.</span>
            </div>
          ) : (
            <div className="alert">
              <span>
                Saldo pendiente: <b>${money(dto.remainingTotal)}</b>
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
