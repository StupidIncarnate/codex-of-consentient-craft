# Gateway build: follow-ups for the migration/consumption phase

Each entry names a decision made while building a gateway module and the existing callers whose
behavior it changes, so the migration phase reviews them rather than assuming a straight swap.

## `@dungeonmaster/bin/git` and `@dungeonmaster/bin/kill` (bin agent)

### Where the lsof+kill combining function belongs

The design (`scrolls/adapters-to-one-place.md` §2) proposed one `@dungeonmaster/bin/port` module
composing `lsof` and `kill` (`listeningPids` + `killByPort` + `portInUse`), because every existing
caller (`processKillByPortAdapter`, `netKillPortAdapter`, `netPortInUseAdapter`) uses the pair
together and never independently. The brief for this build requires one module per program, so this
build split it into `@dungeonmaster/bin/lsof` (`listeningPids`) and `@dungeonmaster/bin/kill`
(`killPid`, `killGroup`) instead. **The composing function — "list what's on this port, then kill
it" — has no home yet.** It is business logic over two bin primitives, not a wrapper around an
outside program, so it belongs in a broker (in whichever package ends up owning port-cleanup
logic — orchestrator and ward each have their own copy today) once the consumption phase migrates
`processKillByPortAdapter`, `netKillPortAdapter` and `netPortInUseAdapter` onto these two modules.

### Reconciliation: "current branch" (async vs sync, detached-HEAD convention)

`@dungeonmaster/bin/git`'s `currentBranch({cwd}) => Promise<string | null>` reconciles:

- `packages/orchestrator/src/adapters/git/current-branch/git-current-branch-adapter.ts` — async,
  returns `{exitCode, output}`, passes the literal string `'HEAD'` through for a detached worktree
  with no special-casing.
- `packages/siegelense/src/adapters/git/branch-read/git-branch-read-adapter.ts` — sync (`execSync`),
  returns `ContentText | null`, maps `''` or `'HEAD'` to `null`, and swallows EVERY failure (missing
  git, not a repo, permission denied, detached HEAD) into that same `null`.

The gateway version is **async** (orchestrator's shape) and returns **`null` for detached HEAD**
(siegelense's convention), but **throws** on a real git failure (non-zero exit, e.g. not a repo)
instead of swallowing it into `null` — closing the gap `scrolls/gateway-build/inventory/child-process-and-bin.md`
§5 names for `gitBranchReadAdapter`. Callers to review at migration:

- Every `gitCurrentBranchAdapter` caller in orchestrator that currently reads the literal string
  `'HEAD'` for a detached worktree must be updated to check for `null` instead, and to stop reading
  `{exitCode, output}` off the result (it is now a plain `string | null`).
- Every `gitBranchReadAdapter` caller in siegelense must switch from a synchronous call to an
  `await`ed one, and must be reviewed for whether it actually wants "not a repo" and "permission
  denied" to now throw rather than read as `null`.

### Reconciliation: `kill` invocation shape (signal + per-pid tolerance)

`@dungeonmaster/bin/kill`'s `killPid({pid, signal = 'SIGKILL'})` reconciles:

- `packages/orchestrator/src/adapters/process/kill-by-port/process-kill-by-port-adapter.ts` — SIGKILL
  (`kill -9 <pid>`), one call PER PID, each independently try/caught (an already-exited pid is
  tolerated, not a failure).
- `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts` — the DEFAULT signal (no `-9`),
  one BATCHED `kill <pids...>` call, and the batch's error argument is ignored outright (so a
  partial failure reads identically to full success — not real tolerance, just an unchecked error).

The gateway version keeps orchestrator's shape: SIGKILL, per-pid, and tolerant only in the sense that
`run` never throws on a non-zero exit — the caller reads `exitCode`/`output` to tell "already gone"
apart from a real refusal. **`netKillPortAdapter`'s callers in ward are the losing side of this
reconciliation** and need review at migration: moving to `killPid` per pid changes the signal sent
(`SIGKILL` instead of the default `SIGTERM`) and makes a partial failure visible instead of silently
swallowed — worth confirming this is what ward's e2e-artifact teardown wants before the swap.
