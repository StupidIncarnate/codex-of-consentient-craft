# DEF-216: Ward's e2e check still needs `packages/shared/dist` and `packages/testing/dist` built first

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Package | ward |
| Found | 2026-09-30, walkthrough case WD-41 (feature doc, not re-checked) |
| Moved from | `scrolls/walkthrough/features/07-ward.md`, "Known open items"; 2026-09-30 |

## What is wrong

Playwright's own config and spec loader use plain Node resolution with no export conditions, so `check-run-e2e-broker.ts` needs those two `dist` folders. The plan floated a `paths` map (probe P7); D5.3 to D5.5 were struck (section 11.1). WD-41 can fail with `MODULE_NOT_FOUND` naming `@dungeonmaster/shared` or `@dungeonmaster/testing`.

## What should happen

Either ward builds those two before e2e, or e2e resolves them from source. Re-check that the need is still live first.

## Where to look

- `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
