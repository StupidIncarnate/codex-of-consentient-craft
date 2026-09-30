# DEF-42: `status --since beginning` prints every instance the registry has ever held

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-022 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`status --since beginning` prints every instance the registry has ever held. After 3 weeks that is already about 80 rows. With 6 months of data it will be unreadable.

`status-args-contract.ts:22` still holds `since: z.enum(['1h', '6h', '1d', 'beginning'])`.

Related hand-typed copies that hold the same list (from DEF-103, DEF-105, DEF-130 and DEF-146, which were fixed except for this): the help statics still hand-type the `--since` and `--stop-on` lists, held until this defect lands.

## What should happen

The user wants `beginning` replaced by `1wk`, so the accepted values become `1hr`, `6hr`, `1day`, `1wk`. The help for `status` must say `1wk` (this is the open part of DEF-54). DEF-103 asked that printed lists of accepted values come from the contract's enum at run time, never from a hand-typed string; the help statics are the copies still left.

## Where to look

Files that name `beginning` today (checked 2026-09-30):

- `packages/siegelense/src/contracts/status-args/status-args-contract.ts:22` (the enum)
- `packages/siegelense/src/transformers/status-args-parse/status-args-parse-transformer.ts` (and its test, `--since must be one of 1h, 6h, 1d, beginning`)
- `packages/siegelense/src/brokers/status/read/status-read-broker.ts:58` and `:84` (`since !== 'beginning'`; the ledger called the window table `SINCE_WINDOWS_MS`)
- `packages/siegelense/src/statics/status-table/status-table-statics.ts:59-65` (`sinceWindows`: `order`, `widest`, labels)
- `packages/siegelense/src/statics/siegelense-help/siegelense-help-statics.ts:285`, `:302`, `:305`, `:310` (usage line, flag value `1hr|6hr|1day|beginning`, flag text, REFUSES text)
- `packages/siegelense/src/transformers/status-answer-render/status-answer-render-transformer.ts:38`, `:60`, `:74` and the responder `siegelense-status-responder.ts:51` (the `Widen with --since beginning` hint from DEF-43)
- Tests that pin the old value: the flow, responder and startup integration tests under `packages/siegelense/src/` that print `Widen with --since beginning.`

## History

Waited on the contracts/adapters pivot (the user's hands-off rule for `contracts/`). The pivot merged into `master` on 2026-09-30 (commit 788165421), so the wait is over. Ledger note: DEF-102 through DEF-105 fixes (`f7b0ae083`, `85fd9d331`) left the `--since` / `--stop-on` help lists hand-typed on purpose, pending this change.

DEF-54 (the `status --help` rewrite, SL-028 and SL-030) is folded in here. Its rewrite landed in `db77bdb0a` (built 2026-09-27, ward run `1790547603729-3586`): REFUSES lists the real refusals, the design rule moved to OUTPUT, and the example id is real-shaped. Its one open point was the `1wk` wording in `siegelense-help-statics.ts`, listed above. The help must also still match DEF-44's single-instance table.
