import type { DashboardTopDelinquentsDto } from "@/modules/dashboard/queries/getDashboardTopDelinquentCustomers.query";
import { moneyMX } from "@/modules/shared/utils/formatters";


export function TopDelinquentCustomersCard({
  data,
}: {
  data: DashboardTopDelinquentsDto;
}) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-4">
        <div>
          <h2 className="card-title">Clientes que nos deben</h2>
          <p className="text-sm opacity-70">Top 5 por saldo pendiente</p>
        </div>

        {data.rows.length === 0 ? (
          <div className="alert">
            <span>No hay cuentas por cobrar registradas.</span>
          </div>
        ) : (
          <ul className="menu bg-base-200 rounded-box">
            {data.rows.map((row) => (
              <li key={row.partyId}>
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{row.partyName}</div>
                    <div className="text-xs opacity-70">
                      Último movimiento:{" "}
                      {new Date(row.lastMovementAt).toLocaleDateString("es-MX")}
                    </div>
                  </div>
                  <div className="text-right font-semibold">
                    {moneyMX(row.balance)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
