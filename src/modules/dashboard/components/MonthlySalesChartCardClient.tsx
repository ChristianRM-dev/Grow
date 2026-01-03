"use client";

import type { DashboardMonthlySalesDto } from "@/modules/dashboard/queries/getDashboardMonthlySales.query";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}

export function MonthlySalesChartCardClient({
  data,
}: {
  data: DashboardMonthlySalesDto;
}) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="card-title">Ventas del mes</h2>
            <p className="text-sm opacity-70">
              {formatMoney(data.monthTotal)} · {data.monthCount} notas
              confirmadas
            </p>
          </div>
          <div className="badge badge-ghost">
            {String(data.month).padStart(2, "0")}/{data.year}
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(v) => `${v}`} />
              <Tooltip
                formatter={(v) => formatMoney(Number(v))}
                labelFormatter={(l) => `Día ${l}`}
              />
              <Bar dataKey="total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
