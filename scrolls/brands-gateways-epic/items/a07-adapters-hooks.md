# A07: Adapters: `hooks`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" table row 2 (line 333) and "Also" step 1; `scrolls/gateway-build/coverage.md` and `stays-as-adapter.md` hooks rows; `scrolls/brands-types-tests-rules.md` T1-T3, R1 |
| Needs | [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | hooks, and one file in `shared` (see batch D) |
| Checks to run | lint, typecheck, unit |
| Split | operator splits, 2 to 4 files per agent (batches below) |
| Runs alone | batch D (the `shared` transformer) must not run at the same time as [A12](a12-adapters-shared.md), [A00](a00-orchestrator-own-proxy.md) or [A03](a03-port-kill-broker.md) — all four touch `shared` |

## Current state

Census of `packages/hooks/src/adapters/**` run 2026-09-26: 19 files. `coverage.md`/`stays-as-adapter.md` name a fate
for all 19, but this item's own fresh caller-census found **3 more dead adapters than the source docs claim**:
`stays-as-adapter.md` names only `child-process/exec-sync/child-process-exec-sync-adapter.ts` and
`child-process/spawn/child-process-spawn-adapter.ts` as having zero callers. A same-package, whole-repo caller
search (2026-09-26) also found zero real callers, anywhere, for `debug/debug/debug-debug-adapter.ts`,
`eslint/linter/eslint-linter-adapter.ts` and `fs/stat/fs-stat-adapter.ts`. **All 5 are deleted by
[A01](a01-dead-adapters.md), not by this item.** Do not look for them; if they still exist when you start, A01 has
not landed yet — report LEFT STANDING and wait.

That leaves 14 adapters:

| Batch | Path | Replacement |
|---|---|---|
| A | `adapters/eslint/eslint/eslint-eslint-adapter.ts` | gateway → `@dungeonmaster/npm/eslint` `ESLint` |
| A | `adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter.ts` | gateway (flagged) → `@dungeonmaster/npm/eslint` `ESLint` — calls `.calculateConfigForFile()` on a passed-in `ESLint` instance |
| A | `adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter.ts` | gateway (flagged) → `@dungeonmaster/npm/eslint` `ESLint` — calls `.isPathIgnored()` on a passed-in `ESLint` instance |
| A | `adapters/eslint/output-fixes/eslint-output-fixes-adapter.ts` | gateway → `@dungeonmaster/npm/eslint` `ESLint` — sad-path hole noted in the gateway build's own npm inventory: no `catch` around the disk write today; do not silently fix this, report it as its own finding if you touch it |
| B | `adapters/fetch/get-with-status/fetch-get-with-status-adapter.ts` | gateway → `@dungeonmaster/node/fetch` `fetchWithStatus` |
| B | `adapters/fetch/patch/fetch-patch-adapter.ts` | gateway → `@dungeonmaster/node/fetch` `fetchJson` |
| B | `adapters/fs/ensure-write/fs-ensure-write-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `writeFileCreatingParent` |
| B | `adapters/fs/exists-sync/fs-exists-sync-adapter.ts` | gateway → `@dungeonmaster/node/fs` `existsSync` |
| C | `adapters/fs/read-file/fs-read-file-adapter.ts` | gateway → `@dungeonmaster/node/fs/promises` `readFile` |
| C | `adapters/module/require-fresh/module-require-fresh-adapter.ts` | gateway → `@dungeonmaster/node/module` (`createRequire`) — its own USAGE docstring already calls this real |
| C | `adapters/path/join/path-join-adapter.ts` | gateway → `@dungeonmaster/node/path` `join` |
| C | `adapters/path/resolve/path-resolve-adapter.ts` | gateway → `@dungeonmaster/node/path` `resolve` |
| D | `adapters/process/hook-lint-ignored-paths/process-hook-lint-ignored-paths-adapter.ts` | gateway → `@dungeonmaster/node/process` `getEnv` — moved OUT of "stays" in `stays-as-adapter.md` because it reads `process.env` directly, a Node global |
| D | `adapters/dungeonmaster-eslint-plugin/get-pre-edit-rules/dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter.ts` | stays-as-adapter → a transformer in `shared`, beside `dungeonmasterRuleEnforceOnStatics` (the follow-up doc's own words, line 333) |

**Batch D's second row is the one that touches `shared`.** Confirmed by reading the file in full: it is a pure
`Object.entries(dungeonmasterRuleEnforceOnStatics).filter(...).map(...)`, parsed through
`preEditLintConfigContract`, with no I/O and no library call at all — exactly the "pure filter/map over our own
statics" `stays-as-adapter.md` calls it. It reads `@dungeonmaster/shared/statics`'s
`dungeonmasterRuleEnforceOnStatics`, so the natural home for the transformer is beside that statics file in
`shared`, not in `hooks`.

## Work

1. For every `gateway` row (batches A, B, C, and D's `process-hook-lint-ignored-paths` row): switch every caller
   to the named export, imported from its `#gateway/<kind>/<subpath>` path.
2. The three "flagged" eslint rows in batch A take a passed-in `ESLint` instance rather than creating their own —
   confirm the instance itself is already reached through `#gateway/npm/eslint` at its own creation site before
   assuming these three need no change beyond an import-source swap; if the instance is still created through a
   raw `new ESLint(...)` somewhere in `hooks`, that call site is also this item's to fix.
3. For `dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter.ts`: write a transformer in `packages/shared/src/transformers/`
   (name it for what it does — something like `pre-edit-lint-config-build-transformer.ts` — read `get-folder-detail({
   folderType: 'transformers' })` first) that takes `dungeonmasterRuleEnforceOnStatics` and returns the same
   `PreEditLintConfig` shape, then update `hooks`' one caller to import the transformer from `@dungeonmaster/shared`
   instead of the adapter. Move `preEditLintConfigContract` to `shared` too if nothing else in `hooks` needs it
   locally (check first — do not move a contract two packages both use without checking both).
4. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file (e.g. `#gateway/npm/eslint/eslint/eslint.proxy`), never through a barrel, per T1/T3. The pre-edit-rules
   transformer needs no proxy at all if it does no I/O — a pure transformer's own test calls it directly with a
   real (or stubbed) `dungeonmasterRuleEnforceOnStatics`.
5. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
6. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
7. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 14 adapter files remain under `packages/hooks/src/adapters/` (plus A01's 5), and the folder is gone.
- A transformer in `packages/shared/src/transformers/` computes the pre-edit rule list from
  `dungeonmasterRuleEnforceOnStatics`, and `hooks`' caller imports it from `@dungeonmaster/shared`.
- `npm run ward -- --only lint,typecheck,unit -- packages/hooks packages/shared/src/transformers` (narrowed to the
  exact files touched) exits 0.

## Traps

- Confirm A01 has actually landed (its 5 hooks deletions) before you start.
- `packages/hooks/CLAUDE.md`'s hook-timing rules (pre-edit vs. post-edit) are unrelated to this item's "pre-edit
  RULES list" — do not confuse the two. This item moves the FUNCTION that reads the pre-edit rule list, not any
  hook registration.
- The batch-D transformer move is a cross-package edit. Coordinate with the operator before starting it — it must
  not run alongside [A12](a12-adapters-shared.md) or any other item touching `packages/shared/src/`.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

## Plan

### G-K1

Scope: Group G-K1 (batch A) — migrate ESLint adapter callers to `#gateway/npm/eslint` and delete the four adapters.

Files to delete (12):
- `packages/hooks/src/adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter.ts`
- `packages/hooks/src/adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter.proxy.ts`
- `packages/hooks/src/adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter.test.ts`
- `packages/hooks/src/adapters/eslint/eslint/eslint-eslint-adapter.ts`
- `packages/hooks/src/adapters/eslint/eslint/eslint-eslint-adapter.proxy.ts`
- `packages/hooks/src/adapters/eslint/eslint/eslint-eslint-adapter.test.ts`
- `packages/hooks/src/adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter.ts`
- `packages/hooks/src/adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter.proxy.ts`
- `packages/hooks/src/adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter.test.ts`
- `packages/hooks/src/adapters/eslint/output-fixes/eslint-output-fixes-adapter.ts`
- `packages/hooks/src/adapters/eslint/output-fixes/eslint-output-fixes-adapter.proxy.ts`
- `packages/hooks/src/adapters/eslint/output-fixes/eslint-output-fixes-adapter.test.ts`

Files to edit (12):
- `packages/hooks/src/brokers/eslint/is-path-ignored/eslint-is-path-ignored-broker.ts`
- `packages/hooks/src/brokers/eslint/is-path-ignored/eslint-is-path-ignored-broker.proxy.ts`
- `packages/hooks/src/brokers/eslint/is-path-ignored/eslint-is-path-ignored-broker.test.ts`
- `packages/hooks/src/brokers/eslint/lint-run-targeted/eslint-lint-run-targeted-broker.ts`
- `packages/hooks/src/brokers/eslint/lint-run-targeted/eslint-lint-run-targeted-broker.proxy.ts`
- `packages/hooks/src/brokers/eslint/lint-run-targeted/eslint-lint-run-targeted-broker.test.ts`
- `packages/hooks/src/brokers/eslint/lint-run-with-fix/eslint-lint-run-with-fix-broker.ts`
- `packages/hooks/src/brokers/eslint/lint-run-with-fix/eslint-lint-run-with-fix-broker.proxy.ts`
- `packages/hooks/src/brokers/eslint/lint-run-with-fix/eslint-lint-run-with-fix-broker.test.ts`
- `packages/hooks/src/brokers/eslint/load-config/eslint-load-config-broker.ts`
- `packages/hooks/src/brokers/eslint/load-config/eslint-load-config-broker.proxy.ts`
- `packages/hooks/src/brokers/eslint/load-config/eslint-load-config-broker.test.ts`

Composing proxies verified:
- `packages/hooks/src/brokers/violations/check-new/violations-check-new-broker.proxy.ts`
- `packages/hooks/src/brokers/violations/fix-and-report/violations-fix-and-report-broker.proxy.ts`
