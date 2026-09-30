# DEF-75: `start --json` manifest `logs` lists `api` and `web`, not `driver.log`

| | |
|---|---|
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough cases SL-051, SL-053, SL-063, SL-064 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

The `start --json` manifest `logs` lists `api` and `web`, not `driver.log` (see DEF-45). `instance-manifest-contract.ts:94` holds `logs: z...` with no `driver` field.

## What should happen

Add a `driver` field to the manifest `logs` and thread it through `instance-start-broker.ts`.

## Where to look

- `packages/siegelense/src/contracts/instance-manifest/instance-manifest-contract.ts:29`, `:94`
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts` (the old ledger cited `:229`, `:378`, `:381`, `:385`, `:465`; re-find them)
- `packages/siegelense/src/transformers/start-answer-render/start-answer-render-transformer.ts`

## History

Items 1, 2, 4 and 5 of the original report (unknown-recipe message, raw Zod for `--spec ""`, help wording, `subagent: -` and `session: -` in `SEEDED:`) were fixed, built and seen in the post-build check.
