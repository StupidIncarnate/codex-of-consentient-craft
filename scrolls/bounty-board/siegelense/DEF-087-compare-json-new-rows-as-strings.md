# DEF-87: `compare --json` `console.new`, `server.new` and `network.new` are JSON strings

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: every row needs a second parse |
| Package | siegelense |
| Found | 2026-09-27, walkthrough cases SL-154, SL-156, SL-161 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`compare` holds `console.new`, `server.new` and `network.new` as arrays of strings. `compare-answer-contract.ts:49`, `:58` and `:67` hold `new: z.array(z.string().brand<...>())`. Each row is JSON inside a string and needs a second parse (see DEF-86).

## What should happen

The `new` rows are real objects in `--json`.

## Where to look

`packages/siegelense/src/contracts/compare-answer/compare-answer-contract.ts:49`, `:58`, `:67` (the old ledger cited `:50,54,58`), plus the compare brokers, renderer, stub and tests.

## History

`ca0f834f6`, built 2026-09-27: the lines read `ELEMENTS WITHIN RUN A` and `ELEMENTS WITHIN RUN B`, and the help explains it. The driver saw `SNAPSHOTS: none — the throwaway home died with the instance at kill`.
