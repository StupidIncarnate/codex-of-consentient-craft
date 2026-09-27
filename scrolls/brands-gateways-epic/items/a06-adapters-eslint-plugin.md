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

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
