# 97 – AI Code Generation Rules (Codex / Assistants)

## Non-negotiable
1. Do not invent new architecture; follow `98-architecture.md`.
2. Controllers must be thin; no business rules or EF in Web.
3. All writes are Commands; all reads are Queries.
4. Queries return DTOs (no EF entities).
5. Keep business rules in Domain methods.
6. **Use Party as the shared identity**. Do not create separate Customer/Supplier identities.
7. Sales Notes and Quotations reference **PartyId**.
8. Supplier purchases do **not** have internal folios; store supplier-provided `SupplierFolio`.

## Standard output for a feature
- Application: Command/Query + Handler (+ Validator)
- Domain: methods/invariants if needed
- Web: controller action + view wiring
- Tests: at least 1 Domain test + 1 Application test
- Docs updated if behavior changes
