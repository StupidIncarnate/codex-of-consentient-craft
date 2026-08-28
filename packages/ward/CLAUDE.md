# Ward Package

## What This Package Does

Ward is a quality orchestration CLI tool (`npm run ward`) that runs lint, typecheck, unit, integration, and e2e checks.
It
operates in two modes depending on whether the current project has npm workspaces:

- **Single-package mode** (no workspaces): Runs checks directly in the current working directory.
- **Multi-package mode** (has workspaces): Spawns ward in each workspace package sequentially and combines results.

Ward parses structured JSON output from each tool and persists results for drill-down inspection via `list`, `detail`,
and `raw` subcommands.

## CLI Usage

The binary is `dungeonmaster-ward`. It has four subcommands:

```
npm run ward                                       # Run checks (default if no subcommand given)
```

For inspecting results after a run, use: `npm run ward -- detail <runId> <filePath>`.

Running `npm run ward` with no arguments is equivalent to `npm run ward -- run`.

## Check Types

| Check Type    | Tool       | Description                                                |
|---------------|------------|------------------------------------------------------------|
| `lint`        | ESLint     | Linting with `--fix`                                       |
| `typecheck`   | tsc        | TypeScript type checking                                   |
| `unit`        | Jest       | Unit tests (`*.test.ts`, excludes `*.integration.test.ts`) |
| `integration` | Jest       | Integration tests (`*.integration.test.ts` only)           |
| `e2e`         | Playwright | End-to-end browser tests                                   |
| `test`        | *(alias)*  | Expands to `unit,integration,e2e` (runs all three)         |

**`test` is a virtual alias**, not a real check type. `--only test` expands to `--only unit,integration,e2e` during CLI
parsing. Deduplication is automatic: `--only test,e2e` becomes `--only unit,integration,e2e`.

## Flags

All flags apply to the `run` subcommand.

| Flag                                         | Description                                                                             |
|----------------------------------------------|-----------------------------------------------------------------------------------------|
| `--only lint,typecheck,unit,integration,e2e` | Comma-separated list of check types to run. Omit to run all five.                       |
| `--onlyTests <regex>`                        | Filter tests by name pattern. Requires a `-- <files>` scope. Maps to Jest `--testNamePattern` and Playwright `--grep`. |
| `--changed`                                  | Run every check type over the files that differ from the local default branch.          |
| `--staged`                                   | Run every check type over the files origin does not have yet.                           |
| `-- file1 file2`                             | Passthrough file list. Everything after `--` is treated as file paths.                  |

### The two git scope flags take no companions

`--changed` and `--staged` each run **all five check types** over a file set that git decides. Neither accepts `--only`,
`--onlyTests`, or a `-- <files>` list, and the two cannot be combined with each other. Ward rejects those combinations
at CLI parse time with an error naming the offending flags, rather than picking a winner between two file sets.

```bash
npm run ward -- --staged                 # correct
npm run ward -- --staged --only lint     # rejected
npm run ward -- --changed -- packages/ward  # rejected
npm run ward -- --changed --staged       # rejected
```

To narrow a run, drop the git scope flag and say what you want directly: `npm run ward -- --only lint -- <files>`.

**`--onlyTests` accepts a regex pattern.** Use `|` for alternation: `--onlyTests "foo|bar"` runs tests matching either
name. Ignored by lint and typecheck check types.

### `--onlyTests` requires a `-- <files>` scope

`--onlyTests` is a test NAME filter and scopes nothing on its own. `filteredFolders` in
`commandRunLayerMultiBroker` narrows on `passthrough` alone, so without a file list ward spawns a child in every
workspace package, and the pattern reaches Jest as `--testNamePattern`, which filters at EXECUTION — after each package
has collected and transformed every test file it owns. Measured: an unscoped `--only unit --onlyTests` run took **355s
across 13 packages and 2560 transformed files to run 4 tests**; `web` and `shared` each paid over two minutes to report
`skip`. `cliArgsParseTransformer` therefore rejects `--onlyTests` without a trailing `-- <files>` list, naming the fix.

