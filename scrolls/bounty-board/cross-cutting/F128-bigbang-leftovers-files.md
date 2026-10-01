# F128: big-bang leftovers files are not worked

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P3: leftover cleanup lists |
| Package | cross-cutting |
| Found | big-bang run |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

Three leftovers sets are not worked:

- `b14-shape-contracts/out/leftovers.txt` (88 shapes when recorded).
- `b15-unknown-fields/out/leftovers.json` (W8 rows left: 9 refused by the error check, 3 gateway schemas, 2 unknown data).
- `b15-dead-reparse` kept sites (`tmp/bigbang/logs/w9-kept.tsv`).

## What should happen

Work each part. The plan has current counts.

## Where to look

`b14-shape-contracts/out/leftovers.txt`, `b15-unknown-fields/out/leftovers.json`, `tmp/bigbang/logs/w9-kept.tsv`. Confirm the files still exist under `tmp/` first (`tmp/deletions` was emptied on 2026-09-30).

## History

The plan is in `scrolls/brands-gateways-epic/items/f120-f129-bigbang-followups.md`, section "F128: the big-bang leftovers files" (Part A: 96 rows in the latest run, not 88; Part B: 39 rows, not 14; Part C: 78 sites in 65 files).
