"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { ProductVariantWizard } from "@/modules/products/components/ProductVariantWizard/ProductVariantWizard";
import type { ProductVariantFormValues } from "@/modules/products/forms/productVariantForm.schemas";
import type { ProductVariantEditDto } from "@/modules/products/queries/getProductVariantById.query";
import { updateProductVariantAction } from "@/modules/products/actions/updateProductVariant.action";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

export function ProductEditClient({
  product,
}: {
  product: ProductVariantEditDto;
}) {
  const router = useRouter();

  const initialValues: Partial<ProductVariantFormValues> = {
    speciesName: product.speciesName,
    variantName: product.variantName ?? "",
    bagSize: product.bagSize ?? "",
    color: product.color ?? "",
    defaultPrice: product.defaultPrice,
    isActive: product.isActive,
  };

  const handleSubmit = async (values: ProductVariantFormValues) => {
    try {
      await updateProductVariantAction({ id: product.id, values });
      toast.success("Actualizado exitosamente");
      router.replace(routes.products.list());

    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar el producto");
    }
  };

  return (
    <div className="p-4">
      <ProductVariantWizard
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitting={false}
      />
    </div>
  );
}
