import React from "react";
import { notFound } from "next/navigation";
import { getProductVariantById } from "@/modules/products/queries/getProductVariantById.query";
import { ProductEditClient } from "./product-edit-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductEditPage({ params }: Props) {
  const { id } = await params;

  const product = await getProductVariantById(id);
  if (!product) notFound();

  return <ProductEditClient product={product} />;
}
