# Module – Parties (Terceros / Socios comerciales)

In Grow, a **Party** is the single shared identity for a real-world person/company/nursery. A Party can act as:
- **Customer** (buyer)
- **Supplier** (seller)
- **Both**

This enables one unified **Estado de cuenta** per Party:
- **Nos debe** (Accounts Receivable)
- **Le debemos** (Accounts Payable)
- **Neto**

## Problem solved
Operators must register and search counterparties **without friction**, while supporting:
- Sales to a Party (customer role)
- Purchases from a Party (supplier role)
- A single statement view that automatically nets balances

## Rules
- Minimal required field: **Name**
- Optional fields: phone, notes
- Roles:
  - Customer
  - Supplier
  - Both
- “Public / Walk-in” sales use a special Party (recommended: a fixed Party named **“PÚBLICO”**).

## UX
- Search box with quick results
- Quick-add modal/panel: Name only + Save
- Party Details page with tabs (future-proof):
  - **Ventas** (Sales Notes)
  - **Compras** (Supplier Purchases)
  - **Historial** (Ledger / movements)
- Summary header (future-proof):
  - **Nos debe**
  - **Le debemos**
  - **Neto**

## Accounting model (confirmed with Paty)
- Netting happens **always** and **automatically**.
- We do **not** “pay note vs note”. It is **all sales vs all purchases** for the Party.
- We do not need to store explicit “offset per document”; we only need movement history to explain balances.

## Use cases (CQRS-light)
### Commands
- CreatePartyQuick
- UpdateParty
- SetPartyRoles (Customer/Supplier/Both) *(optional MVP)*
- RestoreParty / DeleteParty *(if using soft delete)*

### Queries
- SearchParties
- GetPartyDetails (includes statement summary later)
- GetPartyForEdit
- GetPartiesList
