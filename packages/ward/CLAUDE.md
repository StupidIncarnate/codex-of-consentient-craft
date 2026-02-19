# Ward Package

## What This Package Does

Ward is a quality orchestration CLI tool (`npx dungeonmaster-ward`) that runs lint, typecheck, and test checks. It
operates in two modes depending on whether the current project has npm workspaces:

- **Single-package mode** (no workspaces): Runs checks directly in the current working directory.
- **Multi-package mode** (has workspaces): Spawns ward in each workspace package sequentially and combines results.

Ward parses structured JSON output from each tool and persists results for drill-down inspection via `list`, `detail`,
and `raw` subcommands.

## CLI Usage

The binary is `npx dungeonmaster-ward`. It has four subcommands:

```
npx dungeonmaster-ward run                        # Run checks (default if no subcommand given)
npx dungeonmaster-ward list [run-id]              # List errors by file from most recent (or specified) run
npx dungeonmaster-ward detail <run-id> <file>     # Show detailed errors for a specific file
npx dungeonmaster-ward raw <run-id> <check-type>  # Show raw tool output for a check type
```

Running `npx dungeonmaster-ward` with no arguments is equivalent to `npx dungeonmaster-ward run`.

## Flags

All flags apply to the `run` subcommand. The `detail` subcommand also accepts `--verbose`.

| Flag                          | Description                                                            |
|-------------------------------|------------------------------------------------------------------------|
| `--only lint,typecheck,test`  | Comma-separated list of check types to run. Omit to run all three.    |
| `--changed`                   | Scope checks to files changed in git (uses `git diff`).               |
| `-- file1 file2`              | Passthrough file list. Everything after `--` is treated as file paths. |
| `--verbose`                   | Enable verbose output.                                                 |

## Common Invocation Patterns

```bash
# Run all checks (lint, typecheck, test) across all packages
npx dungeonmaster-ward run

# Lint only
npx dungeonmaster-ward run --only lint

# Test a single file
npx dungeonmaster-ward run --only test -- path/to/file.test.ts

# Run multiple check types
npx dungeonmaster-ward run --only lint,test

# Lint only changed files
npx dungeonmaster-ward run --only lint --changed

# Inspect results after a run
npx dungeonmaster-ward list                          # errors from latest run
npx dungeonmaster-ward list <run-id>                 # errors from a specific run
npx dungeonmaster-ward detail <run-id> <file-path>   # drill into a file's errors
npx dungeonmaster-ward raw <run-id> lint             # raw eslint JSON output
```

## Workflow: run → list → detail

When ward finds failures, it prints a summary with truncated error info. To get full details (especially jest diffs for
test failures), use `list`:

```bash
# 1. Run checks — see summary with one-line errors
npx dungeonmaster-ward run --only lint,test
# Output includes: "Full error details: npx dungeonmaster-ward list <run-id>"

# 2. List errors — see full jest diffs and complete error messages
npx dungeonmaster-ward list <run-id>

# 3. Detail — drill into a specific file
npx dungeonmaster-ward detail <run-id> <file-path>
```

**Why this matters:** The `run` output truncates test failure messages to the first line. The `list` command shows the
full `toStrictEqual` diff, which is what you need to actually fix the test. Always follow the hint at the bottom of a
failing run.

## How File Scoping Works

Ward supports two file scoping mechanisms: passthrough (`--`) and changed (`--changed`). When either is active, ward
considers the run to have "file scope."

- **No file scope**: Each check runs against all files in each package.
- **Passthrough (`--`)**: The provided file paths are passed directly to the check tool.
- **Changed (`--changed`)**: Uses `git diff` to discover changed files, then passes them to each check tool.

**Special case:** Typecheck always runs `tsc --noEmit` on the entire package regardless of file scope. There is no way
to typecheck individual files with tsc.

## Underlying Commands

Ward spawns these commands per package:

| Check Type | Command                               | With File Scope                                                                 |
|------------|---------------------------------------|---------------------------------------------------------------------------------|
| lint       | `npx eslint --format json .`          | `npx eslint --format json <file1> <file2> ...` (replaces `.` with file list)   |
| typecheck  | `npx tsc --noEmit`                    | `npx tsc --noEmit` (unchanged, always full project)                             |
| test       | `npx jest --json --no-color`          | `npx jest --json --no-color --runInBand --findRelatedTests <file1> <file2> ...` |

## Architecture

The broker chain for a `run` invocation:

```
start-ward.ts (entry point, routes subcommands)
  -> command-run-broker (sets up run)
    -> orchestrate-run-all-broker (detects single vs multi-package, resolves file scope, iterates check types)
      -> orchestrate-run-all-layer-check-broker (dispatches to the right check runner)
        -> check-run-lint-broker      (spawns eslint, parses JSON output)
        -> check-run-typecheck-broker (spawns tsc)
        -> check-run-test-broker      (spawns jest, parses JSON output)
    -> storage-save-broker (persists WardResult to disk)
    -> storage-prune-broker (cleans old results)
```

In multi-package mode, `orchestrate-run-all-broker` spawns a child ward process in each workspace package and
aggregates their results. Check types are iterated sequentially. Results are aggregated into a `WardResult` and saved
for later inspection via `list`, `detail`, and `raw` subcommands.
