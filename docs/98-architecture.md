# 98 – Architecture

## Goal

Grow es un monolito modular orientado a operación diaria. La arquitectura busca equilibrar tres cosas:

- captura rápida de documentos de negocio
- consistencia fuerte en dinero, ledger y auditoría
- mantenibilidad sin sobre-arquitectura

## Runtime Stack

- **Framework:** Next.js 16 App Router
- **UI:** React 19 con server y client components
- **Persistencia:** Prisma + PostgreSQL
- **Validación:** Zod
- **Formularios:** React Hook Form
- **Autenticación:** NextAuth
- **Documentos:** React PDF
- **Offline/PWA:** Serwist

Este repositorio **no** usa MVC, Razor Views ni EF Core.

## Forma Del Sistema

Usamos un **modular monolith** con módulos de negocio en `src/modules`.

Cada módulo agrupa su propia lógica de:

- server actions
- application use cases
- queries
- schemas y formularios
- componentes de UI
- exportación/PDF cuando aplica

Los elementos compartidos viven en:

- `src/components` para UI reutilizable
- `src/lib` para infraestructura común
- `src/modules/shared` para comportamiento transversal cercano al dominio

## Flujo General

La ruta típica es:

**App Router / Components / Server Actions** → **Application Use Cases & Queries** → **Prisma / servicios auxiliares**

## Capas Prácticas

### Web Layer

Implementada en `src/app` y componentes asociados.

Responsabilidades:

- resolver params y navegación
- cargar DTOs vía queries
- invocar server actions para mutaciones
- renderizar páginas, layouts y formularios

Aquí conviven:

- server components para composición y carga de datos
- client components para interacción rica
- route handlers y páginas App Router

### Application Layer

Implementada principalmente en `src/modules/*/application`.

Responsabilidades:

- orquestar workflows de negocio
- definir límites transaccionales
- coordinar ledger, auditoría, folios y otros colaboradores
- mantener el write-side testeable

Ejemplos actuales:

- `createSalesNoteUseCase`
- `updateSalesNoteUseCase`
- `createQuotationUseCase`
- `updateQuotationUseCase`

### Read Side

Implementada principalmente en `src/modules/*/queries`.

Responsabilidades:

- construir DTOs para pantallas y PDFs
- separar consultas de la lógica de escritura
- optimizar lectura sin mezclar reglas transaccionales

Esto sigue un estilo **CQRS-light**:

- escrituras a través de actions/use cases
- lecturas a través de queries y DTOs
- sin read model separado ni event sourcing

### Persistence Layer

La persistencia se hace directamente con Prisma:

- schema y migraciones en `prisma/`
- cliente central en `@/lib/prisma`
- transacciones con `prisma.$transaction(...)`

No estamos imponiendo una capa genérica de repositories/DI para todo. Cuando un caso de uso crece demasiado, preferimos extraer helpers o servicios pequeños antes de introducir abstracciones globales.

## Validación Y Formularios

El patrón actual es:

- Zod define contratos de entrada/salida
- React Hook Form maneja estado local de formularios
- server actions validan otra vez antes de entrar al write-side
- los documentos reutilizan un `DocumentWizard` y pasos compartidos

En ventas y cotizaciones, la captura de:

- cliente/contacto
- líneas registradas
- líneas no registradas
- resumen

se resuelve con componentes y helpers compartidos para reducir divergencia.

## Agregados / Conceptos Principales

- **SalesNote:** documento de venta, pagos, ledger y auditoría
- **Quotation:** documento previo a venta
- **Party:** identidad compartida para cliente/proveedor
- **SupplierPurchase:** documento de compra y cuentas por pagar
- **ProductVariant:** ítem catalogado

Regla de modelado importante:

> “Customer” y “Supplier” son roles de `Party`, no identidades separadas.

## Observabilidad

La observabilidad es deliberadamente ligera:

- `warn` y `error` permanecen visibles
- las trazas detalladas son opt-in mediante variables de entorno
- se prefieren loggers compartidos o scoped loggers en vez de `console.log` ad-hoc
- los payloads se resumen para evitar dumps completos de datos operativos

## Decisiones Intencionales

Lo que sí optimizamos:

- orquestación explícita en el write-side
- queries separadas para lectura
- acceso directo a Prisma cuando mantiene el código claro
- helpers compartidos para flujos críticos repetidos
- cobertura automatizada sobre áreas de más riesgo

Lo que no estamos haciendo hoy:

- microservicios
- event sourcing
- read database separado
- repositories genéricos en todos los módulos
- pureza framework-agnostic a cualquier costo