A **bare `--` sets no passthrough**, so it is not a file scope and does not satisfy the rule.

**A child ward is exempt, and only a child.** `commandRunLayerMultiBroker` spawns one child per
package `filteredFolders` already picked, so the monorepo sweep the rule prevents cannot happen
there — and a whole-package arg (`-- packages/ward`) slices to an empty per-file list, so there is
nothing left to put after the child's own `--`. The parent therefore appends
`wardSpawnCommandStatics.parentScopedFlag` alongside `--onlyTests`, and `cliArgsParseTransformer`
reads it as a LOCAL BOOLEAN that suppresses this one rule. It is deliberately not a `WardConfig`
field: it scopes nothing, so `isFileScopeRequestedGuard` and `isExplicitPathScopeGuard` would have
no honest classification for it. It is also absent from the flag list the unknown-flag error
prints — nobody types it by hand.

The rejection lives after the git scope checks, so `--changed`/`--staged` keep winning: those two already reject
`--onlyTests` outright, and their caller gets one error about the flag they typed rather than a second one demanding a
file list they are forbidden to pass.

```bash
npm run ward -- --only unit --onlyTests "my test" -- packages/ward/src/foo.test.ts   # correct
npm run ward -- --only unit --onlyTests "my test"                                    # rejected
npm run ward -- --only unit --onlyTests "my test" --                                 # rejected
```

**`--onlyTests` is judged across the whole run, not per package.** A test name usually lives in exactly one package, so
in multi-package mode every other package the scope reached reports zero matches. Those packages are reported as `skip`.
The run fails with `--onlyTests pattern "X" matched 0 tests in any package` only when no package the pattern reached
matched anything — which is what a typo or a stale test name looks like.

**A scoped run that reaches no package at all is a different silence, and `hasUnmatchedTestNamePatternGuard` does not
catch it.** Every early return that skips before a runner is spawned — `discoveredCount === 0`, `no matching unit test
files in passthrough`, a package that is not e2e-eligible — records NO `testNamePatternMatch`, so `reached.length` is 0
and the guard's own precondition fails. Reproduced live: `--only e2e --onlyTests "XYZNONEXISTENT" -- <a ward test file>`
exits 0 having run nothing, because `@dungeonmaster/ward` is not e2e-eligible. `hasCheckDiscoveryMismatchGuard` and
`hasNoFilesProcessedGuard` cover the neighbouring shapes but not this one: the first needs `discoveredCount > 0`, and
the second drops checks whose status is `skip`.

## Common Invocation Patterns

```bash
# Run all checks (lint, typecheck, unit, integration, e2e) across all packages
npm run ward

# Lint only
npm run ward -- --only lint

# Run all tests (unit + integration + e2e)
npm run ward -- --only test

# Run only Jest unit tests (excludes integration tests)
npm run ward -- --only unit

# Run only Jest integration tests
npm run ward -- --only integration

# Run only Playwright e2e tests
npm run ward -- --only e2e

# Test a single file (unit tests)
npm run ward -- --only unit -- path/to/file.test.ts

# Scope all checks to a single package
npm run ward -- -- packages/hooks

# Scope specific checks to a single package
npm run ward -- --only test --only lint --only typecheck -- packages/hooks

# Run multiple check types
npm run ward -- --only lint,unit

# All checks, scoped to files that differ from the local default branch
npm run ward -- --changed

# All checks, scoped to everything origin does not have yet — the pre-push gate
npm run ward -- --staged

# Run only tests matching a name pattern — the -- <files> scope is required
npm run ward -- --only unit --onlyTests "my specific test" -- packages/hooks/src/foo.test.ts

# Run tests matching multiple patterns (regex alternation)
npm run ward -- --only test --onlyTests "user|auth" -- packages/hooks

# Combine file scoping with test name filtering
npm run ward -- --only unit --onlyTests "validates input" -- packages/hooks
```

