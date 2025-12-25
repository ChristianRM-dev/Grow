"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { ProductVariantWizard } from "@/modules/products/components/ProductVariantWizard/ProductVariantWizard";
import type { ProductVariantFormValues } from "@/modules/products/forms/productVariantForm.schemas";
import { createProductVariantAction } from "@/modules/products/actions/createProductVariant.action";

export function ProductNewClient() {
  const router = useRouter();

  const handleSubmit = async (values: ProductVariantFormValues) => {
    try {
      await createProductVariantAction(values);
      alert("Guardado exitosamente");
      router.push("/products");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el producto");
    }
  };

  return (
    <div className="p-4">
      <ProductVariantWizard onSubmit={handleSubmit} />
    </div>
  );
}
