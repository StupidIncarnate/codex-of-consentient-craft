# DEF-213: The driving-oddities file has brokers but nothing calls them

| | |
|---|---|
| Status | needs decision |
| Package | siegelense |
| Found | 2026-09-30, walkthrough exploration (code read; a search found only the brokers' own tests calling them) |
| Moved from | `scrolls/walkthrough/features/01-siegelense.md`, "Known open items"; 2026-09-30 |

## What is wrong

Commit `7c5ab8f7c` added `drivingOddityAppendBroker` and `drivingOddityReadBroker`, tested at broker level. Nothing in `siegelenseCallStatics.calls.names`, no `step`
and no responder calls them. The file's home is `.dungeonmaster-assets/` per its header, beside the `siegelense-assets` link. From a walkthrough's view it is dead code.

## What should happen

The user decides: wire it to a call or step, or delete the brokers, contract, stub and error classes.

## Where to look

- `packages/siegelense/src/brokers/driving-oddity/append/`, `read/`
- `packages/siegelense/src/contracts/driving-oddity/`
- `packages/siegelense/src/errors/driving-oddity-duplicate-key/`, `driving-oddity-file-malformed/`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