**Inspect results after a run** — use CLI:

- `npm run ward -- detail <runId> <filePath>` — drill into a file's errors

## Workflow: run → detail

When ward finds failures, it prints a summary with truncated error info. To get full details (especially jest diffs for
test failures), use the detail subcommand:

1. Run checks: `npm run ward -- --only lint,test`
2. Run `npm run ward -- detail <runId> <filePath>` to drill into a specific file's errors

**Why this matters:** The `run` output truncates test failure messages to the first line. The `detail` subcommand shows
the full `toStrictEqual` diff, which is what you need to actually fix the test. Always follow the hint at the bottom of
a failing run.

## How File Scoping Works

Ward has three file scoping mechanisms: passthrough (`--`), changed (`--changed`), and staged (`--staged`). When any of
them is active, ward considers the run to have "file scope."

- **No file scope**: Each check runs against all files in each package.
- **Passthrough (`--`)**: The provided paths are passed directly to the check tool. Accepts both file paths
  (`-- packages/hooks/src/foo.test.ts`) and package paths (`-- packages/hooks`). A package path runs all checks in that
  package without file-level scoping.
- **Changed (`--changed`)**: Diffs against the merge-base with the **local** `main` or `master`, then passes the
  resulting files to each check tool.
- **Staged (`--staged`)**: Diffs against the merge-base with the branch's **upstream tracking ref**, so the file set is
  everything origin does not have: files touched by commits that have not been pushed, plus staged and unstaged edits on
  top of them. Use it as a pre-push gate. When the branch has no tracking ref it falls back to `origin/main`, then
  `origin/master`; when the repo has no origin refs at all it falls back to what `--changed` would produce.

The two git scope flags resolve to a plain file list before any check runs, so from a check runner's point of view
`--changed` and `--staged` are indistinguishable from a `-- <files>` passthrough. Non-source paths (`.md`, `.json`) are
dropped from that list, because ESLint reports a "file ignored" error for a non-source file handed to it explicitly.

**Empty file set: the run is EMPTY, not wide.** When a run ASKED for a file scope and has zero source files left
(nothing changed, nothing unpushed, or an explicitly empty `-- <files>` list), `command-run-broker` prints
`fileScopeEmptyStatics.message` and returns before any check runs — exit 0, no result saved, so `ward detail <runId>`
has nothing to load and `wardDetailBroker` answers `null`.

**The two halves are different questions, asked of different objects.** Whether a file scope was REQUESTED comes from
`isFileScopeRequestedGuard`, over the config the caller handed in; whether it RESOLVED comes from `passthrough` on the
config the git scope layer returned. A git scope that DID resolve to files is an ordinary scoped run and still runs.

**Every `wardConfigContract` field is classified in `isFileScopeRequestedGuard`**, as
`satisfies Record<keyof WardConfig, WardScopeKind>` over `fileScope` / `typeFilter` / `testNameFilter`. Adding a field
to the contract without a kind fails `tsc`; so does a kind outside the union, or a leftover key for a field the
contract no longer has. A new FILE-SCOPING flag therefore inherits the empty-scope short-circuit the day it is added,
and cannot be forgotten at a call site — there is no list of flag names spelled anywhere in the broker.

**Do not express "no files" by leaving `passthrough` unset.** `hasPassthrough` is
`Array.isArray(passthrough) && length > 0` in five separate places, so an unset list — and an empty one — both read
there as "no file scope", which is the whole repo. The lesson cost real time: a round reviewer pushes its own round,
so the NEXT reviewer's `--staged` has nothing left to measure, and on quest a7520e60 one such run swept 13 packages
including e2e in 858s while another crossed the 600s harness timeout. Both were read as the round's green verdict.

