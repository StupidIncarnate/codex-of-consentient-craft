# DEF-203: No test shows the verdict buttons disable while a request is in flight, or that a verdict survives a reload

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Priority | P2: a test gap around verdict buttons |
| Package | web |
| Found | 2026-09-30, walkthrough cases MK-14, MK-15 (code read) |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "MK-14, MK-15", and `scrolls/walkthrough/features/04-marks-and-human-verdicts.md`, "Known open items"; 2026-09-30 |

## What is wrong

Nothing tests that the verdict buttons disable during a request. Nothing tests that a verdict survives a page reload.
The e2e spec notes state is settled by write triggers, not by a reload (`quest-summary-human-check-verdict.e2e.ts:155`).
`scrolls/consolidated-plan-handoff.md` ("Known gaps") says why: `EndpointControl` in `packages/testing` cannot hold a mocked HTTP request
open long enough to see the disabled state. A search found no `disabled` or `reload` assertion in the spec.

## What should happen

Add an e2e (or a widget test with a held request) that asserts the disabled state mid-flight, and one that reloads the page and asserts the verdict is still shown.

## Where to look

- `packages/web/src/flows/quest-chat/quest-summary-human-check-verdict.e2e.ts:150-155`
- `packages/testing` `EndpointControl` (needs a hold-open option)

## History

MK-14 is the only way to see the in-flight state today.
