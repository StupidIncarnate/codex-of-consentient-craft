# Ward Package

## What This Package Does

Ward is a quality orchestration CLI tool (`dungeonmaster-ward`) that runs lint, typecheck, test, and e2e checks across
all packages in the monorepo. It discovers project folders, runs checks sequentially per package, parses structured JSON
output from each tool, and persists results for drill-down inspection via `list`, `detail`, and `raw` subcommands.

## CLI Usage

The binary is `dungeonmaster-ward`. It has four subcommands:

```
dungeonmaster-ward run                        # Run checks (default if no subcommand given)
dungeonmaster-ward list [run-id]              # List errors by file from most recent (or specified) run
dungeonmaster-ward detail <run-id> <file>     # Show detailed errors for a specific file
dungeonmaster-ward raw <run-id> <check-type>  # Show raw tool output for a check type
```

Running `dungeonmaster-ward` with no arguments is equivalent to `dungeonmaster-ward run`.

## Flags

All flags apply to the `run` subcommand. The `detail` subcommand also accepts `--verbose`.

| Flag                             | Description                                                                |
|----------------------------------|----------------------------------------------------------------------------|
| `--only lint,typecheck,test,e2e` | Comma-separated list of check types to run. Omit to run all four.          |
| `--glob "pattern"`               | Scope checks to files matching a glob pattern, resolved from project root. |
| `--changed`                      | Scope checks to files changed in git (uses `git diff`).                    |
| `-- file1 file2`                 | Passthrough file list. Everything after `--` is treated as file paths.     |
| `--verbose`                      | Enable verbose output.                                                     |

## Common Invocation Patterns

```bash
# Run all checks (lint, typecheck, test, e2e) across all packages
dungeonmaster-ward run

# Lint only
dungeonmaster-ward run --only lint

# Test a single file
dungeonmaster-ward run --only test -- path/to/file.test.ts

# Lint files matching a glob
dungeonmaster-ward run --only lint --glob "*pattern*"

# Run multiple check types
dungeonmaster-ward run --only lint,test

# Lint only changed files
dungeonmaster-ward run --only lint --changed

# Inspect results after a run
dungeonmaster-ward list                          # errors from latest run
dungeonmaster-ward list <run-id>                 # errors from a specific run
dungeonmaster-ward detail <run-id> <file-path>   # drill into a file's errors
dungeonmaster-ward raw <run-id> lint             # raw eslint JSON output
```

## How File Scoping Works

Ward supports three file scoping mechanisms: passthrough (`--`), glob (`--glob`), and changed (`--changed`). When any
of these are active, ward considers the run to have "file scope."

- **No file scope**: Each check runs against all files in each discovered package.
- **Passthrough (`--`)**: The provided file paths are matched to packages by prefix. Each package only receives files
  that belong to it. Packages with no matching files are skipped entirely.
- **Glob (`--glob`)**: The pattern is resolved from the project root. Matched files are distributed to their respective
  packages.
- **Changed (`--changed`)**: Uses `git diff` to discover changed files. Those files are then distributed to packages
  the same way as glob.

**Special cases:**

- **Typecheck** always runs `tsc --noEmit` on the entire package regardless of file scope. There is no way to
  typecheck individual files with tsc.
- **e2e** only runs when there is NO file scope AND the working directory is NOT a sub-package. When either condition
  is true, e2e is skipped.

## Underlying Commands

Ward spawns these commands in each package directory:

| Check Type | Command                               | With File Scope                                                                 |
|------------|---------------------------------------|---------------------------------------------------------------------------------|
| lint       | `npx eslint --format json .`          | `npx eslint --format json <file1> <file2> ...` (replaces `.` with file list)    |
| typecheck  | `npx tsc --noEmit`                    | `npx tsc --noEmit` (unchanged, always full project)                             |
| test       | `npx jest --json --no-color`          | `npx jest --json --no-color --runInBand --findRelatedTests <file1> <file2> ...` |
| e2e        | `npx playwright test --reporter json` | Skipped when file scope is active                                               |

## Architecture

The broker chain for a `run` invocation:

```
start-ward.ts (entry point, routes subcommands)
  -> command-run-broker (sets up run)
    -> orchestrate-run-all-broker (discovers packages, resolves file scope, iterates check types)
      -> orchestrate-run-all-layer-check-broker (dispatches to the right check runner)
        -> check-run-lint-broker   (spawns eslint, parses JSON output)
        -> check-run-typecheck-broker (spawns tsc)
        -> check-run-test-broker   (spawns jest, parses JSON output)
      -> check-run-e2e-broker (spawns playwright, handled separately)
    -> storage-save-broker (persists WardResult to disk)
    -> storage-prune-broker (cleans old results)
```

Check types are iterated sequentially. Within each check type, packages are iterated sequentially. Results are
aggregated into a `WardResult` and saved for later inspection via `list`, `detail`, and `raw` subcommands.
