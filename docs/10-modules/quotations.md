# Module – Quotations (Cotizaciones)

## Reality
- A Party sends a list of requested items.
- Los Laureles replies with a document showing the list + prices.

## Requirements
- Quotation has its own **folio sequence**, separate from Sales Notes.
- Quotation can be converted into a Sales Note **without retyping**:
  - Copy items
  - Allow edits during conversion (prices/qty)
- A Sales Note remains editable after conversion.

## Party relationship
- Quotations reference a **Party** (not Customer).
- “PÚBLICO” is not typically used for quotations.

## Use cases (CQRS-light)
### Commands
- CreateQuotation (generates folio via FolioSequence)
- UpdateQuotation
- ConvertQuotationToSalesNote

### Queries
- GetQuotationById
- SearchQuotations
