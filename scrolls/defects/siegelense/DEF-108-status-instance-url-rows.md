# DEF-108: `status --instance` shows no URL or API row

| | |
|---|---|
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-044 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

The user ran `dungeonmaster siegelense start --spec stack` (`inst_310d0c41a4924c8fb6b77a9ad4d91112`) and opened the `API:` URL: it "doesn't go anywhere". After `start`, the URLs cannot be found again: `status --instance` shows no URL or API row. Checked 2026-09-30: `status-answer-render-transformer.ts` has no URL or API row.

## What should happen

`status --instance` shows both the web URL and the API URL.

## Where to look

- `packages/siegelense/src/transformers/status-answer-render/status-answer-render-transformer.ts`
- `packages/siegelense/src/contracts/instance-status/instance-status-contract.ts`
- `packages/siegelense/src/brokers/status/read/instance-entry-layer-broker.ts`

## History

The port bug itself was fixed. Cause confirmed 2026-09-28 from `/proc/<pid>/environ`: the web process got `DUNGEONMASTER_WEB_PORT=36611`, the API process got only `DUNGEONMASTER_PORT` and `DUNGEONMASTER_HOME`, so the root redirect pointed at API port + 1 (46312, where nothing listens; API port 46311). Config half `0f37b2f39` (merge `1428407a8`); server half `7eca77498`, merge `54cda289a`: `server-init-responder.ts` reads `DUNGEONMASTER_WEB_PORT` and falls back to port + 1. Ward run `1790719370659-8a8a`.
