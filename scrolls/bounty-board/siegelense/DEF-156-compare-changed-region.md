# DEF-156: `compare` reports a pixel share but not where the pixels changed

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: a pixel share hides how much of the page changed |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-156 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`compare --instance inst_8591259dc557490183ee35dc08634557 --run-a run_16 --run-b run_33` (a healthy home page against the broken fallback form): `PIXEL DELTA: last capture differs 3%`. The two captures are entirely different pages but mostly black background, so a pixel share reads as a tiny change. Both shot paths now print. A changed-region box is not built: it needs pixelmatch's diff image (`shot-diff-count-broker.ts:42` only keeps the count).

## What should happen

Also report where it changed: a changed-region box, or both image paths side by side (the paths are done).

## Where to look

- `packages/siegelense/src/brokers/shot/diff-count/shot-diff-count-broker.ts` (calls `pixelmatch` from `#gateway/npm/pixelmatch`)
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.ts`
- the compare broker and renderer

## History

`d47ebb02b`, merge `7f59e75b7`, ward runs `1790719170297-306e`, `1790719451074-12fb`: PIXEL DELTA names both shot paths; one `ELEMENTS: not compared` line; new console, server and network lines listed (up to 5).
