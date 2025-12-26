import React from "react";

import { ProductNewClient } from "./product-new-client";
import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

export default function ProductNewPage() {
  return (
    <FormPageLayout
      title="Nuevo producto"
      description="Registra un producto en el catálogo."
      backHref={routes.products.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Productos", href: routes.products.list() },
            { label: "Nuevo" },
          ]}
        />
      }
    >
      <ProductNewClient />
    </FormPageLayout>
  );
}
