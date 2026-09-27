# Inventory & design: `@dungeonmaster/node/child_process` and `@dungeonmaster/bin/*`

Scope: every wrapper for `child_process`, and every spawn of an outside program — git, npm, the Claude CLI,
lsof, kill, and cp. `@dungeonmaster/node/child_process` and every `@dungeonmaster/bin/<program>` this scope
names are built, in `packages/@gateway/node/src/child_process/` and `packages/@gateway/bin/src/*/`. What
follows is what a caller migrating onto them still needs: how two old copies of the same function differed,
and the one piece with no gateway home yet.

## 1. `@dungeonmaster/node/child_process`

Built. It exports `run` (capture the whole output), `stream` and `streamLines` (a live callback plus the
accumulated output), `spawnDetached` (a process-group leader, returns `{pid, pgid}`), `spawnLive` and
`spawnLongLived` (a live process handle with no captured output), `runFireAndForget` (true fire-and-forget,
for opening a URL), and `runSync` (a blocking capture, for the one caller — testing's fixture setup — that
cannot free the event loop to await). No raw `spawn`, `exec`, or `execSync` leaves the module. Each file's
own PURPOSE comment gives its signature and its sad-path behavior — a command not found, a non-zero exit, a
signal kill, a timeout — so this inventory does not repeat it.

## 2. `@dungeonmaster/bin/<program>`

Every function here is built on `child_process`'s `run`. Each returns plain values, never throws on the
program's own ordinary failure (git or npm's non-zero exit), and throws only on a structural bug such as a
missing argument.

### `bin/git`

Built, in `packages/@gateway/bin/src/git/`. Three choices from the design hold, now as code rather than
proposals:

- `detectDefaultBranch` and `detectOriginDefaultBranch` stay two separate functions. One answers what the
  local checkout holds; the other answers what origin has seen. Collapsing them would let a diff shrink
  silently the moment a local branch runs ahead of origin — `git-detect-origin-default-branch.ts`'s own
  header explains why.
- `branchDelete`, `worktreeRemove`, and `worktreePrune` stay three separate functions, not one. Removing a
  worktree's traces always needs the last two together, but a plain branch delete needs neither.
- `diffFiles`, `untrackedFiles`, and `logNameOnly` throw on a non-zero git exit, unlike every other function
  in this module. That is the behavior the adapters they replace already had, not a new choice.

`diffCommitted` and `diffUncommitted` are not `bin/git` functions. Each composes a default-branch lookup and
a diff into one answer, which is business logic, so both stay ward brokers (`git-diff-committed-broker.ts`,
`git-diff-uncommitted-broker.ts`) that call `bin/git`'s primitives.

`currentBranch` is the one `bin/git` function built to reconcile two adapters that disagreed — see section 4.

### `bin/npm`

Built, in `packages/@gateway/bin/src/npm/`. `runScript` generalizes `install` and `runBuild` to any
`npm run <script>` call. Ward's own bundle builder
(`packages/ward/src/brokers/bundle/build/bundle-build-broker.ts`) still spawns `npm` by hand instead of
calling `runScript` — a caller-migration item this inventory found that is not yet in
`scrolls/gateway/followup-sustainability.md`'s numbered list.

### `bin/claude`

Built, in `packages/@gateway/bin/src/claude/`. `resolveClaudeCliPath` finds the CLI in order — an env
override, then the installed `@anthropic-ai/claude-code` package's own `bin` entry, then a bare `claude`
confirmed on `$PATH` — and throws `ClaudeNotInstalledError` when none resolves. `spawnStreamJson` spawns it
and hands back the live process and its `stdout`. Building the argv (the prompt, `--model`, `--resume`,
`--add-dir`) stays orchestrator's job, since that reads our own contracts.

One caller has not moved onto it:
`packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts:104`
still reads `process.env.CLAUDE_CLI_PATH ?? 'claude'` directly, instead of calling `resolveClaudeCliPath`.

