# DEF-265: `get-architecture` layer diagram lists raw packages the same page says nothing may import

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | shared |
| Found | 2026-09-30, read-only check of `scrolls/gateway/followup-sustainability.md` after the gateway pivot merged (788165421) |
| Moved from | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" and "Work carried over from the gateway build", 2026-09-30. That doc is deleted; git history holds it |

## What is wrong

`get-architecture` says: "Every folder type imports outside things through it, types included, and nothing imports a raw package." Its layer diagram, a few lines away, still lists raw packages as allowed imports:

- "contracts/     # Can import: statics, errors, contracts, zod, @dungeonmaster/shared/@types, @dungeonmaster/orchestrator"
- the widgets line lists `@mantine/core`; the flows line lists `hono` and `express`; others list `react` and `react-router-dom`

An agent reading the diagram imports `zod` directly and gets a lint error.

## What should happen

The diagram names `#gateway/npm/<subpath>` (or just "outside packages through `#gateway`") wherever it lists a raw package. Check `folderConfigStatics` `allowedImports`: if the diagram is generated from it, fix the statics, not the text.

## Where to look

- `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts` (the `get-architecture` text)
- `packages/shared/src/statics/folder-config/folder-config-statics.ts`

## History

The gateway follow-up doc asked for this change ("layer diagram and import rules"). The Z02 rewrite (2026-09-30) fixed the prose but not the diagram lines.
