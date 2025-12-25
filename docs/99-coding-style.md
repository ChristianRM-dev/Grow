This guide adapts the original principles to the **Next.js App Router** ecosystem, maintaining the focus on **Clean Architecture Lite** and **Feature-First** organization.

1) Naming Conventions
---------------------

*   **Files & Folders**:
    
    *   Folders: kebab-case (e.g., sales-management).
        
    *   React Components: PascalCase.tsx (e.g., SalesButton.tsx).
        
    *   Logic Files: kebab-case.ts (e.g., create-sales-note.ts).
        
*   **Types & Interfaces**: PascalCase.
    
*   **Functions & Variables**: camelCase.
    
*   **Commands (Actions)**: VerbNounAction (e.g., CreateSalesNoteAction).
    
*   **Queries**: getXxxQuery or searchXxxQuery.
    
*   **Data Shapes**: XxxDto or XxxSchema.
    

2) Foldering (Feature-First)
----------------------------

Logic is grouped by domain module rather than technical role.src/modules//(actions|queries|domain|components)/...

Example:

*   src/modules/sales/actions/create-sales-note.ts (Command)
    
*   src/modules/sales/queries/get-sales-summary.ts (Query)
    
*   src/modules/sales/domain/sales-logic.ts (Business Rules)
    

3) Boundary Rules (Server/Client)
---------------------------------

*   **Thin Server Actions**:
    
    *   Perform session/auth checks.
        
    *   Parse input using **Zod**.
        
    *   Call the Application/Domain logic.
        
    *   Return a plain serializable result (no ORM classes).
        
*   **Thin Page Components**:
    
    *   page.tsx should only fetch data (Queries) and pass it to feature components.
        
*   **No Direct DB in UI**: Never import the Prisma/ORM client inside a page.tsx or a Client Component.
    

4) Validation
-------------

*   **Input Validation**: Handled by **Zod schemas** within the Action or a shared schema file. This catches "garbage data" before it touches the business logic.
    
*   **Domain Invariants**: Handled inside the Domain layer (e.g., "A Sale cannot have zero items"). These are pure TypeScript functions or methods.
    

5) Data Access
--------------

*   **Queries (Read)**:
    
    *   Must use .select() to return only required fields.
        
    *   Map to **DTOs** to avoid leaking sensitive or unnecessary database metadata to the client.
        
*   **Commands (Write)**:
    
    *   Load the required Aggregate Root from the DB.
        
    *   Apply modifications via Domain methods.
        
    *   Save changes using the ORM in the Infrastructure/Action layer.
        

6) Testing
----------

*   **Domain Unit Tests**: Test business logic in isolation (no DB, no Next.js APIs). Focus on edge cases for sales, discounts, and stock rules.
    
*   **Integration Tests**: Test the Server Actions and Queries against a test database to ensure the "Handler" behavior and DB constraints work together.
    
*   **Naming**: Use the pattern describe('Feature', () => { it('should \[Outcome\] when \[Condition\]') }).
    

7) Technical Constraint: React Server Components (RSC)
------------------------------------------------------

*   Favor **Async Server Components** for data fetching.
    
*   Use useTransition and useOptimistic in Client Components to handle the "Slow Internet" business reality for Los Laureles.
    
*   Keep use client components at the leaves of the component tree to maximize SEO and performance.