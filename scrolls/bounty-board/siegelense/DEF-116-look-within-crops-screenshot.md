# DEF-116: `look` with `within` screenshots the whole page

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: the screenshot shows the whole page when the reading is scoped |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-067 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`npm run siegelense -- run --instance inst_8591259dc557490183ee35dc08634557 --steps '[{"step":"look","within":"GUILD_LIST"}]'` (run_4) returns a key scoped to `GUILD_LIST` (4 rows), but its screenshot `runs/run_4/step1.png` is the whole page. Checked 2026-09-30: `browser-session-contract.ts` has `within` on `look` and `countMatches` but none on `capture`.

## What should happen

The user's rule: a `look` with `within` screenshots only that section, cropped to the scoped element, because on a dense page a full-page image cannot tell an agent which part the key covers. A `look` with no `within` keeps the full-page shot.

## Where to look

- `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` (add an optional `within` on `capture`)
- `packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.ts` (the capture implementation: use the union bounding box of the `within` matches as `clip`; this replaces `playwright-session-adapter.ts`)
- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.ts` (pass `within` for `look`)

## History

Was `queued — contracts/adapters pivot`.