### `bin/cp`

Built, in `packages/@gateway/bin/src/cp/`. `copyRecursive` reconciles the three orchestrator call sites that
spawn `cp` with different flags, through a `hardlink` parameter: `false` runs `cp -a`, for a single dist
copy; `true` runs `cp -al`, for a node_modules mirror, where sharing inodes is safe and cheap.
`cp-copy-recursive.ts`'s own header names which call site needs which.

### `bin/lsof`, `bin/kill`, and `process.kill()`

`bin/lsof`'s `listeningPids` and `bin/kill`'s `killPid` and `killGroup` are built. The function that composes
them — list what is on a port, then kill it — is not: `scrolls/gateway/followup-sustainability.md` item 32
has the gap, and section 4 below has `killPid`'s own reconciliation.

`process.kill()` — signaling a pid or process group this process already holds a handle for — is not a
`bin/kill` spawn. It is a Node global, so it lives in `@dungeonmaster/node/process`; see
`node-and-browser.md`'s mapping table.

## 3. Mapping: every existing call site → its gateway replacement

`scrolls/gateway-build/coverage.md` has the current per-adapter mapping to a gateway export, path by path,
for every child_process and bin call site along with every other adapter in the repo. It also lists three
dead adapters with no production callers — hooks' `child-process-exec-sync-adapter.ts` and
`child-process-spawn-adapter.ts`, and orchestrator's `child-process-spawn-adapter.ts` — and says to delete
them, not migrate them.

## 4. Reconciliations

Two functions reconcile two adapter copies that disagreed. Both decisions are made, and documented where the
decision lives rather than repeated here:

- `currentBranch` (`bin/git`) reconciles orchestrator's async, `'HEAD'`-returning copy against siegelense's
  sync, `null`-collapsing copy. `git-current-branch.ts`'s own header and
  `scrolls/gateway/followup-sustainability.md` item 33 give the decision and the callers it affects.
- `killPid` (`bin/kill`) reconciles orchestrator's SIGKILL/per-pid/tolerant copy against ward's
  default-signal/batched/intolerant copy, keeping orchestrator's shape. `kill-pid.ts`'s own header and
  followup-sustainability.md item 33 give the decision.

Still open: the port-composing function named in section 2 above has no home yet
(`scrolls/gateway/followup-sustainability.md` item 32), so ward's `netKillPortAdapter` and
`netPortInUseAdapter`, and orchestrator's `processKillByPortAdapter`, are not migrated. Once it exists, it
composes `listeningPids` with `killPid`, whose signal and tolerance are already decided above.

## 5. Sad-path holes

Every sad-path hole this inventory found is fixed in the built wrappers. `run` throws `RunNotFoundError`
instead of returning a fake exit code when a command is never found. `stream` and `streamLines` report the
killing `signal` instead of dropping it. `spawnLongLived` and `runFireAndForget` both log instead of
crashing the process when a command never starts. `bin/claude`'s `resolveClaudeCliPath` throws a named
`ClaudeNotInstalledError` instead of letting a missing CLI surface as a bare ENOENT. Each wrapper's own
PURPOSE comment names the hole it closes.

What is not fixed is not a wrapper gap — it is a caller that has not switched to the fixed wrapper yet. See
section 4 above.

## 6. Out of scope for the raw-import lint rule

A lint rule can read only a literal command string. These call sites build the command at runtime instead —
from `process.platform`, an env override, or our own resolved binary path — so the future
`bin-program-spawn-ban` rule cannot see them and does not need to:

