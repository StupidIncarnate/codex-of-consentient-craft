# DEF-139: `screenshot` cannot capture a full page

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: a missing capture mode |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-090 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`run ... --steps '[{"step":"resize","width":600,"height":500},{"step":"screenshot","name":"resized-600x500.png"}]'` (run_35) saved a 600×500 image whose form runs off the bottom. `screenshot` captures the viewport only. The cut-off note is fixed (the reading says the page is taller or wider than the viewport). `screenshot {fullPage: true}` is not built: `browser-session-contract.ts` has no `fullPage`.

Only document scroll is measured by the cut-off note, not inner scroll containers.

## What should happen

`screenshot` accepts `fullPage: true`.

## Where to look

- `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` (`capture`)
- `packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.ts`
- `packages/siegelense/src/contracts/step/step-contract.ts` (the `screenshot` step)

## History

Cut-off note `954a08412`, merge `89375f952`. DEF-140 (`scroll` step) fixed in the same merge.
