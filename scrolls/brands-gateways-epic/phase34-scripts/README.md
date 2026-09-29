> **This folder is the committed copy of `tmp/phase34/`.** The scripts name `tmp/phase34` in their own paths and
> write their output under it, so run them from there: `cp -a scrolls/brands-gateways-epic/phase34-scripts tmp/phase34`
> when `tmp/phase34/` is missing. The `out/` and `sample-out/` folders are not copied here.

# Phase 3 and 4 migration scripts

Scripts for the mechanical parts of the brands-and-gateways epic's Phases 3 and 4. Every script
re-censuses the tree on each run (no stored file lists), defaults to a dry run, and writes only when
given `apply`. Run every one from the worktree root. Output is gated by ward like any other change
(EPIC.md rule 16); record each use in EPIC.md's "Scripts used".

`lib/repo.cjs` holds what they share: TypeScript's own module resolution (`node16`,
`customConditions: ['source']`), fenced to this worktree, with an in-memory overlay; an export-graph
walker that finds the file DECLARING a name behind any barrel; B03's planned `exports` map; a
LanguageService per package; the typecheck gate; a Myers diff.

**Fencing matters here.** This worktree sits inside the main checkout, so a resolution that misses in
this tree walks up and silently lands in the main checkout's `packages/` (it happened while building
these: a "0 new errors" result was really the main checkout's code). Every host in `lib/` hides paths
outside the worktree.

`lib/verify-sample.cjs <sampleDir> [<sampleDir> ...] [--check=a.ts,b.ts] [--no-exports-overlay]`
proves a sample without touching `packages/`: it overlays every sample file at its real path (several
sample dirs stack), plus B03's planned `exports`, resolves every import, and typechecks each file
before and after with its package's own tsconfig (root files included, so global setup types load),
printing only the diagnostics the overlay added.

