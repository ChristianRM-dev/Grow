# Module – Sales Notes (Notas de Venta) [CORE]

## Why this is the core
Everything connects to the Sales Note:
- Reporting
- Collections (credit / receivables)
- Payments
- Party statement (netting with supplier purchases)
- Quotation conversion

## Folio (mandatory)
- Folio is **system generated**, **unique**, and **non-editable**.
- Format: `YYYY-MM-NN`
  - `YYYY` year, `MM` month, `NN` sequential number within the month (01, 02, 03, …)
- The month is based on the **Business Time Zone** (Mexico City).
- Cancelled notes keep the folio (never reused).

## UX principle
**One primary screen** to create/edit a Sales Note. No forced navigation to separate heavy forms.

## Required capabilities
### Create Sales Note (fast path)
- Party selection:
  - Search existing Party
  - Quick-add Party with **name only**
  - Option: “Público / Mostrador” (recommended: fixed Party named “PÚBLICO”)
- Add line items:
  - Search product variant
  - Quick-add product/variant if not found (minimal fields)
- Price editing:
  - Price is **editable per line item** at time of sale
- Totals:
  - Subtotal, discount (if applicable), total

### Editable after creation
- Notes must remain **editable** to reflect real-world changes (shipments, breakage, substitutions, etc.)

## Payment types
Supported payment methods (each note can have one or multiple payments):
- Cash
- Transfer
- Credit (unpaid balance becomes receivable)
- Al cambio (barter: plant-for-plant; stored as a settlement record)

## Data captured (MVP)
- Folio (system generated)
- Date/time (business date in Mexico City)
- Party (name required if not “PÚBLICO”)
- Items: quantity, product variant, unit price, line total
- Payments: type, amount (or barter details), reference (optional)
- Status: Draft / Confirmed / Cancelled (optional MVP)

## Accounting impact (statement)
- Each Sales Note contributes to the Party’s **Receivable** balance if not fully paid.
- Payments reduce Receivable.
- Statement nets Receivable vs Payable automatically.

## Key use cases (CQRS-light)
### Commands
- CreateSalesNote (generates folio via FolioSequence)
- AddSalesNoteLineItem
- UpdateSalesNoteLineItemPrice
- RemoveSalesNoteLineItem
- RecordPayment (incoming payments / settlements)
- CancelSalesNote (optional MVP)

### Queries
- GetSalesNoteById
- GetSalesNoteForEdit
- SearchSalesNotes (filters by date range/party/status)
