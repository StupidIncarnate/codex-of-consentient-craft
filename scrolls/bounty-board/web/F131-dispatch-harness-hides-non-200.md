# F131: `startQuestViaStartRoute` drops the HTTP status and returns `processId: "undefined"`

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | web |
| Found | e2e flake fix |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

`dispatchHarness.startQuestViaStartRoute` (`packages/web/test/harnesses/dispatch/dispatch.harness.ts:338`) returns `processId: String(body.processId)` on any response. On a non-200 the body has no `processId`, so it returns the string "undefined" and the caller sees no failure.

Checked 2026-09-30: still there (lines 338-349).

## What should happen

Make it fail loudly on a non-200.

## Where to look

`packages/web/test/harnesses/dispatch/dispatch.harness.ts:338`.

## History

Found by the e2e flake fix. Priority P2.
