# DEF-152: `results --kind ws` records `closed` but no `opened` event

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-129 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`results --since boot --kind ws` on `inst_e4fc1619fe3d452bb5547f10cac0bd2e`: 28 rows — 10 received, 2 sent, 16 closed, and no opened event, so a socket's start never shows and its lifetime cannot be read. Checked 2026-09-30: `browser-session-launch-broker.ts:254-285` records frames and a close line, no open line.

## What should happen

Record `opened` beside `closed`, with run and step (per DEF-125). The times already print readably.

## Where to look

- `packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.ts:254-285` (`page.on('websocket')`; push an open line at the start of the handler)
- the `linesBuild` helper with `websocketFrameLine` and `websocketCloseLine` (add a `websocketOpenLine`).

## History

Readable-time half fixed: `da9b2d343`, merge `2ba469630`.
