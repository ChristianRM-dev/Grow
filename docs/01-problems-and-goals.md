# 01 – Problems & Goals (Why the first attempt failed)

## What went wrong (previous system)
- The workflow required **too many steps** during a sale.
- Registering a **new customer** or a **new plant/product** was “too hard”:
  - Multiple forms
  - Too much required information
- Slow internet amplified the pain: the system felt **slower than Excel**.
- Result: the system was essentially **never adopted**.

## What must be different
### Non-negotiable UX outcomes
- A **single primary screen** to create a Sales Note (Nota de Venta).
- Create customer “just-in-time” with **only name required**.
- Add a plant/product “just-in-time” from the sales screen (no navigation to a separate heavy form).
- Every Sales Note remains **editable** after creation (to handle shipment changes and real-world adjustments).

### Non-negotiable business outcomes
- Weekly / monthly reports by date range.
- Support real payment types:
  - Cash
  - Transfer
  - Credit
  - **Al cambio** (barter: plant-for-plant)
- Supplier module supports:
  - Debts
  - Discounts (e.g., -10%)
  - Supplier can also be a customer (netting/offset logic)

## Measurable goals (MVP targets)
- **Time to create a sales note**: < 2 minutes for typical wholesale order.
- **Clicks to add a new customer**: ≤ 2 (open quick-add, type name, save).
- **Resilience**: no loss of in-progress Sales Note even if the browser closes / internet drops.
