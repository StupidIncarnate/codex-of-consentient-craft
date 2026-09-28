# A06: Adapters: `eslint-plugin`

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Delete every adapter" (305-366); `scrolls/gateway-build/coverage.md` eslint-plugin rows; `scrolls/brands-types-tests-rules.md` T1-T3, T7, R1 |
| Needs | [G05](g05-error-classes-in-error-files.md), [G15](g15-gateway-returns-unknown-not-caller-type.md), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md), [G21](g21-gateway-proxy-addressing-read-back.md) |
| Unblocks | [B04](b04-eslint-rules-on-real-tsestree.md), [A18](a18-raw-calls-and-dependency-cleanup.md), [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | eslint-plugin |
| Checks to run | lint, typecheck, unit |
| Split | operator splits, 2 to 4 files per agent (batches below) |
| Runs alone | no other agent editing `eslint-plugin` at the same time |

## Current state

Census of `packages/eslint-plugin/src/adapters/**` run 2026-09-26: 14 files, none of them in A01's dead list.
`coverage.md` names fates for only 10 of the 14 — the other 4 are this item's own finding, verified by reading
each file and its real callers.

| Batch | Path | Replacement |
|---|---|---|
| 1 | `adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.ts` | gateway → `@dungeonmaster/npm/eslint-plugin-eslint-comments` |
| 1 | `adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.ts` | gateway → `@dungeonmaster/npm/eslint-plugin-jest` |
| 1 | `adapters/eslint/rule-tester/eslint-rule-tester-adapter.ts` | gateway → `@dungeonmaster/npm/eslint` `RuleTester` — see Traps, this one is test infrastructure, not a production wrapper |
| 1 | `adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.ts` | gateway → `@dungeonmaster/npm/@typescript-eslint/eslint-plugin` |
| 2 | `adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter.ts` | gateway → `@dungeonmaster/node/fs` `readFileSyncIfExists` |
| 2 | `adapters/fs/exists-sync/fs-exists-sync-adapter.ts` | gateway → `@dungeonmaster/node/fs` `existsSync` |
| 2 | `adapters/fs/read-file-sync/fs-read-file-sync-adapter.ts` | gateway → `@dungeonmaster/node/fs` `readFileSync` |
| 2 | `adapters/fs/write-file-sync/fs-write-file-sync-adapter.ts` | gateway → `@dungeonmaster/node/fs` `writeFileSync` |
| 3 | `adapters/fs/readdir-sync/fs-readdir-sync-adapter.ts` | not in `coverage.md` — see below |
| 3 | `adapters/minimatch/match/minimatch-match-adapter.ts` | gateway → `@dungeonmaster/npm/minimatch` |
| 3 | `adapters/path/join/path-join-adapter.ts` | gateway → `@dungeonmaster/node/path` `join` |
| 4 | `adapters/path/dirname/path-dirname-adapter.ts` | not in `coverage.md` — see below |
| 4 | `adapters/eslint/typed-parser-services/eslint-typed-parser-services-adapter.ts` | not in `coverage.md` — see below |
| 4 | `adapters/eslint/typed-rule-tester/eslint-typed-rule-tester-adapter.ts` | not in `coverage.md` — see below |

**Batch 3's `fs-readdir-sync-adapter.ts`** (confirmed 2026-09-26): calls raw `readdirSync(dirPath, { withFileTypes:
true })`, real caller is `gateway-layout`'s own rule (per its PURPOSE header: "gateway-layout reaches for this to
compare a gateway subpath folder against its own siblings"). **Recommended:** gateway → `@dungeonmaster/node/fs`
`readdirEntriesSync` — the same replacement `shared`'s own `fs-readdir-with-types-adapter.ts` gets in `coverage.md`
(identical shape: `readdirSync` with `withFileTypes: true`, mapped to `{ name, isDirectory }`).

**Batch 4's `path-dirname-adapter.ts`** (confirmed 2026-09-26): a plain `dirname(filePath)` wrapper, same shape as
every other package's `path/dirname` adapter. **Recommended:** gateway → `@dungeonmaster/node/path` `dirname`
(wrapper deleted; callers import `path` directly) — the same replacement every other package's identical adapter
gets.

**Batch 4's `eslint-typed-parser-services-adapter.ts`** (confirmed 2026-09-26): already imports
`ESLintUtils`/`TSESLint`/`TSESTree` from `#gateway/npm/typescript-eslint__utils` — it is already gateway-compliant
on its outside call. Its one real caller is `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/rule-platform-globals-ban-broker.ts`
(confirmed by reading it — this is production code for the `platform-globals-ban` rule
[A19](a19-adapters-folder-type-gone-caller-rules-on.md) turns on). **Recommended — the executing agent may change
this with a reason in DECISIONS:** since it already reaches the gateway directly and the "adapters" folder type is
going away regardless, move the function as-is into a `transformers/` file in `eslint-plugin` (it is a pure,
deterministic mapping from `(context, node)` to a declaration file path, with no I/O of its own — the type checker
data it reads was already loaded by ESLint before this function runs). Update
`rule-platform-globals-ban-broker.ts`'s import accordingly.

