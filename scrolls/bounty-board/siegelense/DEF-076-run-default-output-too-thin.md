# DEF-76: `results --run` prints only a header for a `look` run

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-066; rewritten with the user, also SL-069, SL-100, SL-120 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`results --instance <id> --run run_2` prints only the header and `SCREENSHOTS:` for a `look` run. The key appears only with `--kind steps`, but `results --help` says the default is "an instance header followed by formatted step readings". An agent following the help never sees its reading. Every `look`, `eval` and `box` costs two calls, and a failure five (SL-069).

SL-100: a hold step writes 4 frames (`step1_frame1.png` and on), but the run's `SCREENSHOTS` line lists only `step1.png`.
SL-120: `run --json` already carries an `index` with console errors and warnings, server errors and network exchanges and failures; the text view prints none of it.

## What should happen

Rewritten 2026-09-28 with the user. Keep the 50,000-character rule by CAPPING, not by returning nothing.

1. `run` prints one line per step by default, capped in length: step, target, ok or failed, duration, screenshot, and the step's answer when short (`"Dungeonmaster"`, `260×36 at (472,351), visible`). A large answer (a `look` key) prints its size and the exact `results` command.
2. A closing line counts the run's evidence: `console: N errors · network: N requests, N failed · server: N errors`. It only needs to print the `index`.
3. An opt-in flag, for example `run ... --show steps,console,network`, prints those readings in full after the batch.
4. The `SCREENSHOTS` line lists hold frames too.

## Where to look

`packages/siegelense/src/` run and results answer renderers (`run-answer-render`, `results-answer-render` transformers) and the help statics. Find them with `discover` before editing.

## History

Supersedes an earlier pointer-only fix. Was labelled `queued — section batch` (one agent takes every such defect from the section).
