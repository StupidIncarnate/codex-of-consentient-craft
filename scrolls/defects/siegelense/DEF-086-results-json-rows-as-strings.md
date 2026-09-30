# DEF-86: `results --json` rows are JSON strings inside JSON

| | |
|---|---|
| Status | ready |
| Package | siegelense |
| Found | 2026-09-27, walkthrough cases SL-127, SL-128, SL-149 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`results --json` puts each row in `rows` as a JSON string inside the JSON (`"rows": ["{\"step\":3,...}"]`), so every row needs a second parse. `results-answer-contract.ts:56` still holds `rows: z.array(z.string().brand<'ResultsAnswerRows'>())`.

## What should happen

Rows are real objects in `--json`.

## Where to look

- `packages/siegelense/src/contracts/results-answer/results-answer-contract.ts:56` (the old ledger cited `:47`)
- the results read brokers that build `rows`, the text renderer, tests and stubs.

## History

`ca0f834f6`, built 2026-09-27: console lines carry their level (`ERROR: boom`, `WARNING: careful`), and network lines read `GET 200 <url> — <trimmed body>`. A multi-line body spanning several lines was DEF-96, closed on 2026-09-28.
