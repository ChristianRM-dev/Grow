import { makePrefixedParamName } from "@/modules/shared/tables/prefixedTableQuery";

export const PARTY_SALES_NOTES_QUERY_PREFIX = "salesNotes" as const;

export const PARTY_SALES_NOTES_QUERY_KEYS = {
  page: makePrefixedParamName(PARTY_SALES_NOTES_QUERY_PREFIX, "page"),
  pageSize: makePrefixedParamName(PARTY_SALES_NOTES_QUERY_PREFIX, "pageSize"),
  sortField: makePrefixedParamName(
    PARTY_SALES_NOTES_QUERY_PREFIX,
    "sortField",
  ),
  sortOrder: makePrefixedParamName(
    PARTY_SALES_NOTES_QUERY_PREFIX,
    "sortOrder",
  ),
  search: makePrefixedParamName(PARTY_SALES_NOTES_QUERY_PREFIX, "search"),
  paymentStatus: makePrefixedParamName(
    PARTY_SALES_NOTES_QUERY_PREFIX,
    "paymentStatus",
  ),
  from: makePrefixedParamName(PARTY_SALES_NOTES_QUERY_PREFIX, "from"),
  to: makePrefixedParamName(PARTY_SALES_NOTES_QUERY_PREFIX, "to"),
} as const;

export type PartySalesNotePaymentStatus = "all" | "paid" | "pending";