**Batch 4's `eslint-typed-rule-tester-adapter.ts`** (confirmed 2026-09-26): imports raw `eslint`'s `RuleTester` and
raw `@typescript-eslint/parser` directly (not yet through the gateway). Its only real caller anywhere in the
package is `rule-platform-globals-ban-broker.integration.test.ts` — a TEST file, confirmed by a same-package
caller census. So is `eslint-rule-tester-adapter.ts` (batch 1) — its real callers are exclusively other rules'
`.test.ts` files, by design (`packages/eslint-plugin/CLAUDE.md`: "Rule brokers are tested with ESLint's RuleTester
integration tests"). **Recommended — the executing agent may change this with a reason in DECISIONS:** both
`eslint-rule-tester-adapter.ts` and `eslint-typed-rule-tester-adapter.ts` are test infrastructure, not production
code, so per T7 they belong beside the tests they serve rather than in `adapters/`. Move both into a
`test/harnesses/` pair (`rule-tester.harness.ts`, `typed-rule-tester.harness.ts`), each importing
`RuleTester` from `#gateway/npm/eslint` and (for the typed one) the parser from
`@dungeonmaster/npm/@typescript-eslint/parser` directly (check whether that subpath already exists in the npm
gateway; if not, report LEFT STANDING naming the missing gateway subpath rather than adding it yourself — a new
gateway subpath is a gateway-package change, outside this item's scope).

## Work

1. For each `gateway` row: switch every caller to the named export, imported from its `#gateway/<kind>/<subpath>`
   path.
2. For the two `not in coverage.md` rows recommended as ordinary gateway swaps (`fs-readdir-sync`, `path-dirname`):
   treat them exactly like the `gateway` rows.
3. For `eslint-typed-parser-services-adapter.ts`: move it to `transformers/`, update its one caller
   (`rule-platform-globals-ban-broker.ts`), keep its `#gateway/npm/typescript-eslint__utils` import as-is.
4. For `eslint-rule-tester-adapter.ts` and `eslint-typed-rule-tester-adapter.ts`: move both to `test/harnesses/`
   per the recommendation above (or record a different decision), update every rule `.test.ts` and
   `.integration.test.ts` file that imports them.
5. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly
   (imported per file, e.g. `#gateway/npm/eslint/eslint/eslint.proxy` — never through a barrel), per T1/T3. The two
   RuleTester harnesses are test infrastructure and carry no production proxy of their own — they are called
   directly from test files, never mocked.
6. New code follows R1 — return what the gateway call told you; do not write a new `adapterResultContract`-shaped
   return.
7. Delete every adapter this item touches, its `.proxy.ts`, `.test.ts` and any `.stub.ts`, and its now-empty
   wrapper folder.
8. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- None of the 14 adapter files remain under `packages/eslint-plugin/src/adapters/`, and the folder is gone.
- `rule-platform-globals-ban-broker.ts` imports its declaration-file lookup from a `transformers/` file, not
  `adapters/`.
- Every rule `.test.ts`/`.integration.test.ts` that used `eslintRuleTesterAdapter`/`eslintTypedRuleTesterAdapter`
  now imports the relocated harness (or whatever DECISIONS records instead).
- `npm run ward -- --only lint,typecheck,unit -- packages/eslint-plugin` exits 0.

## Traps

- `eslint-rule-tester-adapter.ts` has dozens of callers across `brokers/rule/**/*.test.ts` — moving it touches
  every one of those import lines. Do this as its own batch, not folded into unrelated work, and expect a wide
  file list in your ward run.
- `eslintTypedRuleTesterAdapter`'s own header explains WHY it hardcodes a repo-root `tsconfigRootDir` (six
  directory levels up from its own folder) — read that comment before moving the file, since a relocation changes
  how many levels up the real repo root sits, and the constant must move with it.
- Do not confuse `eslintRuleTesterAdapter` (untyped, used everywhere) with `eslintTypedRuleTesterAdapter` (typed,
  used only by the one rule that needs the real type checker) — they are two different files with two different
  real callers.

## Plan — G-I

Batches 1 and 2 (`triage-phase2.md`'s G-I): the four "batch 1" adapters plus the four "batch 2" `fs/*` adapters, and
every real caller of each. Written 2026-09-28 by a read-only pass over the actual tree (`discover`, `Read`) — not
implemented. **`eslint/rule-tester`'s caller count made this plan stop before any file was touched; see "Why this
plan stops here" at the end.**

### 1a. Three plugin-load adapters (small — not blocked)

Delete (9 files):
- `packages/eslint-plugin/src/adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.ts`
- `packages/eslint-plugin/src/adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.proxy.ts`
- `packages/eslint-plugin/src/adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.test.ts`
- `packages/eslint-plugin/src/adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.ts`
- `packages/eslint-plugin/src/adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.proxy.ts`
- `packages/eslint-plugin/src/adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.test.ts`
- `packages/eslint-plugin/src/adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.ts`
- `packages/eslint-plugin/src/adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.proxy.ts`
- `packages/eslint-plugin/src/adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.test.ts`

Replacement: `#gateway/npm/eslint-plugin-eslint-comments`, `#gateway/npm/eslint-plugin-jest`, `#gateway/npm/typescript-eslint__eslint-plugin` — each a real pass-through (`export * from '<pkg>'`, or named re-exports where the package's own `.d.ts` uses `export =`), with no `.proxy.ts` of its own, exactly as unmocked as the deleted adapters' own empty proxies (`Record<PropertyKey, never>`).

Edit (2 files):
- `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts` — import lines 32-34; call sites at line 75 (`typescriptEslintEslintPluginLoadAdapter()`), 230/276/299 (`eslintPluginEslintCommentsLoadAdapter()`), 300 (`eslintPluginJestLoadAdapter()`).
- `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.proxy.ts` — drops the three now-pointless child-proxy calls (lines 23-25); keeps its `registerModuleMock({module: 'eslint-plugin-jest', ...})` (mocks the real npm specifier at module-load time, unaffected by which file re-exports it).

Verified NOT needing an edit: `config-dungeonmaster-broker.test.ts` (no reference to any of the three adapter names — confirmed by `discover`).

### 1b. `eslint/rule-tester` — BLOCKED, see "Why this plan stops here"

Delete (3 files):
- `packages/eslint-plugin/src/adapters/eslint/rule-tester/eslint-rule-tester-adapter.ts`
- `packages/eslint-plugin/src/adapters/eslint/rule-tester/eslint-rule-tester-adapter.proxy.ts`
- `packages/eslint-plugin/src/adapters/eslint/rule-tester/eslint-rule-tester-adapter.test.ts`

Replacement per item recommendation: a `test/harnesses/rule-tester.harness.ts` composing `RuleTester` from
`#gateway/npm/eslint` — test infrastructure, no production proxy.

Edit (1 file): `packages/eslint-plugin/src/index.ts` line 27 — the package's own public barrel re-exports
`eslintRuleTesterAdapter` from the adapter path; this is what `local-eslint` (a different package) imports it
through (`import { eslintRuleTesterAdapter } from '@dungeonmaster/eslint-plugin'`), so the barrel line's SOURCE path
changes but the exported name can stay stable for that external caller.

Edit (76 in-package files) — every `packages/eslint-plugin/src/brokers/rule/<name>/rule-<name>-broker.test.ts` that
imports `eslintRuleTesterAdapter` by RELATIVE path (`'../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter'`),
confirmed present by `discover({grep: "eslintRuleTesterAdapter", strict: true})` against `brokers/rule/**`. Per EPIC.md
concession #1 there is no `_test_` barrel, so each of these 76 relative imports must change individually to the new
harness path — a barrel re-export at `index.ts` does not cover them, since none of them import through the package
barrel:

ban-adhoc-types, ban-anonymous-jsx-in-map, ban-dom-handles-in-ingredients, ban-fetch-in-proxies,
ban-flattened-contract-params, ban-gateway-export, ban-inline-helpers-in-test-scenarios, ban-invented-failures,
ban-jest-mock-in-proxies, ban-jest-mock-in-tests, ban-negated-matchers, ban-node-builtins-in-test-scenarios,
ban-nondeterminism-in-ingredients, ban-not-to-throw, ban-object-keys-in-expect, ban-page-route-in-e2e,
ban-playwright-evaluate-for-styles, ban-playwright-extract-then-assert, ban-primitives, ban-proxy-catch-all-defaults,
ban-reflect-outside-guards, ban-require-in-source, ban-silent-catch, ban-startup-branching,
ban-string-includes-in-expect, ban-tautological-assertions, ban-typeof-assertions, ban-unanchored-to-match,
ban-unknown-payload-in-discriminated-union, ban-wait-for-timeout, ban-weak-asymmetric-matchers,
ban-weak-existence-matchers, ban-workspace-export-mocks, bin-program-spawn-ban, enforce-contract-usage-in-tests,
enforce-e2e-base-import, enforce-file-metadata, enforce-gateway-config-names-exist, enforce-gateway-restricted-to,
enforce-gateway-schema-fields, enforce-harness-patterns, enforce-hydration-recipes-structure,
enforce-implementation-colocation, enforce-import-dependencies, enforce-jest-mocked-usage, enforce-magic-arrays,
enforce-object-destructuring-params, enforce-optional-guard-params, enforce-project-structure,
enforce-proxy-child-creation, enforce-proxy-param-binding, enforce-proxy-patterns, enforce-regex-usage,
enforce-stub-patterns, enforce-stub-usage, enforce-test-colocation, enforce-test-creation-of-proxy,
enforce-test-name-prefix, enforce-test-proxy-imports, enforce-testid-queries, forbid-non-exported-functions,
forbid-todo-skip, forbid-type-reexport, gateway-colocation, gateway-dependency-declared, gateway-import-boundary,
gateway-layout, gateway-schema-brand, jest-mocked-must-import, no-bare-process-cwd, no-multiple-property-assertions,
no-mutable-state-in-proxy-factory, raw-import-ban, require-contract-validation,
require-validation-on-untyped-property-access, require-zod-on-primitives

— each of those 76 names expands to exactly one file,
`packages/eslint-plugin/src/brokers/rule/<name>/rule-<name>-broker.test.ts`. NOT on this list, confirmed by the same
`discover` pass: `platform-globals-ban` (uses the typed rule-tester instead, G-J's scope) and
`enforce-folder-return-types` (b18-rule's file, out of my scope regardless).

Out-of-package, NOT edited (different package — report only): `local-eslint`'s own rule-broker tests
(`packages/local-eslint/src/brokers/rule/{ban-direct-io-in-test-scenarios,ban-locator-pick,ban-quest-status-literals,ban-sync-seeding-methods,graph-reachability,no-bare-location-literals,no-hardcoded-package-names}/*.test.ts`)
import `eslintRuleTesterAdapter` from `'@dungeonmaster/eslint-plugin'` (the package barrel), not from the adapter's
relative path — unaffected as long as `index.ts`'s re-export keeps the same exported name.

### 2. Four `fs/*` adapters

Delete (12 files):
- `packages/eslint-plugin/src/adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter.ts` (+`.proxy.ts`, +`.test.ts`)
- `packages/eslint-plugin/src/adapters/fs/exists-sync/fs-exists-sync-adapter.ts` (+`.proxy.ts`, +`.test.ts`)
- `packages/eslint-plugin/src/adapters/fs/read-file-sync/fs-read-file-sync-adapter.ts` (+`.proxy.ts`, +`.test.ts`)
- `packages/eslint-plugin/src/adapters/fs/write-file-sync/fs-write-file-sync-adapter.ts` (+`.proxy.ts`, +`.test.ts`)

Replacement: `#gateway/node/fs` — `readFileSyncIfExists` (for `fsEnsureReadFileSyncAdapter`, which returns `string`
and throws on missing; the gateway's shape returns `string | null`, so each caller's "throw on missing" branch has
to be rebuilt at the call site — this is real behavioural work, not a rename), `existsSync`, `readFileSync`,
`writeFileSync`. Trap: the gateway's `readFileSync`/`writeFileSync` are FIXED to `'utf8'` — no `encoding` parameter.
`fsReadFileSyncAdapter`/`fsWriteFileSyncAdapter`/`fsEnsureReadFileSyncAdapter` all accept an optional `encoding`
that every real caller below omits (all default to `'utf-8'`/`'utf8'` implicitly) EXCEPT their own `.test.ts` files,
which is being deleted anyway — confirm no real caller passes a non-default encoding before relying on this.

Edit — impl + proxy (2 files each, tests verified not needing changes since they go through the broker's own proxy,
not the adapter's, except where noted):

| Caller broker/responder | Adapter(s) used | Folder |
|---|---|---|
| `config-gateway-lint-config-broker.ts` (+`.proxy.ts`) | exists, read | `brokers/config/gateway-lint-config/` |
| `config-workspace-package-names-broker.ts` (+`.proxy.ts`) | read | `brokers/config/workspace-package-names/` |
| `resolve-workspace-glob-layer-broker.ts` (+`.proxy.ts`) | read | `brokers/config/workspace-package-names/` |
| `repo-scope-resolve-broker.ts` (+`.proxy.ts`) | read | `brokers/repo-scope/resolve/` |
| `check-gateway-export-name-exists-layer-broker.ts` (+`.proxy.ts`) | exists, read | `brokers/rule/enforce-gateway-config-names-exist/` |
| `check-gateway-subpath-exists-layer-broker.ts` (+`.proxy.ts`) | exists | `brokers/rule/enforce-gateway-config-names-exist/` |
| `barrel-completeness-layer-broker.ts` (+`.proxy.ts`) | exists, read | `brokers/rule/gateway-colocation/` |
| `find-nearest-package-json-layer-broker.ts` (+`.proxy.ts`) | read | `brokers/rule/gateway-dependency-declared/` |
| `find-package-json-dir-layer-broker.ts` (+`.proxy.ts`) | exists | `brokers/rule/gateway-dependency-declared/` |
| `build-gateway-type-declaration-index-layer-broker.ts` (+`.proxy.ts`) | exists | `brokers/rule/gateway-schema-brand/` |
| `collect-gateway-type-declaration-names-layer-broker.ts` (+`.proxy.ts`) | read | `brokers/rule/gateway-schema-brand/` |
| `find-ancestor-directory-layer-broker.ts` (+`.proxy.ts`) | exists | `brokers/rule/platform-globals-ban/` |
| `resolve-gateway-scope-layer-broker.ts` (+`.proxy.ts`) | read | `brokers/rule/platform-globals-ban/` |
| `resolve-package-platform-layer-broker.ts` (+`.proxy.ts`) | read | `brokers/rule/platform-globals-ban/` |
| `workspace-root-find-broker.ts` (+`.proxy.ts`) | read | `brokers/workspace-root/find/` |
| `install-detect-config-responder.ts` (+`.proxy.ts`) | read, write | `responders/install/detect-config/` |
| `rule-enforce-proxy-child-creation-broker.ts` (+`.proxy.ts`) | ensure-read | `brokers/rule/enforce-proxy-child-creation/` — **BLOCKED, see below** |

Verified NOT needing a code change: `rule-enforce-import-dependencies-broker.test.ts:526` contains the literal string
`'fsEnsureReadFileSyncAdapterProxy'` as FIXTURE TEXT (a sample import line the rule-under-test parses to confirm
`.proxy.ts` files are exempt from import restrictions) — not a real import. Per the a12 item's own Trap about rule
fixtures, this stays as-is; it is negative/sample test data, not a caller.

### Why this plan stops here

**`rule-enforce-proxy-child-creation-broker.ts` is the only real caller of `fsEnsureReadFileSyncAdapter`, and
migrating it collides with a file I am explicitly told not to touch.**
`packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts` (owned this session by b18-rule) scans
each `post-edit`-tagged rule broker's SOURCE TEXT for the literal patterns `fsExistsSyncAdapter`,
`fsEnsureReadFileSyncAdapter`, `fsReadFileSyncAdapter`, `fsWriteFileSyncAdapter`, `fsReadFileAdapter`,
`fsWriteFileAdapter` (`checkPostEditRulesForFsOperations`, lines 109-145) to prove a post-edit rule "uses file system
operations"; its own `it` block asserts `rulesWithoutFsOps` is `[]` (line 232). `@dungeonmaster/enforce-proxy-child-creation`
is post-edit (confirmed by the hardcoded list this same file asserts at lines 238-246). Once
`rule-enforce-proxy-child-creation-broker.ts` calls `readFileSyncIfExists`/`existsSync` from `#gateway/node/fs`
instead, none of those six literal patterns remain in its source, `checkPostEditRulesForFsOperations` reports it as a
rule with no fs operations, and the integration test throws. I cannot fix this myself (the file is off-limits this
session); the eventual fix is adding the gateway names to that pattern list, which is a one-line change but sits in a
file this plan does not touch.

**`eslint/rule-tester`'s migration touches 76 in-package test files plus a cross-package (`local-eslint`) consumer of
the package barrel** — the exact "dozens of rule test files" condition the dispatching prompt named as a stop
condition, with the instruction to stop after the plan and report the count rather than implement.

Given both blockers sit inside this same group's file list (one adapter's only caller is off-limits; the other
adapter's callers number in the dozens), this plan stops here per instruction, with ZERO files created, edited or
deleted. The three plugin-load adapters (1a) and the three fs adapters other than `fs-ensure-read-file-sync`
(exists-sync, read-file-sync, write-file-sync) are NOT blocked by either issue and are ready for a fresh, right-sized
dispatch (the load-adapter sweep is 2 files' worth of caller edits; the fs sweep is 16 files' worth across the 16
non-blocked callers, i.e. ~34 caller-side files, still well past a 2-4-file batch and worth splitting by rule-folder
group as the table above already groups them).

### G-I-a

The operator re-split G-I into three groups after the plan above stopped early. This group's scope (2026-09-28):

**1. Three plugin-load adapters and their one caller.**

Delete (9 files):
- `packages/eslint-plugin/src/adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.ts`
- `packages/eslint-plugin/src/adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.proxy.ts`
- `packages/eslint-plugin/src/adapters/eslint-plugin-eslint-comments/load/eslint-plugin-eslint-comments-load-adapter.test.ts`
- `packages/eslint-plugin/src/adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.ts`
- `packages/eslint-plugin/src/adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.proxy.ts`
- `packages/eslint-plugin/src/adapters/eslint-plugin-jest/load/eslint-plugin-jest-load-adapter.test.ts`
- `packages/eslint-plugin/src/adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.ts`
- `packages/eslint-plugin/src/adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.proxy.ts`
- `packages/eslint-plugin/src/adapters/typescript-eslint-eslint-plugin/load/typescript-eslint-eslint-plugin-load-adapter.test.ts`

Edit (2 files):
- `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`
- `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.proxy.ts`

**2. `fs/ensure-read-file-sync` and its one caller.**

Delete (3 files):
- `packages/eslint-plugin/src/adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter.ts`
- `packages/eslint-plugin/src/adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter.proxy.ts`
- `packages/eslint-plugin/src/adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter.test.ts`

Edit (2 files; `.test.ts` verified needing no change, run only):
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.proxy.ts`

**3. Integration test's fs-operation recognizer.**

Edit (1 file):
- `packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts`

Not touched (other groups' scope): `adapters/eslint/rule-tester/**`, `adapters/fs/{exists-sync,read-file-sync,write-file-sync}/**` and every rule folder that still imports them.

Found while implementing, added here per EPIC rule 14 (same package, so edited rather than reported):
- `packages/eslint-plugin/package.json` — `gateway-dependency-declared` requires `@dungeonmaster/node` in `dependencies` once the broker imports `#gateway/node/fs` directly; only `@dungeonmaster/npm` was listed before.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

## Plan — F48

Scope: `packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts` only. No helper file
split out — the fix is two path/logic corrections inside functions the file already keeps local and
unexported (`checkPreEditRulesForFsOperations`, `checkPostEditRulesForFsOperations`), matching this file's
own existing precedent (it already keeps `getPreEditDungeonmasterRules` and its siblings unexported, and
sits directly under `src/` with no folder type of its own).

Edit (1 file):
- `packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts`
  - Import `readdirSync` alongside the existing `readFileSync` from `fs`, and `gatewayLocationsStatics`
    alongside `dungeonmasterRuleEnforceOnStatics` from `@dungeonmaster/shared/statics`.
  - Fix the path bug: `__dirname` is already `packages/eslint-plugin/src` (the file's own directory), so
    a rule's folder is `join(__dirname, 'brokers', 'rule', ruleSlug)`, not
    `join(__dirname, '../../src/brokers/rule', ruleSlug, ...)`.
  - Replace the single guessed filename (`rule-${ruleSlug}-broker.ts`) with a real directory listing:
    every `.ts` file directly inside that rule's folder, via `readdirSync(ruleDir, {withFileTypes: true})`,
    excluding `.test.ts`, `.proxy.ts` and `.stub.ts` — this is what lets the check see fs work that lives
    in a layer-broker file beside the rule's own entry file, not just the entry file itself.
  - Replace text-substring matching (`line.includes(pattern)` against adapter FUNCTION names and bare
    words like `'readFileSync'`) with import-SPECIFIER matching: extract every `from '...'`/`require(...)`
    /`import(...)` specifier per file, and classify a specifier as file-system work when it contains
    `/adapters/fs/` (the not-yet-migrated raw adapters) or starts with `#gateway/node/fs` or
    `#gateway/node/fs__promises` (built from `gatewayLocationsStatics.importPrefix`/`.folders.node`, not
    hardcoded). This is what stops `ban-gateway-export`'s doc comment (which only ever mentions the word
    "readFileSync" in prose) from tripping the pre-edit check — a comment is not an import specifier.
  - Remove the empty `catch {}` in both `checkPreEditRulesForFsOperations` and
    `checkPostEditRulesForFsOperations` — with the path fixed, `readdirSync`/`readFileSync` reading a real
    rule's own real folder should never throw, so a throw now means a genuine problem (a rule with no
    folder, a rule slug that does not match a folder name), and the test should fail loudly on it rather
    than silently reporting "no violations".
  - `Violation`'s `pattern`/`line` fields become `specifier`/`location` (`<filePath>:<lineNumber>`), and
    `throwErrorIfViolationsFound`'s message is updated to match — same shape, clearer content.
  - No other function in the file changes: `getPreEditDungeonmasterRules`, `getPostEditDungeonmasterRules`,
    `getAllPostEditRules`, `getPreEditRuleCount`, `getPostEditRuleCount`,
    `throwErrorIfRulesWithoutFs`, `getRegisteredDungeonmasterRules`, `getStaticsDungeonmasterRules`,
    `getMissingRules`, `excludeWardOnlyTypeCheckedRules`, `throwErrorIfMissingRules`,
    `throwErrorIfExtraRules`, and every `describe`/`it` block, are unchanged.

Proof (temporary, reverted before the final ward run): retag `@dungeonmaster/gateway-dependency-declared`
from `'post-edit'` to `'pre-edit'` in
`packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts` — this
rule's own fs work lives entirely in its layer files (`find-nearest-package-json-layer-broker.ts`,
`find-package-json-dir-layer-broker.ts`), never in `rule-gateway-dependency-declared-broker.ts` itself, so
it is the sharpest proof that folder-wide scanning (not just the one guessed filename) is what makes the
check real. Run only the pre-edit describe block, confirm it fails with a readable message naming the rule,
the fs specifier and the file:line, then revert the statics file.
