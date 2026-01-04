"use client";

import React from "react";
import Link from "next/link";

import type { SalesNoteDetailsDto } from "@/modules/sales-notes/queries/getSalesNoteDetails.query";
import type { SalesNoteAuditLogRowDto } from "@/modules/sales-notes/queries/getSalesNoteAuditLog.query";

import { routes } from "@/lib/routes";
import { dateMX, money } from "@/modules/shared/utils/formatters";
import {
  auditChangeLabel,
  auditEventTitle,
  auditFormatMoney,
  auditFormatText,
} from "@/modules/shared/audit/auditUi";

function renderAuditChange(change: SalesNoteAuditLogRowDto["changes"][number]) {
  const hasDecimal =
    change.decimalBefore !== null || change.decimalAfter !== null;

  if (hasDecimal) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="opacity-70">{auditChangeLabel(change.key)}</span>
        <span className="font-medium">
          {auditFormatMoney(change.decimalBefore)} →{" "}
          {auditFormatMoney(change.decimalAfter)}
        </span>
      </div>
    );
  }

  const hasString = change.stringBefore !== null || change.stringAfter !== null;

  if (hasString) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="opacity-70">{auditChangeLabel(change.key)}</span>
        <span className="font-medium">
          {auditFormatText(change.stringBefore)} →{" "}
          {auditFormatText(change.stringAfter)}
        </span>
      </div>
    );
  }

  const beforeJson =
    change.jsonBefore == null ? "—" : JSON.stringify(change.jsonBefore);
  const afterJson =
    change.jsonAfter == null ? "—" : JSON.stringify(change.jsonAfter);

  return (
    <div className="space-y-1 text-sm">
      <div className="opacity-70">{auditChangeLabel(change.key)}</div>
      <div className="break-all font-mono text-xs opacity-80">
        {beforeJson} → {afterJson}
      </div>
    </div>
  );
}

function AuditLogSection({
  auditLog,
}: {
  auditLog: SalesNoteAuditLogRowDto[];
}) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="collapse collapse-arrow bg-base-200">
          <input type="checkbox" />

          <div className="collapse-title text-lg font-semibold">
            Historial de movimientos
          </div>

          <div className="collapse-content">
            {auditLog.length === 0 ? (
              <div className="py-4 text-sm opacity-70">
                No hay movimientos registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {auditLog.map((e) => {
                  const when = e.occurredAt ?? e.createdAt;
                  const actor = e.actorNameSnapshot ?? "Sistema";
                  const role = e.actorRoleSnapshot
                    ? ` · ${e.actorRoleSnapshot}`
                    : "";

                  return (
                    <div
                      key={e.id}
                      className="rounded-xl border border-base-300 bg-base-100 p-3"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold">
                            {auditEventTitle(e.eventKey)}
                          </div>
                          <div className="text-sm opacity-70">
                            {dateMX(when)}
                          </div>
                        </div>

                        <div className="text-sm opacity-70">
                          {actor}
                          {role}
                          {e.reference ? ` · Ref: ${e.reference}` : ""}
                        </div>

                        {e.changes.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {e.changes.map((c, idx) => (
                              <div
                                key={`${e.id}_${idx}`}
                                className="rounded-lg bg-base-200 p-2"
                              >
                                {renderAuditChange(c)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-2 text-sm opacity-70">
                            Sin cambios detallados.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SalesNoteDetailsClient({
  dto,
  auditLog,
}: {
  dto: SalesNoteDetailsDto;
  auditLog: SalesNoteAuditLogRowDto[];
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

      {/* Audit log */}
      <AuditLogSection auditLog={auditLog} />
    </>
  );
}
