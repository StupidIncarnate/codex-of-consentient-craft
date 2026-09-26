# Inventory & design: `@dungeonmaster/node/child_process` and `@dungeonmaster/bin/*`

Scope: every adapter/broker in every package (testing included) that imports `child_process` directly, plus every
spawn of an outside program (git, npm, the Claude CLI, lsof, kill, cp, and OS "open URL" commands). Built from
`tmp/adapters-fresh/spawns.json`, `tmp/adapters-fresh/adapters.json`, and the real files they point at. No code
written; this is design only.

## 1. `@dungeonmaster/node/child_process` — proposed API

Curated: no raw `spawn`/`exec`/`execSync` exported. Six functions cover every existing shape (`spawnCapture`,
`spawnStream`, `spawnStreamLines`, `spawnDetached`, `spawnLongLived`, `execAdapter`, `execSyncAdapter` — the
testing package's mocking adapter is not a wrapper and has no home here; see §7).

| Exported name | Signature (plain values) | Not found (ENOENT) | Exits non-zero | Killed by signal | Timeout | Writes to stderr | Prints nothing | stdin closes early | Detached group |
|---|---|---|---|---|---|---|---|---|---|
| `run` | `({command, args, cwd, timeout?, env?}) => Promise<{exitCode: ExitCode \| null, output: ErrorMessage, signal: ProcessSignal \| null}>` | `exitCode: 1`, `output: ''`, `signal: null` — never throws | `exitCode` = the real code (clamped ≥0) | `exitCode: 1`, `signal` set to the killing signal | `timeout` (ms) fires `child.kill()`; resolves exactly like a signal kill once the child actually dies | folded into `output` alongside stdout (combined) | `output: ''`, `exitCode` still whatever the process reported | stdio is `['inherit', 'pipe', 'pipe']`; caller's own stdin, not ours to guard | n/a — this is the foreground, non-detached form |
| `stream` | `({command, args, cwd, onStderr?}) => Promise<{exitCode: ExitCode \| null, output: ErrorMessage}>` | `exitCode` derived from `error.code` when numeric, else `1`; `output` is whatever stdout was buffered before the error | `exitCode` = code (clamped ≥0), or `null` if the process was killed with no code | `exitCode: null` (code is `null` on a signal kill; `stream` does not report the signal — a gap, see §5) | not supported — no `timeout` param today (gap, see §5) | forwarded live to `onStderr`, per chunk, never buffered into `output` | `output: ''` | not guarded | n/a |
| `streamLines` | `({command, args, cwd, onLine, abortSignal?}) => Promise<{exitCode: ExitCode \| null, output: ErrorMessage}>` | same as `stream` (code from `error.code` or `1`) | `exitCode` clamped ≥0 | `exitCode` derived from `error`/`close` code, no explicit signal field (gap, see §5) | not supported directly — `abortSignal` lets a caller abort externally; no built-in timer | forwarded to `onLine` per chunk, and appended to the accumulated `output` | `output: ''` (empty combined string) | not guarded | n/a |
| `spawnDetached` | `({command, args, cwd, env?, stdoutFd, stderrFd}) => {pid: ProcessId, pgid: ProcessGroupId}` | throws `Error` naming the command when `child.pid` is `undefined` (spawn never started) | caller polls independently (fire-and-forget); no exit reporting by design | not observed here — caller uses `spawnKillGroup`/`spawnIsGroupAlive` (see `@dungeonmaster/bin` process helpers below) to reap | n/a | n/a (stdio is redirected to caller-owned fds, never inspected here) | n/a | stdio `['ignore', fd, fd]` — no stdin at all | `pgid` is returned precisely so a caller can signal the WHOLE group (`kill(-pgid, sig)`) — `detached: true` makes the leader its own session leader, so the pid alone never reaches a wrapper's grandchild (`npm run` → `sh -c` → real listener) |
| `spawnLongLived` | `({command, args, cwd}) => {kill: () => void}` | not observed — no pid/error surfaced to the caller (gap, see §5) | not surfaced | `kill('SIGTERM')` is the only lever this exposes; caller cannot tell if it landed | n/a | stdio is `'pipe'` but nothing reads it (gap, see §5) | n/a | not guarded | not detached — `kill()` reaches only the direct child, not a wrapper's grandchild (documented limitation vs `spawnDetached`) |
| `runFireAndForget` | `({command}) => void` | swallowed — `exec()`'s own error callback is never attached, so a bad command fails silently (gap, see §5) | swallowed, same reason | swallowed | n/a | swallowed | n/a | n/a | n/a |

`runSync` is deliberately **not** proposed as a new export. It exists today only as a raw `execSync` call in one live
site (`packages/siegelense/src/adapters/git/branch-read/git-branch-read-adapter.ts`) and one dead adapter
(`packages/hooks/src/adapters/child-process/exec-sync/child-process-exec-sync-adapter.ts`, 0 production callers).
Both callers are branch-name reads that already have an async equivalent (`run`) via `@dungeonmaster/bin/git`; the
sync path is reconciled away rather than carried into the gateway (§4).

## 2. `@dungeonmaster/bin/<program>` — proposed API

Every function is built on `@dungeonmaster/node/child_process`'s `run` unless noted. All return plain values, never
throw on a command's own failure (git/npm's ordinary non-zero exit), and throw only on a structural bug (e.g. a
required argument's absence).

### `@dungeonmaster/bin/git`

| Exported name | Signature | Built on | Replaces |
|---|---|---|---|
| `currentBranch` | `({cwd}) => Promise<{exitCode: ExitCode, output: ErrorMessage}>` | `run` (`git rev-parse --abbrev-ref HEAD`) | `gitCurrentBranchAdapter` (orchestrator) + `gitBranchReadAdapter` (siegelense) — reconciled, see §4 |
| `addAll` | `({cwd}) => Promise<{exitCode, output}>` | `run` (`git add -A`) | `gitAddAllAdapter` |
| `commit` | `({cwd, message, allowEmpty?}) => Promise<{exitCode, output}>` | `run` (`git commit -m <message> [--allow-empty]`) | `gitCommitAdapter` |
| `push` | `({cwd, setUpstream?: {branchName}}) => Promise<{exitCode, output}>` | `run` (`git push [-u origin <branch>]`) | `gitPushAdapter` |
| `checkout` | `({cwd, branchName}) => Promise<{exitCode, output}>` | `run` (`git checkout <branch>`, never `-f`/`-B`) | `gitCheckoutAdapter` |
| `branchDelete` | `({cwd, branchName}) => Promise<{exitCode, output}>` | `run` (`git branch -D <branch>`) | `gitBranchDeleteAdapter` |
| `headSha` | `({cwd}) => Promise<GitSha \| null>` | `run` (`git rev-parse HEAD`) | `gitHeadShaAdapter` |
| `upstreamSha` | `({cwd}) => Promise<GitSha \| null>` | `run` (`git rev-parse @{upstream}`) | `gitUpstreamShaAdapter` |
| `verifyRef` | `({cwd, ref}) => Promise<boolean>` | `run` (`git rev-parse --verify <ref>`) | `gitVerifyRefAdapter` |
| `diffFiles` | `({cwd, baseRef, comparison?}) => Promise<RepoRelativePath[]>` | `run` (`git diff <rev> --name-only`) — throws on non-zero exit | `gitDiffFilesAdapter` |
| `untrackedFiles` | `({cwd}) => Promise<RepoRelativePath[]>` | `run` (`git ls-files --others --exclude-standard`) — throws on non-zero exit | `gitUntrackedFilesAdapter` |
| `logNameOnly` | `({cwd, baseRef}) => Promise<QuestWorkCommit[]>` | `run` (`git log --name-only <format> <range>`) — throws on non-zero exit | `gitLogNameOnlyAdapter` |
| `worktreeAdd` | `({cwd, worktreePath, branchName, baseBranch, mode}) => Promise<{exitCode, output}>` | `run` (`git worktree add …`) | `gitWorktreeAddAdapter` |
| `worktreePrune` | `({cwd}) => Promise<{exitCode, output}>` | `run` (`git worktree prune`) | `gitWorktreePruneAdapter` |
| `worktreeRemove` | `({cwd, worktreePath}) => Promise<{exitCode, output}>` | `run` (`git worktree remove --force <path>`) | `gitWorktreeRemoveAdapter` |
| `detectDefaultBranch` | `({cwd}) => Promise<GitBranchName \| null>` | `run` (`git rev-parse --verify main`, then `master`) | `gitDetectDefaultBranchBroker` (ward) — reconciled with the next row, see §4 |
| `detectOriginDefaultBranch` | `({cwd}) => Promise<GitBranchName \| null>` | `run` (`git rev-parse --verify origin/main`, then `origin/master`) | `gitDetectOriginDefaultBranchBroker` (ward) |
| `diffCommitted` | `({cwd}) => Promise<GitRelativePath[]>` | `run` (`git merge-base` + `git diff --name-only --diff-filter=d`) — composes `detectOriginDefaultBranch`/`detectDefaultBranch` | `gitDiffCommittedBroker` (ward) — this is business logic (branch detection + diff), so it may stay a **broker** calling `@dungeonmaster/bin/git`'s primitives rather than becoming a bin function itself |
| `diffUncommitted` | `({cwd}) => Promise<GitRelativePath[]>` | `run` (`git diff --name-only --diff-filter=d HEAD` + `git ls-files --others --exclude-standard`), de-duplicated | `gitDiffUncommittedBroker` (ward) — same call: composition stays a ward broker |

Sad paths: every function here inherits `run`'s ENOENT/non-zero/signal/stderr behavior. The three list-returning
functions (`diffFiles`, `untrackedFiles`, `logNameOnly`) additionally **throw** `Error` on a non-zero git exit — that
behavior is preserved from the existing adapters, not new.

### `@dungeonmaster/bin/npm`

| Exported name | Signature | Built on | Replaces |
|---|---|---|---|
| `install` | `({cwd}) => Promise<{exitCode, output}>` | `run` (`npm install`) | `npmInstallAdapter` (siegelense) |
| `runBuild` | `({cwd, workspace}) => Promise<{exitCode, output}>` | `run` (`npm run build --workspace=<name>`) | `npmRunBuildAdapter` (siegelense) |
| `runScript` | `({cwd, workspace?, script, args?}) => Promise<{exitCode, output}>` | `run` | new — generalizes the one-off `npm` spawn in `ward/src/brokers/bundle/build/bundle-build-broker.ts` (`bundleStatics.buildCommand = 'npm'`, args `['run', 'build', ...]`), so ward's bundle builder stops hand-rolling its own `npm` call |

### `@dungeonmaster/bin/claude`

| Exported name | Signature | Built on |
|---|---|---|
| `resolveCliPath` | `() => AbsoluteFilePath` | `require.resolve('@anthropic-ai/claude-code')`-based lookup (see below — **this resolution does not exist today**) |
| `spawnStreamJson` | `({prompt, resumeSessionId?, cwd?, stdinMode?, model, disableToolSearch?, onStderrLine?, addDir?}) => {process: ChildProcess, stdout: Readable}` | `@dungeonmaster/node/child_process`'s raw `spawn` (not `run`/`streamLines` — this needs the live `ChildProcess` handle and a readable `stdout` stream for JSONL parsing, not a captured/joined string) |

Only the spawn, the CLI-path resolution, and the raw line stream belong here. Everything from
`claudeLineNormalizeBroker` onward (session-id extraction, JSONL → `ChatEntry[]`) stays in orchestrator
(`agentSpawnUnifiedBroker`, `chatLineProcessTransformer`), because it reads our own contracts.

**Where CLI-path resolution lives today: nowhere.** `packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts:104` reads
`const cliPath = process.env.CLAUDE_CLI_PATH ?? 'claude';` — a bare command name resolved off `$PATH`, with an env
override for tests (`packages/testing`'s e2e harness points `CLAUDE_CLI_PATH` at the fake CLI). No code anywhere
calls `require.resolve('@anthropic-ai/claude-code')`. The package is only an **optional peer dependency** of
`@dungeonmaster/cli` (`packages/cli/package.json:36-42`) — declared so a consumer can install it, never resolved to a
path. This is exactly the gap the brief's design closes: `resolveCliPath` is new code, not a reconciliation of two
existing implementations, and it is what makes "how Claude is launched is going to change" (brief) land in one place.

### `@dungeonmaster/bin/cp`

Not in the brief's `git`/`npm`/`claude`/`lsof`/`kill` list, but the scan surfaces it: `COPY_COMMAND = 'cp'` is spawned
in three orchestrator worktree brokers.

| Exported name | Signature | Built on | Replaces |
|---|---|---|---|
| `copyRecursive` | `({from, to, cwd?}) => Promise<{exitCode, output}>` | `run` (`cp -a <from> <to>` — exact flags to confirm against each of the three call sites, which may not agree — see §4) | `COPY_COMMAND` spawns in `populate-one-root-layer-broker.ts:131,209` and `worktree-seed-dist-broker.ts:132` |

### `@dungeonmaster/bin/lsof` and `@dungeonmaster/bin/kill`

Two programs, one recurring operation ("what's on this port, kill it") duplicated four times across three packages.
Proposed as one module, `@dungeonmaster/bin/port` (composing both programs), rather than two thin per-binary modules,
because every existing caller uses them as a pair and never independently:

| Exported name | Signature | Built on | Replaces |
|---|---|---|---|
| `listeningPids` | `({port}) => Promise<ProcessPid[]>` | `run` (`lsof -ti :<port>`) | the `lsof` half of `processKillByPortAdapter`, `netKillPortAdapter`, `netPortInUseAdapter` |
| `killByPort` | `({port}) => Promise<{killedPids: ProcessPid[]}>` | `listeningPids` + `run` (`kill -9 <pid>` per pid, orchestrator's shape) or `run` (`kill <pids...>`, ward's shape) — **these two shapes disagree** (`-9`/per-pid vs plain/batch), see §4 | `processKillByPortAdapter` (orchestrator), `netKillPortAdapter` (ward) |
| `portInUse` | `({port}) => Promise<boolean>` | `listeningPids` (non-empty) | `netPortInUseAdapter` (ward) |

`process.kill()` (the Node builtin, not the `kill` binary) is a **separate concern** — signaling a PID or process
group this process itself already holds a handle/pgid for, never spawning an external `kill`. That stays modeled as
plain Node global usage, not a `@dungeonmaster/bin` program:

| Today | Gateway home |
|---|---|
| `processSignalAdapter` (orchestrator) — `process.kill(pid, signal)`, catches to `boolean` | `@dungeonmaster/node/process`'s `signal({pid, signal}) => boolean` |
| `processIsAliveAdapter` (siegelense) — `kill(-pgid, 0)`, catches ESRCH to `boolean` | `@dungeonmaster/node/process`'s `isGroupAlive({pgid}) => boolean` |
| `processKillGroupAdapter` (siegelense) — `kill(-pgid, signal)`, catches ESRCH to `{success, signalSent}` | `@dungeonmaster/node/process`'s `killGroup({pgid, signal}) => {success: true, signalSent: boolean}` |

Per `packages/siegelense/CLAUDE.md`: kill the process GROUP, not the child, and skip the signal for one that already
exited (ESRCH on a dead group is the expected teardown outcome, not a failure) — both existing adapters already
encode this and the gateway versions preserve it verbatim.

## 3. Mapping: every existing call site → its gateway replacement

| Existing adapter / call site | `path:line` | Gateway replacement |
|---|---|---|
| `childProcessSpawnCaptureAdapter` | `packages/shared/src/adapters/child-process/spawn-capture/child-process-spawn-capture-adapter.ts:36` | `@dungeonmaster/node/child_process`'s `run` |
| `childProcessSpawnStreamAdapter` | `packages/shared/src/adapters/child-process/spawn-stream/child-process-spawn-stream-adapter.ts:18` | `run` → `stream` |
| `childProcessSpawnStreamLinesAdapter` | `packages/shared/src/adapters/child-process/spawn-stream-lines/child-process-spawn-stream-lines-adapter.ts:27` | `streamLines` |
| `childProcessSpawnDetachedAdapter` | `packages/siegelense/src/adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.ts:35` | `spawnDetached` |
| `childProcessSpawnLongLivedAdapter` | `packages/server/src/adapters/child-process/spawn-long-lived/child-process-spawn-long-lived-adapter.ts:12` | `spawnLongLived` |
| `childProcessExecAdapter` | `packages/cli/src/adapters/child-process/exec/child-process-exec-adapter.ts:11` | `runFireAndForget` — caller: `packages/cli/src/responders/cli/serve/cli-serve-responder.ts:40` |
| `childProcessSpawnAdapter` (hooks) | `packages/hooks/src/adapters/child-process/spawn/child-process-spawn-adapter.ts:16` | **dead — 0 production callers** (`adapters.json` `prodRefs: 0`); delete, do not migrate |
| `childProcessSpawnAdapter` (orchestrator) | `packages/orchestrator/src/adapters/child-process/spawn/child-process-spawn-adapter.ts:16` | **dead — 0 production callers**; delete |
| `childProcessExecSyncAdapter` (hooks) | `packages/hooks/src/adapters/child-process/exec-sync/child-process-exec-sync-adapter.ts:13` | **dead — 0 production callers**; delete |
| `childProcessSpawnStreamJsonAdapter` | `packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts:26` | `@dungeonmaster/bin/claude`'s `spawnStreamJson` (settings-file read, `--add-dir`, env-var handling stay in this orchestrator broker — only the raw spawn call moves) |
| `gitCurrentBranchAdapter` | `packages/orchestrator/src/adapters/git/current-branch/git-current-branch-adapter.ts:24` | `@dungeonmaster/bin/git`'s `currentBranch` |
| `gitAddAllAdapter` | `packages/orchestrator/src/adapters/git/add-all/git-add-all-adapter.ts:20` | `git`'s `addAll` |
| `gitBranchDeleteAdapter` | `packages/orchestrator/src/adapters/git/branch-delete/git-branch-delete-adapter.ts:23` | `git`'s `branchDelete` |
| `gitCheckoutAdapter` | `packages/orchestrator/src/adapters/git/checkout/git-checkout-adapter.ts:25` | `git`'s `checkout` |
| `gitCommitAdapter` | `packages/orchestrator/src/adapters/git/commit/git-commit-adapter.ts:24` | `git`'s `commit` |
| `gitDiffFilesAdapter` | `packages/orchestrator/src/adapters/git/diff-files/git-diff-files-adapter.ts:39` | `git`'s `diffFiles` |
| `gitHeadShaAdapter` | `packages/orchestrator/src/adapters/git/head-sha/git-head-sha-adapter.ts:16` | `git`'s `headSha` |
| `gitLogNameOnlyAdapter` | `packages/orchestrator/src/adapters/git/log-name-only/git-log-name-only-adapter.ts:45` | `git`'s `logNameOnly` |
| `gitPushAdapter` | `packages/orchestrator/src/adapters/git/push/git-push-adapter.ts:38` | `git`'s `push` |
| `gitUntrackedFilesAdapter` | `packages/orchestrator/src/adapters/git/untracked-files/git-untracked-files-adapter.ts:25` | `git`'s `untrackedFiles` |
| `gitUpstreamShaAdapter` | `packages/orchestrator/src/adapters/git/upstream-sha/git-upstream-sha-adapter.ts:25` | `git`'s `upstreamSha` |
| `gitVerifyRefAdapter` | `packages/orchestrator/src/adapters/git/verify-ref/git-verify-ref-adapter.ts:19` | `git`'s `verifyRef` |
| `gitWorktreeAddAdapter` | `packages/orchestrator/src/adapters/git/worktree-add/git-worktree-add-adapter.ts:37` | `git`'s `worktreeAdd` |
| `gitWorktreePruneAdapter` | `packages/orchestrator/src/adapters/git/worktree-prune/git-worktree-prune-adapter.ts:24` | `git`'s `worktreePrune` |
| `gitWorktreeRemoveAdapter` | `packages/orchestrator/src/adapters/git/worktree-remove/git-worktree-remove-adapter.ts:23` | `git`'s `worktreeRemove` |
| `gitDetectDefaultBranchBroker` | `packages/ward/src/brokers/git/detect-default-branch/git-detect-default-branch-broker.ts:15` | `git`'s `detectDefaultBranch` |
| `gitDetectOriginDefaultBranchBroker` | `packages/ward/src/brokers/git/detect-origin-default-branch/git-detect-origin-default-branch-broker.ts:25` | `git`'s `detectOriginDefaultBranch` |
| `gitDiffCommittedBroker` | `packages/ward/src/brokers/git/diff-committed/git-diff-committed-broker.ts:28` | stays a ward broker; its two internal `childProcessSpawnCaptureAdapter` calls (`:44` merge-base, `:55` diff) move to `git`'s primitives |
| `gitDiffUncommittedBroker` | `packages/ward/src/brokers/git/diff-uncommitted/git-diff-uncommitted-broker.ts:25` | stays a ward broker; its two internal spawn calls (`:31` diff, `:38` ls-files) move to `git`'s primitives |
| `gitBranchReadAdapter` | `packages/siegelense/src/adapters/git/branch-read/git-branch-read-adapter.ts:16` | `git`'s `currentBranch` — reconciled with orchestrator's copy, see §4 |
| `npmInstallAdapter` | `packages/siegelense/src/adapters/npm/install/npm-install-adapter.ts:21` | `npm`'s `install` |
| `npmRunBuildAdapter` | `packages/siegelense/src/adapters/npm/run-build/npm-run-build-adapter.ts:25` | `npm`'s `runBuild` |
| `bundleStatics.buildCommand` spawn | `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts:88` | `npm`'s `runScript` |
| `processKillByPortAdapter` | `packages/orchestrator/src/adapters/process/kill-by-port/process-kill-by-port-adapter.ts:15` | `port`'s `listeningPids` + `killByPort` |
| `netKillPortAdapter` | `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts:13` | `port`'s `killByPort` |
| `netPortInUseAdapter` | `packages/ward/src/adapters/net/port-in-use/net-port-in-use-adapter.ts:22` | `port`'s `portInUse` |
| `processSignalAdapter` | `packages/orchestrator/src/adapters/process/signal/process-signal-adapter.ts:17` | `@dungeonmaster/node/process`'s `signal` |
| `processIsAliveAdapter` | `packages/siegelense/src/adapters/process/is-alive/process-is-alive-adapter.ts:21` | `@dungeonmaster/node/process`'s `isGroupAlive` |
| `processKillGroupAdapter` | `packages/siegelense/src/adapters/process/kill-group/process-kill-group-adapter.ts:23` | `@dungeonmaster/node/process`'s `killGroup` |
| `COPY_COMMAND` spawns | `packages/orchestrator/src/brokers/worktree/populate-node-modules/populate-one-root-layer-broker.ts:131,209`, `packages/orchestrator/src/brokers/worktree/seed-dist/worktree-seed-dist-broker.ts:132` | `@dungeonmaster/bin/cp`'s `copyRecursive` |
| `agentSpawnUnifiedBroker`'s `childProcessSpawnStreamJsonAdapter` call | `packages/orchestrator/src/brokers/agent/spawn-unified/agent-spawn-unified-broker.ts:82` | stays an orchestrator broker calling `@dungeonmaster/bin/claude`'s `spawnStreamJson` |
| `childProcessMockerAdapter` (testing) | `packages/testing/src/adapters/child-process/mocker/child-process-mocker-adapter.ts:47` | **not migrated** — it mocks `child_process` itself for a caller's own tests; see §7 |
| `childProcessExecSyncAdapter` (testing) | `packages/testing/src/adapters/child-process/exec-sync/child-process-exec-sync-adapter.ts:14` | its production callers (if any survive the reconciliation in §4) go through `@dungeonmaster/node/child_process`; the testing package itself does not re-export a sync wrapper |

## 4. Drift found

| Case | `path:line` (each side) | What differs |
|---|---|---|
| **Read the current branch** (named in the brief) | `packages/orchestrator/src/adapters/git/current-branch/git-current-branch-adapter.ts:24` vs `packages/siegelense/src/adapters/git/branch-read/git-branch-read-adapter.ts:16` | Same command (`git rev-parse --abbrev-ref HEAD`), two shapes: orchestrator's is **async**, goes through `childProcessSpawnCaptureAdapter`, returns `{exitCode, output}` and treats a detached HEAD as the literal string `'HEAD'` with no special-casing. siegelense's is **sync** (`execSync` directly, bypassing any shared adapter), returns `ContentText \| null`, and explicitly maps `''` or the literal `'HEAD'` to `null`. Reconciling means picking one shape (async, matching the rest of `@dungeonmaster/bin/git`) and one null-vs-string-HEAD convention; every siegelense caller of `gitBranchReadAdapter` has to be reviewed for the switch from sync to async and from `null` to `'HEAD'`. |
| **Default-branch detection is split into two brokers ward alone owns, with no orchestrator equivalent** | `packages/ward/src/brokers/git/detect-default-branch/git-detect-default-branch-broker.ts:15`, `packages/ward/src/brokers/git/detect-origin-default-branch/git-detect-origin-default-branch-broker.ts:25` | Not a second implementation of the same question — `detectDefaultBranch` asks the LOCAL main/master, `detectOriginDefaultBranch` asks origin's copy, and the header on the origin one explains why `@{upstream}` is deliberately not used. Flagged here because the gateway migration must keep both as two distinct `@dungeonmaster/bin/git` exports rather than collapsing them — a plausible-looking "simplification" during the move would reintroduce the exact bug `gitDiffFilesAdapter`'s own header describes (a diff that silently collapses once the default branch absorbs a quest's commits). |
| **`git branch -D` vs a `git worktree remove --force` + `git worktree prune` pair** | `packages/orchestrator/src/adapters/git/branch-delete/git-branch-delete-adapter.ts:23`, `git-worktree-remove-adapter.ts:23`, `git-worktree-prune-adapter.ts:24` | Not drift in behavior, but three separate git primitives with overlapping responsibility (removing a worktree's traces) that a single caller always uses together (`worktreeRemove` then `worktreePrune`, per that adapter's own header). Keep as three functions — the header explains why each is reached for over the others — but note for the caller migration that no single gateway call replaces the trio. |
| **`kill` invocation shape disagrees between orchestrator and ward** | `packages/orchestrator/src/adapters/process/kill-by-port/process-kill-by-port-adapter.ts:47` (`kill -9 <pid>`, one `execSync` per pid, individually caught) vs `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts:27` (`kill <pids.join(' ')>`, one `exec` call, no `-9`, no per-pid catch) | orchestrator sends `SIGKILL` immediately and tolerates a pid that already exited (each `kill -9 <pid>` wrapped in its own try/catch); ward sends the default signal (`SIGTERM`) to every pid at once and does not tolerate one of them being gone (a single failed pid fails the whole `kill` invocation, silently, since the callback ignores the error argument). `killByPort`'s design in §2 has to pick one signal and one per-pid-tolerance policy — recommend orchestrator's (`-9`, per-pid, tolerant), since it is closer to `processKillGroupAdapter`'s already-established ESRCH-is-not-a-failure convention. |
| **`cp` invocation may not agree across the three call sites** | `packages/orchestrator/src/brokers/worktree/populate-node-modules/populate-one-root-layer-broker.ts:131,209`, `packages/orchestrator/src/brokers/worktree/seed-dist/worktree-seed-dist-broker.ts:132` | Not confirmed identical — `COPY_COMMAND = 'cp'` is a shared constant, but the flags each call site passes were not read line-by-line here (out of this pass's file budget). Before writing `copyRecursive`, the args at all three call sites need a direct diff to confirm one signature covers all three, or whether one needs e.g. `-a` and another `-r`. |

## 5. Sad-path holes that exist today

| Hole | `path:line` |
|---|---|
| `stream` (→ `childProcessSpawnStreamAdapter`) loses the killing signal — `child.on('close', (code) => ...)` only reads `code`, never a second `signal` argument, so a process killed by SIGTERM/SIGKILL reports `exitCode: null` indistinguishably from a normal `code === null` case. `run`'s own header explains exactly why this matters (an OOM-reaped process reading as an ordinary lint failure). | `packages/shared/src/adapters/child-process/spawn-stream/child-process-spawn-stream-adapter.ts:52` |
| `streamLines` has the same gap — `child.on('close', (code) => ...)` drops the signal argument entirely. | `packages/shared/src/adapters/child-process/spawn-stream-lines/child-process-spawn-stream-lines-adapter.ts:90` |
| `stream` and `streamLines` accept no `timeout`; only `run` (`childProcessSpawnCaptureAdapter`) has one. A long-running `stream`/`streamLines` caller (ward's `multi-package-layer-broker.ts:131`, orchestrator's `step-handler-ward-broker.ts:83`) has no built-in way to bound a hung child — whatever timeout protection exists is the caller's own, external mechanism, not the adapter's. | `packages/shared/src/adapters/child-process/spawn-stream/child-process-spawn-stream-adapter.ts:18`, `packages/shared/src/adapters/child-process/spawn-stream-lines/child-process-spawn-stream-lines-adapter.ts:27` |
| `childProcessExecAdapter` attaches no `'error'` listener to the `ChildProcess` `exec()` returns, so a command that fails to spawn at all (ENOENT on `open`/`xdg-open`/`start`) throws an **unhandled** `'error'` event with nothing catching it — Node's default behavior for an unhandled `error` event is to crash the process. | `packages/cli/src/adapters/child-process/exec/child-process-exec-adapter.ts:11-14` |
| `childProcessSpawnLongLivedAdapter` returns only `{kill}` — no `pid`, no `'error'` listener, no `'exit'`/`'close'` handler at all. A spawn that fails (ENOENT) produces a `ChildProcess` whose `.kill()` still "succeeds" from the caller's point of view, and nothing ever reports that the server process never started. | `packages/server/src/adapters/child-process/spawn-long-lived/child-process-spawn-long-lived-adapter.ts:12-34` |
| `netKillPortAdapter`'s inner `exec('kill ' + pids.join(' '), () => {...})` ignores its error argument outright, so a partial-failure `kill` (one pid already gone, `kill`'s exit 1) is reported identically to full success. | `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts:27-29` |
| `gitBranchReadAdapter`'s `catch { return null; }` collapses every failure mode — git not installed, not a git repo, permission denied, detached HEAD — into the same `null`, where the async siblings (`gitCurrentBranchAdapter`) at least preserve the exit code and raw output for a caller that wants to distinguish them. | `packages/siegelense/src/adapters/git/branch-read/git-branch-read-adapter.ts:28-30` |
| No function in `@dungeonmaster/bin/claude`'s current form (`childProcessSpawnStreamJsonAdapter`) reports the CLI's own ENOENT (Claude not installed / not on `$PATH`) as anything other than an ordinary `'error'` event the caller (`agentSpawnUnifiedBroker`) forwards via its optional `onError` — a caller that omits `onError` never learns the spawn never started at all. | `packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts:128-132`, `packages/orchestrator/src/brokers/agent/spawn-unified/agent-spawn-unified-broker.ts:109-111` |

## 6. Out of scope for the raw-import lint rule

Per the brief: "Commands built at runtime are allowed. Lint cannot read them, and most are commands users configure
in `.dungeonmaster.json` or paths to our own CLIs." These call sites build their command from a runtime value, a
module constant naming an already-homed program (`@dungeonmaster/bin/*` covers the outside part; the runtime part is
still allowed), or `process.execPath`/our own resolved binary path:

| Call site | `path:line` | Why it is out of scope |
|---|---|---|
| Browser-open command | `packages/cli/src/responders/cli/serve/cli-serve-responder.ts:34-40` | `cmd` is built from `process.platform` and a URL (`open`/`start`/`xdg-open`), never a literal — and none of `open`/`start`/`xdg-open` has a home in `@dungeonmaster/bin` today. If one is added later, this becomes an in-scope call to migrate; until then lint cannot read a runtime-built shell string. |
| `dungeonmaster-ward` child spawn (ward's own CLI, self-referential) | `packages/ward/src/brokers/command/run/multi-package-layer-broker.ts:52,131-133` | `wardBin` — our own CLI's resolved path |
| `dungeonmaster-ward` re-invocation from riftcarver/ward step handlers | `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts:272-273`, `packages/orchestrator/src/brokers/step-handler/ward/step-handler-ward-broker.ts:83-84`, `packages/ward/src/brokers/ward/detail/ward-detail-broker.ts` (reads `process.env.WARD_CLI_PATH ?? WARD_COMMAND`) | `process.env.WARD_CLI_PATH ?? wardCommandStatics.bin` — an env override of our own CLI's bin name, both runtime values |
| `dungeonmaster siegelense cleanup` re-invocation | `packages/orchestrator/src/brokers/step-handler/cleanup/step-handler-cleanup-broker.ts:59` | `process.env.DUNGEONMASTER_CLI_PATH ?? cleanupCliCallStatics.call.bin` — our own CLI |
| Lane process launch (dev server, Playwright driver) | `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts:188` (`laneProcess.command`) | User-configured `devCommand`/`buildCommand` from `.dungeonmaster.json`, resolved at runtime per the spec's own lane definitions |
| Driver self-relaunch | `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts:218-219` (`process.execPath`) | `process.execPath` (the current Node binary) plus `cliPackageBinResolveAdapter()`'s resolved path to our own CLI's bin script — deliberately not the bare `dungeonmaster` command, per that call site's own comment, to avoid PATH ambiguity |
| ward's own bundle-build `npm` spawn's args (not the command itself) | `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts:88-91` | The **command** (`bundleStatics.buildCommand = 'npm'`) is in scope (§2, `npm`'s `runScript`); `bundleStatics.buildArgs` and the temp-dir path argument are runtime-built and irrelevant to the lint rule, which reads only the first word |

## 7. Proxy design

**How a caller's proxy mocks these wrappers.** Every existing composing broker/adapter proxy over `git`/`npm` calls
mocks the underlying `childProcessSpawnCaptureAdapter`'s `spawn` — e.g.
`packages/shared/src/adapters/child-process/spawn-capture/child-process-spawn-capture-adapter.proxy.ts:99`:
`const handle = registerMock({ fn: spawn });`, addressed by **the command** (`handle.calledWith([command])`). After
the migration, a caller of `@dungeonmaster/bin/git`'s `currentBranch()` gets a proxy that mocks `currentBranch`
itself, imported from `@dungeonmaster/bin/git` — **not** `child_process`'s `spawn` underneath, per
`scrolls/adapters-to-one-place.md`'s own rule: "Mocking `fs` underneath would still intercept the call, but it would
skip the wrapper's own behaviour, which is what the broker relies on." A caller's proxy shape becomes, e.g.:

```ts
const handle = registerMock({ fn: currentBranch }); // imported from @dungeonmaster/bin/git
handle.calledWith([{ cwd }]).returns({ exitCode: ExitCodeStub({ value: 0 }), output: 'main' as ErrorMessage });
```

**How the gateway's own wrappers mock `child_process` underneath.** Inside `@dungeonmaster/node/child_process`'s own
`.test.ts`/`.proxy.ts`, the address is still **the command**, exactly as today's adapter proxies do it — this part of
the convention does not change, only which file it lives in:

- `packages/shared/src/adapters/child-process/spawn-capture/child-process-spawn-capture-adapter.proxy.ts:99` —
  `registerMock({ fn: spawn })`, `handle.calledWith([command]).implement(() => createMockChildFromConfig({snapshot}))`,
  building a fake `ChildProcess` (`EventEmitter` + `Readable` stdout/stderr) and firing `'exit'`/`'error'` on
  `process.nextTick`/`setImmediate`. `@dungeonmaster/node/child_process/run`'s own `.proxy.ts` carries this same
  builder, plus the two race-condition knobs already modeled (`raceExitBeforeDrain`, `neverDrain` — the exit-before-
  drain race `run`'s own header describes) — those become gateway-owned test fixtures rather than shared-package ones.
- `packages/shared/src/adapters/child-process/spawn-stream-lines/child-process-spawn-stream-lines-adapter.proxy.ts:21`
  — same `registerMock({ fn: spawn })` address, a lighter fake (`PassThrough` streams, an `on`/`close`/`error`
  listener table) since `streamLines` only needs line-by-line `stdout`/`stderr`.
- `packages/testing/src/adapters/child-process/mocker/child-process-mocker-adapter.ts:47` is the ONE exception to
  "mock the wrapper, not `child_process`": its whole job IS mocking `child_process.spawn` directly via `jest.doMock`,
  for callers that want to simulate `spawn` before any gateway wrapper exists around it. Its own proxy
  (`child-process-mocker-adapter.proxy.ts:6`) is intentionally empty ("this adapter mocks child_process itself"). It
  is **not migrated into the gateway** — it is a testing utility with no outside-world call of its own to wrap, and
  keeping it in `@dungeonmaster/testing` matches the brief's own carve-out for an adapter that "touches no outside
  thing directly." Its usefulness after the migration is unclear (every caller it could serve should be testing a
  gateway wrapper's own proxy instead) and is a question for the consumption phase, not this design.
- The `.child-process` address convention itself is documented in `packages/testing/CLAUDE.md`'s own table: *"the
  COMMAND"* is the address for `child_process` (`spawn`/`exec`/`execSync`) mocks, alongside `path`'s SEGMENTS and
  `fetch`'s URL. `@dungeonmaster/node/child_process`'s own proxy inherits this table unchanged — the gateway does not
  invent a new addressing scheme for a package the testing conventions already cover.

## Summary (10 lines)

`@dungeonmaster/node/child_process` exports six curated functions — `run` (capture-to-completion, replaces
`spawnCapture`), `stream`/`streamLines` (live callback + accumulated output), `spawnDetached` (process-group leader,
returns `{pid, pgid}`), `spawnLongLived` (fire-and-forget with a `kill` handle), and `runFireAndForget` (true
fire-and-forget, e.g. opening a URL) — no raw `spawn`/`exec`/`execSync` leaves the module. `@dungeonmaster/bin/git`
(17 functions), `@dungeonmaster/bin/npm` (3), `@dungeonmaster/bin/claude` (path resolution + raw JSONL spawn only —
chat-entry translation stays in orchestrator), `@dungeonmaster/bin/cp` (1), and a combined `@dungeonmaster/bin/port`
(lsof+kill, 3 functions) sit on top of `run`. Two real reconciliations are needed before the move: "current branch"
(orchestrator's async vs siegelense's sync, with a different detached-HEAD convention) and `kill`'s signal/tolerance
policy (orchestrator's `-9`/per-pid/tolerant vs ward's default-signal/batch/intolerant). The Claude CLI path
resolution the brief describes doesn't exist yet — today it's `process.env.CLAUDE_CLI_PATH ?? 'claude'` on `$PATH`,
never a `require.resolve('@anthropic-ai/claude-code')` — so `resolveCliPath` is new code, not a migration. Three
hooks/orchestrator adapters are dead (0 production callers) and should be deleted rather than migrated. Proxies mock
the wrapper (`currentBranch`, not `spawn`) for callers; inside the gateway itself, `spawn` stays the mock address,
unchanged from today's `registerMock({fn: spawn})` convention.
