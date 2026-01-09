// src/modules/shared/pdf/formatters.ts

function toNumberOrZero(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(v: string): string {
  const n = toNumberOrZero(v);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatQty(v: string): string {
  const n = toNumberOrZero(v);
  const s = n.toFixed(3);
  return s.replace(/\.?0+$/, "");
}
