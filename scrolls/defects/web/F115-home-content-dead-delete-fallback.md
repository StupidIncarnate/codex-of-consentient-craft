# F115: `home-content-widget` keeps a dead `Failed to delete quest` fallback

| | |
|---|---|
| Status | ready |
| Package | web |
| Found | T05 web fix |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

`packages/web/src/widgets/home-content/home-content-widget.tsx:246` keeps a `'Failed to delete quest'` fallback for an error with no message. `fetchJson` always builds a message, so no real path reaches it.

## What should happen

Drop the branch.

## Where to look

`packages/web/src/widgets/home-content/home-content-widget.tsx:246`.

## History

Found by the T05 web fix. Checked 2026-09-30: still there.
