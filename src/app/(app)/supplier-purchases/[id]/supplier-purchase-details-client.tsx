"use client";

import React from "react";
import Link from "next/link";

import type { SupplierPurchaseDetailsDto } from "@/modules/supplier-purchases/queries/getSupplierPurchaseDetails.query";
import { routes } from "@/lib/routes";
import { dateMX, money } from "@/modules/shared/utils/formatters";

export function SupplierPurchaseDetailsClient({
  dto,
}: {
  dto: SupplierPurchaseDetailsDto;
}) {
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

      {/* Purchase details */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body space-y-2">
          <h2 className="text-lg font-semibold">Detalles</h2>

          <div className="text-sm opacity-80">
            <div>
              Folio del proveedor: <b>{dto.supplierFolio}</b>
            </div>
            <div>
              Fecha de compra: <b>{dateMX(dto.occurredAt)}</b>
            </div>
            <div>
              Creado: <b>{dateMX(dto.createdAt)}</b>
            </div>
          </div>

          <div className="border-t border-base-300 pt-2">
            <div className="text-sm opacity-70">Notas</div>
            <div className="mt-1">{dto.notes?.trim() ? dto.notes : "—"}</div>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Pagos</h2>

            <Link
              href={routes.supplierPurchases.payments.new(dto.id)}
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
                          href={routes.supplierPurchases.payments.edit(
                            dto.id,
                            p.id
                          )}
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
              <span>Esta compra está completamente pagada.</span>
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
