# Flow – Slow internet / offline / power interruption

## Risks
- In-progress Sales Note could be lost
- Operators revert to Excel if the system feels fragile

## Strategy (MVP)
- Client autosaves Sales Note drafts locally (IndexedDB/localStorage)
- Server receives draft snapshots when online (optional)
- Recovery UI: “Restore draft?” on next load

## Requirements
- Draft autosave must be lightweight (small payloads)
- Avoid long blocking requests
- Show clear “Saved” state
