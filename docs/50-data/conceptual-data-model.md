# 50 – Conceptual Data Model (MVP)

This is a **pragmatic relational model** for the MVP. It can be implemented in PostgreSQL or SQL Server.

## Core tables (suggested)

### Parties
Represents a real-world person/company/nursery that can be a customer, supplier, or both.

- `PartyId` (GUID)
- `Name` (required)
- `Phone` (optional)
- `Notes` (optional)
- `Roles` (flags or join table; e.g., Customer/Supplier)
- `CreatedAt`
- `UpdatedAt` (nullable)
- `IsDeleted` (bool)
- `DeletedAt` (nullable)

> **Public / Walk-in:** recommended as a fixed Party record named “PÚBLICO”.

### ProductVariants
- `ProductVariantId` (GUID)
- `SpeciesName` (required)
- `VariantName` (optional, e.g., "Bolsa 3L - Roja")
- `BagSize` (optional)
- `Color` (optional)
- `DefaultPrice` (Money)
- `IsActive`
- `CreatedAt`

### SalesNotes
- `SalesNoteId` (GUID)
- `Folio` (string, unique)  **system-generated, non-editable**
- `CreatedAt` (UTC)
- `PartyId` (FK, required; “PÚBLICO” for walk-ins)
- `Status` (Draft/Confirmed/Cancelled)
- `Subtotal`
- `DiscountTotal`
- `Total`

### SalesNoteLines
- `SalesNoteLineId` (GUID)
- `SalesNoteId` (FK)
- `ProductVariantId` (FK, nullable if quick-added then linked)
- `DescriptionSnapshot` (string; what the user saw/typed)
- `Quantity` (decimal)
- `UnitPrice` (Money)  **final/editable**
- `LineTotal`

### Payments
Store payments/settlements related to Sales Notes (incoming) and optionally supplier payments (outgoing).
If you prefer stricter separation, split into `IncomingPayments` and `OutgoingPayments`.

- `PaymentId` (GUID)
- `SalesNoteId` (FK, nullable if supplier payment)
- `PartyId` (FK, optional but recommended for statement history)
- `Direction` (In/Out) *(recommended)*
- `PaymentType` (Cash/Transfer/Credit/AlCambio)
- `Amount` (Money, nullable for barter if needed)
- `Reference` (string, optional; transfer ref)
- `Notes` (string, optional)
- `OccurredAt` (Business Time Zone; recommended)
- `CreatedAt` (UTC)

### SupplierPurchases
Purchases from suppliers (Accounts Payable side). No internal folio; store supplier’s reference.

- `SupplierPurchaseId` (GUID)
- `PartyId` (FK, required; supplier Party)
- `SupplierFolio` (string, required)
- `OccurredAt` (Business Time Zone; recommended)
- `Total` (Money)
- `Notes` (optional)
- `CreatedAt` (UTC)

### PartyLedgerEntries (recommended)
A unified movement history for the Party statement (Receivable/Payable + Net). This supports “all vs all” netting without linking note-to-note.

- `PartyLedgerEntryId` (GUID)
- `PartyId` (FK)
- `Side` (Receivable/Payable)
- `SourceType` (SalesNote/SupplierPurchase/Payment/Adjustment)
- `SourceId` (GUID, nullable for manual adjustments)
- `Reference` (string; e.g., sales note folio or supplier folio)
- `OccurredAt` (Business Time Zone)
- `Amount` (Money) *(use sign convention or Direction field)*
- `Notes` (optional)
- `CreatedAt` (UTC)

> You can either (A) persist ledger entries, or (B) compute a statement from SalesNotes/SupplierPurchases/Payments.  
> Persisting a ledger simplifies “Historial” and auditability.

### Quotations
- `QuotationId` (GUID)
- `Folio` (string, unique)  **system-generated**
- `PartyId` (FK, required)
- `CreatedAt` (UTC)
- `Status` (Draft/Sent/Converted/Cancelled)
- `Total` (optional snapshot)

### QuotationLines
- `QuotationLineId` (GUID)
- `QuotationId` (FK)
- `ProductVariantId` (nullable)
- `DescriptionSnapshot`
- `Quantity`
- `QuotedUnitPrice` (Money)

### FolioSequences
One row per period (year/month) and type.

- `FolioSequenceId` (GUID)
- `Type` (SalesNote/Quotation)
- `Year`
- `Month`
- `NextNumber`

## Notes
- Use `DescriptionSnapshot` fields to preserve what was sold/quoted even if the catalog changes later.
- Keep money as `decimal(18,2)` in DB.
- Indexes:
  - `SalesNotes(Folio)` **unique**
  - `Quotations(Folio)` **unique**
  - `FolioSequences(Type, Year, Month)` **unique**
  - `Parties(Name)` for search
  - `ProductVariants(SpeciesName, VariantName)` for search
  - `SupplierPurchases(PartyId, SupplierFolio)` *(unique optional, depends on supplier behavior)*
