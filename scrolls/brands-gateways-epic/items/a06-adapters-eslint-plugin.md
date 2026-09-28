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

### G-I-b

Scope (2026-09-28), written by a read-only pass over the actual tree (`discover`, `Read`). G-I-a already landed
(the three plugin-load adapters and `fs/ensure-read-file-sync` are gone). This group covers `fs/exists-sync` and
`fs/write-file-sync` and **every real caller of each**, confirmed by reading each candidate file — the item's own
"batch 2" caller table (lines 216-234) undercounts the real `fsExistsSyncAdapter` callers: `resolve-workspace-glob-layer-broker.ts`,
`workspace-root-find-broker.ts`, `resolve-package-platform-layer-broker.ts`, `repo-scope-resolve-broker.ts`, and six
rule brokers that check file existence for their own colocation/pattern logic (`rule-enforce-hydration-recipes-structure-broker.ts`,
`rule-enforce-implementation-colocation-broker.ts`, `rule-enforce-proxy-child-creation-broker.ts`,
`rule-enforce-proxy-patterns-broker.ts`, `rule-enforce-test-colocation-broker.ts`, `rule-gateway-colocation-broker.ts`
plus its `barrel-completeness-layer-broker.ts` layer) were not named there. All are real production callers, not
test fixtures (`rule-enforce-import-dependencies-broker.test.ts:161`'s one hit IS fixture text, per the a12 item's own
Trap about rule fixtures — left untouched).

Part 1 (`exists-sync` + `write-file-sync`, every caller) alone is already ~50 files with proxies and tests, so per
the dispatching instructions part 2 (`fs/read-file-sync`) does NOT run in this group — see "Part 2 file count" below.

**Delete (6 files) once nothing imports them:**
- `packages/eslint-plugin/src/adapters/fs/exists-sync/fs-exists-sync-adapter.ts` (+`.proxy.ts`, +`.test.ts`)
- `packages/eslint-plugin/src/adapters/fs/write-file-sync/fs-write-file-sync-adapter.ts` (+`.proxy.ts`, +`.test.ts`)

**Edit — every real caller (impl + proxy, 18 pairs = 36 files), onto `existsSync`/`existsSyncProxy` from
`#gateway/node/fs`(`/exists-sync/exists-sync.proxy`), and `writeFileSync`/`writeFileSyncProxy` for the one write
caller:**
1. `brokers/config/gateway-lint-config/config-gateway-lint-config-broker.ts` (+`.proxy.ts`)
2. `brokers/config/workspace-package-names/resolve-workspace-glob-layer-broker.ts` (+`.proxy.ts`)
3. `brokers/repo-scope/resolve/repo-scope-resolve-broker.ts` (+`.proxy.ts`)
4. `brokers/rule/enforce-gateway-config-names-exist/check-gateway-export-name-exists-layer-broker.ts` (+`.proxy.ts`)
5. `brokers/rule/enforce-gateway-config-names-exist/check-gateway-subpath-exists-layer-broker.ts` (+`.proxy.ts`)
6. `brokers/rule/enforce-hydration-recipes-structure/rule-enforce-hydration-recipes-structure-broker.ts` (+`.proxy.ts`)
7. `brokers/rule/enforce-implementation-colocation/rule-enforce-implementation-colocation-broker.ts` (+`.proxy.ts`)
8. `brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.ts` (+`.proxy.ts`) — only the
   `fsExistsSyncAdapter` half; the `readFileSyncIfExists`/gateway-read half already landed
9. `brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.ts` (+`.proxy.ts`)
10. `brokers/rule/enforce-test-colocation/rule-enforce-test-colocation-broker.ts` (+`.proxy.ts`)
11. `brokers/rule/gateway-colocation/barrel-completeness-layer-broker.ts` (+`.proxy.ts`)
12. `brokers/rule/gateway-colocation/rule-gateway-colocation-broker.ts` (+`.proxy.ts`)
13. `brokers/rule/gateway-dependency-declared/find-package-json-dir-layer-broker.ts` (+`.proxy.ts`)
14. `brokers/rule/gateway-schema-brand/build-gateway-type-declaration-index-layer-broker.ts` (+`.proxy.ts`)
15. `brokers/rule/platform-globals-ban/find-ancestor-directory-layer-broker.ts` (+`.proxy.ts`)
16. `brokers/rule/platform-globals-ban/resolve-package-platform-layer-broker.ts` (+`.proxy.ts`) — exists half only;
    `fsReadFileSyncAdapter` half stays (read-file-sync out of scope)
