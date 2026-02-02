"use client";

import type { DashboardMonthlySalesDto } from "@/modules/dashboard/queries/getDashboardMonthlySales.query";
import { moneyMX } from "@/modules/shared/utils/formatters";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export function MonthlySalesChartCardClient({
  data,
}: {
  data: DashboardMonthlySalesDto;
}) {
  const primary = cssVar("--p", "oklch(60% 0.2 250)");
  const baseContent = cssVar("--bc", "oklch(20% 0 0)");

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300/60">
      <div className="card-body gap-4">
        {/* Accent line */}
        <div className="h-1 w-full rounded-full bg-primary/80" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="card-title">Ventas del mes</h2>
            <p className="text-sm opacity-70">
              {moneyMX(data.monthTotal)} · {data.monthCount} notas confirmadas
            </p>
          </div>
          <div className="badge badge-primary badge-outline">
            {String(data.month).padStart(2, "0")}/{data.year}
          </div>
        </div>

        <div className="h-56 w-full rounded-xl bg-base-200/40 p-3 border border-base-300/40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.series} barSize={18}>
              <CartesianGrid
                stroke="currentColor"
                strokeOpacity={0.12}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: baseContent, opacity: 0.75, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${v}`}
                tick={{ fill: baseContent, opacity: 0.6, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={34}
              />
              <Tooltip
                formatter={(v) => moneyMX(Number(v))}
                labelFormatter={(l) => `Día ${l}`}
                contentStyle={{
                  background: "oklch(var(--b1))",
                  border: "1px solid oklch(var(--b3))",
                  borderRadius: 12,
                }}
                cursor={{ fill: "oklch(var(--b2))", opacity: 0.5 }}
              />
              <Bar dataKey="total" fill={primary} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
