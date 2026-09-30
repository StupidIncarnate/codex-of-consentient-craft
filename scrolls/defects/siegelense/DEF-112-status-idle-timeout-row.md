# DEF-112: `status --instance` has no idle-timeout row

| | |
|---|---|
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-050 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`npm run siegelense -- start --spec stack --idle-timeout-ms 1800000` booted `inst_4210304e3bcb489fa28683180894d110`. The `start` summary now prints `IDLE TIMEOUT:` and `start --json` has `idleTimeoutMs`. `status --instance` has no row for it, because the timeout is not persisted anywhere `status` reads. Checked 2026-09-30: `start-answer-render-transformer.ts:30-37` prints it; the status render and `instance-status-contract.ts` do not.

## What should happen

`status --instance` shows `IDLE TIMEOUT:` the same way, for example `30m (raised from the 15m default)` or `15m (default)`. That needs the timeout stored in the registry row or manifest (the same manifest work as DEF-75).

## Where to look

- `packages/siegelense/src/transformers/start-answer-render/start-answer-render-transformer.ts:25-64` (the wording to reuse)
- `packages/siegelense/src/contracts/instance-status/instance-status-contract.ts`, `registry-entry-contract.ts`
- `packages/siegelense/src/transformers/status-answer-render/status-answer-render-transformer.ts`

## History

`0f37b2f39`, merge `1428407a8`: `start` prints `IDLE TIMEOUT:`, `start --json` has `idleTimeoutMs`, and help says a value below 900000 is refused. Still to do from the same ticket: `start --help` (SL-064) states plainly that a value below 900000 is refused, not only that the flag "only RAISES" the ceiling (the ledger marks this as done; not re-read).
