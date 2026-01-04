import { money } from "@/modules/shared/utils/formatters";

/**
 * Small UI helpers for AuditLog rendering.
 * Keep code and comments in English; UI strings returned are Spanish.
 */

export function auditEventTitle(eventKey: string): string {
  switch (eventKey) {
    case "salesNote.created":
      return "Nota de venta creada";
    case "salesNote.updated":
      return "Nota de venta actualizada";
    case "salesNote.payment.created":
      return "Pago registrado";
    case "salesNote.payment.updated":
      return "Pago actualizado";
    case "supplierPurchase.created":
      return "Compra creada";
    case "supplierPurchase.updated":
      return "Compra actualizada";
    case "supplierPurchase.payment.created":
      return "Pago a proveedor registrado";
    case "supplierPurchase.payment.updated":
      return "Pago a proveedor actualizado";
    default:
      return "Movimiento registrado";
  }
}

export function auditChangeLabel(changeKey: string): string {
  switch (changeKey) {
    case "SALES_NOTE_SUBTOTAL":
      return "Subtotal";
    case "SALES_NOTE_DISCOUNT_TOTAL":
      return "Descuento";
    case "SALES_NOTE_TOTAL":
      return "Total";
    case "SALES_NOTE_BALANCE_DUE":
      return "Saldo pendiente";
    case "PAYMENT_AMOUNT":
      return "Monto del pago";
    case "SUPPLIER_PURCHASE_TOTAL":
      return "Total de compra";
    case "SUPPLIER_PURCHASE_BALANCE_DUE":
      return "Saldo pendiente";
    default:
      return changeKey;
  }
}

export function auditFormatMoney(value: string | null): string {
  if (!value) return "—";
  return `$${money(value)}`;
}

export function auditFormatText(value: string | null): string {
  if (!value) return "—";
  return value;
}
