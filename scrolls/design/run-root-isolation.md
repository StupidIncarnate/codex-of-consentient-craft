# Run-root isolation: one way to answer "which checkout is this work for?"

## The defect class

The prod server runs from the main checkout. Every quest works in its own worktree under `worktrees/<name>`. Code that
does work FOR a quest, but finds a directory, a module or a binary from the process it happens to run in, acts on the
main checkout instead. A walk "passes" against master's code, a contract the quest just wrote is refused as missing,
a recipe the quest just wrote is "unknown".

Measured on 2026-10-01 (quest 1918a5ee, siege `happyWalk` walled on `Unknown recipe`):

- `laneProvisionBatchBroker` calls siegelense's `instanceStartBroker` in the server process. It read the repo root from
  `cwd()` (the main checkout), spawned the driver there, and resolved the CLI bin from the server's own install. Every
  lane the router started served master's web, API, recipes and `.dungeonmaster.json`.
- `quest-modify-broker` checked contract `source` paths and `packagesAffected` against `questRepoRootBroker` (the main
  checkout) during `in_progress`.
- `lane-kill-broker` and `step-handler-cleanup-broker` ran the server's own siegelense against the main checkout.

## Why it kept happening

`@dungeonmaster/no-bare-process-cwd` already bans `process.cwd()` outside entry points. It allowlists the gateway's own
`process` wrapper, and that wrapper exports `cwd`. Every caller imports `cwd` from `#gateway/node/process`, so the rule
never fires. 29 production files read it, at any depth. A broker written for a CLI (where the ambient cwd is right) was
then called from the server (where it is always the main checkout).

`require.resolve` of our own packages has the same shape: it answers "where is THIS process installed", which is the
main checkout inside the server.

## The rule, stated once

**The entry layer may read where it is running. Everything below it takes the location as a parameter.**

| Need | The one way | Allowed ambient reads |
|---|---|---|
| A repo root for CLI or hook work | the entry point reads `cwd()` and passes a `RepoRootCwd` down | `startup/` and `responders/` files only |
| A repo root for QUEST work | `questCwdResolveBroker` — the worktree once carved, the repo root before | `questRepoRootBroker` only inside `quest-cwd-resolve-broker` and the riftcarver step handler |
| A module of ours at runtime | `moduleResolveBroker({ specifier, repoRoot })` in `@dungeonmaster/shared/brokers` | `require.resolve` only inside that broker |
| A binary of ours | `packageBinResolveBroker({ binName, repoRoot })` in `@dungeonmaster/shared/brokers` | none — never a bare command name |

`moduleResolveBroker` resolves from `repoRoot` first (Node's own `node_modules` walk), and falls back to this process's
own install only when `repoRoot` has none — the global-install-only consumer (CLAUDE.md scenario 4). Its result says
which one answered.

A broker's location parameter is REQUIRED. A default of `cwd()` is how a forgotten argument silently picks the wrong
checkout.

## Enforcement

| Rule | Package | What it refuses |
|---|---|---|
| `@dungeonmaster/no-bare-process-cwd` | eslint-plugin (shipped) | `process.cwd()` AND a call of `cwd` imported from `#gateway/node/process` (any alias), outside `startup/`, `responders/` and the gateway's own process wrapper |
| `@dungeonmaster-local/ban-ambient-module-resolve` | local-eslint | `require.resolve(...)` in production code outside `moduleResolveBroker` |
| `@dungeonmaster-local/enforce-quest-cwd-resolve` | local-eslint | importing `questRepoRootBroker` outside its allowlist |
| `@dungeonmaster-local/ban-self-located-repo-lookup` | local-eslint | unchanged check; its message no longer recommends `process.cwd()` |

All at `error` from the first commit. Lint can force a parameter; it cannot check the caller passed the right one, so
the server-side paths (lane start, lane kill, cleanup, modify-quest) each carry a test where the server's cwd and the
quest's worktree differ, asserting the worktree is used.

## Not covered here

- Generated Claude hook commands are bare names (`dungeonmaster-pre-edit-lint`). A dispatched agent is safe: its PATH
  starts with the worktree's `node_modules/.bin`. An interactive session opened in a worktree runs main's hooks. Owner:
  hooks package; needs a decision on how Claude Code resolves a hook command's PATH before changing what `init` writes.
- The driver caches the recipes module for its lifetime (`dynamicImport`). A lane is per walker piece, so a rebuild
  mid-lane is the only miss.
- The served-build staleness check runs only for `siegelense start`, not for a lane the router starts.