| Call site | `path:line` | What is runtime-built |
|---|---|---|
| Browser-open command | `packages/cli/src/responders/cli/serve/cli-serve-responder.ts:34-40` | `cmd` comes from `process.platform` and a URL (`open`/`start`/`xdg-open`). None of the three has a home in `@dungeonmaster/bin` yet; adding one makes this an in-scope call to migrate. |
| `dungeonmaster-ward` child spawn (ward's own CLI) | `packages/ward/src/brokers/command/run/multi-package-layer-broker.ts:52,131-133` | `wardBin`, our own CLI's resolved path |
| `dungeonmaster-ward` re-invocation from step handlers | `packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts:272-273`, `packages/orchestrator/src/brokers/step-handler/ward/step-handler-ward-broker.ts:83-84`, `packages/ward/src/brokers/ward/detail/ward-detail-broker.ts` | `process.env.WARD_CLI_PATH ?? wardCommandStatics.bin`, an env override of our own CLI's bin name |
| `dungeonmaster siegelense cleanup` re-invocation | `packages/orchestrator/src/brokers/step-handler/cleanup/step-handler-cleanup-broker.ts:59` | `process.env.DUNGEONMASTER_CLI_PATH ?? cleanupCliCallStatics.call.bin`, our own CLI |
| Lane process launch (dev server, Playwright driver) | `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts:188` | `laneProcess.command`, the user's `devCommand`/`buildCommand` from `.dungeonmaster.json` |
| Driver self-relaunch | `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts:218-219` | `process.execPath` plus `cliPackageBinResolveAdapter()`'s resolved path to our own CLI, chosen over a bare `dungeonmaster` command to avoid PATH ambiguity |
| ward's own bundle-build `npm` spawn's arguments | `packages/ward/src/brokers/bundle/build/bundle-build-broker.ts:88-91` | The command itself, `bundleStatics.buildCommand = 'npm'`, is in scope for `bin/npm`'s `runScript` (section 2 above). `bundleStatics.buildArgs` and the temp-dir path are runtime-built, and the lint rule reads only the first word. |

## 7. Proxy design

A caller's proxy mocks the wrapper it imports, not `child_process` underneath. Before the migration, a
composing broker or adapter proxy over a `git`/`npm` call mocked the underlying `spawn` call directly — for
example `child-process-spawn-capture-adapter.proxy.ts:99`'s `registerMock({ fn: spawn })`, addressed by the
command. A caller of `bin/git`'s `currentBranch()` instead gets a proxy that mocks `currentBranch` itself,
imported from `@dungeonmaster/bin/git` — not `spawn` underneath, per `scrolls/adapters-to-one-place.md`'s own
rule: mocking a layer underneath would still intercept the call, but it would skip the wrapper's own
behavior, which is what the broker relies on. A caller's proxy shape becomes:

```ts
const handle = registerMock({ fn: currentBranch }); // imported from @dungeonmaster/bin/git
handle.calledWith([{ cwd }]).returns({ exitCode: ExitCodeStub({ value: 0 }), output: 'main' as ErrorMessage });
```

Inside the gateway's own wrappers, the address is still the command, exactly as today's adapter proxies do
it — this part of the convention does not change, only which file it lives in. `child_process/run.proxy.ts`
carries the same `ChildProcess` fake the adapter proxy it replaces built (an `EventEmitter` plus `Readable`
stdout/stderr, firing `'exit'`/`'error'` on `setImmediate`), plus a `neverDrain` knob for a descendant
process that holds a stdio pipe open past the child's own exit.

`packages/testing/src/adapters/child-process/mocker/child-process-mocker-adapter.ts` is the one exception:
its whole job is mocking `child_process.spawn` directly via `jest.doMock`, for a caller that wants to
simulate `spawn` before any gateway wrapper exists around it. It is not migrated into the gateway — it has no
outside-world call of its own to wrap, and stays in `@dungeonmaster/testing`. Whether it is still useful once
every caller under it tests a gateway wrapper's own proxy instead is a question for the consumption phase.

The `.child-process` address convention — mocking by the COMMAND — is documented in
`packages/testing/CLAUDE.md`'s own table, alongside `path`'s SEGMENTS and `fetch`'s URL. The gateway's own
proxies inherit this table unchanged.
