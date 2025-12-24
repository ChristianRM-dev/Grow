# Module – Accounts Receivable (Credit / Collections)

Accounts Receivable is not a standalone identity module; it is part of a Party’s **Estado de cuenta**.

## Reality
Some sales are on **credit**. Operators need:
- Who owes (Party)
- How much (Receivable balance)
- Since when
- Ability to record partial payments

## Requirements
- Sales Notes create receivable balance for a Party when not fully paid.
- Support:
  - Partial payments
  - Payment history
  - Remaining balance
- The Party statement always shows:
  - **Nos debe** (Receivable)
  - **Le debemos** (Payable)
  - **Neto** (Receivable - Payable)

## Notes (from Paty)
- Netting with Payables happens “naturally” (always).
- No requirement to match payments/offsets to a specific note.

## Use cases (CQRS-light)
### Commands
- RecordReceivablePayment (payment received from Party)
- MarkSalesNoteAsCredit *(optional; can be derived by “unpaid balance”)*

### Queries
- GetOpenReceivables (Parties with Receivable > 0)
- GetPartyReceivableSummary
- GetPartyStatementSummary (includes Receivable + Payable + Net)
