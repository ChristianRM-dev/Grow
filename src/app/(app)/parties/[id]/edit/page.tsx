// src/app/(app)/parties/[id]/edit/page.tsx
import React from "react";
import { notFound } from "next/navigation";

import { getPartyById } from "@/modules/parties/queries/getPartyById.query";
import { PartyEditClient } from "./party-edit-client";

import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PartyEditPage({ params }: Props) {
  const { id } = await params;

  const party = await getPartyById(id);
  if (!party) notFound();

  return (
    <FormPageLayout
      title="Editar contacto"
      description="Actualiza la información del cliente o proveedor."
      backHref={routes.parties.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Clientes y proveedores", href: routes.parties.list() },
            { label: "Editar" },
          ]}
        />
      }
    >
      <PartyEditClient party={party} />
    </FormPageLayout>
  );
}