17. `brokers/workspace-root/find/workspace-root-find-broker.ts` (+`.proxy.ts`)
18. `responders/install/detect-config/install-detect-config-responder.ts` (+`.proxy.ts`) — exists AND write; the
    `fsReadFileSyncAdapter` half stays

**Edit — test files needing explicit staging added, because `existsSyncProxy` ships no address-less catch-all
"by design" (confirmed precedent: `packages/session-forensics/src/brokers/quest/find/quest-find-broker.proxy.ts:64`,
`packages/ward/src/brokers/check-run/source-condition/source-condition-supported-broker.proxy.ts:11`), unlike the old
adapter's `setupFileSystem`. Every walk-to-filesystem-root broker's "nothing found anywhere" test currently relies on
that removed catch-all and needs each level staged `exists:false` by hand — the same shape
`repo-scope-resolve-broker.test.ts` (unaffected, already explicit) already uses:**
- `config-gateway-lint-config-broker.test.ts` — 3 explicit `false` stages for `/orphan/src`, `/orphan`, `/`
- `check-gateway-subpath-exists-layer-broker.test.ts` — 1 explicit `false` stage for the "barrel missing on disk" case
- `find-package-json-dir-layer-broker.test.ts` — 6 explicit `false` stages walking `/repo/packages/node/src/fs` to `/`
- `find-ancestor-directory-layer-broker.test.ts` — 6 explicit `false` stages, same walk as above
- `resolve-package-platform-layer-broker.test.ts` — 3 explicit `false` stages for `/orphan/src`, `/orphan`, `/`
- `workspace-root-find-broker.test.ts` — 3 explicit `false` stages for `/orphan/src`, `/orphan`, `/`

**Edit — test files whose call sites change shape only (property rename or exposed-child-to-wrapper-method), no
new scenarios:**
- `barrel-completeness-layer-broker.test.ts` — `proxy.fsExistsSync.returns({filePath, exists})` → `{path, exists}`
- `rule-enforce-implementation-colocation-broker.test.ts` — `proxy.fsExistsSync.setupFileSystem(fn)` →
  `proxy.setupFileSystem(fn)` (the broker's own proxy stops exposing the child proxy directly, matching the
  encapsulation rule, and translates internally to two complementary `returnsMatchingPath` predicates)
