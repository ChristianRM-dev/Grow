import type { DashboardTopDelinquentsDto } from "@/modules/dashboard/queries/getDashboardTopDelinquentCustomers.query";
import { moneyMX } from "@/modules/shared/utils/formatters";

export function TopDelinquentCustomersCard({
  data,
}: {
  data: DashboardTopDelinquentsDto;
}) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300/60">
      <div className="card-body gap-4">
        <div className="h-1 w-full rounded-full bg-accent/80" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="card-title">Clientes que nos deben</h2>
            <p className="text-sm opacity-70">Top 5 por saldo pendiente</p>
          </div>
          <div className="badge badge-accent badge-outline">Top 5</div>
        </div>

        {data.rows.length === 0 ? (
          <div className="alert alert-info">
            <span>No hay cuentas por cobrar registradas.</span>
          </div>
        ) : (
          <div className="rounded-xl border border-base-300/40 bg-base-200/40 overflow-hidden">
            <ul className="divide-y divide-base-300/50">
              {data.rows.map((row) => (
                <li key={row.partyId} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {row.partyName}
                      </div>
                      <div className="text-xs opacity-70">
                        Último movimiento:{" "}
                        {new Date(row.lastMovementAt).toLocaleDateString(
                          "es-MX",
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold tabular-nums">
                        {moneyMX(row.balance)}
                      </div>
                      <div className="text-xs opacity-60">Saldo</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
