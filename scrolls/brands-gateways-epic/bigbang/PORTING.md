# Porting the big-bang brand migration to another repo

For an operator who has never seen this repo. The brand rules themselves (B1 to B6) are in
`scrolls/brands-types-tests-rules.md` and `../items/b15-brand-migration.md`; the first run's record is `../EPIC.md`,
section "Big-bang run". This page is the procedure. All paths below are relative to `scrolls/brands-gateways-epic/`.

## 0. Readiness for assayer (as of 2026-09-30) — read before starting

**Usable, but not as one push-button run.** The tooling ports; the target is not ready yet; and some script bugs from
the first run are documented here rather than fixed in the scripts.

What works now:

| What | Evidence |
|---|---|
| Every script takes `--root=<repo>` and runs in place from `phase34-scripts/` and `bigbang/` | `node --check` on all 82 JS files, `bash -n` on both drivers |
| The read-only tools run on assayer and leave it untouched | brand census: 154 contract files, 50 standalone brands; `diag.cjs --full`: 0 errors on 5 packages; b12 census: 78 unbranded object contracts; b14 census: 58 ad-hoc shapes; promise-parse scan: 0. Outputs in this repo's `tmp/bigbang/port-trial/`. assayer's `git status` identical before and after |

What assayer needs before any brand step (section 1 has the general list):

| Missing | Why it matters |
|---|---|
| zod 4 (it has 3.25.76) | The scripts write `z.json()`, which zod 3 lacks |
| A build of this branch linked in, then `dungeonmaster init` | Its linked `@dungeonmaster/eslint-plugin` has none of the brand rules yet |
| Its own decision tables (section 3) | Which brand is an owned id, which a value brand, which goes plain. The census scripts draft them; a person or an opus agent must review them. This is judgment, not a script |
| `--zod-spec=zod` | assayer has no gateway packages yet |
| Its `cli` package is named `assayer` (unscoped) | The scripts refer to it by folder name |

What is not proven:

1. **The portable `run-all.sh` has never run end to end.** It commits as it goes; the porting agent could not run
   git. Run segment A on a scratch branch first and read the first few commits.
2. **Four script bugs from the first run are documented, not fixed in the scripts.** On a second repo they recur
   unless someone fixes them first:
   - W5's build-through-root-parse rewriter (`b15-value-brands`) wraps parses at wrong offsets: `.parse(return)`,
     triple-nested wraps, a contract referenced inside its own definition. Repair: `strip-w5-wraps.py`.
   - W6 (`b12-object-brand-fallout`) wraps objects that hold functions in a zod parse, which strips the functions at
     runtime (MCP handlers, testbed `cleanup`). Repair: FIXER-BRIEF decision 4.
   - W1 and W5 delete standalone brands and their validation with them; INVALID tests stop throwing. Repair:
     FIXER-BRIEF "Unit-test stage".
   - Scripts wrap `contract.parse(...)` around un-awaited Promises. Repair: `promise-parse-scan.cjs`, then add the
     `await`.
   Plus W9 (`b15-dead-reparse`) removes parses that a comment calls deliberate, and SD12 over-brands test-harness
   inputs; both are in section "Traps".

**Recommended order for assayer:** fix the W5 rewriter and W6's function handling in the scripts first (an estimated
hour of agent work, and it saves the repair passes); meet the prerequisites above; draft and review the decision
tables; then run the scripts in order with a commit after each, the repair scripts, and fixer rounds, exactly as the
first run did. assayer is about a seventh the size of this repo (154 contract files against 1,170), so the fixer
rounds should be short.

## 1. Prerequisites

1. The target is an npm-workspaces monorepo with its packages under `packages/*`, `node_modules` installed, and
   `node_modules/typescript`, `eslint` and `prettier` present at its root. `tsx` is optional.
2. Its `@dungeonmaster/*` packages carry the brand rules (`require-object-contract-brands`,
   `require-object-contract-brands-indexed`, `enforce-owner-field-reuse`) in their compiled `dist`. A `file:` link to a
   checkout counts only once that checkout is built from a commit that has them.
