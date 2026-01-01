"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { ProductVariantWizard } from "@/modules/products/components/ProductVariantWizard/ProductVariantWizard";
import type { ProductVariantFormValues } from "@/modules/products/forms/productVariantForm.schemas";
import { createProductVariantAction } from "@/modules/products/actions/createProductVariant.action";
import { toast } from "@/components/ui/Toast/toast";
import { routes } from "@/lib/routes";

export function ProductNewClient() {
  const router = useRouter();

  const handleSubmit = async (values: ProductVariantFormValues) => {
    try {
      await createProductVariantAction(values);
      toast.success("Guardado exitosamente");
      router.replace(routes.products.list());

    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar el producto");
    }
  };

  return (
    <div className="p-4">
      <ProductVariantWizard
        initialValues={{
          speciesName: "",
          variantName: "",
          bagSize: "",
          color: "",
          defaultPrice: "",
          isActive: true,
        }}
        onSubmit={handleSubmit}
        submitting={false}
      />
    </div>
  );
}
