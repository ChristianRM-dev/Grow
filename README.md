# Grow

Grow es una plataforma de gestión para vivero construida para Los Laureles. El repositorio está organizado como un monolito modular sobre Next.js App Router y Prisma, con foco en flujos operativos como ventas, cotizaciones, compras, pagos, ledger y auditoría.

## Stack

- Next.js 16 + React 19 + TypeScript
- Prisma + PostgreSQL
- Zod + React Hook Form
- NextAuth
- Tailwind CSS 4 + DaisyUI
- Serwist para PWA/offline
- React PDF para documentos imprimibles
- Vitest + Testing Library para pruebas automatizadas

## Módulos Principales

- `sales-notes`: notas de venta, pagos, ledger y auditoría
- `quotations`: cotizaciones y prefill hacia ventas
- `supplier-purchases`: compras a proveedor y cuentas por pagar
- `products`: catálogo de variantes y precios
- `parties`: identidad compartida para clientes y proveedores
- `reports`: reportes operativos y exportables

## Estructura Del Repo

```text
src/app/        App Router pages, layouts, routes y server components
src/components/ UI compartida y bloques reutilizables de formularios
src/modules/    Módulos de negocio con actions, queries, use cases y forms
src/lib/        Helpers de infraestructura y utilidades comunes
prisma/         Schema, migraciones y seed de Prisma
docs/           Documentación de producto y de ingeniería
```

## Desarrollo

```bash
pnpm install
pnpm dev
```

Comandos útiles:

- `pnpm dev:turbo` para levantar el servidor con Turbopack
- `pnpm dev:pwa` para validar comportamiento PWA localmente
- `NEXT_WEBPACK_POLL=true pnpm dev` si trabajas sobre Docker o un filesystem montado que necesite polling

## Calidad

```bash
pnpm lint
pnpm test
pnpm test:coverage
```

## Base De Datos

```bash
pnpm db:generate
pnpm db:migrate:dev
pnpm db:seed
pnpm studio
```

## Observabilidad

- `warn` y `error` se emiten por defecto.
- Los logs verbosos son opt-in con `DEBUG_OBSERVABILITY=true` o `NEXT_PUBLIC_DEBUG_OBSERVABILITY=true`.
- El flag histórico `NEXT_PUBLIC_DEBUG_SALES_FLOW=true` sigue habilitando trazas detalladas del flujo de ventas.

## Documentación

- Índice documental: [docs/README.md](docs/README.md)
- Arquitectura vigente: [docs/98-architecture.md](docs/98-architecture.md)
