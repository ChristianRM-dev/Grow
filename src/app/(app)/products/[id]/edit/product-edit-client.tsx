"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { ProductVariantWizard } from "@/modules/products/components/ProductVariantWizard/ProductVariantWizard";
import type { ProductVariantFormValues } from "@/modules/products/forms/productVariantForm.schemas";
import type { ProductVariantEditDto } from "@/modules/products/queries/getProductVariantById.query";
import { updateProductVariantAction } from "@/modules/products/actions/updateProductVariant.action";

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
      alert("Actualizado exitosamente");
      router.push("/products");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el producto");
    }
  };

  return (
    <div className="p-4">
      <ProductVariantWizard
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
