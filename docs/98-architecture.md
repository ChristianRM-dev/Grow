# 98 – Architecture (CQRS-Light + Pragmatic DDD)

## Goal
Build a nursery-management platform that is:
- Fast to operate (single-screen sales entry)
- Reliable under slow/unreliable connections
- Maintainable without overengineering
- AI-friendly: predictable patterns for code generation

We use a **modular monolith** with **Clean Architecture Lite** + **CQRS-light** + **pragmatic DDD**.

## Layers
**Web (MVC)** → **Application (Use Cases)** → **Domain (Rules)**  
**Infrastructure** implements persistence/external integrations.

### Web
- Controllers + Razor Views
- Thin orchestration only (no business logic)

### Application
- Commands/Queries + Handlers + Validators
- DTOs and mapping
- Transaction boundaries

### Domain
- Aggregates/entities + invariants
- Value Objects (Money, Folio, DateRange)
- No EF Core dependencies

### Infrastructure
- EF Core DbContext + migrations
- Repository implementations (if needed)
- Export services (PDF/Excel), etc.

## CQRS-light definition
- Writes: Commands
- Reads: Queries with DTO projections
- No separate read database, no event sourcing, no projections pipeline.

## Pragmatic DDD aggregates (current)
- SalesNote (core)
- Quotation
- Party (shared identity for customers/suppliers)
- SupplierPurchase (payables-side document, supplier folio reference)
- ProductVariant

> **Note:** “Customer” and “Supplier” are roles of Party, not separate identities.
