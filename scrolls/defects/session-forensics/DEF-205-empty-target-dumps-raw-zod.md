# DEF-205: An empty-string target skips the usage text and dumps a raw Zod error

| | |
|---|---|
| Status | needs decision |
| Package | session-forensics |
| Found | 2026-09-30, walkthrough exploration (code read) |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "SF · empty target", and `scrolls/walkthrough/features/06-session-forensics.md`, "Known open items" item 1; 2026-09-30 |

## What is wrong

`SessionForensicsFlow` guards only `target === undefined` (`session-forensics-flow.ts:40`). `target: ''` reaches `DigestRunResponder`, which calls
`sessionIdContract.parse()` / `questIdContract.parse()` (not `.safeParse()`) at `digest-run-responder.ts:58,65,101`. The uncaught `ZodError`
prints as a raw JSON array from `StartSessionForensics`'s top-level catch. A test asserts this exact dump
(`start-session-forensics.integration.test.ts:50-81`), so it may be deliberate.

## What should happen

The user decides: keep the dump, or treat an empty target like a missing one and print the usage block. If changed, update the test at `:50-81`.

## Where to look

- `packages/session-forensics/src/flows/session-forensics/session-forensics-flow.ts:40`
- `packages/session-forensics/src/responders/digest/run/digest-run-responder.ts:58,65,101`
- `packages/session-forensics/src/startup/start-session-forensics.integration.test.ts:50-81`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
