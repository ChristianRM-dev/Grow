import { getPartyDetailsWithLedgerQuery } from "@/modules/parties/queries/getPartyDetailsWithLedger.query";
import { PartyDetailsClient } from "./party-details-client";

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
  if (!result) {
    return (
      <div className="p-4">
        <div className="alert alert-error">
          <span>No se encontró el cliente.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PartyDetailsClient
        party={result.party}
        summary={result.summary}
        ledger={result.ledger}
      />
    </div>
  );
}
