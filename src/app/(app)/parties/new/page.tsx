import React from "react";

import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";
import { PartyNewClient } from "./party-new-client";

export default function PartyNewPage() {
  return (
    <FormPageLayout
      title="Nuevo Contacto"
      description="Registra un cliente, proveedor o ambos."
      backHref={routes.parties.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Clientes y proveedores", href: routes.parties.list() },
            { label: "Nuevo" },
          ]}
        />
      }
    >
      <PartyNewClient />
    </FormPageLayout>
  );
}