**A path that exists and that no check processed FAILS the run — but only when the caller typed it.** After the summary
prints, `commandRunBroker` asks two questions: `isExplicitPathScopeGuard` over the config the CALLER handed in, and
`hasNoFilesProcessedGuard` over the finished `WardResult`. Both true means the scope named real paths and every
file-scoped check still reported zero files — `npm run ward -- --only lint -- scripts/build-workspaces.mjs`, where
`scripts/**` is in eslint.config.js `ignores` and belongs to no workspace package. Ward prints
`noFilesProcessedStatics` naming the paths and exits 1.

Three things make that predicate survive the runs it must not redden:

- **Typecheck does not count.** It is classified `false` in `hasNoFilesProcessedGuard`'s
  `satisfies Record<CheckType, boolean>` table, because `tsc` has no per-file mode:
  `--only typecheck -- scripts/build-workspaces.mjs` reports 6145 files for a path tsc never saw. Counting it would
  make the answer `false` for every run that includes typecheck.
- **A skipped check is not evidence.** Jest's "No tests found" becomes `status: 'skip'`, and a non-e2e-eligible package
  skips e2e outright. A run left with no file-scoped check at all (`--only typecheck`) therefore does not fail.
- **A crashed project is not evidence either.** `commandRunLayerChildCrashBroker` synthesises a failing `ProjectResult`
  whose `filesCount` is the contract default 0, so a child ward that died would otherwise print the NO CHECK PROCESSED
  block under its own crash report — two true statements, the wrong cause. `hasNoFilesProcessedGuard` drops crashed
  results via `isCrashedProjectResultGuard`, per project result: a package that really did look at the scope and find
  nothing still counts, and only a check whose EVERY project result crashed loses its vote. An empty `projectResults`
  keeps its vote, because no child spawning at all is the shape the guard exists for.
- **The answer is run-level, not per-path.** `--findRelatedTests` reports the related TEST file rather than the source
  file it was handed, and `ProjectResult` records `filesCount` (a count) plus `onlyProcessed` (a set difference against
  discovery) — never the processed list. One check processing anything clears the whole scope.

**Git-derived paths are exempt, and that is why the guard reads `config` and not `resolvedConfig`.**
`commandRunLayerGitScopeBroker` writes a `--changed`/`--staged` diff into the same `passthrough` field an explicit
`-- <files>` list lands in, so the field alone cannot say who asked. `isExplicitPathScopeGuard` answers false whenever
`changed` or `staged` is set — a diff legitimately holds root-level files nothing lints, and reddening those would
break the pre-push gate. Like `isFileScopeRequestedGuard` it classifies every `wardConfigContract` field
(`satisfies Record<keyof WardConfig, WardPathOrigin>`), so a second way to name paths cannot be added without deciding
whether a human typed it.

**ESLint answers for files it refused to lint, and those do not count as processed.** Hand eslint an explicitly-named
path its config ignores and it emits a FULL result entry — same shape as a linted file, `errorCount: 0`, one
ruleId-less severity-1 "File ignored…" warning — so the JSON array length counted files it never opened and
`--only lint -- packages/web/src/jest-dom.d.ts` reported `1 files passed`. `isEslintIgnoredResultGuard` filters those
out of `filesCount`/`discoveredCount` in `checkRunLintBroker`. Only an explicit path produces the entry; a directory
walk skips ignored files silently, which is why a whole-repo run never showed the miscount.

**Special case:** Typecheck always runs on the entire package regardless of file scope. There is no way to typecheck
individual files with tsc.

**Typecheck is the one check that WRITES.** In multi-package mode with project references, `command-run-broker` runs
`checkCommandsStatics.typecheckRefs` — `tsc -b --listFiles`, once, from the repo root — instead of the per-package
`tsc --noEmit`. `tsc -b` is BUILD mode: it emits into each package's `outDir` and writes `.tsbuildinfo`, so a ward run
that includes `typecheck` is a build by another name. Two of them at once corrupt the shared `dist/`. That is why the
orchestrator lets exactly one session per round run a ward, and why a worker's scoped ward carries `lint` plus tests
and never `typecheck`. The non-emitting per-package path is still reachable: a project-references cycle makes
`command-run-broker` fall back to it.

