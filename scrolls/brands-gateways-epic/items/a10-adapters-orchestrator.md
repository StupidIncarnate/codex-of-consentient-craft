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


### G-T remaining

The last seven `adapters/git/*` folders (push, untracked-files, upstream-sha, verify-ref, worktree-add, worktree-prune, worktree-remove; each with its proxy and test, `worktree-add` also its integration test) move onto `#gateway/bin/git`. The Plan section above already named GIT-1 and GIT-2 as done; the code matched. Scope, all under `packages/orchestrator/src`:

Deleted: `adapters/git/**` (the seven folders and the now-empty `git/` folder).

Edited callers, proxies and tests:
- `brokers/git/working-tree-files/git-working-tree-files-broker.ts` and `.proxy.ts`
- `brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker.ts` and `.proxy.ts`
- `brokers/worktree/discard/worktree-discard-broker.ts` and `.proxy.ts`
- `brokers/worktree/prepare/worktree-prepare-broker.ts` and `.proxy.ts`
- `brokers/git/detect-base-branch/git-detect-base-branch-broker.ts` and `.proxy.ts`
- `brokers/step-handler/commit/step-handler-commit-broker.ts`, `.proxy.ts` and `.test.ts`
- `brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts` and `.proxy.ts`
- `brokers/worktree/ensure-quest-branch/worktree-ensure-quest-branch-broker.integration.test.ts`
- `brokers/worktree/resume-restore/worktree-resume-restore-broker.integration.test.ts`
- `brokers/worktree/prepare/worktree-prepare-broker.integration.test.ts` (comment only)
- `responders/quest/handle-signal-back/quest-handle-signal-back-responder.integration.test.ts`

Proxies that compose the edited proxies and are covered by the whole-package unit run (not edited): `git-rows-layer-broker`, `quest-get-quest-work-broker`, `quest-node-dispatch-loop-broker`, `quest-run-step-broker`, `step-handler-run-broker`, `orchestration-dispatch-bootstrap-responder`, `quest-get-blight-checklist-responder`, `quest-get-quest-work-responder`, `worktree-create-responder`.

### G-CC fs

Scope, all under `packages/orchestrator/src`. Done in this pass: `rm`, `walk-files`, `read-file-range`. The other ten
`adapters/fs/*` folders stay (see the gaps below).

Deleted: `adapters/fs/rm/**`, `adapters/fs/walk-files/**`, `adapters/fs/read-file-range/**` (adapter, proxy, test each).

Edited callers, proxies and tests:
- `brokers/quest/delete/quest-delete-broker.ts` and `.proxy.ts`
- `brokers/smoketest/teardown-quest/smoketest-teardown-quest-broker.ts`, `.proxy.ts` and `.test.ts`
- `brokers/smoketest/clear-prior-quests/smoketest-clear-prior-quests-broker.test.ts` (two test titles)
- `brokers/usage-ledger/scan/usage-ledger-scan-broker.ts`, `.proxy.ts` and `.test.ts`
- `brokers/usage-ledger/scan/fold-batch-layer-broker.ts`, `.proxy.ts` and `.test.ts`

Gaps that stop the rest:
- `append-file`, `is-accessible`, `read-file`, `readlink`, `rename`, `symlink`, `write-file`: all seven are mocked wholesale by
  `registerModuleMock` in `brokers/step-handler/riftcarver/step-handler-riftcarver-broker.proxy.ts` behind address-less
  `calledWith([])` virtual stores, and again in `quest-route-scope-broker.proxy.ts` and `quest-run-step-broker.proxy.ts`. Moving any
  one needs those three virtual-fs proxies rebuilt on the gateway proxies' exact addressing.
- `read-jsonl`: `chat-replay-jsonl-read-broker.test.ts` needs a one-shot rejection (`throwsOnce`), and `readNonEmptyLinesProxy` has
  none.
- `readdir`: `fsReaddirAdapterProxy` carries a `calledWith([])` fallback and `returnsOnceFor` that `scan-subagents-dir` and
  every composing proxy lean on; `readdirIfExistsProxy` has no one-shot, and the adapter is sync where the wrapper is async.
- `watch-tail`: `tailFile` returns no `initialDrain`, which `chat-subagent-tail-broker` awaits, and `tailFileProxy` stages every
  call as `calledWith([])`.

## Plan — F64

