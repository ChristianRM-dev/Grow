# Business Rule – Folios

## Separate sequences
- Sales Notes have their own sequence.
- Quotations have their own sequence.
- Supplier purchases **do not** generate internal folios (supplier provides their own reference).

## Sales Note format (mandatory)
- `YYYY-MM-NN`
  - `YYYY` year
  - `MM` month (Business Time Zone: Mexico City)
  - `NN` sequential number within the month starting at `01`

Examples:
- January 2026: `2026-01-01`, `2026-01-02`, ...
- February 2026: `2026-02-01`, `2026-02-02`, ...

## Quotation format (proposed)
Use the same pattern but with a different sequence type:
- `YYYY-MM-NN` (Quotation sequence)
or, if you want a prefix:
- `CO-YYYY-MM-NN`

> Decide one format and keep it stable.

## Cancellation
- If a note/quotation is cancelled, keep the folio (do not reuse).
- Status changes are tracked.
