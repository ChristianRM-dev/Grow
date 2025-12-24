# 03 – Glossary

- **Sales Note (Nota de Venta)**: The core document that records what was sold, to whom, at what price, and how it was paid. Sales notes have a **system-generated, non-editable folio**.
- **Quotation (Cotización)**: A pre-sale document. Can be converted into a Sales Note without retyping. Quotations have their **own folio sequence** (separate from Sales Notes).
- **Folio**: A unique identifier for Sales Notes and Quotations. Sequences are **separate** and **never reused**, even if a document is cancelled.
- **Business Time Zone (Zona horaria del negocio)**: The time zone used to interpret business dates (Mexico City). Used for folio period (YYYY-MM) and reporting.
- **Party (Tercero / Socio comercial)**: A real-world person/company/nursery that can act as a **customer**, a **supplier**, or **both**. Parties are the single shared identity used across sales, purchases, and statements.
- **Customer role (Cliente)**: A Party acting as a buyer. Sales Notes reference a Party.
- **Supplier role (Proveedor)**: A Party acting as a supplier. Purchases reference a Party and store the supplier’s own folio/reference.
- **Statement (Estado de cuenta)**: A single view per Party that shows both sections:
  - **Accounts Receivable (Nos debe / Por cobrar)**
  - **Accounts Payable (Le debemos / Por pagar)**
  and the **Net balance (Neto)**.
- **Net balance (Neto)**: Receivable minus Payable. Positive means the Party owes Los Laureles; negative means Los Laureles owes the Party.
- **Ledger (Historial de movimientos)**: A chronological list of movements (sales, purchases, payments, adjustments) used to explain the statement and balances.
- **Al cambio**: Payment/settlement method where the transaction is settled by exchanging plants (barter) rather than money.
- **Wholesale / Mayoreo**: Bulk sales (often for shipments).
- **Retail / Menudeo**: Walk-in public sales.
- **Product Variant**: A sellable variation of a plant (species + bag size + color + presentation/quality).
