# Ward — walkthrough

Case prefix: `WD` · Packages: `ward` · Main sources: `packages/ward/CLAUDE.md`,
`packages/ward/MANUAL-TEST-CASES.md`, `scrolls/workflow-paralellizer-plan.md` (sections 9-11),
`packages/shared/src/statics/session-snippet/session-snippet-statics.ts` (`ward`, `wardDiscipline` keys)

## What changed

Section J of the workflow-parallelizer plan landed in full on `master` (`scrolls/workflow-paralellizer-plan.md`
section 9.A: all eight steps committed). Ward's typecheck stopped being `tsc -b` — it is now a per-package
`tsc --noEmit --listFiles`, jest and eslint read source directly, and `npm run build` is no longer a prerequisite
for `npm run ward` in any check type. Two fixes landed 2026-09-22: a file- or directory-scoped **typecheck** run now
fails on a real error anywhere in the touched package, not just inside the named files (`ee245edc5`, `8208a2ef9`) —
the summary lists named-file errors first, then everything else under `--- errors elsewhere in <package> ---`. E2e
now serves a hashed prebuilt bundle via `vite preview` (`bundle-build-broker.ts`) instead of a dev server, keyed by
two independently-picked free ports so several browser walks against one package can run at once. `ward list` is
now routed (it silently 404'd before) and an unknown subcommand now exits 1, not 0. Ward's own `eslint --fix` has a
documented, intermittent upstream bug that can turn compiling code into non-compiling code while grading it
(section 9.16/10.1) — one case below exists purely to catch a recurrence.

## How to reach it

| Surface | How to reach it | Notes |
|---|---|---|
| Run checks | `npm run ward` or `npm run ward -- run [flags] [-- files]` | default subcommand; from repo root only |
| List a run's failing files | `npm run ward -- list [runId]` | omit `runId` for the newest run |
| Drill into one file's errors | `npm run ward -- detail <runId> [filePath] [--json]` | `filePath` optional — omit for whole-run detail |
| Raw tool output for one check | `npm run ward -- raw <runId> <checkType>` | e.g. `raw 1739625600000-a3f1 typecheck` |

## Setup

1. Every command runs from the **repo root** (`/home/brutus-home/projects/codex-of-consentient-craft`). `cd` into a
   package and ward reports "No files found".
2. **No build is required for any case below.** lint, typecheck, unit and integration all read source directly
   (Section J). None of these cases edit ward's own CLI-routing source, so the compiled
   `dist/bin/ward-entry.js` binary `npm run ward` invokes does not need refreshing either.
3. **Exception: e2e.** Playwright's own config loader and spec transform use plain Node resolution with no export
   conditions, so `@dungeonmaster/shared` and `@dungeonmaster/testing` still resolve through `dist/` at e2e time —
   build those two first if you have not built recently: `npm run build --workspace=@dungeonmaster/shared --workspace=@dungeonmaster/testing`.
   Ward builds the UI bundle itself (see WD-40).
4. Failure cases mutate a source file. **Revert every mutation immediately after the case**, and run
   `git status --porcelain packages/ward` before the next case to confirm the tree is clean — a forgotten mutation
   breaks every case after it. A comment mutation (not a blank line) survives `eslint --fix`; a blank line does not.
5. Two guard files carry almost every mutation below (mirroring `packages/ward/MANUAL-TEST-CASES.md`, which this
   walkthrough leans on for the full scope × check-type grid rather than repeating it row for row):
   `packages/ward/src/guards/is-check-type/is-check-type-guard.ts` and
   `packages/ward/src/guards/is-run-id/is-run-id-guard.ts`.
6. Each case shows a `run: <runId>` line on completion — capture it for that case's `detail`/`raw`/`list` follow-up
   where one is listed.

## Test cases

### Subcommands

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-01 | `npm run ward -- --only lint -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts` (no subcommand) | Runs exactly as `run` would — `WardFlow` treats a missing/flag-shaped first arg as implicit `run`. `lint @dungeonmaster/ward PASS 1 files` | `unit`: `ward-flow.integration.test.ts` | P2 | |
| WD-02 | `npm run ward -- list` with no prior run this session | Prints the newest run's errors-by-file list (or nothing notable if the newest run passed clean) | `unit`: `ward-list-responder.test.ts` | P2 | |
| WD-03 | `npm run ward -- detail` (no runId) | `Usage: ward detail <run-id> [file-path] [--json]` to stderr, exits without crashing | `unit`: `ward-detail-responder.test.ts` | P2 | |
| WD-04 | `npm run ward -- raw` (no args) | `Usage: ward raw <run-id> <check-type>` to stderr | `unit`: `ward-raw-responder.test.ts` | P2 | |
| WD-05 | `npm run ward -- bogus` | stderr: `Unknown command: bogus` then `Available commands: run, list, detail, raw`; **exit code non-zero** (was exit 0 before the Section J fix — confirm it stays fixed) | `unit`: `ward-flow.integration.test.ts` | P1 | |

### CLI flag parsing (`cliArgsParseTransformer`)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-06 | `npm run ward -- --banana -- packages/ward` | `Error: Unknown flag: --banana` naming the accepted flags and common Jest/ESLint/tsc/Playwright flag mistakes; exits non-zero before any check runs | `unit`: `cli-args-parse-transformer.test.ts` | P2 | |
| WD-07 | `npm run ward -- --only unit -- --headed` | `Error: Flags after "--" are not forwarded to underlying tools: --headed` — flags after `--` are rejected, never silently passed to Jest/Playwright | `unit`: same | P2 | |
| WD-08 | `npm run ward -- extra-positional` | `Error: Unexpected positional argument: extra-positional` naming that paths must come after `--` | `unit`: same | P2 | |
| WD-09 | `npm run ward -- --only unit --onlyTests "returns config with onlyTests pattern"` (no `-- files`) | `Error: --onlyTests requires a file scope: add -- <files>` — rejected before any check spawns, well under a second | `unit`: same | P2 | |
| WD-10 | `npm run ward -- --only unit --onlyTests "x" --` (bare separator, no files) | Same rejection as WD-09 — a bare `--` is not a file scope | `unit`: same | P2 | |
| WD-11 | `npm run ward -- --uncommitted --only lint` | `Error: --uncommitted cannot be combined with: --only`, naming the standalone alternative | `unit`: same | P2 | |
| WD-12 | `npm run ward -- --committed -- packages/ward` | `Error: --committed cannot be combined with: -- <files>` | `unit`: same | P2 | |
| WD-13 | `npm run ward -- --only banana -- packages/ward` | Errors on the invalid check type via `checkTypeContract.parse` (zod validation), not a silent skip | `unit`: `check-type-contract.test.ts` | P2 | |
| WD-14 | `npm run ward -- --only unit --` (empty passthrough) | Equivalent to no passthrough — runs unit across every package (this is the expensive "no scope" shape; expect several minutes) | `unit`: same | P3 | |

### Check-type scoping (representative — full grid is `packages/ward/MANUAL-TEST-CASES.md` sections 1-9)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-15 | `npm run ward -- --only unit -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts` | `unit @dungeonmaster/ward PASS 1 files, N discovered`; no integration/e2e/lint/typecheck lines | `unit`: MANUAL-TEST-CASES.md 1a | P3 | |
| WD-16 | `npm run ward -- --only unit -- packages/ward/src/startup/start-ward.integration.test.ts` | `unit ... skip` — an `.integration.test.ts` file never counts as a unit file, even file-scoped | `unit`: MANUAL-TEST-CASES.md 1c | P2 | |
| WD-17 | `npm run ward -- --only test -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts` | unit `PASS 1`, integration `skip`, e2e `skip` — `test` expands to `unit,integration,e2e` and each filters independently | `unit`: MANUAL-TEST-CASES.md 6a | P2 | |
| WD-18 | `npm run ward -- --only test,e2e -- packages/ward` | unit, integration, e2e run; e2e is **not** duplicated by the `test` expansion | `unit`: `cli-args-parse-transformer.test.ts` | P2 | |
| WD-19 | `npm run ward -- --only lint -- packages/ward/src/startup/start-ward.integration.test.ts` | `lint ... PASS 1 files` — lint does NOT filter by test-file type, unlike unit/integration | `unit`: MANUAL-TEST-CASES.md 4c | P3 | |
| WD-20 | `npm run ward -- --only integration -- packages/shared` | `integration @dungeonmaster/shared skip` — no `.integration.test.ts` files exist there | `unit`: MANUAL-TEST-CASES.md 10f | P2 | |

### Typecheck: errors outside the named scope still fail the run (`ee245edc5`, `8208a2ef9`)

Mutation for every row: in `packages/ward/src/guards/is-check-type/is-check-type-guard.ts`, change
`.safeParse(value).success` to `.safeParse(value)` (returns an object where a boolean is expected — a real `tsc`
error). **Revert after WD-24.**

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-21 | `npm run ward -- --only typecheck -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts` (scoped to the broken file itself) | `typecheck @dungeonmaster/ward FAIL`; detail shows the TS error under `--- typecheck ---` with no "elsewhere" heading — the broken file IS the named scope | `unit`: `check-run-typecheck-broker.test.ts` | P2 | |
| WD-22 | `npm run ward -- --only typecheck -- packages/ward/src/guards/is-run-id/is-run-id-guard.ts` (scoped to a **different**, clean file) | `typecheck @dungeonmaster/ward FAIL` — must NOT pass. Detail shows `  --- errors elsewhere in @dungeonmaster/ward ---` followed by the `is-check-type-guard.ts` error; the scoped file has nothing of its own | `unit`: `check-run-typecheck-broker.test.ts` (added by `ee245edc5`) | **P1** | |
| WD-23 | `npm run ward -- --only typecheck -- packages/ward/src/guards/is-check-type` (directory containing the broken file) | `FAIL`, error listed like a named-file scope — no "elsewhere" heading, because the path is a prefix-match | `unit`: `check-run-typecheck-broker.test.ts` (added by `8208a2ef9`) | P2 | |
| WD-24 | `npm run ward -- --only typecheck -- packages/ward/src/guards/is-run-id` (a **sibling** directory) | `FAIL` with `  --- errors elsewhere in @dungeonmaster/ward ---` — a directory scope of `is-run-id` must never claim credit for `is-check-type` being clean | `unit`: same (path-prefix-with-trailing-separator guard, `is-path-under-directory-guard.test.ts`) | **P1** | |
| WD-25 | Revert the mutation. `npm run ward -- --only typecheck -- packages/ward` (bare package arg) | `PASS` — a bare package arg carries no passthrough at all (`multiPackageLayerBroker` slices it to nothing), so this scope was always whole-package truth and the split never applies | `unit`: same | P3 | |
| WD-26 | With the mutation still reverted: confirm `git status --porcelain` shows nothing under `packages/ward/dist`, `.tsbuildinfo`, or any `tsconfig.json` after WD-21 through WD-24 | Typecheck **never emits** — no `dist/`, no `.tsbuildinfo` outside `.ward/`, no rewritten `tsconfig.json` (verifies `check-commands-statics.test.ts`'s "no `-b`" invariant end to end) | `unit`: `check-commands-statics.test.ts` | P2 | |

### Git scope flags

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-27 | With a clean working tree: `npm run ward -- --uncommitted` | Prints the empty-scope message and **exits 0 having run nothing** — an empty file scope is EMPTY, not wide | `integration`: `command-run-broker.test.ts` (`fileScopeEmptyStatics`) | P2 | |
| WD-28 | Add a comment (not a blank line) to `is-check-type-guard.ts`, and separately create `packages/ward/src/guards/is-check-type/scratch-new-file.ts` (never `git add` it). `npm run ward -- --uncommitted` | All 5 check types run, scoped to **both** files — the tracked edit AND the never-added one. `git ls-files --others --exclude-standard` must list the new file for this to prove anything; `git diff` alone reports tracked paths only | `unit`: `git-scope-layer-broker.test.ts` | **P1** | |
| WD-29 | Revert/delete both from WD-28. Commit a trivial comment change to `is-check-type-guard.ts` on this branch **without pushing**, leave a second file's edit uncommitted. `npm run ward -- --committed` | Scoped to the **committed** file only — the uncommitted edit is excluded, and anything already on `origin/main` is excluded | `unit`: `git-diff-committed-broker.test.ts` | P2 | |
| WD-30 | Same tree as WD-29. `npm run ward -- --committed --uncommitted` | **Accepted, not rejected** — the one pair ward allows. Runs the union: the committed file plus the uncommitted one, each listed once even if the same file appears in both halves | `unit`: `cli-args-parse-transformer.test.ts` | P2 | |
| WD-31 | Same tree, add `--only lint`: `npm run ward -- --committed --uncommitted --only lint` | Rejected: `--committed --uncommitted cannot be combined with: --only` — the pair still rejects every narrowing flag | `unit`: same | P2 | |
| WD-32 | Revert the commit (`git reset --soft HEAD~1` or equivalent) and the edit from WD-29/30 | Tree clean again before the next case | — | — | |
| WD-33 | `npm run ward -- --only lint -- scripts/build-workspaces.mjs` | `noFilesProcessedStatics` message naming the path, **exits 1** — `scripts/**` is in `eslint.config.js` `ignores` and belongs to no workspace package, so an explicit path the caller typed resolved to zero files processed | `unit`: `has-no-files-processed-guard.test.ts` | **P1** | |

### Edge cases

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-34 | `npm run ward -- --only unit -- packages/ward/src/nonexistent.test.ts` | Ward does not crash. Live: `unit ... FAIL 0 files, N discovered DISCOVERY MISMATCH` with `(crash)` in the detail; exits non-zero | `unit`: `path-check-layer-broker.test.ts` | P2 | |
| WD-35 | `npm run ward -- --only e2e --onlyTests "XYZNONEXISTENT" -- packages/ward/src/guards/is-check-type/is-check-type-guard.ts` | Exits **0**, having run nothing — `@dungeonmaster/ward` is not e2e-eligible, so the scope reaches no package at all. This is the silence `hasUnmatchedTestNamePatternGuard` does NOT catch (documented gap, `packages/ward/CLAUDE.md`) — confirm it still reproduces | `none` | **P1** | |
| WD-36 | `npm run ward -- --only unit --onlyTests "XYZNONEXISTENT" -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts` | Jest loads the file but 0 tests match. `unit ... skip`; guidance line `--onlyTests pattern "XYZNONEXISTENT" matched 0 tests in any package — possible typo or stale test name`; exits non-zero | `unit`: `has-unmatched-test-name-pattern-guard.test.ts` | P2 | |
| WD-37 | `npm run ward -- --only unit -- packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.test.ts packages/ward/src/startup/start-ward.integration.test.ts` | unit runs 1 file (only the `.test.ts`), integration would run the other if `--only test`; here integration is not requested so only unit shows, `PASS 1 files` — the integration file is silently absent from unit's count, not merged in | `unit`: MANUAL-TEST-CASES.md 6d shape | P3 | |
| WD-38 | Flip `expect(...).toBe(true)` to `false` in `is-check-type-guard.test.ts`. `npm run ward -- --only unit -- packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts` | `FAIL 1 files, 1 errors`; **caller-scoped to one file**, so the full jest `Expected`/`Received` diff prints inline in the summary — no `detail` call needed to see it | `unit`: `is-caller-file-scope-guard.test.ts`, `inline-failure-message-transformer.test.ts` | P2 | |
| WD-39 | Revert WD-38. `npm run ward -- --only lint -- packages/ward` (package-scope, not file-scope) then break lint the same way and re-run | Package-scope failure prints the ONE-LINE form plus `Full error details: npm run ward -- detail <runId> <filePath>` — not the full inline diff, because the scope is not caller-file-scoped | `unit`: `is-caller-file-scope-guard.test.ts` | P2 | |

### E2e

**Expensive — each e2e case boots an API server, a Vite preview server and a real Chromium browser. Budget
30s-2min for a single-file case (WD-40/41), several minutes for a package-scope sweep (skip unless specifically
testing e2e infrastructure).**

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-40 | `npm run ward -- --only e2e -- packages/ward` | `e2e @dungeonmaster/ward skip` — ward itself is not e2e-eligible (no `widgets/`, no React/ink) | `unit`: `architecture-package-e2e-eligible-detect-broker.test.ts` | P3 | |
| WD-41 | `npm run ward -- --only e2e -- packages/web/src/flows/app/smoke.e2e.ts` | `e2e @dungeonmaster/web PASS 1 files`. Ward builds a hashed bundle first run (`bundle-build-broker`), then reuses it on an unchanged tree — watch stdout/stderr for the build step on the FIRST run of a session and its absence on the second | **P1** (only integration-tested against mocks, never a real repeat run) | | |
| WD-42 | Immediately repeat WD-41 | Same PASS, but noticeably faster — the bundle hash matched, so `vite preview` served the existing `.ward/bundle/<hash>/` directory with no rebuild | `none` | **P1** | |
| WD-43 | Open two terminals. Run WD-41 in both within a couple seconds of each other | Both complete independently — each picked its own free server+web port pair (`netFreePortPairAdapter`) and its own `.ward-playwright-report-<serverPort>.json`, so neither overwrites the other's report or kills the other's server. **This is the case most likely to be broken silently** — watch for `Timed out waiting 60000ms from config.webServer` in either terminal, which means a port collided | `unit`: mocks the port adapter, never runs two real processes | **P1** | |
| WD-44 | In `packages/web/src/flows/app/smoke.e2e.ts`, flip an assertion in the health-check test (e.g. expected `status: 'ok'` to `'broken'`). `npm run ward -- --only e2e --onlyTests "health" -- packages/web/src/flows/app/smoke.e2e.ts` | `e2e @dungeonmaster/web FAIL 1 files`; detail shows the diff naming `"broken"` vs `"ok"`. **Revert after.** | `unit`: `parse-playwright-crash-output-transformer.test.ts` | P2 | |

### Open handles

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-45 | `npm run ward -- --only integration -- packages/orchestrator/src/startup/start-orchestrator.integration.test.ts` | Whatever the pass/fail verdict, the summary should carry a `--- open handles (integration) ---` section reading `these kept jest alive after the tests finished; --forceExit killed them`, naming `@dungeonmaster/orchestrator` and a Timer/Interval frame. `start-orchestrator.ts` arms ~3 real interval timers plus 2 fs watchers at module load and nothing neutralizes them in this test (`packages/orchestrator/CLAUDE.md`, "Importing the barrel in a unit test leaks real timers"). **This is a documented pre-existing leak, not a regression to fix** — the case exists to confirm the reporting path still fires, not to chase the leak | `none` (CLAUDE.md states no leak-guard test exists for this) | **P1** | |

### Ward's own `eslint --fix` (watch-for-it, not a deterministic repro)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-46 | Before any lint-including ward run that touches `packages/eslint-plugin` (or any package using a chained `X as unknown as Y` cast), snapshot `git status --porcelain` for that package. Run the lint check. Diff `git status --porcelain` again | Expect **no diff** — a byte-identical tree. If the tree changed, check whether a bare `as unknown` now exists with no trailing `as <Type>`: `@typescript-eslint/no-unnecessary-type-assertion`'s autofix has a documented intermittent bug that strips the outer cast off a chained assertion, turning compiling code into code that does not compile (`scrolls/workflow-paralellizer-plan.md` 9.16). If it fires, it is a real (if upstream) DEF, not tester error | `none` — deliberately: a prior full-repo memory-ceiling test was removed and replaced by nothing that covers this | **P1** | |

### Drill-down (`list` / `detail` / `raw`)

Reuses the failure from WD-38 — redo the mutation if you already reverted it, and capture the `run: <runId>` line.

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-47 | `npm run ward -- list <runId>` | Errors-by-file list for that run, naming `is-check-type-guard.test.ts` | `unit`: `ward-list-responder.test.ts` | P2 | |
| WD-48 | `npm run ward -- detail <runId> packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts` | Full test name, full `Expected`/`Received` diff, stack trace with line number. `detail` normalizes paths — try the same call with a repo-relative, package-relative, and absolute path; all three should return the same content | `unit`: `command-detail-broker.test.ts` | P2 | |
| WD-49 | `npm run ward -- detail <runId> packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts --json` | Same content, machine-readable JSON shape instead of the text summary | `unit`: `result-to-detail-json-transformer.test.ts` | P3 | |
| WD-50 | `npm run ward -- raw <runId> unit` | Raw jest JSON output for that check — large, but useful when `detail` truncates something. **Do not use this for typecheck** — `packages/ward/MANUAL-TEST-CASES.md` notes tsc raw output runs 100K+ chars of file listings | `unit`: `command-raw-broker.test.ts` | P3 | |
| WD-51 | Revert the WD-38 mutation | Tree clean before closing out | — | — | |

### Full sweep

**Expensive — full lint + typecheck + unit + integration + e2e across every package. Tens of minutes; the plan's
own measured single-package e2e run alone was 549s. Only run this if you are specifically validating the whole
ward surface, and use `timeout: 600000`+ if scripting it — never a fixed `sleep`.**

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| WD-52 | `npm run ward` (bare, clean tree, nothing scoped) | All 14 packages, all check types, 0 `DISCOVERY MISMATCH`. e2e for `packages/web` is the slow tail — do not conclude "green" from a run that was killed or backgrounded before e2e reports (section 9.B: this is exactly how a red `master` went unnoticed for days) | `none` — this IS the top-level verification | P3 (well-covered by every other case combined; run only per ward-discipline's "before a merge" rule) | |

## Known open items

- **E2e's residual `dist` need.** `check-run-e2e-broker.ts` still requires `packages/shared/dist` and
  `packages/testing/dist` to be built before an e2e run — Playwright's own config/spec loader uses plain Node
  resolution with no export conditions. The plan floated closing this via a `paths` map (probe P7) but D5.3-D5.5
  were struck (section 11.1); this residual build is still live. If WD-41 fails with a `MODULE_NOT_FOUND` naming
  `@dungeonmaster/shared` or `@dungeonmaster/testing`, build those two first.
- **`hasUnmatchedTestNamePatternGuard` does not catch a scope that reaches no package at all** — WD-35 is the
  reproduction (`packages/ward/CLAUDE.md`, "A scoped run that reaches no package at all is a different silence").
- **Per-sub-agent worktrees, a borrowed-binaries opt-out, and a role-migration mechanism** are still open per
  section 11.4 of the plan — none of these are ward-specific enough to script into this walkthrough, but a
  worktree-flavoured ward run (`create-worktree` → `npm run ward -- -- <files>` inside it) is worth a spot check
  if you are touching that surface this session.
- **Ward's own `eslint --fix` autofix bug (WD-46)** is upstream in `@typescript-eslint`, confirmed intermittent
  (one deliberate before/after check found no recurrence across 17 legitimate `as unknown` hits). No automated
  guard exists for it by design — a full-repo memory-ceiling test that used to run here was removed as
  measuring nothing durable.
- **Two served docs (`get-testing-patterns`, `get-syntax-rules`) instruct `grep -r ... packages/*/dist/`**, which
  this repo's own `PreToolUse` hook blocks. Not ward's own surface, but ward's `packages/ward/CLAUDE.md` used to
  carry the same kind of stale instruction (a `--only lint,test` verification line) — reconfirmed absent as of
  this walkthrough (WD setup did not need it); if a future edit reintroduces an expensive default verification
  command into that file, flag it.

## Sources

- `packages/ward/CLAUDE.md` — CLI usage, flags, underlying commands, file-scoping rules, architecture
- `packages/ward/MANUAL-TEST-CASES.md` — the full scope × check-type coverage grid this walkthrough draws
  representative cases from rather than duplicating
- `scrolls/workflow-paralellizer-plan.md` — sections 9 (execution log), 10 (defects/surprises), 11 (what changed
  from the written plan); read 11 before trusting any earlier section
- `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` — `ward` and `wardDiscipline` keys,
  what every session is told about ward before it runs one
- `packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.ts` — the one place flag legality is
  decided
- `packages/ward/src/brokers/check-run/typecheck/check-run-typecheck-broker.ts` — the elsewhere-heading split
- `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts` — bundle build, port pairs, per-port report path
- `packages/ward/src/transformers/result-to-summary/result-to-summary-transformer.ts` — exact summary/detail text
  for every section quoted above
