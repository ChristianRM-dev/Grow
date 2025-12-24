# Module – Reports

## Required reports (MVP)

### Weekly sales report (by date range)
Columns:
- Sales Note folio
- Date (business date)
- Party name
- Line items: quantity, product name/variant, unit price, line total
- Note total

### Monthly report (by date range)
Same as weekly, but monthly filters.

### Annual “by species/variant”
- Total quantities sold per product variant within a year.

### By payment type
- Totals grouped by: Cash, Transfer, Credit, Al cambio

### Party statement report (recommended MVP+)
For a given Party:
- **Nos debe** (Receivable)
- **Le debemos** (Payable)
- **Neto**
Plus movement history (sales, purchases, payments, adjustments) if needed.

## Export
- Excel export is a priority (PDF optional).
- Reports should be based on **queries that project to DTOs** (fast, low memory).
