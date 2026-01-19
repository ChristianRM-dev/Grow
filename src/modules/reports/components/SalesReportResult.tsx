import type { SalesReportDto } from "@/modules/reports/queries/getSalesReport.dto";
import { dateMX, moneyMX } from "@/modules/shared/utils/formatters";

function formatQty(qty: number) {
  return qty.toFixed(3).replace(/\.?0+$/, "");
}

export function SalesReportResult({
  report,
  pdfHref,
}: {
  report: SalesReportDto;
  pdfHref: string;
}) {
  if (report.salesNotes.length === 0) {
    return (
      <div className="alert alert-info">
        <span>No hay ventas para el filtro seleccionado.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-box border border-base-300 bg-base-100 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Resultados</h3>
            <p className="text-sm opacity-70">{report.rangeLabel}</p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="text-sm">
              <span className="opacity-70">Total: </span>
              <span className="font-semibold">
                {moneyMX(report.grandTotal)}
              </span>
            </div>

            <div className="text-sm">
              <span className="opacity-70">Abonado: </span>
              <span className="font-semibold">
                {moneyMX(report.grandPaidTotal)}
              </span>
            </div>

            <div className="text-sm">
              <span className="opacity-70">Restante: </span>
              <span className="font-semibold">
                {moneyMX(report.grandBalanceDue)}
              </span>
            </div>

            <a
              className="btn btn-outline btn-sm"
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Exportar PDF
            </a>
          </div>
        </div>
      </div>

      {report.salesNotes.map((sn) => (
        <>
          <div
            key={sn.id}
            className="rounded-box border border-base-300 bg-base-100"
          >
            <div className="border-b border-base-300 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm opacity-70">Folio</div>
                  <div className="font-semibold">{sn.folio}</div>

                  <div className="mt-2 text-sm opacity-70">Cliente</div>
                  <div>{sn.partyName}</div>

                  <div className="mt-2 text-sm opacity-70">Fecha</div>
                  <div>{dateMX(sn.createdAt)}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm opacity-70">Total</div>
                  <div className="text-lg font-semibold">
                    {moneyMX(sn.total)}
                  </div>

                  <div className="mt-2 text-sm opacity-70">Abonado</div>
                  <div className="font-semibold">{moneyMX(sn.paidTotal)}</div>

                  <div className="mt-2 text-sm opacity-70">Restante</div>
                  <div className="font-semibold">{moneyMX(sn.balanceDue)}</div>
                </div>
              </div>
            </div>

            {/* resto igual */}
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th className="text-right">P. Unit.</th>
                      <th className="text-right">Cant.</th>
                      <th className="text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sn.lines.map((l, idx) => (
                      <tr key={`${sn.id}-line-${idx}`}>
                        <td>{l.description}</td>
                        <td className="text-right">{moneyMX(l.unitPrice)}</td>
                        <td className="text-right">{formatQty(l.quantity)}</td>
                        <td className="text-right">{moneyMX(l.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-end">
                <div className="text-right">
                  <div className="text-sm opacity-70">Total</div>
                  <div className="font-semibold">{moneyMX(sn.total)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="divider"></div>
        </>
      ))}
    </div>
  );
}
