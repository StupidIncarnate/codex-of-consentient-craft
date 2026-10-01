# DEF-237: PURPOSE headers in packages/@gateway describe the build that made them, not the file

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | gateway |
| Found | 2026-09-26, spot check of four headers |
| Moved from | `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history) item 46, 2026-09-30 |

## What is wrong

Many headers tell the history of the adapters they replaced, describe a layout that no longer exists, use the old import form, or cite follow-up items by number. All of that breaks the comment rules.

Still present 2026-09-30:

| Problem | Where |
|---|---|
| names the adapter it replaced | `bin/src/git/current-branch/current-branch.ts:2-3`, `npm/src/pngjs/decode-png/decode-png.ts:3`, `bin/src/git/diff-files/diff-files.ts:7`, `head-sha`, `log-name-only`, `untracked-files`, `upstream-sha`, `bin/src/kill/kill-pid/kill-pid.ts:3-5`, `node/src/child_process/run-fire-and-forget`, `spawn-long-lived`, `npm/src/glob/glob/glob.ts`, `npm/src/testing-library__react/testing-library__react.ts:5` (`mantineRenderAdapter`) |
| points at old adapter paths | `bin/src/gateway-test-support/arg-matcher.ts:7-8`, `node/src/gateway-test-support/path-matcher.ts:6-7` |
| comment in a proxy names "this adapter" | `node/src/fetch/fetch-with-status/fetch-with-status.proxy.ts:52` |
| cites items of the gateway doc by number | `current-branch.ts`, `bin/src/lsof/listening-pids/listening-pids.ts` (recheck) |

A text search cannot find every one, so each header has to be read.

## What should happen

Every wrapper, proxy, stub and barrel header states what the file does and why it is shaped so, in the present tense. No replaced adapter, no earlier layout, no item number. Each `USAGE` example compiles against the file as it stands.

Split per subpath, two to four files per agent. Do it after the code items land.

## Where to look

`packages/@gateway/{bin,node,npm,browser}/src/**`

## History

Original text and table: `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history), item 46.