| Script | Item | Does | Dry-run count, 2026-09-28 evening | Leaves for an agent |
|---|---|---|---|---|
| `b03-exports-barrels/run.cjs [pkg ...] [--verify=f,...] [--sample-out=d] [apply]` | B03 steps 1, 2 | `exports` becomes concession 1's three keys (dist paths from each tsconfig.build.json); every root folder-type barrel moves to `src/<ft>/<ft>.ts` with its relative specifiers recomputed; relative importers of a moved barrel rewritten | 16 packages; 34 root barrels moved; 52 files written, 34 deleted; 0 leftovers | Keys it keeps and does not judge (`.`, `./testing` until the strip, eslint-plugin's `./tsconfig`, `./config`, `./rule-tester.harness`, testing's whole map); the barrel-honesty rule (B03 step 7); `create-package` templates and `init` scaffold (step 8) |
| `b03-per-file-imports/rewrite.cjs [--importers=p,..] [--targets=p,..] [--files=..] [--sample-out=d] [apply]` | B03 step 4 | Every import whose name is DECLARED in a `.stub.ts`/`.proxy.ts` and arrives through any barrel moves to that file's per-file specifier; same package gets a relative path. Each new specifier is resolved back to the declaring file under the planned `exports` before it is written. Merges into an existing import of the same specifier | 1,670 files, 1,855 statements, 4,090 names (3,917 via `shared/contracts`, 82 `shared/testing`, 22 `orchestrator/testing`, 18 `hydration/contracts`, 13 config, 12 `eslint-plugin` root, 24 via web's claude-mock harness) | `out/leftovers.json`: 43 stub imports in 34 production files (orchestrator 34 names, hydration-recipes 8, testing 1: guards and recipe brokers building data from stubs, a C6 violation to redesign); 45 `/testing` mentions inside strings (rule-test fixtures, testing's hoister tests); 2 namespace imports of a barrel |
| `b03-strip-barrels/run.cjs [pkg ...] [--sample-out=d] [apply]` | B03 steps 3, 4 | Drops every stub/proxy re-export from every production barrel; deletes a root `testing.ts` and its `./testing` key only when no file imports it | 14 files; 414 stub/proxy re-exports (shared 239, siegelense 84, hydration 45, session-forensics 18, hydration-recipes 15, config 11, eslint-plugin 2); hydration-recipes, mcp, siegelense `testing.ts` deletable now; shared (67 importers) and orchestrator (16) wait for the rewrite | Any `/testing` barrel still imported after the rewrite (listed with its importers) |
| `b02-contract-index/index.cjs [pkg ...]` | B02 | Read-only index of every `contracts/**/*-contract.ts`: parse sites in production code (chains like `x.shape.id.parse` included), nesting closure, value/type/test/stub uses resolved through imports, public-barrel reach, types that are not `z.infer`. Classes: parsed, value-used, type-only, test-only, dead | 1,170 files: 961 parsed, 30 value-used, 78 type-only, 25 test-only, **76 dead**; 48 files export a type that is not `z.infer`/`input`/`output` | The review of `out/delete-candidates.txt`; every non-dead class (type-only holds `eslint-context` and `tsestree`, test-only holds `exec-error`: the B06 cases); the `require-contract-parse` rule itself |
| `b02-contract-index/delete.cjs <reviewed-list.txt> [--verify] [apply]` | B02 step 7 | Deletes contract, `<base>.stub.ts`, `<base>-contract.test.ts` and every barrel line re-exporting them, for listed paths that are STILL `dead` in a fresh index (anything else is refused and its uses printed) | Full candidate list: 76 accepted, 228 files, 7 barrels edited | Building the reviewed list; other files left in a deleted contract's folder (listed) |
| `b11-contract-merge/census.cjs` | B11 steps 1-3 | Every contract name declared in two or more packages: each definition's shape (object, scalar-brand, enum...) and index class, and which definer every production user (via `dependencies`) and test user (via `devDependencies` too) already reaches | 39 names; 14 have an object definition; 19 have no keeper every user depends on (nearest keeper and the missing edges printed) | Every merge decision, the `FolderType` reconciliation (mcp's copy is `dead` now), names whose users share no dependency |
| `b11-contract-merge/move.cjs --from=<losing> --to=<keeper> [--sample-out=d] [apply]` | B11 step 6, after a decision | Points every importer of the losing copy (contract and stub, found by declaring file) at the keeper: relative in its package, per-file for a stub, `@dungeonmaster/<pkg>/contracts` for a contract; drops barrel lines; deletes the losing trio. Refuses when the keeper lacks a name or the two schemas differ; writes nothing if any importer cannot move | `getQuestInput` mcp→shared: refused (mcp's copy `.extend`s shared's with `format`); `cleanupAnswer`, `wardResult`: refused (schemas differ); `folderConfig`: refused (keeper lacks `AllowedExternalImports`); `zodIssueError` siegelense→server: blocked (server has no contracts barrel) | Reconciling the two checks in the keeper first; package dependencies it lists as missing |
| `b15-as-never/run.cjs <pkg> [--stub-args-only] [--files=..] [--sample-out=d] [apply]` | B15 "found along the way" | Removes each `as never` in a test file only where the file's diagnostics stay identical (LanguageService per package; the gate restores the casts in any statement that gains a diagnostic) | 3,717 casts in the repo (2,727 inside a `...Stub(` call). In test files: **2,970 removable in 452 files**, 540 load-bearing kept (orchestrator 998/143, shared 649/90, mcp 330/64, web 316/105, siegelense 172/29, server 139/3, testing 109/14, tooling 92/8, hooks 91/5, ward 16/5, cli 16/0, hydration 16/39, session-forensics 13/13, hydration-recipes 7/3, eslint-plugin 6/16); 198 in stub/proxy/harness files left; 107 in production files left | The kept list (`out/<pkg>-kept.txt`): each is a real type mismatch to read |
| `b15-stub-unwrap/run.cjs <pkg> --stubs=AStub,BStub [--files=..] [--sample-out=d] [apply]` | B15 stub shrinkage | `XStub({ value: <literal> })` becomes the literal (`attr="x"` in JSX) for a decided list of stubs, only where the gate stays green; drops the stub's import when no use is left | 16,048 literal-only wraps of 369 stubs in 1,897 files repo-wide (AbsoluteFilePath 1,841, FilePath 1,611, QuestId 1,249, ContentText 1,013, ...). Today, with brands in place, only enum stubs pass: `ExecutionStepStatusStub` in web, 112 unwrapped, 15 kept | Which brands go plain (B15 B2/B6), `XStub()` default calls, non-literal arguments, deleting the stub and contract afterwards (`b02-contract-index/delete.cjs` refuses until nothing uses them) |
| `b15-rename/rename.cjs --file=<decl> --from=Old --to=New` or `--batch=<json>` `[--sample-out=d] [apply]` | B15 (also B11, B16) | TypeScript's own rename over the declaring package and every package depending on it; locations unioned; refuses when `New` already appears in a touched file | `GuildListItem`→`GuildRosterEntry` (trial): 74 locations in 24 files, 16 packages scanned in 20-30s; 66 same-text hits NOT renamed: local `type GuildListItem = ReturnType<typeof GuildListItemStub>` aliases in 18 proxies (different symbols) and comments | Brand TEXT in `.brand<'…'>()` (B12's autofix), the same-name local aliases and comments in `out/leftovers.txt`, file renames |

