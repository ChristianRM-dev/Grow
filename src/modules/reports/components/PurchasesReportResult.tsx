// src/modules/reports/components/PurchasesReportResult.tsx
import type { PurchasesReportDto } from "@/modules/reports/queries/getPurchasesReport.dto";
import { money, dateMX } from "@/modules/shared/utils/formatters";

function formatQty(qty: number) {
  return qty.toFixed(3).replace(/\.?0+$/, "");
}

export function PurchasesReportResult({
  report,
  pdfHref,
}: {
  report: PurchasesReportDto;
  pdfHref: string;
}) {
  if (report.purchases.length === 0) {
    return (
      <div className="alert alert-info">
        <span>No hay compras para el período seleccionado.</span>
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
              <span className="opacity-70">Gran total: </span>
              <span className="font-semibold">{money(report.grandTotal)}</span>
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

      {report.purchases.map((p) => (
        <>
          <div
            key={p.id}
            className="rounded-box border border-base-300 bg-base-100"
          >
            <div className="border-b border-base-300 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm opacity-70">Folio proveedor</div>
                  <div className="font-semibold">{p.supplierFolio}</div>

                  <div className="mt-2 text-sm opacity-70">Proveedor</div>
                  <div>{p.partyName}</div>

                  <div className="mt-2 text-sm opacity-70">Fecha</div>
                  <div>{dateMX(p.occurredAt)}</div>

                  {p.notes ? (
                    <>
                      <div className="mt-2 text-sm opacity-70">Notas</div>
                      <div className="whitespace-pre-wrap">{p.notes}</div>
                    </>
                  ) : null}
                </div>

                <div className="text-right">
                  <div className="text-sm opacity-70">Total de la compra</div>
                  <div className="text-lg font-semibold">{money(p.total)}</div>
                </div>
              </div>
            </div>

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
                    {p.lines.map((l, idx) => (
                      <tr key={`${p.id}-line-${idx}`}>
                        <td>{l.description}</td>
                        <td className="text-right">{money(l.unitPrice)}</td>
                        <td className="text-right">{formatQty(l.quantity)}</td>
                        <td className="text-right">{money(l.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-end">
                <div className="text-right">
                  <div className="text-sm opacity-70">Total</div>
                  <div className="font-semibold">{money(p.total)}</div>
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
