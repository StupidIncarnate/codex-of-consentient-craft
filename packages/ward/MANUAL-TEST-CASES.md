# Ward Manual Test Cases

Test cases for verifying ward's CLI behavior across scope levels, check types, and pass/fail scenarios.

## Output Format Reference

**Live progress** (stderr, shown during execution):

```
{checkType}  {packageName}  {STATUS}  {filesCount} files, {discoveredCount} discovered
{checkType}  {packageName}  skip
```

**Summary** (stdout, shown after all checks complete):

```
run: {runId}
{checkType}:  {STATUS}  {packageCount} packages ({passed} files passed/{failed} files failed, {discovered} discovered)
```

- Skipped checks appear as `skip` in live progress but are **omitted entirely** from the summary.
- The `--- {checkType} ---` error detail section only appears for failing checks.

---

## Coverage Grid

### Happy Path — Scope vs Check Type

Only the requested check type appears in the output. No other check types should be visible.

| ID                                                       | Command                                                    | Live output                 | Not in output        |
|----------------------------------------------------------|------------------------------------------------------------|-----------------------------|----------------------|
| [1a](#1a-single-unit-test-file)                          | `--only unit -- .../cli-args-parse-transformer.test.ts`    | `unit ... PASS 1 files`     | int, e2e, lint, tc   |
| [1b](#1b-implementation-file-finds-related-tests)        | `--only unit -- .../is-check-type-guard.ts`                | `unit ... PASS N files`†    | int, e2e, lint, tc   |
| [1d](#1d-directory-scope)                                | `--only unit -- .../transformers/cli-args-parse`           | `unit ... PASS N files`     | int, e2e, lint, tc   |
| [1e](#1e-multiple-directory-scope)                       | `--only unit -- .../cli-args-parse .../is-check-type`      | `unit ... PASS N files`     | int, e2e, lint, tc   |
| [1f](#1f-package-scope-all-unit-tests-in-package)        | `--only unit -- packages/ward`                             | `unit ... PASS 81 files`    | int, e2e, lint, tc   |
| [1g](#1g-no-scope-all-packages)                          | `--only unit`                                              | `unit ... PASS` (all pkgs)  | int, e2e, lint, tc   |
| [2a](#2a-single-integration-test-file)                   | `--only integration -- .../start-ward.integration.test.ts` | `int ... PASS 1 files`      | unit, e2e, lint, tc  |
| [2c](#2c-directory-scope-containing-integration-tests)   | `--only integration -- .../startup`                        | `int ... PASS N files`      | unit, e2e, lint, tc  |
| [2e](#2e-package-scope-all-integration-tests-in-package) | `--only integration -- packages/ward`                      | `int ... PASS 4 files`      | unit, e2e, lint, tc  |
| [2f](#2f-no-scope-all-packages)                          | `--only integration`                                       | `int ... PASS` (all pkgs)   | unit, e2e, lint, tc  |
| [3a](#3a-package-without-playwrightconfigts)             | `--only e2e -- packages/ward`                              | `e2e ... skip`              | unit, int, lint, tc  |
| [3b](#3b-no-scope-all-packages)                          | `--only e2e`                                               | `e2e ... PASS/skip` per pkg | unit, int, lint, tc  |
| [4a](#4a-single-implementation-file)                     | `--only lint -- .../is-check-type-guard.ts`                | `lint ... PASS 1 files`     | unit, int, e2e, tc   |
| [4b](#4b-single-test-file)                               | `--only lint -- .../is-check-type-guard.test.ts`           | `lint ... PASS 1 files`     | unit, int, e2e, tc   |
| [4c](#4c-integration-test-file)                          | `--only lint -- .../start-ward.integration.test.ts`        | `lint ... PASS 1 files`     | unit, int, e2e, tc   |
| [4d](#4d-multiple-files)                                 | `--only lint -- .../guard.ts .../guard.test.ts`            | `lint ... PASS 2 files`     | unit, int, e2e, tc   |
| [4e](#4e-package-scope-all-files)                        | `--only lint -- packages/ward`                             | `lint ... PASS 236 files`   | unit, int, e2e, tc   |
| [4f](#4f-no-scope-all-packages)                          | `--only lint`                                              | `lint ... PASS` (all pkgs)  | unit, int, e2e, tc   |
| [5a](#5a-single-file-scope--clean-project)               | `--only typecheck -- .../is-check-type-guard.ts`           | `tc ... PASS`\*             | unit, int, e2e, lint |
| [5b](#5b-package-scope)                                  | `--only typecheck -- packages/ward`                        | `tc ... PASS`\*             | unit, int, e2e, lint |
| [5c](#5c-no-scope-all-packages)                          | `--only typecheck`                                         | `tc ... PASS` (all pkgs)\*  | unit, int, e2e, lint |

`*` = typecheck always runs full project, post-filters errors to passthrough files
`†` = via `--findRelatedTests`, N depends on how many tests import the file
All commands prefixed with `npm run ward --`. Paths abbreviated with `...` — see linked detail for full path.

### Cross-Type Filtering — Wrong File Type Passed

These verify that check types **skip** (not run everything) when passthrough files don't match.

| ID                                                         | Command                                                                     | unit     | int      | e2e  | lint   | tc     |
|------------------------------------------------------------|-----------------------------------------------------------------------------|----------|----------|------|--------|--------|
| [1c](#1c-integration-test-file-passed-to-unit-should-skip) | `--only unit -- .../start-ward.integration.test.ts`                         | **skip** |          |      |        |        |
| [2b](#2b-unit-test-file-passed-to-integration-should-skip) | `--only integration -- .../cli-args-parse-transformer.test.ts`              |          | **skip** |      |        |        |
| [2d](#2d-directory-scope-with-no-integration-tests)        | `--only integration -- .../transformers`                                    |          | **skip** |      |        |        |
| [6a](#6a-all-tests-scoped-to-unit-test-file)               | `--only test -- .../cli-args-parse-transformer.test.ts`                     | PASS 1   | **skip** | skip |        |        |
| [6b](#6b-all-tests-scoped-to-integration-test-file)        | `--only test -- .../start-ward.integration.test.ts`                         | **skip** | PASS 1   | skip |        |        |
| [6c](#6c-all-check-types-scoped-to-unit-test-file)         | `--only test,lint,typecheck -- .../cli-args-parse-transformer.test.ts`      | PASS 1   | **skip** | skip | PASS 1 | PASS\* |
| [6d](#6d-mixed-file-types-in-passthrough)                  | `--only test -- .../transformer.test.ts .../start-ward.integration.test.ts` | PASS 1   | PASS 1   | skip |        |        |

**Bold** = the critical assertion (must skip, not run all tests)

### Failure Scenarios

All failures require modifying `is-check-type-guard.ts` or its `.test.ts` — see linked detail for exact change. **Revert
after each test.**

| ID                                                                    | Mutation                     | Command                                                         | unit     | int      | lint     | tc       |
|-----------------------------------------------------------------------|------------------------------|-----------------------------------------------------------------|----------|----------|----------|----------|
| [1h](#1h-unit-test-failure)                                           | flip assertion in `.test.ts` | `--only unit -- .../is-check-type-guard.test.ts`                | **FAIL** |          |          |          |
| [2g](#2g-integration-test-failure)                                    | flip assertion in int test   | `--only int -- .../start-ward.integration.test.ts`              |          | **FAIL** |          |          |
| [4g](#4g-lint-failure--single-file)                                   | add `var x` to `.ts`         | `--only lint -- .../is-check-type-guard.ts`                     |          |          | **FAIL** |          |
| [4h](#4h-lint-failure--file-scoped-other-files-clean)                 | add `var x` to `.ts`         | `--only lint -- .../is-check-type-guard.test.ts`                |          |          | PASS     |          |
| [4i](#4i-lint-failure--package-scope-catches-it)                      | add `var x` to `.ts`         | `--only lint -- packages/ward`                                  |          |          | **FAIL** |          |
| [5d](#5d-typecheck-failure--scoped-to-broken-file)                    | `const x: number = 'hello'`  | `--only typecheck -- .../is-check-type-guard.ts`                |          |          |          | **FAIL** |
| [5e](#5e-typecheck-failure--scoped-to-different-file-error-filtering) | `const x: number = 'hello'`  | `--only typecheck -- .../is-run-id-guard.ts`                    |          |          |          | PASS     |
| [5f](#5f-typecheck-failure--package-scope-catches-it)                 | `const x: number = 'hello'`  | `--only typecheck -- packages/ward`                             |          |          |          | **FAIL** |
| [9a](#9a-unit-fails-lint-and-typecheck-pass)                          | flip assertion in `.test.ts` | `--only unit,lint,typecheck -- .../is-check-type-guard.test.ts` | **FAIL** |          | PASS     | PASS     |
| [9b](#9b-lint-fails-unit-passes)                                      | add `var x` to `.ts`         | `--only lint,unit -- .../is-check-type-guard.ts`                | PASS     |          | **FAIL** |          |
| [9c](#9c-typecheck-fails-lint-passes-on-same-file)                    | `const x: number = 'hello'`  | `--only lint,typecheck -- .../is-check-type-guard.ts`           |          |          | PASS     | **FAIL** |

### Flag Behavior

| ID                                                  | Command                                                               | Checks that run               |
|-----------------------------------------------------|-----------------------------------------------------------------------|-------------------------------|
| [7a](#7a-comma-separated-types)                     | `--only lint,unit -- packages/ward`                                   | lint, unit                    |
| [7b](#7b---only-test-expands-to-unitintegratione2e) | `--only test -- packages/ward`                                        | unit, int, e2e                |
| [7c](#7c---only-testlint-deduplicates)              | `--only test,lint -- packages/ward`                                   | unit, int, e2e, lint          |
| [7d](#7d---only-teste2e-does-not-duplicate-e2e)     | `--only test,e2e -- packages/ward`                                    | unit, int, e2e (no dup)       |
| [8a](#8a-single-pattern-match)                      | `--only unit --onlyTests "EMPTY" -- .../transformer.test.ts`          | jest gets `--testNamePattern` |
| [8b](#8b-multiple-patterns-with-pipe)               | `--only unit --onlyTests "EMPTY\|VALID" -- .../transformer.test.ts`   | jest gets alternation         |
| [8c](#8c-pattern-that-matches-nothing)              | `--only unit --onlyTests "XYZNONEXISTENT" -- .../transformer.test.ts` | jest runs, 0 matches          |
| [8d](#8d---onlytests-ignored-by-lint-and-typecheck) | `--only lint,typecheck --onlyTests "foo" -- packages/ward`            | lint/tc ignore it             |
| [8e](#8e---onlytests-with-integration)              | `--only integration --onlyTests "exports" -- packages/ward`           | int respects it               |

### Edge Cases

| ID                                                      | Command                                                | Expected                |
|---------------------------------------------------------|--------------------------------------------------------|-------------------------|
| [10a](#10a-file-that-doesnt-exist)                      | `--only unit -- packages/ward/src/nonexistent.test.ts` | no crash, 0 files       |
| [10b](#10b---only-with-invalid-check-type)              | `--only banana -- packages/ward`                       | error message           |
| [10c](#10c-empty-passthrough-just---)                   | `--only unit --`                                       | no file scope, runs all |
| [10d](#10d---changed-flag-requires-uncommitted-changes) | `--only lint --changed`                                | scoped to git diff      |
| [10e](#10e---changed-with-multiple-check-types)         | `--only lint,unit,typecheck --changed`                 | each type scoped        |
| [10f](#10f-no-tests-discovered-in-package)              | `--only integration -- packages/eslint-plugin`         | skip                    |

---

## Detailed Test Cases

### 1. Unit Tests

Unit runs Jest with `--testPathIgnorePatterns \.integration\.test\.ts$|\.e2e\.test\.ts$`.
When passthrough files are provided, unit filters to only files that pass `isUnitTestPathGuard` (not
`.integration.test.ts`, not `.e2e.test.ts`). If all files get filtered out, unit skips entirely.
Implementation files (non-test) are passed via `--findRelatedTests` so Jest discovers their related tests.

#### 1a. Single unit test file

```bash
npm run ward -- --only unit -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts
```

**Expected:**

- Live: `unit @dungeonmaster/ward PASS  1 files, 81 discovered`
- Summary: `unit: PASS  1 packages (1 files passed/0 files failed, 81 discovered)`

**Should NOT see:**

- No integration, e2e, lint, or typecheck lines (not requested)

#### 1b. Implementation file (finds related tests)

```bash
npm run ward -- --only unit -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts
```

**Expected:**

- Live: `unit ... PASS  N files, 81 discovered` (jest --findRelatedTests finds tests that import this file)
- Summary: `unit: PASS ...`

#### 1c. Integration test file passed to unit (should skip)

```bash
npm run ward -- --only unit -- packages/ward/src/startup/start-ward.integration.test.ts
```

**Expected:**

- Live: `unit ... skip`
- Summary: empty (just `run: {id}`)

**Should NOT see:**

- unit must NOT show `PASS` — the `.integration.test.ts` file doesn't match unit filtering

#### 1d. Directory scope

```bash
npm run ward -- --only unit -- packages/ward/src/transformers/cli-args-parse
```

**Expected:**

- Live: `unit ... PASS  N files, 81 discovered`
- Jest receives `--testPathPatterns src/transformers/cli-args-parse` (directory pattern, not --findRelatedTests)

#### 1e. Multiple directory scope

```bash
npm run ward -- --only unit -- packages/ward/src/transformers/cli-args-parse packages/ward/src/guards/is-check-type
```

**Expected:**

- Jest receives `--testPathPatterns src/transformers/cli-args-parse|src/guards/is-check-type`
- Runs tests in both directories

#### 1f. Package scope (all unit tests in package)

```bash
npm run ward -- --only unit -- packages/ward
```

**Expected:**

- Live: `unit @dungeonmaster/ward PASS  81 files, 81 discovered`
- Runs ALL unit tests within the ward package only

**Should NOT see:**

- No other packages in the output

#### 1g. No scope (all packages)

```bash
npm run ward -- --only unit
```

**Expected:**

- Runs unit tests across ALL packages with src/ directories
- Live: one line per package
- Summary: `unit: PASS  N packages (...)`

#### 1h. Unit test failure

**Modify:** `packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts`
**Change:** Flip any `true` to `false` in an assertion (e.g., `expect(...).toBe(true)` -> `expect(...).toBe(false)`)

```bash
npm run ward -- --only unit -- packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts
```

**Expected:**

- Live: `unit @dungeonmaster/ward FAIL  1 files, 1 errors, 81 discovered`
- Summary: `unit: FAIL  1 packages (0 files passed/1 files failed, 81 discovered)  @dungeonmaster/ward (1)`
- Error detail section: `--- unit ---` with test name and failure message
- Exit code: non-zero

**Revert change after testing.**

---

### 2. Integration Tests

Integration runs Jest with `--testPathPatterns \.integration\.test\.ts$`.
When passthrough files are provided, integration filters to only files that are NOT identified by
`isNonIntegrationTestGuard` (keeps `.integration.test.ts` files, directories, and implementation files). If all files
get filtered out, integration skips entirely.

#### 2a. Single integration test file

```bash
npm run ward -- --only integration -- packages/ward/src/startup/start-ward.integration.test.ts
```

**Expected:**

- Live: `integration @dungeonmaster/ward PASS  1 files, 4 discovered`
- Summary: `integration: PASS  1 packages (...)`

#### 2b. Unit test file passed to integration (should skip)

```bash
npm run ward -- --only integration -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts
```

**Expected:**

- Live: `integration ... skip`
- Summary: empty (just `run: {id}`)

**Should NOT see:**

- integration must NOT show `PASS 4 files` — the `.test.ts` file doesn't match integration filtering

#### 2c. Directory scope containing integration tests

```bash
npm run ward -- --only integration -- packages/ward/src/startup
```

**Expected:**

- Live: `integration ... PASS N files, 4 discovered`
- Jest receives `--testPathPatterns (?:src/startup).*\.integration\.test\.ts$`

#### 2d. Directory scope with NO integration tests

```bash
npm run ward -- --only integration -- packages/ward/src/transformers
```

**Expected:**

- Live: `integration ... skip`
- Summary: empty

**Should NOT see:**

- integration must NOT discover and run all 4 integration tests in the package

#### 2e. Package scope (all integration tests in package)

```bash
npm run ward -- --only integration -- packages/ward
```

**Expected:**

- Live: `integration @dungeonmaster/ward PASS  4 files, 4 discovered`

#### 2f. No scope (all packages)

```bash
npm run ward -- --only integration
```

**Expected:**

- Runs integration tests across all packages
- Summary: `integration: PASS  N packages (...)`

#### 2g. Integration test failure

**Modify:** `packages/ward/src/startup/start-ward.integration.test.ts`
**Change:** Flip an assertion

```bash
npm run ward -- --only integration -- packages/ward/src/startup/start-ward.integration.test.ts
```

**Expected:**

- Live: `integration @dungeonmaster/ward FAIL  1 files, 1 errors, 4 discovered`
- Summary: `integration: FAIL  1 packages ...`
- Error detail section: `--- integration ---` with test name and failure message
- Exit code: non-zero

**Revert change after testing.**

---

### 3. E2E Tests

E2E runs Playwright. Skips entirely if no `playwright.config.ts` exists in the package.
E2E does NOT filter passthrough files by type — it passes them directly to Playwright.

#### 3a. Package without playwright.config.ts

```bash
npm run ward -- --only e2e -- packages/ward
```

**Expected:**

- Live: `e2e @dungeonmaster/ward skip`
- Summary: empty (just `run: {id}`)

#### 3b. No scope (all packages)

```bash
npm run ward -- --only e2e
```

**Expected:**

- Packages without playwright.config.ts show `skip`
- Only packages with playwright.config.ts actually run

---

### 4. Lint

Lint runs ESLint with `--format json`. When passthrough files are provided, ESLint receives those specific files instead
of `.` (the entire project). Lint does NOT filter by test type — any `.ts` file is valid.

#### 4a. Single implementation file

```bash
npm run ward -- --only lint -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts
```

**Expected:**

- Live: `lint @dungeonmaster/ward PASS  1 files, 236 discovered`
- Summary: `lint: PASS 1 packages (1 files passed/0 files failed, 236 discovered)`

#### 4b. Single test file

```bash
npm run ward -- --only lint -- packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts
```

**Expected:**

- Live: `lint @dungeonmaster/ward PASS  1 files, 236 discovered`
- Lint runs on any file type — test files are valid lint targets

#### 4c. Integration test file

```bash
npm run ward -- --only lint -- packages/ward/src/startup/start-ward.integration.test.ts
```

**Expected:**

- Live: `lint @dungeonmaster/ward PASS  1 files, 236 discovered`
- Lint does NOT skip for integration test files (unlike unit check)

#### 4d. Multiple files

```bash
npm run ward -- --only lint -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts
```

**Expected:**

- Live: `lint @dungeonmaster/ward PASS  2 files, 236 discovered`
- ESLint receives both files

#### 4e. Package scope (all files)

```bash
npm run ward -- --only lint -- packages/ward
```

**Expected:**

- Live: `lint @dungeonmaster/ward PASS  236 files, 236 discovered`
- ESLint runs on all files in the package

#### 4f. No scope (all packages)

```bash
npm run ward -- --only lint
```

**Expected:**

- Runs lint across ALL packages
- Live: one line per package
- Summary: `lint: PASS  N packages (...)`

#### 4g. Lint failure — single file

**Modify:** `packages/ward/src/guards/is-check-type/is-check-type-guard.ts`
**Change:** Add `var x = 1;` at the top of the file

```bash
npm run ward -- --only lint -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts
```

**Expected:**

- Live: `lint @dungeonmaster/ward FAIL  1 files, N errors, 236 discovered`
- Summary: `lint: FAIL  1 packages ...`
- Error detail: `--- lint ---` with file path and lint rule name
- Exit code: non-zero

**Revert change after testing.**

#### 4h. Lint failure — file scoped, other files clean

**Modify:** `packages/ward/src/guards/is-check-type/is-check-type-guard.ts` (add `var x = 1;`)

```bash
npm run ward -- --only lint -- packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts
```

**Expected:**

- Live: `lint @dungeonmaster/ward PASS  1 files, 236 discovered`
- The broken file is NOT in the passthrough — only the clean test file is linted
- Lint passes because the scoped file has no errors

**Revert change after testing.**

#### 4i. Lint failure — package scope catches it

**Modify:** `packages/ward/src/guards/is-check-type/is-check-type-guard.ts` (add `var x = 1;`)

```bash
npm run ward -- --only lint -- packages/ward
```

**Expected:**

- Live: `lint @dungeonmaster/ward FAIL  236 files, N errors, 236 discovered`
- Package scope lints all files including the broken one
- Error detail: `--- lint ---` with the modified file path

**Revert change after testing.**

---

### 5. Typecheck

Typecheck runs `tsc --noEmit`. It ALWAYS checks the entire project regardless of file scope.
When passthrough files are provided, typecheck post-filters errors: only errors in passthrough files are reported. If
tsc fails but no errors match the passthrough, status is reported as `pass`.
Skips if no `tsconfig.json` exists in the package.

#### 5a. Single file scope — clean project

```bash
npm run ward -- --only typecheck -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts
```

**Expected:**

- Live: `typecheck @dungeonmaster/ward PASS  N files, N discovered`
- tsc runs on the full project (ignores file scope for execution)

#### 5b. Package scope

```bash
npm run ward -- --only typecheck -- packages/ward
```

**Expected:**

- Live: `typecheck @dungeonmaster/ward PASS  N files, N discovered`

#### 5c. No scope (all packages)

```bash
npm run ward -- --only typecheck
```

**Expected:**

- Runs tsc in every package
- Summary: `typecheck: PASS  N packages (...)`

#### 5d. Typecheck failure — scoped to broken file

**Modify:** `packages/ward/src/guards/is-check-type/is-check-type-guard.ts`
**Change:** Add `const x: number = 'hello';` at the top

```bash
npm run ward -- --only typecheck -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts
```

**Expected:**

- Live: `typecheck @dungeonmaster/ward FAIL ...`
- Summary: `typecheck: FAIL  1 packages ...`
- Error detail: `--- typecheck ---` with the file path, line number, and TS error (e.g.,
  `Type 'string' is not assignable to type 'number'`)
- Exit code: non-zero

**Revert change after testing.**

#### 5e. Typecheck failure — scoped to DIFFERENT file (error filtering)

**Modify:** `packages/ward/src/guards/is-check-type/is-check-type-guard.ts`
**Change:** Add `const x: number = 'hello';` at the top

```bash
npm run ward -- --only typecheck -- packages/ward/src/guards/is-run-id/is-run-id-guard.ts
```

**Expected:**

- Live: `typecheck @dungeonmaster/ward PASS ...`
- tsc actually fails, but the error is in `is-check-type-guard.ts` which is NOT in the passthrough
- Typecheck post-filters errors and finds none matching the scoped file, so reports `pass`

**Should NOT see:**

- FAIL status — the error is outside the passthrough scope

**Revert change after testing.**

#### 5f. Typecheck failure — package scope catches it

**Modify:** `packages/ward/src/guards/is-check-type/is-check-type-guard.ts`
**Change:** Add `const x: number = 'hello';` at the top

```bash
npm run ward -- --only typecheck -- packages/ward
```

**Expected:**

- Live: `typecheck @dungeonmaster/ward FAIL ...`
- Package scope means no file filtering — all errors are reported
- Error detail: `--- typecheck ---` with the modified file

**Revert change after testing.**

---

### 6. Cross-Type File Filtering

These cases verify that each check type correctly handles files that belong to a different type.

#### 6a. All tests, scoped to unit test file

```bash
npm run ward -- --only test -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts
```

**Expected:**

- unit: `PASS  1 files` (file matches unit filter)
- integration: `skip` (file filtered out — not `.integration.test.ts`)
- e2e: `skip` (no playwright.config.ts)
- Summary: only `unit:` line

**Should NOT see:**

- integration showing `PASS N files` — must skip

#### 6b. All tests, scoped to integration test file

```bash
npm run ward -- --only test -- packages/ward/src/startup/start-ward.integration.test.ts
```

**Expected:**

- unit: `skip` (file filtered out — IS `.integration.test.ts`)
- integration: `PASS  1 files`
- e2e: `skip`
- Summary: only `integration:` line

#### 6c. All check types, scoped to unit test file

```bash
npm run ward -- --only test,lint,typecheck -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts
```

**Expected:**

- unit: `PASS  1 files`
- integration: `skip`
- e2e: `skip`
- lint: `PASS  1 files` (lint accepts any file type)
- typecheck: `PASS` (always runs full project)
- Summary: `unit:`, `lint:`, `typecheck:` lines. integration and e2e omitted.

#### 6d. Mixed file types in passthrough

```bash
npm run ward -- --only test -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts packages/ward/src/startup/start-ward.integration.test.ts
```

**Expected:**

- unit: runs on `cli-args-parse-transformer.test.ts` only (1 file)
- integration: runs on `start-ward.integration.test.ts` only (1 file)
- e2e: `skip`
- Summary: both `unit:` and `integration:` lines

**Should NOT see:**

- unit running all 81 tests
- integration running all 4 tests

---

### 7. Flag Combinations

#### 7a. Comma-separated types

```bash
npm run ward -- --only lint,unit -- packages/ward
```

**Expected:**

- Only lint and unit run
- Summary: `lint:` and `unit:` lines only

**Should NOT see:**

- integration, e2e, or typecheck lines

#### 7b. --only test expands to unit,integration,e2e

```bash
npm run ward -- --only test -- packages/ward
```

**Expected:**

- unit, integration, e2e all run
- e2e shows `skip` (no playwright.config.ts)
- Summary: `unit:` and `integration:` lines. e2e omitted.

**Should NOT see:**

- lint or typecheck lines

#### 7c. --only test,lint deduplicates

```bash
npm run ward -- --only test,lint -- packages/ward
```

**Expected:**

- Runs unit, integration, e2e, lint
- Summary: unit, integration, lint lines. e2e omitted.

**Should NOT see:**

- typecheck line
- Duplicate check type lines

#### 7d. --only test,e2e does not duplicate e2e

```bash
npm run ward -- --only test,e2e -- packages/ward
```

**Expected:**

- unit, integration, e2e run (e2e not duplicated from test expansion)
- e2e shows `skip` once

---

### 8. --onlyTests Pattern Filtering

`--onlyTests` maps to Jest `--testNamePattern` (unit/integration) and Playwright `--grep` (e2e).
Lint and typecheck ignore it entirely.

#### 8a. Single pattern match

```bash
npm run ward -- --only unit --onlyTests "EMPTY" -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts
```

**Expected:**

- Jest receives `--testNamePattern EMPTY`
- Only tests with "EMPTY" in the name run
- Summary: `unit: PASS ...`

#### 8b. Multiple patterns with pipe

```bash
npm run ward -- --only unit --onlyTests "EMPTY|VALID" -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts
```

**Expected:**

- Jest receives `--testNamePattern EMPTY|VALID`
- Tests matching either pattern run

#### 8c. Pattern that matches nothing

```bash
npm run ward -- --only unit --onlyTests "XYZNONEXISTENT" -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts
```

**Expected:**

- Jest runs but finds no matching test names
- Live: `unit ... PASS 0 files` or similar (jest exits 0 with no tests run)

#### 8d. --onlyTests ignored by lint and typecheck

```bash
npm run ward -- --only lint,typecheck --onlyTests "foo" -- packages/ward
```

**Expected:**

- lint and typecheck run normally (--onlyTests has no effect on them)
- Summary: `lint: PASS`, `typecheck: PASS`

#### 8e. --onlyTests with integration

```bash
npm run ward -- --only integration --onlyTests "exports" -- packages/ward
```

**Expected:**

- Jest receives `--testNamePattern exports` alongside `--testPathPatterns \.integration\.test\.ts$`
- Only integration tests matching the name pattern run

---

### 9. Failure Scenarios — Cross-Type

These verify that failures in one check type don't affect others, and that mixed results are reported correctly.

#### 9a. Unit fails, lint and typecheck pass

**Modify:** `packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts` (flip assertion)

```bash
npm run ward -- --only unit,lint,typecheck -- packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts
```

**Expected:**

- unit: FAIL (broken test)
- lint: PASS (linting the test file is fine)
- typecheck: PASS (type assertion flip doesn't cause type errors)
- Error detail: only `--- unit ---` section
- Exit code: non-zero

**Revert change after testing.**

#### 9b. Lint fails, unit passes

**Modify:** `packages/ward/src/guards/is-check-type/is-check-type-guard.ts` (add `var x = 1;`)

```bash
npm run ward -- --only lint,unit -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts
```

**Expected:**

- lint: FAIL (var triggers lint rule)
- unit: PASS (tests still pass via --findRelatedTests)
- Error detail: only `--- lint ---` section
- Exit code: non-zero

**Revert change after testing.**

#### 9c. Typecheck fails, lint passes on same file

**Modify:** `packages/ward/src/guards/is-check-type/is-check-type-guard.ts` (add `const x: number = 'hello';`)

```bash
npm run ward -- --only lint,typecheck -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts
```

**Expected:**

- lint: PASS (valid JS syntax, eslint doesn't type-check)
- typecheck: FAIL (tsc catches the type error)
- Error detail: `--- typecheck ---` section with the type error
- Exit code: non-zero

**Revert change after testing.**

---

### 10. Edge Cases

#### 10a. File that doesn't exist

```bash
npm run ward -- --only unit -- packages/ward/src/nonexistent.test.ts
```

**Expected:**

- Jest runs with --findRelatedTests on a nonexistent path
- Likely: `unit ... PASS 0 files` or jest error
- Should not crash ward itself

#### 10b. --only with invalid check type

```bash
npm run ward -- --only banana -- packages/ward
```

**Expected:**

- Ward should error with an invalid flag message (not silently skip)

#### 10c. Empty passthrough (just --)

```bash
npm run ward -- --only unit --
```

**Expected:**

- Equivalent to no passthrough — runs all unit tests across all packages
- No file scoping applied

#### 10d. --changed flag (requires uncommitted changes)

**Modify:** Make a trivial change to `packages/ward/src/guards/is-check-type/is-check-type-guard.ts` (add a blank line)

```bash
npm run ward -- --only lint --changed
```

**Expected:**

- Only the changed file is linted
- Live: `lint @dungeonmaster/ward PASS  1 files, 236 discovered`

**Revert the change after testing.**

#### 10e. --changed with multiple check types

**Modify:** Make a trivial change to `packages/ward/src/guards/is-check-type/is-check-type-guard.ts`

```bash
npm run ward -- --only lint,unit,typecheck --changed
```

**Expected:**

- lint: scoped to changed file only
- unit: scoped to changed file via --findRelatedTests
- typecheck: runs full tsc, post-filters errors to changed file

**Revert the change after testing.**

#### 10f. No tests discovered in package

```bash
npm run ward -- --only integration -- packages/eslint-plugin
```

**Expected:**

- Live: `integration @dungeonmaster/eslint-plugin skip` (no `.integration.test.ts` files exist)
- Summary: empty
