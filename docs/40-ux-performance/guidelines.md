# UX & Performance Guidelines (Slow Connectivity)

## Primary UX principles
- Single primary screen for Sales Note entry
- Minimal required fields
- Inline search + inline creation (customer/product)
- Avoid multi-step wizards

## Performance guidelines
- Prefer small JSON endpoints for autosave and typeahead search
- Paginate lists by default
- Queries should project to DTOs
- Cache lookup tables (payment types, etc.)

## Drafts/autosave
- Draft locally every N seconds or on change
- Restore draft on next visit
- Do not block the UI during autosave
