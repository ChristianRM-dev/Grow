import { makePrefixedParamName } from "@/modules/shared/tables/prefixedTableQuery";
import type { ParsedTableQuery } from "@/modules/shared/tables/parseTableSearchParams";

export const PARTY_PURCHASES_QUERY_PREFIX = "partyPurchases" as const;

export const PARTY_PURCHASES_QUERY_KEYS = {
  page: makePrefixedParamName(PARTY_PURCHASES_QUERY_PREFIX, "page"),
  pageSize: makePrefixedParamName(PARTY_PURCHASES_QUERY_PREFIX, "pageSize"),
  sortField: makePrefixedParamName(
    PARTY_PURCHASES_QUERY_PREFIX,
    "sortField",
  ),
  sortOrder: makePrefixedParamName(
    PARTY_PURCHASES_QUERY_PREFIX,
    "sortOrder",
  ),
  search: makePrefixedParamName(PARTY_PURCHASES_QUERY_PREFIX, "search"),
  paymentStatus: makePrefixedParamName(
    PARTY_PURCHASES_QUERY_PREFIX,
    "paymentStatus",
  ),
  from: makePrefixedParamName(PARTY_PURCHASES_QUERY_PREFIX, "from"),
  to: makePrefixedParamName(PARTY_PURCHASES_QUERY_PREFIX, "to"),
} as const;

export type PartyPurchasePaymentStatusFilter = "all" | "paid" | "pending";

export type PartyPurchasesQuery = ParsedTableQuery & {
  paymentStatus: PartyPurchasePaymentStatusFilter;
  from: string;
  to: string;
};

export type PartyPurchaseRowDto = {
  id: string;
  supplierFolio: string;
  occurredAt: string; // ISO
  paymentStatus: "PAID" | "PENDING";
  total: string;
  paidTotal: string;
  remainingTotal: string;
  isFullyPaid: boolean;
};

export type PartyPurchasesTableResult = {
  data: PartyPurchaseRowDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  query: PartyPurchasesQuery;
};
