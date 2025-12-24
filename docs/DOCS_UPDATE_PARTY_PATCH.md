# Docs update – Party + statement model (2025-12-22)

This patch updates the documentation to adopt:
- **Party** as the shared identity (customer/supplier roles)
- Unified **statement** (Nos debe / Le debemos / Neto) with automatic netting
- Sales Note folio format: **YYYY-MM-NN** using Business Time Zone (Mexico City)
- Supplier purchases: no internal folio; store supplier-provided `SupplierFolio`
- Updated conceptual data model and AI rules

Updated files:
- docs/03-glossary.md
- docs/10-modules/customers.md (now describes Parties)
- docs/10-modules/suppliers.md
- docs/10-modules/accounts-receivable.md
- docs/10-modules/sales-notes.md
- docs/10-modules/quotations.md
- docs/10-modules/reports.md
- docs/30-business-rules/folios.md
- docs/50-data/conceptual-data-model.md
- docs/98-architecture.md
- docs/97-ai-codegen-rules.md
- docs/60-roadmap/mvp-scope.md
