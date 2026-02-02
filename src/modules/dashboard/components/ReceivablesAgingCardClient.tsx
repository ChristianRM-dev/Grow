"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { DashboardReceivablesSummaryDto } from "../queries/getDashboardReceivablesSummary.query";
import { moneyMX } from "@/modules/shared/utils/formatters";

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export function ReceivablesAgingCardClient({
  data,
}: {
  data: DashboardReceivablesSummaryDto;
}) {
  const primary = cssVar("--p", "oklch(60% 0.2 250)");
  const secondary = cssVar("--s", "oklch(62% 0.18 150)");
  const accent = cssVar("--a", "oklch(65% 0.2 30)");
  const baseContent = cssVar("--bc", "oklch(20% 0 0)");

  const palette = [secondary, primary, accent, secondary, primary];

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300/60">
      <div className="card-body gap-4">
        <div className="h-1 w-full rounded-full bg-secondary/80" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="card-title">Por cobrar</h2>
            <p className="text-sm opacity-70">
              Total estimado: {moneyMX(data.totalReceivable)}
            </p>
          </div>

          <div className="badge badge-secondary badge-outline">Antigüedad</div>
        </div>

        <div className="h-56 w-full rounded-xl bg-base-200/40 p-3 border border-base-300/40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.buckets} barSize={18}>
              <CartesianGrid
                stroke="currentColor"
                strokeOpacity={0.12}
                vertical={false}
              />
              <XAxis
                dataKey="label"
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
                contentStyle={{
                  background: "oklch(var(--b1))",
                  border: "1px solid oklch(var(--b3))",
                  borderRadius: 12,
                }}
                cursor={{ fill: "oklch(var(--b2))", opacity: 0.5 }}
              />
              <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                {data.buckets.map((_, idx) => (
                  <Cell key={idx} fill={palette[idx % palette.length]} />
                ))}
              </Bar>
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
