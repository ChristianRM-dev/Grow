# Module – Suppliers (Supplier role of a Party)

In Grow, suppliers are not a separate identity. A **Supplier** is a **Party** with the supplier role.

## Problem solved
Track what is owed to suppliers and support the real-world rule:
- The same Party can **sell to us** (Purchases → Payables)
- And **buy from us** (Sales Notes → Receivables)
- Balances are **netted automatically** in the Party’s statement.

## Requirements
### Supplier master data
- Stored as a Party (name required; phone optional)

### Purchases from suppliers
- Record purchases as **Supplier Purchases** (Accounts Payable side)
- Purchases do **not** generate internal folios
  - The supplier provides their own folio/reference
  - We store it as `SupplierFolio` for traceability

### Payments / adjustments
- Record payments (cash/transfer) and adjustments (discounts, corrections)
- Discounts (e.g., -10%) are modeled as explicit adjustments

## Netting behavior (confirmed with Paty)
- Netting is not manual. It **always happens**.
- We do not need to link “purchase X offsets sales note Y”.
- The UI shows one statement: **Nos debe**, **Le debemos**, **Neto**, plus movement history.

## Use cases (CQRS-light)
### Commands
- MarkPartyAsSupplier (or SetPartyRoles)
- RecordSupplierPurchase (stores SupplierFolio + total + date)
- RecordPayablePayment (payment to supplier)
- ApplyPayableAdjustment (discounts, corrections)

### Queries
- SearchSuppliers (filters Parties with supplier role)
- GetSupplierPurchasesForParty
- GetPayablesStatementForParty (summary + history)
