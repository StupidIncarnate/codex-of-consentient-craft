# DEF-235: the node and browser gateway copies init writes have never had typecheck, tests or build run in a consumer

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: the consumer gateway copies are unproven; `check:consumer` may already cover them |
| Package | gateway |
| Found | 2026-09, `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history) item 41 |
| Moved from | `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history), 2026-09-30 |

## What is wrong

`init` copies dungeonmaster's node and browser gateway source (tests and proxies included) into a consumer's `packages/@gateway/{node,browser}`. A scratch-consumer run proved the files land and configs are written. Nobody has run the consumer's typecheck, tests or build against the copy.

Known blockers: `@dungeonmaster/testing` is not published, and the browser copy's tests need `jest-environment-jsdom` and `undici`, which `init` lists in the browser gateway's `devDependencies`. `npm run check:consumer` now claims to run typecheck, lint and the copied gateways' own tests; if it really does, this may be done. Confirm before working on it.

## What should happen

In a freshly `init`-ed consumer: `npm install`, typecheck, the gateway tests and `npm run build` all pass.

## Where to look

- `scripts/consumer-check/`
- `packages/cli/src/statics/gateway-source-copy/`

## History

It was blocked on publishing `@dungeonmaster/testing` (item 21a in the source doc). That is done: `packages/testing/package.json:117-119` sets `"publishConfig": { "access": "public" }` (checked 2026-09-30). Start by reading what `npm run check:consumer` runs; it may already prove this. Original text: `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history), item 41.