## Underlying Commands

Ward spawns these commands per package:

| Check Type  | Command                                                                             | With File Scope                                                              |
|-------------|-------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| lint        | `npx eslint --format json .`                                                        | `npx eslint --format json <file1> <file2> ...` (replaces `.` with file list) |
| typecheck   | `npx tsc --noEmit`                                                                  | `npx tsc --noEmit` (unchanged, always full project)                          |
| unit        | `npx jest --json --no-color --testPathIgnorePatterns '\\.integration\\.test\\.ts$'` | Same + `--runInBand --findRelatedTests <files>`                              |
| integration | `npx jest --json --no-color --testPathPatterns '\\.integration\\.test\\.ts$'`       | Same + `--runInBand --findRelatedTests <files>`                              |
| e2e         | `npx playwright test --reporter=json`                                               | `npx playwright test --reporter=json <file1> <file2> ...`                    |

**`--onlyTests` mapping:** When `--onlyTests <regex>` is provided, ward appends `--testNamePattern <regex>` to Jest
commands (unit/integration) and `--grep <regex> --pass-with-no-tests` to Playwright commands (e2e). Lint and typecheck
ignore it. `--pass-with-no-tests` keeps Playwright from failing a package on its own when the grep matches nothing
there; whether that is a real failure is decided once for the whole run.

**E2e eligibility gate:** The e2e broker first asks `architecturePackageE2eEligibleDetectBroker`
(`@dungeonmaster/shared`) whether the package's own `src/` layout and `package.json` qualify it as
e2e-eligible — `widgets/` plus either a React dependency or the `ink` adapter. A non-eligible package
(most backends, CLIs, libraries) returns `status: 'skip'` without ever checking for
`playwright.config.ts`. An **eligible** package missing `playwright.config.ts` returns `status: 'fail'`
— that combination is a real gap, not something to skip quietly. Only an eligible package WITH the
config proceeds to spawn Playwright.

## Architecture

The broker chain for a `run` invocation:

```
start-ward.ts (entry point, routes subcommands)
  -> command-run-broker (sets up run)
    -> orchestrate-run-all-broker (detects single vs multi-package, resolves file scope, iterates check types)
      -> orchestrate-run-all-layer-check-broker (dispatches to the right check runner)
        -> check-run-lint-broker      (spawns eslint, parses JSON output)
        -> check-run-typecheck-broker (spawns tsc)
        -> check-run-unit-broker      (spawns jest, parses JSON output, excludes integration tests)
        -> check-run-integration-broker (spawns jest, parses JSON output, integration tests only)
        -> check-run-e2e-broker       (spawns playwright, parses JSON output)
    -> storage-save-broker (persists WardResult to disk)
    -> storage-prune-broker (cleans old results)
```

**A child's result is loaded BY ID or not at all.** `storageLoadBroker` called without a `runId` returns the newest
file in that package's `.ward/` — the PREVIOUS run — so `commandRunLayerMultiBroker` only ever asks for the id the
child printed on its `run: <id>` summary line, and treats a missing id as a crash
(`commandRunLayerChildCrashBroker`). Skipping that distinction reported a child killed at CLI-parse time as whatever
the package last managed to do, at exit 0: `unit: PASS 1 packages (163 discovered) 2.0s` for a run whose entire wall
clock was 0.2s, byte-identical across consecutive invocations. It defeats `hasNoFilesProcessedGuard` too, because the
stale result claims files were processed. A child that reached its summary always printed the line — the summary and
the result file come from the same `wardResult` — and the two paths that return before it (an empty file scope, a path
not on disk) write neither, so a missing id means no result of this run exists to merge.

In multi-package mode, `orchestrate-run-all-broker` spawns a child ward process in each workspace package and
aggregates their results. Check types are iterated sequentially. Results are aggregated into a `WardResult` and saved
for later inspection via `list`, `detail`, and `raw` subcommands.
