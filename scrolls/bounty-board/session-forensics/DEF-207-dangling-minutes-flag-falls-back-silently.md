# DEF-207: A `--minutes` or `--floor-seconds` flag with no value silently takes the default

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Package | session-forensics |
| Found | 2026-09-30, walkthrough exploration (code read) |
| Moved from | `scrolls/walkthrough/features/06-session-forensics.md`, "Known open items" item 5; 2026-09-30 |

## What is wrong

The flow reads `argv[index + 1]`; with no value that is `undefined`, the same path as the flag being absent (`session-forensics-flow.ts:44-47`, `:53-56`). The feature doc calls this "plausibly fine".

## What should happen

Decide whether a flag with no value is a usage error. If so, print the usage block like a bad value does.

## Where to look

- `packages/session-forensics/src/flows/session-forensics/session-forensics-flow.ts:44-62`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