Three `@gateway/node` gaps, all under `packages/@gateway/node/src/`. No caller outside `@gateway/node` imports
`tailFile`, `tailFileProxy`, `readNonEmptyLinesProxy` or `readdirSyncProxy` staging that a signature change touches
(python3 census over `packages/**`; orchestrator's `fsWatchTailAdapter` is its own copy).

Named files:
- `fs__promises/read-non-empty-lines/read-non-empty-lines.proxy.ts` and `.test.ts`: `returnsRawOnce` and `throwsOnce`,
  addressed by path, via `onceFor`.
- `fs/readdir-sync/readdir-sync.proxy.ts` and `.test.ts`: `returnsOnce` and `throwsOnce`, addressed by path. No
  catch-all default. (`readdir-entries-sync` is the `withFileTypes` twin and is left alone.)
- `fs/tail-file/tail-file-handle.ts`: `TailFileHandle` gains `initialDrain: Promise<void>`.
- `fs/tail-file/tail-file.ts`: returns `initialDrain` on every branch (resolves after the first drain closes or errors,
  on ENOENT, on `stop()`, and forwarded from the delegated tail under `awaitCreate`).
- `fs/tail-file/tail-file.proxy.ts`: every staging and read-back method takes `path`; no `calledWith([])`, no casts.
- `fs/tail-file/tail-file.test.ts`: existing cases move onto the path-addressed proxy; new `initialDrain` cases.

### F35 riftcarver proxies

The three proxies that stop the seven fs adapters moving (riftcarver's step handler, `quest-route-scope`,
`quest-run-step`) stop mocking the adapters' MODULES. Every adapter runs its real body, and the raw `fs/promises`
call underneath is staged by exact path through the proxy chain the implementation already reaches (T06): each
proxy composes the proxy beside each broker its implementation imports, and stages through that proxy's own
semantic methods.

Design:
- No `registerModuleMock` of an adapter or of `@dungeonmaster/shared/brokers` in any of the three. The home is
  resolved for real by `dungeonmasterHomeFindBroker`, staged through `dungeonmasterHomeFindBrokerProxy` inside
  `questFindQuestPathBrokerProxy`.
- The quest file lives at one exact path (`/home/testuser/.dungeonmaster/guilds/<GuildIdStub>/quests/<folder>/quest.json`).
  `questOperationsUpdateBrokerProxy` gains `setupQuestOnDisk({ quest })`, which stages the find (probe miss, guild
  listing, quest scan), every READ of that path (a sticky, addressed read through a new
  `questLoadBrokerProxy.setupQuestFileAt`), and the persist (temp write, rename, outbox append) — every one at
  its exact address. Because raw `readFile` is one shared mock, this one staging answers `questFindQuestPathBroker`,
  `questGetBroker`, `questLoadBroker` and `questOperationsUpdateBroker` wherever they read that path.
- The persisted quest is read back from the temp-file write (`getLastPersistedQuest`), not from a virtual store.
- A read AFTER a write returns the seeded quest, not the write: raw `readFile` is staged statically, which is all
  the gateway's `readFileProxy` can do too. No test here asserts a field only a read-after-write would carry
  (route-scope and run-step's record updates depend only on the seeded item; riftcarver's result append asserts
  only the appended result). The read-after-write path is covered by the route-scope integration test on real
  disk.
- `quest-route-scope`: `setupPassthrough` stages nothing but the real broker and the id/clock spies;
  `setupQuest` calls `setupQuestOnDisk` and stages every operation's plan file as missing through
  `plannedWorkReadBrokerProxy.setupPlanMissing`; `setupPlan` restages one as found (`setupPlanFound`, later wins).
- `quest-run-step`: `setupQuest` calls `setupQuestOnDisk`; the handler stays stubbed.
- riftcarver: no raw `spawn`/`mkdir`, no wrapper mocks of `readdirEntriesSync`/`existsSync`/`join`, no `as never`.
  The node_modules mirror, seed and audit are staged through `worktreeProvisionBrokerProxy.setupBareWorktree`;
  the result log through `riftcarverPersistResultBrokerProxy.setupSuccess`; the collision probe through
  `fsIsAccessibleAdapterProxy` by the exact worktree path; the base-branch probes through
  `gitDetectBaseBranchBrokerProxy` and `verifyRefProxy.setupResult` by exact ref (the two ref predicates go);
  the repo root through `questRepoRootBrokerProxy.setupRepoRoot` with a stub.

Files:
- `packages/orchestrator/src/brokers/quest/load/quest-load-broker.proxy.ts` — add `setupQuestFileAt`
- `packages/orchestrator/src/brokers/quest/operations-update/quest-operations-update-broker.proxy.ts` — add `setupQuestOnDisk`
- `packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker.proxy.ts` — rebuilt
- `packages/orchestrator/src/brokers/quest/run-step/quest-run-step-broker.proxy.ts` — rebuilt
- `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.proxy.ts` — rebuilt
- tests of the three, only where a public method's staging changed

The adapter moves onto `#gateway/node` are the NEXT chunk: seven adapters, each with its callers, proxies and tests,
run past the file budget of this one.

### G-CC fs, part 3 (read-jsonl, readdir, watch-tail)

Scope, all under `packages/orchestrator/src` unless a path says otherwise. Chunk 1 moves `read-jsonl` and `readdir`
and deletes both folders. Chunk 2 is `watch-tail`; it is named here and left for the next pass because path-addressing
`tailFileProxy` reaches every composing proxy and every test that stages `setupLines` / `triggerChange` (well past the
file budget of this pass).

Chunk 1, new:
- `transformers/stream-json-lines-from-raw/stream-json-lines-from-raw-transformer.ts` and `.test.ts` (and `.proxy.ts` if the folder type asks for one)

Chunk 1, edited (adapter call moves to `readNonEmptyLines` / `readdirSync` from `#gateway/node`):
- `brokers/chat/replay-jsonl-read/chat-replay-jsonl-read-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/signal/from-session-jsonl/signal-from-session-jsonl-broker.ts`, `.proxy.ts`
- `brokers/chat/history-replay/chat-history-replay-broker.ts`, `.proxy.ts`, `.test.ts` (comment)
- `responders/chat/replay/chat-replay-responder.test.ts` (comment)
- `brokers/quest/monitor-jsonl-watcher/scan-subagents-dir-layer-broker.ts`, `.proxy.ts`
- `brokers/quest/monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker.proxy.ts` (comment)
- `brokers/quest/list/quest-list-broker.ts`, `.proxy.ts`
- `brokers/quest/folder-find/quest-folder-find-broker.ts`, `.proxy.ts`
- `brokers/quest/modify/resolve-package-entry-facts-layer-broker.ts`, `.proxy.ts`
- `brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker.proxy.ts` (F35 concession 7 removal, tried separately)

Chunk 1, deleted: `adapters/fs/read-jsonl/**`, `adapters/fs/readdir/**` (adapter, proxy, test each).

Tests fixed where the removed `calledWith([])` readdir default or the trimmed-line change shows red, named in the report.

Chunk 2, named and NOT done here: `adapters/fs/watch-tail/**` (deleted with it), `readline/create-interface` proxy (comment),
`outbox-watch`, `start-subagent-tail`, `monitor-jsonl-watcher`, `chat-subagent-tail`, `chat-main-session-tail`,
`agent/launch` (`start-main-tail-layer-broker`, `agent-launch-broker`) and every proxy and test composing them, plus
`packages/shared/.../architecture-project-map-broker.integration.test.ts` (re-anchor `→ fsWatchTailAdapter`).

### G-CC fs, part 2 (seven adapters)

Census (python3, `packages/orchestrator/src`, imports of the seven adapters and their proxies): 79 files across the seven, too many for
one pass. This pass takes `write-file` and `rename` (they share callers, so they move together). Scope, all under `packages/orchestrator/src`:

Deleted: `adapters/fs/write-file/**`, `adapters/fs/rename/**` (adapter, proxy, test each).

Edited callers and proxies (each `.ts` and `.proxy.ts`):
- `brokers/dispatch-state/write/dispatch-state-write-broker`
- `brokers/planned-work/write/planned-work-write-broker`
- `brokers/quest/persist/quest-persist-broker` (its `.test.ts` comment)
- `brokers/usage-ledger/write/usage-ledger-write-broker`
- `brokers/guild-config/write/guild-config-write-broker`
- `brokers/quest/outbox-watch/quest-outbox-watch-broker` (still imports `append-file` and `watch-tail`)
- `brokers/riftcarver/persist-result/riftcarver-persist-result-broker`
- `brokers/step-handler/ward/step-handler-ward-broker`
- `brokers/ward/persist-result/ward-persist-result-broker`
- `responders/install/commands-create/install-commands-create-responder`
- `responders/install/repo-scaffold/install-repo-scaffold-responder` (still imports `is-accessible` and `read-file`)
- `brokers/smoketest/stamp-override/smoketest-stamp-override-broker.proxy.ts` (comment), `brokers/guild/add/guild-add-broker.integration.test.ts` (comment), `packages/orchestrator/CLAUDE.md`

Left for the next chunk (each adapter with its callers):
- `readlink` + `symlink`: `worktree/populate-node-modules/populate-one-root-layer-broker` (+ proxy and test, `worktree-populate-node-modules-broker.proxy.ts` and test), `worktree/verify-links/walk-symlinks-layer-broker` (+ proxy and test). `setupSymlinkSucceeds({ target })` needs a `path`, so the populate tests change. `readlinkIfLink` is the wrapper.
- `is-accessible` (26 files): `pathExists` rejects on EACCES and probes F_OK where the adapter swallowed every error and probed R_OK; callers need a decision.
- `read-file` (24 files): the adapter wrapped the error as `Failed to read file at ...`; the wrapper rejects raw.
- `append-file`: `chat-subagent-tail-broker` (and its proxy) belongs to the other agent; `quest-outbox-append`, `quest-outbox-watch` wait with it.
