import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailsPageLayout } from "@/components/ui/DetailsPageLayout/DetailsPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { InlineEntityLink } from "@/components/ui/InlineEntityLink/InlineEntityLink";
import { routes } from "@/lib/routes";
import { dateMX } from "@/modules/shared/utils/formatters";
import { getQuotationDetailsById } from "@/modules/quotations/queries/getQuotationDetails.query";
import { QuotationDetailsClient } from "./quotation-details-client";

function statusVariant(
  status: string
): "success" | "warning" | "info" | "error" {
  switch (status) {
    case "CONVERTED":
      return "success";
    case "SENT":
      return "info";
    case "CANCELLED":
      return "error";
    default:
      return "warning";
  }
}

// Función para traducir los estados a español
export function statusMessage(status: string): string {
  const translations: Record<string, string> = {
    DRAFT: "Borrador",
    SENT: "Enviado",
    CONVERTED: "Convertido",
    CANCELLED: "Cancelado"
  };

  return translations[status] || status;
}

export default async function QuotationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dto = await getQuotationDetailsById(id);
  if (!dto) return notFound();

  return (
    <DetailsPageLayout
      backHref={routes.quotations.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Cotizaciones", href: routes.quotations.list() },
            { label: `Cotización: ${dto.folio}` },
          ]}
        />
      }
      title={dto.folio}
      badge={{
        label: statusMessage(dto.status),
        variant: statusVariant(dto.status),
      }}
      subtitle={
        <>
          Contacto:{" "}
          <InlineEntityLink
            href={routes.parties.details(dto.party.id)}
            title="Ver detalle del contacto"
          >
            {dto.party.name}
          </InlineEntityLink>{" "}
          · Creado: <b>{dateMX(dto.createdAt)}</b>
        </>
      }
      headerActions={
        <>
          <Link
            href={routes.quotations.new()}
            className="btn btn-primary btn-sm"
          >
            Crear nota de venta
          </Link>

          <Link
            href={routes.quotations.pdf(dto.id)}
            target="_new"
            className={`btn btn-info btn-sm`}
          >
            Ver PDF
          </Link>
          <Link
            href={routes.quotations.edit(dto.id)}
            className="btn btn-warning btn-sm"
          >
            Editar cotización
          </Link>
        </>
      }
    >
      <QuotationDetailsClient dto={dto} />
    </DetailsPageLayout>
  );
}
