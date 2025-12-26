// src/modules/sales-notes/application/createSalesNote.usecase.ts
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
    ? `[createSalesNoteUseCase:${ctx.traceId}]`
    : "[createSalesNoteUseCase]";
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

function generateFolio(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const t = now.getTime().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SN-${y}${m}${d}-${t}-${r}`;
}

async function getOrCreateWalkInPublicPartyId(
  tx: typeof prisma,
  ctx?: UseCaseContext
): Promise<string> {
  // Prefer upsert to avoid race conditions.
  const row = await tx.party.upsert({
    where: { systemKey: WALK_IN_PUBLIC_SYSTEM_KEY },
    update: {},
    create: { systemKey: WALK_IN_PUBLIC_SYSTEM_KEY, name: "Público" },
    select: { id: true },
  });

  log(ctx, `walk_in_party_resolved id=${row.id}`);
  return row.id;
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

export async function createSalesNoteUseCase(
  values: SalesNoteFormValues,
  ctx?: UseCaseContext
) {
  log(ctx, "start", {
    customerMode: values.customer.mode,
    partyMode: (values.customer as any).partyMode,
    lines: values.lines?.length ?? 0,
    unregisteredLines: values.unregisteredLines?.length ?? 0,
  });

  return prisma.$transaction(async (tx) => {
    log(ctx, "tx_begin");

    // 1) Resolve partyId
    let partyId: string;

    if (values.customer.mode === "PUBLIC") {
      partyId = await getOrCreateWalkInPublicPartyId(tx, ctx);
    } else {
      if (values.customer.partyMode === "EXISTING") {
        const id = safeTrim(values.customer.existingPartyId);
        if (!id) throw new Error("Missing existingPartyId for PARTY/EXISTING.");

        // Verify party exists and isn't soft-deleted
        const party = await tx.party.findFirst({
          where: { id, isDeleted: false },
          select: { id: true },
        });
        if (!party)
          throw new Error("Selected customer does not exist or is deleted.");

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

    const unregisteredLines = (values.unregisteredLines ?? []).map((l, idx) => {
      const qty = toDecimal(l.quantity);
      const unitPrice = toDecimal(l.unitPrice);
      const lineTotal = qty.mul(unitPrice);

      return {
        _idx: idx,
        productVariantId: null,
        descriptionSnapshot: buildDescriptionSnapshot(l.name, l.description),
        quantity: qty,
        unitPrice,
        lineTotal,
      };
    });

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

    // 4) Create SalesNote with retry on folio collision
    let salesNoteId: string | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const folio = generateFolio();
      log(
        ctx,
        `salesNote_create_attempt attempt=${attempt + 1} folio=${folio}`
      );

      try {
        const created = await tx.salesNote.create({
          data: {
            folio,
            partyId,
            status: "DRAFT",
            subtotal,
            discountTotal,
            total,
          },
          select: { id: true, folio: true },
        });

        salesNoteId = created.id;
        log(ctx, `salesNote_created id=${created.id} folio=${created.folio}`);
        break;
      } catch (err: unknown) {
        if (isUniqueConstraintError(err)) {
          log(ctx, "folio_collision_retry");
          continue;
        }
        log(ctx, "salesNote_create_failed", err);
        throw err;
      }
    }

    if (!salesNoteId)
      throw new Error("Could not generate a unique folio after retries.");

    // 5) Create lines
    if (allLines.length > 0) {
      log(ctx, "lines_createMany_start");
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

    // 6) Optional: verify what was written (super useful for debugging)
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
