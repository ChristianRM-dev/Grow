import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailsPageLayout } from "@/components/ui/DetailsPageLayout/DetailsPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { InlineEntityLink } from "@/components/ui/InlineEntityLink/InlineEntityLink";
import { routes } from "@/lib/routes";
import { dateMX } from "@/modules/shared/utils/formatters";

import { getSupplierPurchaseDetailsById } from "@/modules/supplier-purchases/queries/getSupplierPurchaseDetails.query";
import { SupplierPurchaseDetailsClient } from "./supplier-purchase-details-client";

export default async function SupplierPurchaseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dto = await getSupplierPurchaseDetailsById(id);
  if (!dto) return notFound();

  const canAddPayment = !dto.isFullyPaid;

  return (
    <DetailsPageLayout
      backHref={routes.supplierPurchases.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            {
              label: "Compras a proveedores",
              href: routes.supplierPurchases.list(),
            },
            { label: `Compra: ${dto.supplierFolio}` },
          ]}
        />
      }
      title={dto.supplierFolio}
      badge={{
        label: dto.isFullyPaid ? "Pagado" : "Pendiente",
        variant: dto.isFullyPaid ? "success" : "warning",
      }}
      subtitle={
        <>
          Proveedor:{" "}
          <InlineEntityLink
            href={routes.parties.details(dto.party.id)}
            title="Ver detalle del proveedor"
          >
            {dto.party.name}
          </InlineEntityLink>{" "}
          · Fecha: <b>{dateMX(dto.occurredAt)}</b>
        </>
      }
      headerActions={
        <>
          <Link
            href={routes.supplierPurchases.payments.new(dto.id)}
            className={`btn btn-primary btn-sm ${
              canAddPayment ? "" : "btn-disabled"
            }`}
            aria-disabled={!canAddPayment}
          >
            Registrar pago
          </Link>

          <Link
            href={routes.supplierPurchases.edit(dto.id)}
            className="btn btn-sm"
          >
            Editar compra
          </Link>
        </>
      }
    >
      <SupplierPurchaseDetailsClient dto={dto} />
    </DetailsPageLayout>
  );
}