3. zod 4 is the default `zod` import (this epic's B01). The scripts write `z.json()`, which zod 3 lacks.
4. Generated files import `z` from `--zod-spec`. Without gateways, pass `--zod-spec=zod`. Once `init` has scaffolded
   `packages/@gateway/*` and the `#gateway/*` imports map, keep the default.
5. `packages/` is committed and clean, on the branch that takes the commits. Record a baseline full `ward` first: it
   answers "was it already red" later.
6. Memory: the scripts run with a 16 to 40 GB heap (W6's fallout script needs 40 GB on a repo this size). Run one
   script process at a time: each one reads `packages/` from disk.

## 2. Settings

Every script reads these through `../phase34-scripts/lib/port-config.cjs`: a flag, else the `MIGRATE_*` variable,
else the default. Flags pass through `run-all.sh`.

| Flag | Default (this repo) | What it is |
|---|---|---|
| `--root=DIR` | cwd | the repo to migrate |
| `--out-dir=DIR` | `<root>/tmp` | reports, leftovers, logs, markers, moved-away files |
| `--scope=@x/` | `@dungeonmaster/` | npm scope of the repo's own packages. An unscoped package goes by its folder name |
| `--gateway-dir=REL` | `packages/@gateway` | folder holding the gateway packages |
| `--gateway-spec=#x/` | `#gateway/` | import prefix of the gateways |
| `--zod-spec=SPEC` | `<gateway-spec>npm/zod` | where a generated contract imports `z` from |
| `--browser-pkgs=a,b` | `web` | packages whose gateway kind is `browser` (W7's schema imports) |
| `--eslint-prefix=@x/` | `@dungeonmaster/` | rule prefix of the dungeonmaster plugin in the target's `eslint.config.js` |
| `--decisions=FILE` | `<root>/scrolls/brands-gateways-epic/items/b15-brand-migration.md` | the 4.0 decision tables (section 3) |
| `--fence-extra=a,b` | none | more directories TypeScript resolution may read |
| `--link-fence=0` | on | stop letting `file:`-linked packages' real directories through the fence |

**The fence.** Every TypeScript host the scripts build hides files outside the root. A worktree sits inside its main
checkout, and an unfenced walk-up that misses there resolves to the main checkout's copy and fakes a pass. A consumer
that links `@dungeonmaster/*` by `file:` resolves those packages outside its root, so each symlink under
`node_modules/` whose target is outside the root lets that target, and every `node_modules` above it, through.
Without that, assayer's fenced typecheck reads 237 errors, 203 of them TS2307 on `@dungeonmaster/*`, against 0 with it
(section 9).

## 3. Inputs: decision tables and run lists

| Script (wave) | Reads | From | Shape |
|---|---|---|---|
| `b15-id-brands/run.cjs` (W3, W4) | table 2.2 | `--decisions` file, the lines between `#### 2.2 ` and `#### 2.3 ` | `\| pkg \| brand \| standalone file \| owner path \| owner const \| key \| … \| note \|` (note is the 14th column). Paths are relative to `packages/`. A row is picked by `--brand=<Brand>` (plus `--pkg` when two rows share it); every row with the same owner path and key is retyped in one pass |
| `b15-id-brands/run.cjs` (W4) | table 2.4 | lines between `#### 2.4 ` and `#### 2.5 ` | `\| pkg \| brand \| standalone file \| decision \| owner (path, status) \| owner key \| … \| why \|`. `decision` `plain` or owner `-` makes the script refuse (W1 handles it); an owner note containing `rename of` makes it refuse until the rename is done |
| `b15-unknown-fields/table.cjs` (W8) | item 3 | from the heading `### Item 3: the \`z.unknown()\` sites` to the line starting `Reading the columns:` | `\| # \| path:line \| field \| decision \| target \| target path \| status \| why \|`; `decision` is `json`, `own`, `gateway`, `exception` or `responder`. Rows are re-found by file and field, not by line |
| `feasibility/b15/codemod.cjs` (W1) | `w1-runs.txt` | `run-all.sh --lists=DIR` | `<const> <contract file>` per line, run order, biggest first. Drafted from table 2.8 (`W1 verdict` = `plain`) |
| `b15-value-brands/run.cjs` (W5) | `w5-runs.txt` | same | `<const> <contract file> [--no-group]`; first five lines are trials. Drafted from table 2.6, grouped per 2.7 |
| `b15-id-brands/run.cjs` (W3, W4) | `w3-runs.txt`, `w4-runs.txt` | same | the `--brand` arguments per line (`AgentId --pkg=shared`) |
| `b15-rename/rename.cjs` (W2) | every `w2-*.json` | same | `[{ "file", "from", "to" }]`: language-service renames of duplicate contract names |
| `b02-contract-index/delete.cjs` (3.1) | a reviewed list | its first argument | contract paths still `dead` in a fresh index |

Every other brand script (SD12, W6, W7, W9) re-censuses the tree and reads no table.

**Drafting them for a new repo.** A read-only census first, then one planner agent (read-only except the decision
file) writes the tables in the shapes above, and the operator derives the run lists from them.

| Census | Command (from the target root) | Feeds |
|---|---|---|
| Standalone brands, brand-text sharing, enum stubs, per-package counts | `node <scrolls>/phase34-scripts/brand-census/census.cjs --scope=@x/` → `<out>/brand-census/*.csv` | tables 2.2, 2.4, 2.6, 2.8 (`standalone-brands.csv`: class `F` = used as an object field, `P` = never a field → W1), 2.3 and 2.7 (`brand-sharing.csv`), enum brands off (`enum-stubs.csv`) |
| Parameter retypes (R8) and ad-hoc shapes | same run: `b13-*.csv`, `b14-*.csv` | SD12 and W7 expectations |
| `z.unknown()` fields | `per-package.csv` column `unknown`, then read each site | item 3 |
| Duplicate contract names | `node <scrolls>/phase34-scripts/b11-contract-merge/census.cjs` → `<out>/phase34/b11-contract-merge/out/duplicates.json` | `w2-*.json` |
| Dead contracts | `node <scrolls>/phase34-scripts/b02-contract-index/index.cjs` | the 3.1 reviewed list |
| Unbranded object contracts | `node <scrolls>/phase34-scripts/b12-object-brand-fallout/run.cjs --census` | W6 expectation |

A standalone brand whose production check matters (a regex, a range) is `NOT PLAIN YET` in 2.8: move the check into
the owning contract field first, or W1 deletes it (trap 4).

## 4. Run order

`run-all.sh` is the driver: `bash bigbang/run-all.sh --root=DIR --lists=DIR [--base=REV] [settings] <SEGMENT>`. It
commits each step on the current branch as `<KEY>: <what> (script output, tree red)`, writes a marker per step to
`<out>/bigbang/state/`, skips marked steps on a rerun, and refuses to start while `packages/` is dirty. `--base=REV`
also back-fills markers from commit subjects after REV. It ends with `<out>/bigbang/<SEG>.done` or `.failed`.

| # | Step | Kind | How |
|---|---|---|---|
| 1 | Census | script, read-only | section 3 |
| 2 | Decisions (4.0) | agent, read-only except the decision file | tables 2.2 to 2.8 and item 3 |
| 3 | Run lists | operator | `w1-runs.txt`, `w3-runs.txt`, `w4-runs.txt`, `w5-runs.txt`, `w2-*.json` in one folder |
| 4 | Hand pre-steps | hand | fix stub defaults that a new owner schema rejects (this run's H1: non-uuid `WorkItemId` stubs); do owner renames the tables need |
| 5 | W1 plain, SD12 R8 retype, W3 owned ids, W4 ownerless ids, W2 renames | script | segment `A` |
| 6 | W5 trials (first five lines) | script | segment `B`; read each log before going on |
| 7 | W5 rest, W6 fallout, W6 R2 and R7 autofix, W7 shape contracts, W8 `--only=json,own` | script | segment `C` |
| 8 | Repairs | script + operator | traps 1 and 2 below, then `fix-dangling.cjs` (section 6) |
| 9 | Fixer rounds: typecheck, then unit, then lint, then integration, then e2e | agent rounds | section 6 |
| 10 | W8 `--responders`, W9 dead re-parses | script, NEEDS-GREEN | segment `D`; then read W9's diff for deliberate parses (trap 9) |
| 11 | W10: R2 and R8 autofix over every `src`, scans of R2, R4, R7, R8, R9, a fixer round to 0, rules switched on | script + agents | segment `W10fix`, then fixer rounds |
| 12 | Prove it | operator | `build:clean` (trap 10), full `ward`, the repo's own e2e |

W8 `--responders` and `b15-unknown-fields/measure.cjs` assume dungeonmaster's server shape
(`responderResultContract.parse({ status, data })` under `packages/server`); a repo without it skips them.

## 5. Red-tree verdicts

| Script | Verdict | Why |
|---|---|---|
| W1 `codemod.cjs` | SAFE-IF-RUN-FIRST | its gate restores edits in a file already red; it still moves the contract, so dangling imports land in the fixer queue |
| W2 `rename.cjs` | SAFE-STACKED | TypeScript symbol rename; misses only files whose import no longer resolves |
| SD12 `b13-test-fallout` | SAFE-STACKED | syntactic retype; baseline keyed by code and message |
| W3, W4 `b15-id-brands` | SAFE-STACKED | acts only on new diagnostics naming its brand |
| W5 `b15-value-brands` | SAFE-STACKED, degrades to leftovers | a broken contextual type yields a leftover, not a wrap. Its wrap rewriter misplaced wraps anyway (trap 1) |
| W6 `b12-object-brand-fallout` | SAFE-IF-RUN-IMMEDIATELY-AFTER W5 | wraps literals by contextual owner brand; run it before any hand fix |
| W6 R2, R7 autofix | SAFE-STACKED | syntax, or the syntactic owner index |
| W7 `b14-shape-contracts` | SAFE-STACKED | gate baseline from disk; a red tree drops more shapes to leftovers |
| W8 `--only=json,own` | SAFE-STACKED | rows found by file and field |
| W8 `--responders` | NEEDS-GREEN | bakes checker types into permanent contracts |
| W9 `b15-dead-reparse` | NEEDS-GREEN | removes a runtime parse when a type says it is dead |

## 6. The fixer-round loop

The operator runs every check; fixer agents only edit. One round:

1. **Diag.** `node bigbang/tools/diag.cjs --root=DIR --full --jobs=3 --out=<out>/bigbang/logs/diag-rN.json`. Always
   `--full`: plain mode stops at a package's first syntax error and under-reports. It is unfenced by default, like
   ward's `tsc`.
2. **Graph** (once per tree shape): `node bigbang/tools/graph.cjs --out=<out>/bigbang/logs/graph.json`.
3. **Queue.** `node bigbang/tools/queue.cjs --diag=<diag> --graph=<graph> --max=5 --mode=ready --out=<queue>`: batches
   of up to five red files, one package per batch, leaves first up the import graph. `--by-template --fine` clusters the
   errors; a cluster of hundreds is a script's job (`fix-dangling.cjs`, `apply-suggestions.cjs`), not an agent's.
4. **Agents.** One agent per batch, briefed with `bigbang/FIXER-BRIEF.md` (substitute the target root for the path in
   its first lines) plus the batch's errors and any recipe from `bigbang/recipes/`. Two agents never share a file.
   Sonnet for leaf batches, opus for the root and residue rounds and for integration and e2e.
5. **Check and commit.** Diag again; commit the round on the current branch when the count fell and nothing new
   appeared outside the batches. Repeat from step 1.

After typecheck reaches 0: unit (`ward --only unit`), then lint (`apply-suggestions.cjs <ruleId>` first for bulk
suggestion fixes), then integration, then e2e, each with the same loop.

Script repairs used between rounds:

| Script | When |
|---|---|
| `bigbang/fix-dangling.cjs [--diag=file] [apply]` | TS2307, TS2305, TS2724 on imports of brands moved to `<out>/deletions/`: rewrites the importers the way the wave would have. `fix-dangling-holds.py <base diag> <after diag>` then holds back the edits that made new errors; re-run `fix-dangling.cjs apply` |
| `bigbang/strip-w5-wraps.py --base=<commit before W5> [--files=list] [apply]` | trap 1 |
| `bigbang/promise-parse-scan.cjs` | trap 6: must print `0 parse calls on a Promise` |
| `bigbang/apply-suggestions.cjs <ruleId> [pkgDir …]` | a lint rule with thousands of suggestion-fixable hits (`no-unnecessary-type-conversion` after W1) |

## 7. Traps this run hit

| # | Trap | What it looked like | What fixed it |
|---|---|---|---|
| 1 | W5's build-through-root-parse rewriter wrapped at wrong offsets | triple-nested wraps, a contract used inside its own definition, a field schema parsing a whole value, `.parse(return)` | strip every wrap it added (`strip-w5-wraps.py`, 103 wraps); unwrap `N.valueOf()` stub leftovers |
| 2 | SD12 over-branded harness inputs | 153 harness parameters retyped to brands; callers pass plain values | reverse them: a harness takes raw input (FIXER-BRIEF decision 1) |
| 3 | W6's parses stripped functions | zod drops keys a schema does not list: MCP tool `handler`s, testbed `cleanup`/`writeFile` vanished at runtime, with typecheck green | parse the data only: `{ ...contract.parse(data), handler }` (concession 25c) |
| 4 | Lost validation on deleted standalone brands | 66 unit files red: INVALID tests stopped throwing because the check lived in the deleted brand | put each check back in the owning contract field (19 agents) |
| 5 | Branded record keys and generic constraints | a branded `z.record` key fails every plain lookup (45 errors); a branded constraint rejects every owner passed to the generic (108) | keys plain unless an owner id; constraint-only contracts unbranded (concession 25a, b); R2 and R7 now skip both |
| 6 | Parse of an un-awaited Promise | `contract.parse(promise)` a script left, missing `await` | `promise-parse-scan.cjs` to 0 |
| 7 | `eslint --fix` out of memory in one process | the R2 autofix over every package's contracts died | one package per eslint process, 16 GB heap (`run-all.sh`'s `autofix`) |
| 8 | R7 crashed on a null parent | a tuple leaf: the rule's parent walk met `null` | the walk stops on null (39101c111); expect rule crashes on new shapes and fix the rule, not the tree |
| 9 | W9 removed deliberate parses | a parse kept on purpose at a boundary looked dead to the checker | read W9's diff; restore each deliberate one (this run: 2 of 132) |
| 10 | Stale `dist` after contract deletions | lint passed only because ESLint read `shared`'s stale `dist`; `cli` and `hydration-recipes` `dist` still held deleted contracts | `build:clean` before trusting lint, integration or e2e |
| 11 | `eslint.config.js` loaded a deleted contract | the lint config imports plugin source; once `filePathContract` was deleted every lint run would crash, hidden by trap 10 | after any step touching what the lint config loads, `node -e "require('./eslint.config.js')"` (the driver does it for `--lint-src` paths) |
| 12 | W8's generated responder union stripped keys | zod returns the first union member that parses, dropping the rest's keys; five responders had no data contract | hand-check every generated union; one opus agent per server |

## 8. Where a script writes

Dry runs and censuses write only under `--out-dir`: `<out>/phase34/<script folder>/out`, `<out>/bigbang/{logs,state}`,
`<out>/brand-census`, `<out>/libcopy-census`. Exceptions:

- `apply` writes `packages/`, and moves removed files to `<out>/deletions/<chunk>/`. `b15-id-brands --apply-to=DIR`
  writes under DIR, with moved files under `DIR/tmp/deletions/`.
- `--sample-out`, `--out`, `--sample` and `--work` values are joined onto the root (`path.join(root, value)`), so an
  absolute path does not work; give a root-relative one (it may climb out with `../`).
- `libcopy-census/reqkeys.js` writes its probe file to `<root>/tmp/libcopy-census/probe/`: the probe's imports must
  resolve through the root's `node_modules`.
- `run-all.sh` commits to the target repo's git.
- `libcopy-census/*.js` and `feasibility/b04`, `sd1-retype-residue`, `l3-stub-swaps`, `t05-recorded-failures` are
  this repo's library-copy and eslint-plugin prototypes: portable in their paths, but their tables (`stub-map.json`,
  `build-stub-map.py`) and package names are this repo's.

## 9. Trial on assayer (2026-09-30, read-only)

Run from this checkout against `/home/brutus-home/projects/assayer`, output under this repo's
`tmp/bigbang/port-trial/`. A snapshot of assayer's tree (6,994 files, newest mtime) and `git status` were equal before
and after.

| Run | Result |
|---|---|
| `brand-census/census.cjs --root=… --scope=@assayer/` | 1,474 files, 154 contract files, 50 standalone brands (28 used as a field, 22 never), 115 brand texts (14 shared), 10 branded enums; 0.7 s |
| `tools/diag.cjs --root=… --full --jobs=3` from `/tmp` | 5 packages, 0 errors, 8.7 s |
| same, from assayer's root with no `--root`, `--fence` | 0 errors |
| same, `--fence --link-fence=0` | 237 errors in 186 files (TS2307 203) |
| `b12-object-brand-fallout/run.cjs --census` | 78 unbranded object contracts (shared 45, core 25, app 4, cli 2, desktop 2) |
| `b14-shape-contracts/run.cjs --census` | 58 ad-hoc shapes: 56 data (core 50), 1 mixed, 1 method set |
| `b15-id-brands/run.cjs --brand=RunId` | refuses: `decision tables not found: …/b15-brand-migration.md (pass --decisions=<file> …)` |
| `promise-parse-scan.cjs` | 0 |

What assayer lacks before step 5: zod 4 as the default import (it has 3.25.76), `@dungeonmaster/eslint-plugin` built with
the brand rules (its link's `dist` has none of them), gateways (so `--zod-spec=zod` until they exist), and its own
decision file and run lists. Its `cli` package is named `assayer` (unscoped): the scripts call it `cli`.
