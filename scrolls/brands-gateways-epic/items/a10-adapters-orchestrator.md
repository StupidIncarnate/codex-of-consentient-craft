# A10: Adapters: `orchestrator`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" (305-366) and item 33 (768-786); `scrolls/gateway-build/coverage.md` and `stays-as-adapter.md` orchestrator rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1, 2141 |
| Needs | [A03](a03-port-kill-broker.md), [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | orchestrator |
| Checks to run | lint, typecheck, unit, integration |
| Split | operator splits, 2 to 4 files per agent (batches below); the 15 `git/*` files split into 4 sub-batches given the real behaviour change item 33 calls for |
| Runs alone | no other agent editing `orchestrator` at the same time |

## Current state

Census of `packages/orchestrator/src/adapters/**` run 2026-09-26: 39 files. Three groups this item does NOT
touch:

- `dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` — [A02](a02-forwarder-adapters.md)'s job
  (it forwards into `@dungeonmaster/config`, not an outside call).
- `child-process/spawn/child-process-spawn-adapter.ts` — [A01](a01-dead-adapters.md) deletes it as dead code.
- `process/kill-by-port/process-kill-by-port-adapter.ts` — [A01](a01-dead-adapters.md) ALSO deletes this one as
  dead code. **This corrects `coverage.md`, which lists it as a live "REAL GAP" waiting on
  [A03](a03-port-kill-broker.md)'s new broker** — a fresh caller census (2026-09-26) found zero real callers for
  this file anywhere in `orchestrator` today. If orchestrator genuinely needs "kill what's on this port"
  functionality, its real caller uses a different, as-yet-unidentified code path — do not assume this file's
  deletion removes live behaviour; if you find a caller this census missed, report it under LEFT STANDING rather
  than un-deleting the file yourself.
- `http/readiness-poll/http-readiness-poll-adapter.ts` — [A01](a01-dead-adapters.md) deletes it as dead code too.

That leaves 35 adapters:

| Batch | Path | Replacement |
|---|---|---|
| FS-1 | `adapters/fs/append-file/fs-append-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `appendFile` |
| FS-1 | `adapters/fs/is-accessible/fs-is-accessible-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `pathExists` |
| FS-1 | `adapters/fs/read-file-range/fs-read-file-range-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFileFromOffset` |
| FS-1 | `adapters/fs/read-file/fs-read-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFile` |
| FS-2 | `adapters/fs/read-jsonl/fs-read-jsonl-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readNonEmptyLines` |
| FS-2 | `adapters/fs/readdir/fs-readdir-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readdirIfExists` |
| FS-2 | `adapters/fs/readlink/fs-readlink-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readlinkIfLink` |
| FS-2 | `adapters/fs/rename/fs-rename-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `rename` |
| FS-3 | `adapters/fs/rm/fs-rm-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `rm` |
| FS-3 | `adapters/fs/symlink/fs-symlink-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `symlink` |
| FS-3 | `adapters/fs/walk-files/fs-walk-files-adapter.ts` | gateway → `@dungeonmaster/node/fs` `walkFilesSync` |
| FS-3 | `adapters/fs/watch-tail/fs-watch-tail-adapter.ts` | gateway → `@dungeonmaster/node/fs` `tailFile` |
| MISC | `adapters/fs/write-file/fs-write-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFile` |
| MISC | `adapters/net/check-port-free/net-check-port-free-adapter.ts` | gateway → `@dungeonmaster/node/net` `isPortFree` |
| MISC | `adapters/proc/check-alive/proc-check-alive-adapter.ts` | gateway → `@dungeonmaster/node/process` `kill` — probe-vs-signal semantics stay at the caller |
| MISC | `adapters/process/signal/process-signal-adapter.ts` | gateway → `@dungeonmaster/node/process` `kill` |
| TIMER | `adapters/readline/create-interface/readline-create-interface-adapter.ts` | gateway → `@dungeonmaster/node/readline` `lineReader` — adds an `onError` param the current bare adapter lacks |
| TIMER | `adapters/timer/set-interval/timer-set-interval-adapter.ts` | gateway → `@dungeonmaster/node/setInterval` (pass-through) |
| TIMER | `adapters/timer/set-timeout/timer-set-timeout-adapter.ts` | gateway → `@dungeonmaster/node/setTimeout` (pass-through) |
| SPAWN | `adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts` | split → `@dungeonmaster/bin/claude` `spawnStreamJson`; the settings-file read, `--add-dir` handling and env handling stay an orchestrator broker |
| GIT-1 | `adapters/git/add-all/git-add-all-adapter.ts` | gateway → `@dungeonmaster/bin/git` `addAll` |
| GIT-1 | `adapters/git/branch-delete/git-branch-delete-adapter.ts` | gateway → `@dungeonmaster/bin/git` `branchDelete` |
| GIT-1 | `adapters/git/checkout/git-checkout-adapter.ts` | gateway → `@dungeonmaster/bin/git` `checkout` |
| GIT-1 | `adapters/git/commit/git-commit-adapter.ts` | gateway → `@dungeonmaster/bin/git` `commit` |
| GIT-2 | `adapters/git/current-branch/git-current-branch-adapter.ts` | gateway → `@dungeonmaster/bin/git` `currentBranch` — **behaviour change, see below** |
| GIT-2 | `adapters/git/diff-files/git-diff-files-adapter.ts` | gateway → `@dungeonmaster/bin/git` `diffFiles` |
| GIT-2 | `adapters/git/head-sha/git-head-sha-adapter.ts` | gateway → `@dungeonmaster/bin/git` `headSha` |
| GIT-2 | `adapters/git/log-name-only/git-log-name-only-adapter.ts` | gateway → `@dungeonmaster/bin/git` `logNameOnly` |
| GIT-3 | `adapters/git/push/git-push-adapter.ts` | gateway → `@dungeonmaster/bin/git` `push` |
| GIT-3 | `adapters/git/untracked-files/git-untracked-files-adapter.ts` | gateway → `@dungeonmaster/bin/git` `untrackedFiles` |
| GIT-3 | `adapters/git/upstream-sha/git-upstream-sha-adapter.ts` | gateway → `@dungeonmaster/bin/git` `upstreamSha` |
| GIT-3 | `adapters/git/verify-ref/git-verify-ref-adapter.ts` | gateway → `@dungeonmaster/bin/git` `verifyRef` |
| GIT-4 | `adapters/git/worktree-add/git-worktree-add-adapter.ts` | gateway → `@dungeonmaster/bin/git` `worktreeAdd` |
| GIT-4 | `adapters/git/worktree-prune/git-worktree-prune-adapter.ts` | gateway → `@dungeonmaster/bin/git` `worktreePrune` |
| GIT-4 | `adapters/git/worktree-remove/git-worktree-remove-adapter.ts` | gateway → `@dungeonmaster/bin/git` `worktreeRemove` |

**All 15 `git/*` adapters forward to `@dungeonmaster/shared`'s `childProcessSpawnCaptureAdapter` today**, confirmed
by `stays-as-adapter.md`'s own correction ("13 orchestrator `git/*` adapters ... call
`childProcessSpawnCaptureAdapter` from `@dungeonmaster/shared/adapters`"). `coverage.md` marks their fate as
`gateway` but notes "migration itself deferred to the consumption phase (brief rule 6)" — that deferral belonged
to an earlier, narrower work plan. **This epic's own goal ("no package has an `adapters/` folder") supersedes that
deferral: migrate all 15 now, in this item, not later.**

**`currentBranch({ cwd })` in `#gateway/bin/git` is `async`, returns `null` for a detached HEAD, and throws on a
real git failure** (confirmed by reading `packages/@gateway/bin/src/git/current-branch/current-branch.ts`, if not
already read this session). The old `git-current-branch-adapter.ts` returns `{ exitCode, output }` and passes the
literal string `'HEAD'` through for a detached worktree. Item 33's own words: "Each of its callers switches to a
plain `string | null` and checks `null` instead of `'HEAD'`." Find every caller of `git-current-branch-adapter.ts`
and change each one's check from `=== 'HEAD'` to `=== null`, and from a synchronous `{exitCode, output}` read to
`await`-ing the new call and checking for a thrown error where the old code checked `exitCode !== 0`.

## Work

1. For every FS/MISC/TIMER row: switch every caller to the named export, imported from its `#gateway/<kind>/<subpath>`
   path.
2. For `child-process-spawn-stream-json-adapter.ts`: move the raw spawn call onto `#gateway/bin/claude`'s
   `spawnStreamJson`; keep the settings-file read, `--add-dir` handling and env handling as an orchestrator broker.
3. For every `git/*` row: switch the caller from the adapter to `#gateway/bin/git`'s named export directly. For
   `current-branch` specifically, also update every caller's `'HEAD'`-vs-`null` check and its
   synchronous-vs-`async`/throwing call shape, per the behaviour-change note above.
4. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (`#gateway/bin/git/current-branch/current-branch.proxy`, `#gateway/node/fs__promises/rename/rename.proxy`,
   and so on for every other wrapper), never through a barrel, per T1/T3.
5. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
6. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
7. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught — the `currentBranch` null-check change is exactly the kind of behaviour
   change that needs a real mutation test, not just a passing green.

## Done when

- None of the 35 adapter files remain, and — once [A01](a01-dead-adapters.md) and [A02](a02-forwarder-adapters.md)'s
  orchestrator work has also landed — `packages/orchestrator/src/adapters/` is gone entirely.
- Every caller of `git-current-branch-adapter.ts` now checks `null`, not `'HEAD'`.
- `npm run ward -- --only lint,typecheck,unit,integration -- packages/orchestrator` exits 0.

## Traps

- Server and mcp typecheck `@dungeonmaster/orchestrator` from its compiled `dist` (brands doc, 2156-2158) — a
  behaviour change inside `orchestrator` itself does not have this problem (orchestrator's own ward run reads
  source), but if this item's changes ripple into a NEW exported type or method signature that server/mcp consume,
  report BUILD NEEDED for `@dungeonmaster/orchestrator`.
- Do not touch `dungeonmaster-config-resolve-adapter.ts` — confirm [A02](a02-forwarder-adapters.md) has already
  removed it before you start; if it is still there, report LEFT STANDING rather than deleting it yourself (it is
  not this item's file to delete, even though it lives in this package).
- Confirm [A01](a01-dead-adapters.md) has landed (its 3 orchestrator deletions) before you start.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

## Plan — G-T

Batch 1 scope: GIT-1 and GIT-2 adapters (8 adapters, 24 files deleted; 29 callers/proxies/tests migrated).
GIT-3 and GIT-4 adapters remain standing for the follow-up batch per sizing instructions.

### Files to delete (24 files)
- `packages/orchestrator/src/adapters/git/add-all/git-add-all-adapter.ts`
- `packages/orchestrator/src/adapters/git/add-all/git-add-all-adapter.proxy.ts`
- `packages/orchestrator/src/adapters/git/add-all/git-add-all-adapter.test.ts`
- `packages/orchestrator/src/adapters/git/branch-delete/git-branch-delete-adapter.ts`
- `packages/orchestrator/src/adapters/git/branch-delete/git-branch-delete-adapter.proxy.ts`
- `packages/orchestrator/src/adapters/git/branch-delete/git-branch-delete-adapter.test.ts`
- `packages/orchestrator/src/adapters/git/checkout/git-checkout-adapter.ts`
- `packages/orchestrator/src/adapters/git/checkout/git-checkout-adapter.proxy.ts`
- `packages/orchestrator/src/adapters/git/checkout/git-checkout-adapter.test.ts`
- `packages/orchestrator/src/adapters/git/commit/git-commit-adapter.ts`
- `packages/orchestrator/src/adapters/git/commit/git-commit-adapter.proxy.ts`
- `packages/orchestrator/src/adapters/git/commit/git-commit-adapter.test.ts`
- `packages/orchestrator/src/adapters/git/current-branch/git-current-branch-adapter.ts`
- `packages/orchestrator/src/adapters/git/current-branch/git-current-branch-adapter.proxy.ts`
- `packages/orchestrator/src/adapters/git/current-branch/git-current-branch-adapter.test.ts`
- `packages/orchestrator/src/adapters/git/diff-files/git-diff-files-adapter.ts`
- `packages/orchestrator/src/adapters/git/diff-files/git-diff-files-adapter.proxy.ts`
- `packages/orchestrator/src/adapters/git/diff-files/git-diff-files-adapter.test.ts`
- `packages/orchestrator/src/adapters/git/head-sha/git-head-sha-adapter.ts`
- `packages/orchestrator/src/adapters/git/head-sha/git-head-sha-adapter.proxy.ts`
- `packages/orchestrator/src/adapters/git/head-sha/git-head-sha-adapter.test.ts`
- `packages/orchestrator/src/adapters/git/log-name-only/git-log-name-only-adapter.ts`
- `packages/orchestrator/src/adapters/git/log-name-only/git-log-name-only-adapter.proxy.ts`
- `packages/orchestrator/src/adapters/git/log-name-only/git-log-name-only-adapter.test.ts`

### Files to edit (30 files)
- `packages/orchestrator/package.json` — add `@dungeonmaster/bin` to dependencies per `gateway-dependency-declared` rule
- `packages/orchestrator/src/brokers/agent-prompt/get/agent-prompt-get-broker.ts`
- `packages/orchestrator/src/brokers/agent-prompt/get/agent-prompt-get-broker.proxy.ts`
- `packages/orchestrator/src/brokers/agent-prompt/get/agent-prompt-get-broker.test.ts`
- `packages/orchestrator/src/brokers/git/working-tree-files/git-working-tree-files-broker.ts`
- `packages/orchestrator/src/brokers/git/working-tree-files/git-working-tree-files-broker.proxy.ts`
- `packages/orchestrator/src/brokers/git/working-tree-files/git-working-tree-files-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker.ts`
- `packages/orchestrator/src/brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker.proxy.ts`
- `packages/orchestrator/src/brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/get-quest-work/git-rows-layer-broker.ts`
- `packages/orchestrator/src/brokers/quest/get-quest-work/git-rows-layer-broker.proxy.ts`
- `packages/orchestrator/src/brokers/quest/get-quest-work/git-rows-layer-broker.test.ts`
- `packages/orchestrator/src/brokers/step-handler/commit/step-handler-commit-broker.ts`
- `packages/orchestrator/src/brokers/step-handler/commit/step-handler-commit-broker.proxy.ts`
- `packages/orchestrator/src/brokers/step-handler/commit/step-handler-commit-broker.test.ts`
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts`
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.proxy.ts`
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.test.ts`
- `packages/orchestrator/src/brokers/worktree/discard/worktree-discard-broker.ts`
- `packages/orchestrator/src/brokers/worktree/discard/worktree-discard-broker.proxy.ts`
- `packages/orchestrator/src/brokers/worktree/discard/worktree-discard-broker.test.ts`
- `packages/orchestrator/src/brokers/worktree/prepare/worktree-prepare-broker.ts`
- `packages/orchestrator/src/brokers/worktree/prepare/worktree-prepare-broker.proxy.ts`
- `packages/orchestrator/src/brokers/worktree/prepare/worktree-prepare-broker.test.ts`
- `packages/orchestrator/src/brokers/worktree/resume-restore/worktree-resume-restore-broker.ts`
- `packages/orchestrator/src/brokers/worktree/resume-restore/worktree-resume-restore-broker.proxy.ts`
- `packages/orchestrator/src/brokers/worktree/resume-restore/worktree-resume-restore-broker.test.ts`
- `packages/orchestrator/src/brokers/worktree/resume-restore/worktree-resume-restore-broker.integration.test.ts`
- `packages/orchestrator/test/harnesses/orchestration-quest/orchestration-quest.harness.ts`