- `rule-gateway-colocation-broker.test.ts` — `proxy.fsExistsSync.setupFileSystem(fn)` → `proxy.setupFileSystem(fn)`,
  same reason (its `barrelCompleteness.fsReadFileSync`/`gatewaySubpathDirectoryWalk.fsReaddirSync` calls are
  untouched — different subpaths, out of this group's scope)

Not touched (other groups' scope): `adapters/eslint/rule-tester/**` (G-I-c), `adapters/fs/read-file-sync/**` and
its callers (part 2, not run here), `adapters/fs/readdir-sync/**`, `adapters/minimatch/**`, `adapters/path/**`,
`adapters/eslint/typed-*/**` (G-J).

Found while implementing, added here per EPIC rule 14 (same package, so edited rather than reported):
- `brokers/rule/enforce-gateway-config-names-exist/rule-enforce-gateway-config-names-exist-broker.proxy.ts` (+
  `.test.ts`) — not a direct `fsExistsSyncAdapter` caller, but composes `workspaceRootFindBrokerProxy`, whose
  catch-all removal (see below) broke its own "walk several levels to the workspace root" scenario.
- `brokers/config/workspace-package-names/config-workspace-package-names-broker.proxy.ts` (+ `.test.ts`) — same
  reason: composes `workspaceRootFindBrokerProxy`, and its own "startDir nested under the repo root" and "no
  ancestor" tests each walk several levels the removed catch-all used to answer.
- `brokers/rule/gateway-schema-brand/rule-gateway-schema-brand-broker.test.ts` — same reason: its own proxy
  exposes `workspaceRootFindBrokerProxy` directly, and two RuleTester cases (the unique-interface valid case,
  the duplicate-interface invalid case) each walk several levels from a `packages/@gateway/**` file up to the
  workspace root.

### Part 2 file count (read-file-sync, not implemented this group)

Nearly every one of the 18 brokers above also imports `fsReadFileSyncAdapter` (confirmed while reading each file for
this group). Migrating it would touch the same ~18 broker+proxy pairs (36 files) plus its own adapter's 3 files
(`fs-read-file-sync-adapter.ts`/`.proxy.ts`/`.test.ts`) — roughly 39-40 files. Combined with part 1's ~50, doing both
in one group is far past the 30-file budget the dispatching instructions set, so part 2 is left for a fresh group.

## Concessions made while executing (G-I-b)

- `#gateway/node/fs`'s `existsSyncProxy` ships no address-less catch-all "by design" (confirmed precedent:
  `packages/session-forensics/.../quest-find-broker.proxy.ts:64`, `packages/ward/.../source-condition-supported-broker.proxy.ts:11`).
  Every walk-to-filesystem-root test (`configGatewayLintConfigBroker`, `workspaceRootFindBroker`,
  `findPackageJsonDirLayerBroker`, `findAncestorDirectoryLayerBroker`, `resolvePackagePlatformLayerBroker`, plus
  three transitively-affected consumers) needed EVERY intermediate ancestor level staged `exists: false`
  explicitly, not just the terminal "nothing found" case — a "climbs several levels then finds it" test needs
  the intermediate levels staged too. For RuleTester-driven proxies exposing an arbitrary caller decision
  function (`setupFileSystem((path) => boolean)`), translated to two complementary `returnsMatchingPath` calls
  (one for the predicate's true branch, one for its false branch) rather than an address-less default — exactly
  one of the two ever matches a given call, so there is no ordering ambiguity.
- Several proxies (`config-gateway-lint-config-broker`, `workspace-root-find-broker`,
  `find-package-json-dir-layer-broker`, `find-ancestor-directory-layer-broker`,
  `resolve-package-platform-layer-broker`) staged their computed path via naive string concatenation
  (`` `${dir}/${suffix}` ``), which double-slashes when `dir` is the filesystem root (`/`) — production code
  joins via the gateway's real `pathJoinAdapter`/`path.join`, which normalizes. Fixed with a
  `dir.endsWith('/') ? ... : ...` guard at each staging site; caught by a real crash, not by inspection.
- `ruleEnforceImplementationColocationBrokerProxy` and `ruleGatewayColocationBrokerProxy` stopped exposing
  their composed `existsSyncProxy()` child directly (the old adapter's `fsExistsSyncAdapterProxy` had a
  `.setupFileSystem` method the caller reached through `proxy.fsExistsSync.setupFileSystem(...)`; the gateway
  proxy has no such method) — each now wraps it in its own `setupFileSystem` method instead, which also drops
  the pre-existing "exposed child proxy" pattern the testing docs discourage.
- `resolve-workspace-glob-layer-broker.ts`'s pre-existing `.filter((name): name is PackageName => ...)` tripped
  the newly-landed `@dungeonmaster/ban-contract-type-predicates` rule (a different, concurrent item's work) once
  this scoped lint run touched the file; replaced with `.flatMap((name) => (name === null ? [] : [name]))`,
  which needs no type predicate on a contracts-imported type.

### G-I-d part 1

The item's own "Part 2 file count" section (above) estimated ~18 broker+proxy pairs for
`fs-read-file-sync-adapter.ts`. A read-only pass over the actual tree (`discover`, `Read`, 2026-09-28) found only
**12** real callers of `fsReadFileSyncAdapter` left — most of G-I-b's `existsSync`-only brokers
(`enforce-hydration-recipes-structure`, `enforce-implementation-colocation`, `enforce-proxy-child-creation`'s exists
half, `enforce-proxy-patterns`, `enforce-test-colocation`, `rule-gateway-colocation-broker` itself,
`find-package-json-dir-layer-broker`, `build-gateway-type-declaration-index-layer-broker`'s own exists half,
`find-ancestor-directory-layer-broker`) never called `fsReadFileSyncAdapter` at all. This group takes **10 of the
12**, up to the ~25-file budget; the other 2 are left for part 2 below with the reason each was skipped.

**Delete (0 files this round — see "Left for part 2"):** `fs-read-file-sync-adapter.ts`/`.proxy.ts`/`.test.ts` stay,
because 2 of its 12 real callers are not moved.

**Taken (10 callers, 24 files — impl + proxy, plus 3 test-file edits where the caller's own proxy exposes its
`fsReadFileSync` child directly rather than a semantic method, and 1 ripple edit in a composing proxy):**

1. `brokers/config/gateway-lint-config/config-gateway-lint-config-broker.ts` (+ `.proxy.ts`)
2. `brokers/config/workspace-package-names/config-workspace-package-names-broker.ts` (+ `.proxy.ts`)
3. `brokers/config/workspace-package-names/resolve-workspace-glob-layer-broker.ts` (+ `.proxy.ts`)
4. `brokers/repo-scope/resolve/repo-scope-resolve-broker.ts` (+ `.proxy.ts`)
5. `brokers/rule/enforce-gateway-config-names-exist/check-gateway-export-name-exists-layer-broker.ts` (+ `.proxy.ts`)
6. `brokers/rule/gateway-colocation/barrel-completeness-layer-broker.ts` (+ `.proxy.ts`, + `.test.ts` — its own
   proxy exposes `fsReadFileSync` as a raw child, so the 4 stagings in its own test rename `filePath`→`path` and
   drop the `FileContentsStub` wrap the gateway proxy's plain-`string` `contents` no longer needs)
7. `brokers/rule/gateway-colocation/rule-gateway-colocation-broker.test.ts` — not a direct caller; ripples because
   this file reaches through `proxy.barrelCompleteness.fsReadFileSync.returns(...)` directly (6 call sites) rather
   than a semantic method on `ruleGatewayColocationBrokerProxy`, which stays untouched itself (its
   `barrelCompleteness` field's type is inferred from `barrelCompletenessLayerBrokerProxy`'s own return type)
8. `brokers/rule/gateway-schema-brand/collect-gateway-type-declaration-names-layer-broker.ts` (+ `.proxy.ts`, +
   `.test.ts` — same exposed-child-proxy shape as barrel-completeness, 3 stagings renamed)
9. `brokers/rule/gateway-schema-brand/build-gateway-type-declaration-index-layer-broker.proxy.ts` — not a direct
   caller (its own `.ts` and `.test.ts` are untouched); ripples because it composes
   `collectGatewayTypeDeclarationNamesLayerBrokerProxy` and reaches its exposed `fsReadFileSync` child directly in
   `setupSrcDirWithDeclaration`
10. `brokers/rule/platform-globals-ban/resolve-package-platform-layer-broker.ts` (+ `.proxy.ts`) — only the
    `fsReadFileSyncAdapter` half; its `existsSync` half was already on the gateway (G-I-b)
11. `brokers/workspace-root/find/workspace-root-find-broker.ts` (+ `.proxy.ts`)
12. `responders/install/detect-config/install-detect-config-responder.ts` (+ `.proxy.ts`) — only the
    `fsReadFileSyncAdapter` half; its `existsSync`/`writeFileSync` halves were already on the gateway (G-I-b)

Every proxy above composes `readFileSyncProxy` from `#gateway/node/fs/read-file-sync/read-file-sync.proxy`
(per-file, never the barrel), staged `.returns({path, contents})` at the exact address each caller already used —
no new scenarios, since the old adapter's own proxy also addressed by path with no catch-all. Every implementation
file imports `readFileSync` from the `#gateway/node/fs` barrel, alongside the `existsSync`/`writeFileSync` already
imported there in 8 of these 10 files.

**Left for part 2 (2 callers, not touched this round):**

- `brokers/rule/gateway-dependency-declared/find-nearest-package-json-layer-broker.ts` (+ `.proxy.ts`, +
  `.test.ts`) — its proxy imports raw `existsSync`/`readFileSync` from `'fs'` directly and stages an
  address-less `existsHandle.calledWith([]).implement(() => false)` catch-all, instead of composing
  `findPackageJsonDirLayerBrokerProxy`'s own already-migrated, explicitly-staged `setupPackageJsonAt`/
  `setupNoPackageJsonAt` methods (composed here only inertly). Swapping just the `readFileSync` half to the
  gateway proxy would still leave the raw `existsSync` import and its catch-all in the same file — banned in
  every diff per this session's instructions. Fixing it for real means redesigning this proxy off the raw-fs
  catch-all entirely (every test gains one explicit `setupNoPackageJsonAt` per ancestor level, the same shape
  G-I-b gave `find-package-json-dir-layer-broker.test.ts`), which is its own unit of work.
- `brokers/rule/platform-globals-ban/resolve-gateway-scope-layer-broker.ts` (+ `.proxy.ts`, + `.test.ts`) — same
  shape and same reason: its proxy raw-imports `existsSync`/`readFileSync` from `'fs'` with an address-less
  `existsHandle.calledWith([]).implement(() => false)` catch-all, composing `findAncestorDirectoryLayerBrokerProxy`
  only inertly instead of using its already-migrated explicit staging methods.

Both left-for-part-2 files keep `fsReadFileSyncAdapter`/`fsReadFileSyncAdapterProxy` as real imports, so
`fs-read-file-sync-adapter.ts`/`.proxy.ts`/`.test.ts` cannot be deleted this round.

### G-I-d part 2

Scope (2026-09-28). Named files, all under `packages/eslint-plugin/src/`:

- `brokers/rule/gateway-dependency-declared/find-nearest-package-json-layer-broker.ts` (+ `.proxy.ts`, `.test.ts`)
- `brokers/rule/gateway-dependency-declared/validate-gateway-specifier-layer-broker.proxy.ts` (composes the proxy above; `.test.ts` gains the explicit no-package staging)
- `brokers/rule/gateway-dependency-declared/validate-gateway-specifier-layer-broker.test.ts`
- `brokers/rule/platform-globals-ban/resolve-gateway-scope-layer-broker.ts` (+ `.proxy.ts`, `.test.ts`)
- `brokers/rule/platform-globals-ban/rule-platform-globals-ban-broker.proxy.ts` (composes `resolveGatewayScopeLayerBrokerProxy`; read, edited only if its shape needs it)
- `brokers/rule/gateway-dependency-declared/find-package-json-dir-layer-broker.proxy.ts` and `brokers/rule/platform-globals-ban/find-ancestor-directory-layer-broker.proxy.ts` (additive: a `setupNoPackageJsonBelow`/`setupNoMarkerBelow` method, because a proxy may only create the gateway proxies its own broker imports)
- `adapters/fs/read-file-sync/fs-read-file-sync-adapter.ts`, `.proxy.ts`, `.test.ts` (deleted if no caller is left)

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

### small adapters (readdir-sync, minimatch, dirname, join)

Scope (2026-09-28), all under `packages/eslint-plugin/src/`. Census by walking the tree: `readdir-sync` has 5
callers, `minimatch/match` has 4, `path/dirname` and `path/join` together have about 20 (each with a proxy, and
several with tests that reach the exposed child proxy). That is past the 35-file cap, so this run takes
**minimatch and readdir-sync** and leaves `dirname` and `join` for the next dispatch.

`#gateway/npm/minimatch` ships no proxy (a pure `export * from 'minimatch'`), so minimatch runs for real; the
adapter's `{ dot: true }` option moves to the call sites. `#gateway/node/fs`'s `readdirEntriesSync` has
`readdirEntriesSyncProxy` (`returns({path, entries: {name, kind}[]})`), staged by exact path.

Taken (minimatch):
- `adapters/minimatch/match/minimatch-match-adapter.ts`, `.proxy.ts`, `.test.ts` (deleted)
- `brokers/rule/no-bare-process-cwd/rule-no-bare-process-cwd-broker.ts`, `.proxy.ts`
- `brokers/rule/platform-globals-ban/is-inside-gateway-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/rule/raw-import-ban/rule-raw-import-ban-broker.ts`, `.proxy.ts`
- `brokers/rule/gateway-import-boundary/rule-gateway-import-boundary-broker.ts`, `.proxy.ts`
- (`rule-platform-globals-ban-broker.proxy.ts` composes `isInsideGatewayLayerBrokerProxy`; read, unchanged)

Taken (readdir-sync):
- `adapters/fs/readdir-sync/fs-readdir-sync-adapter.ts`, `.proxy.ts`, `.test.ts` (deleted)
- `brokers/config/workspace-package-names/resolve-workspace-glob-layer-broker.ts`, `.proxy.ts`
- `brokers/rule/gateway-layout/rule-gateway-layout-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/rule/gateway-schema-brand/collect-gateway-type-declaration-names-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/rule/gateway-schema-brand/build-gateway-type-declaration-index-layer-broker.proxy.ts` (reaches `collectProxy.fsReaddirSync`)
- `brokers/rule/gateway-colocation/gateway-subpath-has-stub-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/rule/gateway-colocation/barrel-completeness-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/rule/gateway-colocation/rule-gateway-colocation-broker.test.ts` (reaches `gatewaySubpathDirectoryWalk.fsReaddirSync`), `.proxy.ts` (comment only)

Not taken (left): every caller of `adapters/path/dirname/**` and `adapters/path/join/**` (adapter folders stay).

### path adapters, group 1

Scope (2026-09-28), all under `packages/eslint-plugin/src/`. Callers of `adapters/path/dirname` and
`adapters/path/join` move to `dirname`/`join` from `#gateway/node/path` (pure, run for real in tests, no staging,
no path-adapter proxy composition). Tests are read and edited only if they depend on a mocked join.

- `brokers/workspace-root/find/workspace-root-find-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/config/gateway-lint-config/config-gateway-lint-config-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/rule/platform-globals-ban/find-ancestor-directory-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/rule/platform-globals-ban/resolve-package-platform-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `brokers/rule/platform-globals-ban/resolve-gateway-scope-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `responders/install/detect-config/install-detect-config-responder.ts`, `.proxy.ts`, `.test.ts`

### path adapters, group 2

Scope (2026-09-28), all under `packages/eslint-plugin/src/brokers/rule/`. Callers of `adapters/path/dirname` and
`adapters/path/join` move onto `dirname`/`join` from `#gateway/node/path`, which run for real in tests (no
`registerMock` staging); the proxies drop their `pathJoinAdapterProxy`/`pathDirnameAdapterProxy` composition. The
`adapters/path/*` folders stay; the operator deletes them once both path-adapter groups are done.

- `gateway-dependency-declared/validate-gateway-specifier-layer-broker.ts`, `.proxy.ts`
- `gateway-dependency-declared/find-nearest-package-json-layer-broker.ts`, `.proxy.ts`
- `gateway-dependency-declared/find-package-json-dir-layer-broker.ts`, `.proxy.ts` (also: stale `resolveRepoScopeLayerBroker` comment names `repoScopeResolveBroker`)
- `gateway-schema-brand/build-gateway-type-declaration-index-layer-broker.ts`, `.proxy.ts`
- `gateway-schema-brand/rule-gateway-schema-brand-broker.ts`, `.proxy.ts`
- `enforce-gateway-config-names-exist/check-gateway-subpath-exists-layer-broker.ts`, `.proxy.ts`
- `enforce-gateway-config-names-exist/check-gateway-export-name-exists-layer-broker.ts`, `.proxy.ts`
- `enforce-gateway-config-names-exist/rule-enforce-gateway-config-names-exist-broker.ts`, `.proxy.ts`
