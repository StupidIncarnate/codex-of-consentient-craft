# DEF-213: The driving-oddities file has brokers but nothing calls them

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P3: dead code |
| Package | siegelense |
| Found | 2026-09-30, walkthrough exploration (code read; a search found only the brokers' own tests calling them) |
| Moved from | `scrolls/walkthrough/features/01-siegelense.md`, "Known open items"; 2026-09-30 |

## What is wrong

Commit `7c5ab8f7c` added `drivingOddityAppendBroker` and `drivingOddityReadBroker`, tested at broker level. Nothing in `siegelenseCallStatics.calls.names`, no `step`
and no responder calls them. The file's home is `.dungeonmaster-assets/` per its header, beside the `siegelense-assets` link. From a walkthrough's view it is dead code.

## What should happen

**Decided by the user, 2026-09-30: delete the code.** The idea needs a re-architecture, not wiring. Remove the append and read brokers, `drivingOddityContract` and its stub, the two error classes, and every test and proxy they own. Check with `discover` that nothing else imports them first.

The idea itself is kept as CHG-3, "Siege memory storage".

## Where to look

- `packages/siegelense/src/brokers/driving-oddity/append/`, `read/`
- `packages/siegelense/src/contracts/driving-oddity/`
- `packages/siegelense/src/errors/driving-oddity-duplicate-key/`, `driving-oddity-file-malformed/`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
