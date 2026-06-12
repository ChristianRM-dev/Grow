"use client";

import React, { useMemo } from "react";

import { routes } from "@/lib/routes";
import { PARTY_SALES_NOTES_QUERY_KEYS } from "@/modules/parties/queries/getPartySalesNotesTable.query";
import type { PartyLedgerQuery } from "@/modules/parties/queries/getPartyDetailsWithLedger.query";
import type { PartySalesNotesQuery } from "@/modules/parties/queries/getPartySalesNotesTable.query";

import { DocumentArrowDownIcon } from "@heroicons/react/16/solid";

function setIfPresent(params: URLSearchParams, key: string, value?: string) {
  const trimmed = String(value ?? "").trim();
  if (trimmed) params.set(key, trimmed);
}

export function PartyPdfExportButton({
  partyId,
  ledgerOpen,
  salesNotesOpen,
  ledgerQuery,
  salesNotesQuery,
}: {
  partyId: string;
  ledgerOpen: boolean;
  salesNotesOpen: boolean;
  ledgerQuery: PartyLedgerQuery;
  salesNotesQuery: PartySalesNotesQuery;
}) {
  const href = useMemo(() => {
    const params = new URLSearchParams();

    params.set("showLedger", ledgerOpen ? "1" : "0");
    params.set("showSalesNotes", salesNotesOpen ? "1" : "0");

    if (ledgerOpen) {
      setIfPresent(params, "search", ledgerQuery.search);
      setIfPresent(params, "sortField", ledgerQuery.sortField);
      setIfPresent(params, "sortOrder", ledgerQuery.sortOrder);
    }

    if (salesNotesOpen) {
      setIfPresent(
        params,
        PARTY_SALES_NOTES_QUERY_KEYS.search,
        salesNotesQuery.search,
      );
      setIfPresent(
        params,
        PARTY_SALES_NOTES_QUERY_KEYS.sortField,
        salesNotesQuery.sortField,
      );
      setIfPresent(
        params,
        PARTY_SALES_NOTES_QUERY_KEYS.sortOrder,
        salesNotesQuery.sortOrder,
      );
      setIfPresent(
        params,
        PARTY_SALES_NOTES_QUERY_KEYS.paymentStatus,
        salesNotesQuery.paymentStatus === "all"
          ? undefined
          : salesNotesQuery.paymentStatus,
      );
      setIfPresent(params, PARTY_SALES_NOTES_QUERY_KEYS.from, salesNotesQuery.from);
      setIfPresent(params, PARTY_SALES_NOTES_QUERY_KEYS.to, salesNotesQuery.to);
    }

    return routes.parties.pdf(partyId, params.toString());
  }, [
    ledgerOpen,
    ledgerQuery.search,
    ledgerQuery.sortField,
    ledgerQuery.sortOrder,
    partyId,
    salesNotesOpen,
    salesNotesQuery.from,
    salesNotesQuery.paymentStatus,
    salesNotesQuery.search,
    salesNotesQuery.sortField,
    salesNotesQuery.sortOrder,
    salesNotesQuery.to,
  ]);

  return (
    <a
      className="btn btn-info btn-sm"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <DocumentArrowDownIcon className="h-5 w-5" />
      Exportar PDF
    </a>
  );
}
