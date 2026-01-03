"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardReceivablesSummaryDto } from "../queries/getDashboardReceivablesSummary.query";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}

export function ReceivablesAgingCardClient({
  data,
}: {
  data: DashboardReceivablesSummaryDto;
}) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-4">
        <div>
          <h2 className="card-title">Por cobrar</h2>
          <p className="text-sm opacity-70">
            Total estimado: {formatMoney(data.totalReceivable)}
          </p>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.buckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => `${v}`} />
              <Tooltip formatter={(v) => formatMoney(Number(v))} />
              <Bar dataKey="amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs opacity-60">
          Antigüedad basada en entradas de ventas (notas de venta).
        </p>
      </div>
    </div>
  );
}
