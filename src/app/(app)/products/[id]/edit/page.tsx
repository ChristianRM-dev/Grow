import React from "react";
import { notFound } from "next/navigation";

import { getProductVariantById } from "@/modules/products/queries/getProductVariantById.query";
import { ProductEditClient } from "./product-edit-client";

import { FormPageLayout } from "@/components/ui/FormPageLayout/FormPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductEditPage({ params }: Props) {
  const { id } = await params;

  const product = await getProductVariantById(id);
  if (!product) notFound();

  return (
    <FormPageLayout
      title="Editar producto"
      description="Actualiza la información del producto."
      backHref={routes.products.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Productos", href: routes.products.list() },
            { label: "Editar" },
          ]}
        />
      }
    >
      <ProductEditClient product={product} />
    </FormPageLayout>
  );
}
