import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SalesNoteFormValues } from "@/modules/sales-notes/forms/salesNoteForm.schemas";

const WALK_IN_PUBLIC_SYSTEM_KEY = "WALK_IN_PUBLIC";

type UseCaseContext = { traceId?: string };

function log(
  ctx: UseCaseContext | undefined,
  message: string,
  extra?: unknown
) {
  const prefix = ctx?.traceId
    ? `[updateSalesNoteUseCase:${ctx.traceId}]`
    : "[updateSalesNoteUseCase]";
  if (extra !== undefined) console.log(prefix, message, extra);
  else console.log(prefix, message);
}

function toDecimal(value: string | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}

function buildDescriptionSnapshot(name: string, description?: string | null) {
  const n = safeTrim(name);
  const d = safeTrim(description);
  if (!d) return n || "—";
  return `${n} — ${d}`;
}

async function getOrCreateWalkInPublicPartyId(
  tx: typeof prisma,
  ctx?: UseCaseContext
): Promise<string> {
  const row = await tx.party.upsert({
    where: { systemKey: WALK_IN_PUBLIC_SYSTEM_KEY },
    update: {},
    create: { systemKey: WALK_IN_PUBLIC_SYSTEM_KEY, name: "Público" },
    select: { id: true },
  });

  log(ctx, `walk_in_party_resolved id=${row.id}`);
  return row.id;
}

export async function updateSalesNoteUseCase(
  salesNoteId: string,
  values: SalesNoteFormValues,
  ctx?: UseCaseContext
) {
  log(ctx, "start", {
    salesNoteId,
    customerMode: values.customer.mode,
    partyMode: (values.customer as any).partyMode,
    lines: values.lines?.length ?? 0,
    unregisteredLines: values.unregisteredLines?.length ?? 0,
  });

  return prisma.$transaction(async (tx) => {
    log(ctx, "tx_begin");

    // 0) Ensure SalesNote exists
    const existing = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: { id: true, partyId: true, folio: true, status: true },
    });

    if (!existing) {
      throw new Error("SalesNote not found.");
    }

    // 1) Resolve partyId
    let partyId: string;

    if (values.customer.mode === "PUBLIC") {
      partyId = await getOrCreateWalkInPublicPartyId(tx, ctx);
    } else {
      if (values.customer.partyMode === "EXISTING") {
        const id = safeTrim(values.customer.existingPartyId);
        if (!id) throw new Error("Missing existingPartyId for PARTY/EXISTING.");

        const party = await tx.party.findFirst({
          where: { id, isDeleted: false },
          select: { id: true },
        });
        if (!party) {
          throw new Error("Selected customer does not exist or is deleted.");
        }

        partyId = party.id;
        log(ctx, `party_existing_resolved id=${partyId}`);
      } else {
        const name = safeTrim(values.customer.newParty?.name);
        if (!name) throw new Error("Missing newParty.name for PARTY/NEW.");

        const createdParty = await tx.party.create({
          data: {
            name,
            phone: safeTrim(values.customer.newParty?.phone) || null,
            notes: safeTrim(values.customer.newParty?.notes) || null,
          },
          select: { id: true },
        });

        partyId = createdParty.id;
        log(ctx, `party_created id=${partyId}`);
      }
    }

    // 2) Build line payloads
    const registeredLines = (values.lines ?? []).map((l, idx) => {
      const qty = toDecimal(l.quantity);
      const unitPrice = toDecimal(l.unitPrice);
      const lineTotal = qty.mul(unitPrice);

      return {
        _idx: idx,
        productVariantId: safeTrim(l.productVariantId) || null,
        descriptionSnapshot: buildDescriptionSnapshot(
          l.productName,
          l.description
        ),
        quantity: qty,
        unitPrice,
        lineTotal,
      };
    });

    // NOTE: This assumes your schema uses `unregisteredLines[].name`.
    // If your form uses `productName` instead, change `l.name` to `l.productName`.
    const unregisteredLines = (values.unregisteredLines ?? []).map(
      (l: any, idx) => {
        const qty = toDecimal(l.quantity);
        const unitPrice = toDecimal(l.unitPrice);
        const lineTotal = qty.mul(unitPrice);

        return {
          _idx: idx,
          productVariantId: null as string | null,
          descriptionSnapshot: buildDescriptionSnapshot(
            safeTrim(l.name ?? l.productName),
            l.description
          ),
          quantity: qty,
          unitPrice,
          lineTotal,
        };
      }
    );

    const allLines = [...registeredLines, ...unregisteredLines];
    log(ctx, "lines_built", { allLines: allLines.length });

    // 3) Totals
    const subtotal = allLines.reduce(
      (acc, l) => acc.add(l.lineTotal),
      new Prisma.Decimal(0)
    );
    const discountTotal = new Prisma.Decimal(0);
    const total = subtotal.sub(discountTotal);

    log(ctx, "totals", {
      subtotal: subtotal.toString(),
      discountTotal: discountTotal.toString(),
      total: total.toString(),
    });

    // 4) Update SalesNote header
    await tx.salesNote.update({
      where: { id: salesNoteId },
      data: {
        partyId,
        subtotal,
        discountTotal,
        total,
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    // 5) Replace lines (simple approach)
    log(ctx, "lines_replace_start");

    await tx.salesNoteLine.deleteMany({
      where: { salesNoteId },
    });

    if (allLines.length > 0) {
      const res = await tx.salesNoteLine.createMany({
        data: allLines.map((l) => ({
          salesNoteId,
          productVariantId: l.productVariantId,
          descriptionSnapshot: l.descriptionSnapshot,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
        })),
      });
      log(ctx, "lines_createMany_done", res);
    } else {
      log(ctx, "lines_skipped_empty");
    }

    // 6) Optional debug snapshot
    const written = await tx.salesNote.findUnique({
      where: { id: salesNoteId },
      select: {
        id: true,
        folio: true,
        partyId: true,
        total: true,
        _count: { select: { lines: true } },
      },
    });

    log(ctx, "tx_end_written_snapshot", written);

    return { salesNoteId };
  });
}
