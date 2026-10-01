# DEF-168: A full `npm run ward` exits 1 on two slow files that pass alone

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | ward |
| Found | 2026-09-29, full ward run `1790726979118-47a0` |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

Full `npm run ward` (run `1790726979118-47a0`) passes every check across 17 packages but exits 1 on two slow files: lint `packages/hydration-recipes/src/brokers/dm/registry/dm-registry-broker.integration.test.ts` (4.4s in rules) and integration `packages/cli/src/startup/start-install.integration.test.ts` (12.1s slowest test). Neither file changed on 2026-09-29. Alone, both pass with no slow flag (runs `1790727882144-09b5`, `1790727887775-9361`). The full run's parallel load pushes them over the bar.

## What should happen

Either the two tests get cheaper, or the full-run threshold accounts for load. The ledger says this needs real debugging and should go to the default model when dispatched.

## Where to look

The two files above, and ward's slow-test threshold (`SLOW TESTS FAILED THIS RUN`).

## History

Not re-run on 2026-09-30.
