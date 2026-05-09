import { Prisma } from "@/generated/prisma/client";
import { buildDescriptionSnapshot } from "@/modules/shared/snapshots/descriptionSnapshot";
import {
  computeDiscountedLineTotalsDecimal,
  sumDecimals,
  toDecimal,
} from "@/modules/shared/utils/decimals";
import { safeTrim } from "@/modules/shared/utils/strings";

type LoggerLike =
  | { log: (message: string, extra?: unknown) => void }
  | undefined;

export type DocumentLinePayload<TPriceField extends string> = {
  productVariantId: string | null;
  descriptionSnapshot: string;
  discountPercent: number;
  quantity: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
} & Record<TPriceField, Prisma.Decimal>;

type RegisteredDocumentLineInput<TPriceField extends string> = {
  productVariantId?: string | null;
  productName: string;
  description?: string | null;
  quantity: number;
  discountPercent?: number | string | null;
} & Record<TPriceField, string | number>;

type UnregisteredDocumentLineInput<TPriceField extends string> = {
  name: string;
  description?: string | null;
  quantity: number;
  discountPercent?: number | string | null;
} & Record<TPriceField, string | number>;

type RegisterableUnregisteredLine<TPriceField extends string> = {
  shouldRegister?: boolean;
  name: string;
  variantName?: string;
  bagSize?: string;
  color?: string;
} & Record<TPriceField, string | number>;

type PersistDocumentLinesParams<TPayload> = {
  payloads: readonly TPayload[];
  createMany: (payloads: readonly TPayload[]) => Promise<unknown>;
  deleteExisting?: () => Promise<unknown>;
  logger?: LoggerLike;
  startMessage?: string;
  emptyMessage?: string;
  doneMessage?: string;
};

export function buildRegisteredDocumentLinePayloads<
  TPriceField extends string,
  TLine extends RegisteredDocumentLineInput<TPriceField>,
>(lines: readonly TLine[], priceField: TPriceField) {
  return lines.map((line) => {
    const quantity = toDecimal(line.quantity);
    const unitPrice = toDecimal(line[priceField]);
    const { subtotal, discountAmount, lineTotal, discountPercent } =
      computeDiscountedLineTotalsDecimal({
        quantity,
        unitPrice,
        discountPercent: line.discountPercent,
      });

    return {
      productVariantId: safeTrim(line.productVariantId) || null,
      descriptionSnapshot: buildDescriptionSnapshot(
        line.productName,
        line.description,
      ),
      discountPercent,
      quantity,
      subtotal,
      discountAmount,
      lineTotal,
      [priceField]: unitPrice,
    } as DocumentLinePayload<TPriceField>;
  });
}

export function buildUnregisteredDocumentLinePayloads<
  TPriceField extends string,
  TLine extends UnregisteredDocumentLineInput<TPriceField>,
>(
  lines: readonly TLine[],
  priceField: TPriceField,
  productVariantIdsByIndex?: ReadonlyMap<number, string>,
) {
  return lines.map((line, index) => {
    const quantity = toDecimal(line.quantity);
    const unitPrice = toDecimal(line[priceField]);
    const { subtotal, discountAmount, lineTotal, discountPercent } =
      computeDiscountedLineTotalsDecimal({
        quantity,
        unitPrice,
        discountPercent: line.discountPercent,
      });

    return {
      productVariantId: productVariantIdsByIndex?.get(index) ?? null,
      descriptionSnapshot: buildDescriptionSnapshot(line.name, line.description),
      discountPercent,
      quantity,
      subtotal,
      discountAmount,
      lineTotal,
      [priceField]: unitPrice,
    } as DocumentLinePayload<TPriceField>;
  });
}

export function calculateDocumentTotals<TPriceField extends string>(
  lines: readonly DocumentLinePayload<TPriceField>[],
) {
  const subtotal = sumDecimals(lines, (line) => line.subtotal);
  const discountTotal = sumDecimals(lines, (line) => line.discountAmount);
  const total = subtotal.sub(discountTotal);

  return {
    subtotal,
    discountTotal,
    total,
  };
}

export async function registerProductVariantsFromUnregisteredLines<
  TPriceField extends string,
  TLine extends RegisterableUnregisteredLine<TPriceField>,
>(
  tx: Prisma.TransactionClient,
  lines: readonly TLine[],
  priceField: TPriceField,
  logger?: LoggerLike,
) {
  const registeredProductIds = new Map<number, string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.shouldRegister) continue;

    logger?.log("registering_product", { index, name: line.name });

    const existingProduct = await tx.productVariant.findFirst({
      where: {
        speciesName: { equals: line.name.trim(), mode: "insensitive" },
        variantName: line.variantName?.trim() || null,
        isDeleted: false,
      },
    });

    if (existingProduct) {
      registeredProductIds.set(index, existingProduct.id);
      logger?.log("product_already_exists", {
        index,
        productId: existingProduct.id,
        name: line.name,
      });
      continue;
    }

    const createdProduct = await tx.productVariant.create({
      data: {
        speciesName: line.name.trim(),
        variantName: line.variantName?.trim() || null,
        bagSize: line.bagSize?.trim() || null,
        color: line.color?.trim() || null,
        defaultPrice: toDecimal(line[priceField]),
        isActive: true,
      },
    });

    registeredProductIds.set(index, createdProduct.id);
    logger?.log("product_registered", {
      index,
      productId: createdProduct.id,
      name: line.name,
      defaultPrice: createdProduct.defaultPrice.toString(),
    });
  }

  return registeredProductIds;
}

export async function persistDocumentLines<TPayload>({
  payloads,
  createMany,
  deleteExisting,
  logger,
  startMessage,
  emptyMessage = "lines_skipped_empty",
  doneMessage = "lines_createMany_done",
}: PersistDocumentLinesParams<TPayload>) {
  if (startMessage) {
    logger?.log(startMessage);
  }

  if (deleteExisting) {
    await deleteExisting();
  }

  if (payloads.length === 0) {
    logger?.log(emptyMessage);
    return;
  }

  const result = await createMany(payloads);
  logger?.log(doneMessage, result);
}
