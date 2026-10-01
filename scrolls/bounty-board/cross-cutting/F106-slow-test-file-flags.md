# F106: slow test files and load timeouts recorded in whole-repo runs

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: slow and flaky whole-repo runs cost reruns |
| Package | cross-cutting |
| Found | operator |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

Slow-file flags in the whole-repo integration run 1790700091564-feb3:

- `typed-return-is-void-like-transformer.integration.test.ts` took 14.6s. Give it F102's fixture tsconfig.
- hooks' `start-post-ask-question-hook.integration.test.ts` took 11.9s. This is the config-load warm-up F104 describes. Give its `beforeAll` a warm-up timeout, or fix F105.

Also:

- `packages/siegelense/src/flows/driver/driver-flow.integration.test.ts`: 9 tests failed "api never answered their ready path" at load average 17 (run 1790717002382-c2c3) and passed alone (1790717413036-0e36).
- `packages/web/src/flows/quest-chat/warpgate-queue-listing.e2e.ts` "the queue bar lists BOTH" failed in full e2e 1790765218082-ebdf and passed alone (1790765575837-5b26). It was green in the next full ward.

## What should happen

Investigate every slow-file flag and load timeout, on a quiet machine.

## Where to look

The four test files named above.

## History

The user tabled this until the refactor finished (Phase 6, Z08, 2026-09-29), because the refactor ran memory-heavy work in parallel. The refactor merged into `master` on 2026-09-30 (788165421), so the hold is lifted. Z08 in `scrolls/brands-gateways-epic/EPIC.md` holds the same charge. Related: F105, F130, and DEF-168 (two more files that are slow only under a full run's load).
