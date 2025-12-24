# Module – Products / Plant Catalog

## Reality
- ~50 species, but variations create up to ~200 sellable combinations.
- Operators must add items quickly during a sale.

## Modeling
- Species (base)
- ProductVariant (sellable): species + bag size + color + presentation/quality + default price

## Rules
- Default price exists, but **sales price is editable per note line**.
- Availability is often checked visually; inventory tracking can be “light” at first.

## Use cases
### Commands
- CreateProductVariantQuick (minimal fields)
- UpdateProductVariant (admin)

### Queries
- SearchProductVariants
- GetProductVariantById
