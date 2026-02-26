# Ward Package

## What This Package Does

Ward is a quality orchestration CLI tool (`npm run ward`) that runs lint, typecheck, unit, and e2e checks. It
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

For inspecting results after a run, use the MCP tools: `ward-list`, `ward-detail`, `ward-raw`.

Running `npm run ward` with no arguments is equivalent to `npm run ward -- run`.

## Check Types

| Check Type | Tool       | Description                          |
|------------|------------|--------------------------------------|
| `lint`     | ESLint     | Linting with `--fix`                 |
| `typecheck`| tsc        | TypeScript type checking             |
| `unit`     | Jest       | Unit/integration tests               |
| `e2e`      | Playwright | End-to-end browser tests             |
| `test`     | *(alias)*  | Expands to `unit,e2e` (runs both)    |

**`test` is a virtual alias**, not a real check type. `--only test` expands to `--only unit,e2e` during CLI parsing.
Deduplication is automatic: `--only test,e2e` becomes `--only unit,e2e`.

## Flags

All flags apply to the `run` subcommand. The `detail` subcommand also accepts `--verbose`.

| Flag                               | Description                                                            |
|------------------------------------|------------------------------------------------------------------------|
| `--only lint,typecheck,unit,e2e`   | Comma-separated list of check types to run. Omit to run all four.      |
| `--changed`                        | Scope checks to files changed in git (uses `git diff`).               |
| `-- file1 file2`                   | Passthrough file list. Everything after `--` is treated as file paths. |
| `--verbose`                        | Enable verbose output.                                                 |

## Common Invocation Patterns

```bash
# Run all checks (lint, typecheck, unit, e2e) across all packages
npm run ward

# Lint only
npm run ward -- --only lint

# Run all tests (unit + e2e)
npm run ward -- --only test

# Run only Jest unit tests
npm run ward -- --only unit

# Run only Playwright e2e tests
npm run ward -- --only e2e

# Test a single file (unit tests)
npm run ward -- --only unit -- path/to/file.test.ts

# Run multiple check types
npm run ward -- --only lint,unit

# Lint only changed files
npm run ward -- --only lint --changed
```

**Inspect results after a run** — use MCP tools:
- `ward-list` with runId — errors from a specific run
- `ward-detail` with runId + filePath — drill into a file's errors
- `ward-raw` with runId + checkType — raw tool output for a check type

## Workflow: run → list → detail

When ward finds failures, it prints a summary with truncated error info. To get full details (especially jest diffs for
test failures), use the MCP tools:

1. Run checks: `npm run ward -- --only lint,test`
2. Use MCP tool `ward-list` with the run ID to see full error messages and jest diffs
3. Use MCP tool `ward-detail` with the run ID and file path to drill into a specific file

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
| unit       | `npx jest --json --no-color`          | `npx jest --json --no-color --runInBand --findRelatedTests <file1> <file2> ...` |
| e2e        | `npx playwright test --reporter=json` | `npx playwright test --reporter=json <file1> <file2> ...`                       |

**E2e skip behavior:** The e2e broker checks for `playwright.config.ts` before spawning. If absent, it returns
`status: 'skip'` — packages without Playwright tests are skipped gracefully.

## Architecture

The broker chain for a `run` invocation:

```
start-ward.ts (entry point, routes subcommands)
  -> command-run-broker (sets up run)
    -> orchestrate-run-all-broker (detects single vs multi-package, resolves file scope, iterates check types)
      -> orchestrate-run-all-layer-check-broker (dispatches to the right check runner)
        -> check-run-lint-broker      (spawns eslint, parses JSON output)
        -> check-run-typecheck-broker (spawns tsc)
        -> check-run-unit-broker      (spawns jest, parses JSON output)
        -> check-run-e2e-broker       (spawns playwright, parses JSON output)
    -> storage-save-broker (persists WardResult to disk)
    -> storage-prune-broker (cleans old results)
```

In multi-package mode, `orchestrate-run-all-broker` spawns a child ward process in each workspace package and
aggregates their results. Check types are iterated sequentially. Results are aggregated into a `WardResult` and saved
for later inspection via `list`, `detail`, and `raw` subcommands.
