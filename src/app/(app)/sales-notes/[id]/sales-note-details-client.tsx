"use client";

import React, { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { SalesNoteDetailsDto } from "@/modules/sales-notes/queries/getSalesNoteDetails.query";
import type { SalesNoteAuditLogRowDto } from "@/modules/sales-notes/queries/getSalesNoteAuditLog.query";

import { routes } from "@/lib/routes";
import { dateMX, moneyMX } from "@/modules/shared/utils/formatters";
import {
  auditChangeLabel,
  auditEventTitle,
  auditFormatMoney,
  auditFormatText,
} from "@/modules/shared/audit/auditUi";

import { softDeleteSalesNotePaymentAction } from "@/modules/sales-notes/actions/softDeleteSalesNotePayment.action";

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

function getStatusLabel(status: SalesNoteDetailsDto["status"]) {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "CONFIRMED":
      return "Confirmada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return "—";
  }
}

export function SalesNoteDetailsClient({
  dto,
  auditLog,
}: {
  dto: SalesNoteDetailsDto;
  auditLog: SalesNoteAuditLogRowDto[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isCancelled = dto.status === "CANCELLED";

  // Only allow adding payment if not fully paid AND not cancelled
  const canAddPayment = !dto.isFullyPaid && !isCancelled;

  /**
   * Calculate total number of plants by summing quantities from all lines
   * (both registered and external lines)
   */
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

  function canModifyPayment(payment: SalesNoteDetailsDto["payments"][number]) {
    if (isCancelled) return false;
    if (payment.isDeleted) return false;
    return true;
  }

  async function handleDeletePayment(paymentId: string) {
    if (isCancelled) return;

    const ok = window.confirm(
      "¿Eliminar este pago? Se marcará como eliminado y no contará para el saldo.",
    );
    if (!ok) return;

    startTransition(async () => {
      await softDeleteSalesNotePaymentAction({
        salesNoteId: dto.id,
        paymentId,
      });

      router.refresh();
    });
  }

  return (
    <>
      {/* Status banner */}
      {isCancelled ? (
        <div className="alert alert-error mb-3">
          <div className="flex flex-col gap-1">
            <div className="font-semibold">Nota desactivada</div>
            <div className="text-sm">
              Esta nota está marcada como <b>{getStatusLabel(dto.status)}</b>.
              Solo lectura: no se pueden registrar pagos ni editar información.
            </div>
          </div>
        </div>
      ) : (
        <div className="alert mb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              Estado: <b>{getStatusLabel(dto.status)}</b>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="text-sm opacity-70">Total</div>
            <div className="text-2xl font-semibold">${moneyMX(dto.total)}</div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <div className="text-sm opacity-70">Pagado</div>
            <div className="text-2xl font-semibold">
              ${moneyMX(dto.paidTotal)}
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <div className="text-sm opacity-70">Pendiente</div>
            <div className="text-2xl font-semibold">
              ${moneyMX(dto.remainingTotal)}
            </div>
          </div>
        </div>

        {/* Total plants card with highlighted style */}
        <div className="card border-l-4 border-l-success bg-success/10">
          <div className="card-body">
            <div className="text-sm font-medium opacity-70">
              Total de plantas agregadas
            </div>
            <div className="text-2xl font-bold text-success">{totalPlants}</div>
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
                        <td className="text-right">${moneyMX(l.unitPrice)}</td>
                        <td className="text-right">${moneyMX(l.lineTotal)}</td>
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
                        <td className="text-right">${moneyMX(l.unitPrice)}</td>
                        <td className="text-right">${moneyMX(l.lineTotal)}</td>
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
              <span className="font-medium">${moneyMX(dto.subtotal)}</span>
            </div>

            <div className="flex justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">${moneyMX(dto.total)}</span>
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
              onClick={(e) => {
                if (!canAddPayment) e.preventDefault();
              }}
              title={
                isCancelled
                  ? "No se pueden registrar pagos en una nota desactivada."
                  : dto.isFullyPaid
                    ? "La nota ya está completamente pagada."
                    : undefined
              }
            >
              Registrar pago
            </Link>
          </div>

          {isCancelled ? (
            <div className="alert">
              <span>
                Esta nota está desactivada. Los pagos están en modo solo
                lectura.
              </span>
            </div>
          ) : null}

          {isPending ? (
            <div className="alert">
              <span>Procesando…</span>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th className="text-right">Monto</th>
                  <th>Referencia</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dto.payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center opacity-70">
                      No hay pagos registrados
                    </td>
                  </tr>
                ) : (
                  dto.payments.map((p) => {
                    const editable = canModifyPayment(p);
                    const rowClass = p.isDeleted ? "opacity-60" : "";

                    return (
                      <tr key={p.id} className={rowClass}>
                        <td>{dateMX(p.occurredAt)}</td>
                        <td>{p.paymentType}</td>
                        <td className="text-right">${moneyMX(p.amount)}</td>
                        <td>{p.reference ?? "—"}</td>
                        <td className="max-w-[320px] truncate">
                          {p.notes ?? "—"}
                        </td>
                        <td>
                          {p.isDeleted ? (
                            <div className="flex flex-col gap-1">
                              <span className="badge badge-error">
                                Eliminado
                              </span>
                              {p.deletedAt ? (
                                <span className="text-xs opacity-70">
                                  {dateMX(p.deletedAt)}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="badge badge-success">Activo</span>
                          )}
                        </td>
                        <td className="text-right">
                          {isCancelled ? (
                            <span className="text-sm opacity-60">—</span>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Link
                                className={`btn btn-ghost btn-sm ${
                                  editable ? "" : "btn-disabled"
                                }`}
                                aria-disabled={!editable}
                                href={
                                  editable
                                    ? routes.salesNotes.payments.edit(
                                        dto.id,
                                        p.id,
                                      )
                                    : "#"
                                }
                                onClick={(e) => {
                                  if (!editable) e.preventDefault();
                                }}
                                title={
                                  p.isDeleted
                                    ? "No se puede editar un pago eliminado."
                                    : undefined
                                }
                              >
                                Editar
                              </Link>

                              <button
                                type="button"
                                className={`btn btn-ghost btn-sm text-error ${
                                  editable ? "" : "btn-disabled"
                                }`}
                                disabled={!editable || isPending}
                                onClick={() => handleDeletePayment(p.id)}
                                title={
                                  p.isDeleted
                                    ? "Este pago ya está eliminado."
                                    : "Eliminar pago"
                                }
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {isCancelled ? null : dto.isFullyPaid ? (
            <div className="alert alert-success">
              <span>Esta nota de venta está completamente pagada.</span>
            </div>
          ) : (
            <div className="alert">
              <span>
                Saldo pendiente: <b>${moneyMX(dto.remainingTotal)}</b>
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
