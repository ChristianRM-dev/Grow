// src/modules/payments/application/paymentTypeMapping.ts
// Normalizes PaymentType values between Prisma (server) and form DTOs (client).

export const PaymentTypeFormValues = [
  "CASH",
  "TRANSFER",
  "CREDIT",
  "EXCHANGE",
] as const;
export type PaymentTypeFormValue = (typeof PaymentTypeFormValues)[number];

export function toFormPaymentType(prismaValue: string): PaymentTypeFormValue {
  const v = prismaValue?.trim();

  // Prisma currently returns "Exchange" in some environments.
  if (v === "Exchange" || v === "EXCHANGE") return "EXCHANGE";

  // Assume the rest are already uppercase and valid.
  if (v === "CASH" || v === "TRANSFER" || v === "CREDIT") return v;

  // Fail fast to catch unexpected values early.
  throw new Error(`Unsupported paymentType: ${prismaValue}`);
}

export function toPrismaPaymentType(formValue: PaymentTypeFormValue): string {
  // If your Prisma enum uses "Exchange" (mixed case), map back.
  // If later you standardize Prisma to "EXCHANGE", change this mapping.
  if (formValue === "EXCHANGE") return "Exchange";
  return formValue;
}
