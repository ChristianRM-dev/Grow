import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSalesNoteDetailsById } from "@/modules/sales-notes/queries/getSalesNoteDetails.query";
import { DetailsPageLayout } from "@/components/ui/DetailsPageLayout/DetailsPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";
import { dateMX } from "@/modules/shared/utils/formatters";
import { SalesNoteDetailsClient } from "./sales-note-details-client";
import { InlineEntityLink } from "@/components/ui/InlineEntityLink/InlineEntityLink";
import { getSalesNoteAuditLogById } from "@/modules/sales-notes/queries/getSalesNoteAuditLog.query";

export default async function SalesNoteDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dto = await getSalesNoteDetailsById(id);
  if (!dto) return notFound();
  const auditLog = await getSalesNoteAuditLogById(dto.id);
  console.log("auditLog", auditLog);
  const canAddPayment = !dto.isFullyPaid;

  return (
    <DetailsPageLayout
      backHref={routes.salesNotes.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Notas de venta", href: routes.salesNotes.list() },
            { label: `Nota: ${dto.folio}` },
          ]}
        />
      }
      title={dto.folio}
      badge={{
        label: dto.isFullyPaid ? "Pagado" : "Pendiente",
        variant: dto.isFullyPaid ? "success" : "warning",
      }}
      subtitle={
        <>
          Cliente:{" "}
          <InlineEntityLink
            href={routes.parties.details(dto.party.id)}
            title="Ver detalle del cliente"
          >
            {dto.party.name}
          </InlineEntityLink>{" "}
          · Creado: <b>{dateMX(dto.createdAt)}</b>
        </>
      }
      headerActions={
        <>
          <Link
            href={routes.salesNotes.payments.new(dto.id)}
            className={`btn btn-primary btn-sm ${
              canAddPayment ? "" : "btn-disabled"
            }`}
            aria-disabled={!canAddPayment}
          >
            Registrar pago
          </Link>

          <Link
            href={routes.salesNotes.pdf(dto.id)}
            target="_new"
            className={`btn btn-info btn-sm`}
          >
            Ver PDF
          </Link>

          <Link
            href={routes.salesNotes.edit(dto.id)}
            className="btn btn-warning btn-sm"
          >
            Editar nota
          </Link>
        </>
      }
    >
      <SalesNoteDetailsClient dto={dto} auditLog={auditLog} />
    </DetailsPageLayout>
  );
}
