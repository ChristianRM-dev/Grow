import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPartyDetailsWithLedgerQuery } from "@/modules/parties/queries/getPartyDetailsWithLedger.query";
import { PartyDetailsClient } from "./party-details-client";

import { DetailsPageLayout } from "@/components/ui/DetailsPageLayout/DetailsPageLayout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs/Breadcrumbs";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PartyDetailsPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const result = await getPartyDetailsWithLedgerQuery({
    partyId: id,
    searchParams: sp,
  });

  if (!result) return notFound();

  const phone = result.party.phone?.trim();
  const subtitle = phone ? (
    <>
      Teléfono: <b>{phone}</b>
    </>
  ) : (
    <span className="opacity-70">Sin teléfono registrado</span>
  );

  return (
    <DetailsPageLayout
      backHref={routes.parties.list()}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Contactos", href: routes.parties.list() },
            { label: result.party.name },
          ]}
        />
      }
      title={result.party.name}
      subtitle={subtitle}
      headerActions={
        <Link href={routes.parties.edit(id)} className="btn btn-sm">
          Editar
        </Link>
      }
    >
      <PartyDetailsClient
        party={result.party}
        summary={result.summary}
        ledger={result.ledger}
      />
    </DetailsPageLayout>
  );
}
