// src/modules/shared/folio/monthlyFolio.ts
import { FolioType, Prisma } from "@/generated/prisma/client";
import {
  isRecordNotFoundError,
  isUniqueConstraintError,
} from "@/modules/shared/prisma/errors";

type Tx = Prisma.TransactionClient;

type LoggerLike =
  | { log: (message: string, extra?: unknown) => void }
  | undefined;

async function allocateMonthlySequenceNumber(params: {
  tx: Tx;
  type: FolioType;
  year: number;
  month: number;
  logger?: LoggerLike;
}): Promise<number> {
  const { tx, type, year, month, logger } = params;

  const where = {
    type_year_month: { type, year, month },
  } as const;

  // 1) Try update (fast path)
  try {
    const updated = await tx.folioSequence.update({
      where,
      data: { nextNumber: { increment: 1 } },
      select: { nextNumber: true },
    });

    const issued = updated.nextNumber - 1;
    logger?.log("folio_sequence_update", { type, year, month, issued });
    return issued;
  } catch (err: unknown) {
    if (!isRecordNotFoundError(err)) throw err;
  }

  // 2) Missing row -> create (may race)
  try {
    await tx.folioSequence.create({
      data: {
        type,
        year,
        month,
        nextNumber: 2, // we issue "1" and next becomes "2"
      },
      select: { id: true },
    });

    logger?.log("folio_sequence_created", { type, year, month, issued: 1 });
    return 1;
  } catch (err: unknown) {
    if (!isUniqueConstraintError(err)) throw err;

    // 3) Race -> retry update once
    const updated = await tx.folioSequence.update({
      where,
      data: { nextNumber: { increment: 1 } },
      select: { nextNumber: true },
    });

    const issued = updated.nextNumber - 1;
    logger?.log("folio_sequence_race_retry_update", {
      type,
      year,
      month,
      issued,
    });
    return issued;
  }
}

export function formatMonthlyFolio(
  year: number,
  month: number,
  number: number
): string {
  const yyyy = String(year).padStart(4, "0");
  const mm = String(month).padStart(2, "0");
  const nn = String(number).padStart(2, "0"); // minimum 2 digits
  return `${yyyy}-${mm}-${nn}`;
}

export async function generateMonthlyFolio(params: {
  tx: Tx;
  type: FolioType;
  date?: Date;
  logger?: LoggerLike;
}): Promise<string> {
  const { tx, type, date = new Date(), logger } = params;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const issuedNumber = await allocateMonthlySequenceNumber({
    tx,
    type,
    year,
    month,
    logger,
  });

  return formatMonthlyFolio(year, month, issuedNumber);
}