## Proofs on a copy

The `sample-out/` folders hold `.ts` and `.test.ts` copies laid out as repo paths; delete them
once read, so no tool that globs from the repo root picks them up.

Each rewrite script was run with `--sample-out` and its output checked with `lib/verify-sample.cjs`
(or the script's own `--verify`). Nothing under `packages/` was edited.

| Sample | Files | Result |
|---|---|---|
| `b03-per-file-imports/sample-out` | cli proxy (`shared/contracts` + `shared/testing`), hydration-recipes proxy (`orchestrator/testing`, type-only import), local-eslint test (`eslint-plugin` root), web e2e (re-export through a harness) | every specifier resolves to the declaring file; 0 new diagnostics in 4 files |
| same, stacked with `b03-strip-barrels/sample-out` (shared, orchestrator, eslint-plugin stripped) | the same 4 files | 0 new diagnostics. Negative control: an un-rewritten importer against the stripped barrel gets TS2305/TS2724 |
| `b03-exports-barrels --verify` (shared, hydration-recipes, overlaid) | mcp broker using `shared/contracts`, `/transformers`, `/statics`; the cli proxy; `hydration-recipes/index.ts`; the moved `src/contracts/contracts.ts` | barrels resolve to `src/<ft>/<ft>.ts`; 0 new diagnostics |
| `b02-contract-index/delete.cjs --verify` | `packages/shared/contracts.ts` with `bin-entry` gone | 0 diagnostics; a listed live contract (`eslint-context`) was refused |
| `b11-contract-merge/sample-out` | mcp's `get-quest-input` callers | caught TS2339 `format` missing: the schemas differ, which is why the script now refuses that merge |
| `b15-as-never/sample-out` | `quest-modify-broker.test.ts` (191 casts), `quest-resolved-comments-transformer.test.ts` (68), `guild-session-list-widget.test.tsx` (41) | all removed; 0 new diagnostics |
| `b15-stub-unwrap/sample-out` | web's two `ExecutionStepStatusStub` test files | 0 new diagnostics |
| `b15-rename/sample-out` | the contract, a web widget, `start-orchestrator.ts`, a server responder | 0 new diagnostics |

## How to run each

- **B03, in this order, per package group** (never two agents on one package's barrels):
  1. `node tmp/phase34/b03-exports-barrels/run.cjs shared` then `... shared apply`. The keys keep
     `./testing` so today's importers still resolve.
  2. `node tmp/phase34/b03-per-file-imports/rewrite.cjs --targets=shared` then `... apply`. Split
     the writes by importing package with `--importers=` to size agent-free ward runs.
  3. `node tmp/phase34/b03-strip-barrels/run.cjs shared` then `... apply`; it deletes `testing.ts`
     only once step 2 left no importer.
  4. Gate: `lint,typecheck,unit,integration` on every package that imports the one changed.
- **B02:** `node tmp/phase34/b02-contract-index/index.cjs`, review `out/delete-candidates.txt` into a
  new file, then `delete.cjs <that file> --verify`, then `... apply`.
- **B11:** `census.cjs`; a human decides each object duplicate and reconciles the keeper; then
  `move.cjs --from=... --to=...`, `--sample-out` plus `verify-sample.cjs`, then `apply`.
- **B15:** per package in dependency order, after the B12/B13 autofixes:
  `for p in shared orchestrator ...; do node tmp/phase34/b15-as-never/run.cjs $p; done`;
  `b15-stub-unwrap/run.cjs <pkg> --stubs=<the brands this package made plain>`;
  `b15-rename/rename.cjs --batch=<renames.json>`.

## Not scripted, and why (measured 2026-09-28 evening)

| Candidate | Measured | Why no script |
|---|---|---|
| B04 `Tsestree` → `TSESTree` | 506 `Tsestree` type uses in 177 files, 140 visitor handlers typed `(node: Tsestree)` in 86 files, 2,200 `TsestreeStub(` in 82 files with 1,728 `TsestreeNodeType.X` inside them | Not one-to-one. A visitor's type swap cascades into every helper that takes a `Tsestree`, and the flat all-optional copy's `?.` guards must be read out by hand. A hand-built stub tree becomes `CallExpressionStub({ code })`: someone has to write the code string. The statics copy has 5 uses in 4 files |
| B05 other copied library types | `TypescriptSourceFileStub` 53 uses in 8 files, `TimerHandleStub` 10 in 3, `McpServerClientStub` 8 in 3, `FileStatsStub` 4 in 2, `EslintInstance` 5 in 2 | Too small to pay for a script; each needs a read (`hasRef`, the six wrapped source files) |
| B12, B13 autofixes | neither rule exists yet under `packages/eslint-plugin/src/brokers/rule/` | Built as eslint autofixes by design; ward's lint `--fix` applies them |
| B14, B16 | judgement per item | each flagged shape needs a new contract or an owner decision |
| B17 remainder | F53: 8 violations | hand fixes |
| B18 split (b) | 9 `return { success: true }` in 8 production files | hand fixes |
| B15 `z.unknown()`/`z.any()` in contracts | 128 in 88 files | each needs a replacement contract chosen |
| B15 dropping a brand's TYPE and its production `.parse` | — | a per-file gate cannot see what an exported signature change does to the rest of the package, and removing a parse drops a runtime check; the test-side half is `b15-stub-unwrap` |

## What a script can get wrong that ward will not catch

- `b02-contract-index` reads imports only. A contract reached by a string (a dynamic `import()` of a
  computed path, a JSON config, a template) looks dead. `delete.cjs` refuses anything the fresh index
  does not call dead, but the review of the list is still the check.
- `b03-per-file-imports` moves a production file's stub import too (43 imports in 34 files today); that compiles, and
  only B03's extended `enforce-import-dependencies` refuses it. The list is in `out/leftovers.json`.
- The per-file keys' `import`/`require`/`types` targets point at `dist/src/**/*.stub.js`, which
  `tsconfig.build.json` never emits (it excludes stubs and proxies, and nothing production imports
  them after the strip). Ward reads `source`, so only `check:published`/`check:consumer` see it.
- An `exports` field added to hooks, server, ward and web (none today) closes every deep import not
  matching the three keys, `@dungeonmaster/<pkg>/package.json` included. Absolute-path imports (the
  cli's install discovery) are unaffected.
- `b15-as-never` and `b15-stub-unwrap` accept an edit when the file's own diagnostics are unchanged.
  A test can still change meaning: an assertion that compared a stub's branded value now compares a
  literal, and a cast that silenced an `any` flow is gone. Run the package's unit tests, not only
  typecheck.
- `b15-rename` renames symbols, not text: a brand string, a snapshot, a fixture string or a doc naming
  the old identifier keeps the old name (`out/leftovers.txt` lists the same-text hits).
