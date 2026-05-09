"use client";

import type { ReactNode } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  NoSymbolIcon,
} from "@heroicons/react/16/solid";

type PaymentStatus = "PAID" | "PENDING" | "CANCELLED";

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  {
    label: string;
    icon: ReactNode;
  }
> = {
  PAID: {
    label: "Pagada",
    icon: <CheckCircleIcon className="h-5 w-5 text-success" />,
  },
  PENDING: {
    label: "Pendiente",
    icon: <ClockIcon className="h-5 w-5 text-warning" />,
  },
  CANCELLED: {
    label: "Cancelada",
    icon: <NoSymbolIcon className="h-5 w-5 text-error" />,
  },
};

export function renderPaymentStatusCell(status: PaymentStatus) {
  const config = PAYMENT_STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      {config.icon}
      <span className="text-sm opacity-80">{config.label}</span>
    </div>
  );
}

export function renderBooleanBadge(
  value: boolean,
  labels: { trueLabel?: string; falseLabel?: string } = {},
) {
  return (
    <span className={`badge ${value ? "badge-success" : "badge-ghost"}`}>
      {value ? labels.trueLabel ?? "Sí" : labels.falseLabel ?? "No"}
    </span>
  );
}
