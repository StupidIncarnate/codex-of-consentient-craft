# B11: a contract name is unique across the repo's workspace packages, and today's duplicates are merged

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), chunks 4.0 (decisions), R9 (rule) and W2 (merges). That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), C8 "a contract name is unique across the repo's workspace packages", lines 1468-1527; open decision 11, lines 2432-2433; the `FolderType` bug, lines 60-62 and 2477 |
| Needs | [B10](b10-owner-index.md), [B03](b03-package-exports-and-per-file-test-imports.md) |
| Unblocks | [B15](b15-brand-migration.md), and Z01–Z07 |
| Packages touched | Every package holding a duplicate contract name (see Current state for the freshly regenerated list); the package each duplicate moves down to, per the dependency-graph rule below |
| Checks to run | `lint,typecheck,unit,integration` — merging a contract moves its stub too, and every caller across packages needs a typecheck, not just the package the contract lands in |
| Split | Operator splits by duplicate-name cluster, 2-4 files (a contract + its stub + its test, times however many packages define it) per agent |
| Runs alone | No |

## Why

B3 (derived brand text, handled by [B12](b12-require-object-contract-brands.md)) derives every brand
text from the contract's owner name. If two packages each define a contract with the same owner name,
they mint the same brand text — possibly checking different things behind it. This is not hypothetical:
`FolderType` is `z.string()` in `mcp` and `z.enum([...])` in `shared`, both under the same brand text.
Zod treats two brands with the same text as the *same type*, so the two are interchangeable to
TypeScript, yet they check different things — a known, already-recorded bug
(`packages/mcp/CLAUDE.md` records it, per the source doc).

A second contract with the same name is either a copy that will drift, or a different check hiding
behind the same brand text. Both are the exact duplication problem the gateway already solved for
outside packages — this item is the same fix, for our own contracts.

## Current state

**Regenerated this session (2026-09-26)**, since the doc's own `tmp/dup-contracts.txt` lives in the main
checkout's gitignored `tmp/` and may not exist in this worktree. A `python3` scan across every
`packages/*/src/**/*-contract.ts` file (excluding `packages/@gateway/*`, since the gateway holds no
contracts of ours) for `export const <name>Contract = ` found:

- **1,048 total exported contract names**, of which **37 are declared in more than one package** — the
  same count the source doc reported from its 2026-09-24 scan, though re-derived independently this
  session, not carried forward from the doc's number.

The full duplicate list, fresh this session:

| Contract name | Packages |
|---|---|
| `absoluteFilePathContract` | shared, tooling |
| `agentIdContract` | orchestrator, shared |
| `chatOutputPayloadContract` | server, web |
| `cleanupAnswerContract` | orchestrator, siegelense |
| `commentBatchResponseContract` | server, web |
| `contentTextContract` | mcp, shared |
| `dispatchPlayResponseContract` | orchestrator, web |
| `errorMessageContract` | mcp, shared |
| `exitCodeContract` | shared, testing, tooling |
| `fileContentsContract` | config, hooks, shared |
| `fileNameContract` | eslint-plugin, shared, testing |
| `filePathContract` | config, eslint-plugin, hooks, server, shared, testing |
| `folderConfigContract` | config, shared |
| `folderDependencyTreeContract` | mcp, shared |
| `folderTypeContract` | mcp, shared |
| `getQuestInputContract` | mcp, shared |
| `globPatternContract` | shared, tooling, ward |
| `importPathContract` | mcp, shared, testing |
| `isoTimestampContract` | orchestrator, server, session-forensics, web |
| `packageJsonContract` | cli, shared, testing, ward |
| `packageJsonRawContract` | cli, ward |
| `pixelCoordinateContract` | siegelense, web |
| `processIdContract` | server, shared |
| `processOutputContract` | testing, tooling |
| `questWorkInputContract` | mcp, orchestrator |
| `recipeInputKeyContract` | hydration-recipes, siegelense |
| `recipeManifestContract` | hydration, hydration-recipes |
| `recipeNameContract` | hydration, hydration-recipes, siegelense |
| `runIdContract` | siegelense, ward |
| `signalBackInputContract` | mcp, server |
| `stepNameContract` | orchestrator, shared |
| `timeoutMsContract` | shared, web |
| `toolNameContract` | mcp, server, web |
| `toolResponseContract` | hooks, mcp |
| `toolUseIdContract` | hydration-recipes, mcp, orchestrator |
| `transcriptLineContract` | hooks, hydration-recipes |
| `wardResultContract` | shared, ward |

This list is a snapshot from this session's scan (a simple regex over `export const \w+Contract\s*=`) —
it will have drifted by the time this item is dispatched, since Phase 2 (adapter deletion) and other
Phase 3 items land contracts and delete others in between. **Re-run the scan fresh when this item starts**
rather than merging against this table blind; treat this table as a starting point that confirms the
doc's premise (37 duplicates existed and mostly still do), not as the final work list.

Many of these 37 disappear on their own before this item even needs to touch them: standalone scalar
brand contracts (`filePathContract`, `isoTimestampContract`, `fileContentsContract`, `fileNameContract`,
`exitCodeContract`, `globPatternContract`, and similarly-shaped ones) are removed entirely by
[B12](b12-require-object-contract-brands.md)/[B15](b15-brand-migration.md)'s B2 (no standalone brand
contracts). **Confirm, for each name in the fresh scan, whether it is a standalone scalar brand (B2 will
delete it — leave it alone here) or an object contract (this item merges it) before doing any merge
work.** Merging a contract B2 is about to delete anyway is wasted work; deleting it and then discovering
B15 also wanted to delete it is a coordination problem the two items' agents should resolve by checking
each other's status before touching a shared file.

## Work

1. **Re-run the duplicate-name scan fresh** at the start of this item (see Current state for the method:
   a syntax-level, or at minimum a careful regex, scan of every `export const <name>Contract` across
   `packages/*/src`, excluding `@gateway`). Read [B10](b10-owner-index.md)'s index — it should already
   record every contract name and its package, so this item likely does not need its own scan logic at
   all; use the index's data directly if it exposes duplicates already, and only fall back to a fresh
   `python3` scan if the index does not yet expose this view.
2. **Sort each duplicate into one of two buckets:**
   - **A standalone scalar brand** ([B12](b12-require-object-contract-brands.md)/[B15](b15-brand-migration.md)'s
     B2 deletes these; do nothing here except confirm the deletion is scheduled, and skip it).
   - **An object contract with the same name in two or more packages** — this item's real work.
3. **For each object-contract duplicate, find the package that should keep the name**: "the lowest
   package that every user of the contract already depends on, directly or through another package. A
   package lower in the graph cannot import from one above it, so a contract moves down, not up." In this
   repo that is usually `shared`, but the rule never hardcodes `shared` — compute the actual dependency
   graph for each duplicate's real users. A consumer repo may have no package like `shared` at all.
4. **When the users share no dependency at all, there is no autofix and the rule still errors.** Its
   message names the packages that define the name, says the contract is duplicated, and says to move it
   to a package every user depends on, or to create a package that holds it (open decision 11, settled:
   "The rule errors: the contract is duplicated, and it must move down to a package every user depends
   on, or into a new package created to hold it. The model makes that move; the rule does not pick.").
   For this item, that means: when you hit a duplicate with no shared dependency, decide the destination
   yourself (an existing package every user depends on, or propose a new one), and record the decision
   and its reason in this item's Concessions section.
5. **The same shape under a different name is allowed and must NOT be merged.** Two contracts with an
   identical schema (once brand texts are ignored) but different names are either genuine copies (like
   `dispatchPlayResponseContract` appearing in both `orchestrator` and `web` under the *same* name — that
   one IS a name duplicate and gets merged) or two meanings that happen to share a shape (like
   `killArgsContract` and `snapshotsArgsContract`, different names, same shape — leave these alone; a
   machine cannot tell them apart, their brand texts differ, and the compiler already keeps them from
   mixing). This item's scope is **name** duplicates only, from the index [B10](b10-owner-index.md)
   built — not a shape-similarity sweep.
6. **Merge each real duplicate**: keep the contract file (and its stub, and its test) in the destination
   package, delete the copies in the other packages, and switch every caller in those other packages to
   import from the destination package instead.
   ```text
   // before — measured on 2026-09-24, re-confirmed with a fresh count this session
   37 contract names are defined in more than one package, for example:
     filePathContract       config, eslint-plugin, hooks, server, shared, testing
     packageJsonContract    cli, shared, testing, ward

   // after — one package owns each name; the others import it
   packages/shared/src/contracts/package-json/package-json-contract.ts    the one packageJsonContract
   packages/shared/src/contracts/package-json/package-json.stub.ts        the one PackageJsonStub
   packages/cli, ward, testing                                             a production caller imports @dungeonmaster/shared/contracts (the folder-type barrel);
                                                                            a test imports @dungeonmaster/shared/contracts/package-json/package-json.stub directly
   ```
   (Import path per this epic's per-file form — see `b03-package-exports-and-per-file-test-imports.md`
   for the exact form; a production caller imports the folder-type barrel, a test imports the exact stub
   or proxy file it needs, straight from where it sits.)
7. **Fix the `FolderType` bug specifically**, as the concrete instance of this rule: `mcp`'s
   `FolderType` (`z.string()`) and `shared`'s `FolderType` (`z.enum([...])`) are two different checks
   under one brand text. Determine which package should keep the name (per step 3's dependency-graph
   rule), and pick the *stricter, correct* check (the enum, if that is what the real domain is — a folder
   type is presumably a closed set of values, so the enum is very likely the right check to keep; confirm
   by reading both definitions before deciding, and do not default to keeping whichever one happens to sit
   in the "winning" package if the other one is the more correct check — reconcile the two, keeping the
   better check, in the destination package).
8. **The stub moves with its contract**, to the one package that keeps the name.

## Lint rules this item adds or changes

**`enforce-unique-contract-names`** — ward only, because it reads other packages' files. It needs an
index across the repo's own workspace packages of every exported contract name — this is
[B10](b10-owner-index.md)'s index, read directly, not rebuilt.

| What it checks | Message |
|---|---|
| A contract name (an object contract, not a layer contract) is exported by exactly one workspace package | `{{name}} is already defined in {{otherPackage}}. A contract name is unique across the repo — import it from there, or move it to a package every user depends on.` |

No autofix — merging spans multiple files across multiple packages and needs a dependency-graph decision
a machine should not make silently.

## Teaching text this item changes

None named specifically in the "Architecture, folder-type and testing docs" tables for C8. The general
principle ("one home for each outside package" already exists for the gateway; this item is the same idea
for our own contracts) is implicitly covered by [Z01](../z01-gateway-folder-type-doc.md)'s general sweep;
no specific row references C8 by name in the doc tables read for this epic, so this item adds no doc-row
obligation beyond noting the `FolderType` fix in whatever `packages/mcp/CLAUDE.md` currently records about
the bug — update that file to say the bug is fixed, once it is.

## Done when

- [ ] The duplicate-name scan is re-run fresh at the start of this item, using [B10](b10-owner-index.md)'s
      index where possible.
- [ ] Every duplicate is sorted into "standalone scalar brand, leave for B2" or "object contract, merge
      here", with the sorting shown in the report.
- [ ] Every real object-contract duplicate is merged into one package, chosen by the dependency-graph
      rule, with every caller switched.
- [ ] Every duplicate whose users share no common dependency has an explicit destination decision
      recorded in Concessions, with the reason.
- [ ] The `FolderType` bug is fixed: one contract, one package, the correct (not just the "winning")
      check.
- [ ] `packages/mcp/CLAUDE.md`'s record of the `FolderType` bug is updated to say it is fixed.
- [ ] `enforce-unique-contract-names` exists, runs in ward, and is confirmed against a reintroduced
      duplicate-name mutation.
- [ ] `npm run ward -- --only lint,typecheck,unit,integration -- <touched files>` exits 0.

## Traps

- The duplicate list in this file is a snapshot — re-scan before merging, since other items running
  concurrently change contract names out from under a stale list.
- Do not merge a duplicate that is actually two different meanings sharing a shape under a *different*
  name (`killArgsContract` vs `snapshotsArgsContract`) — this item's scope is same-*name* duplicates only.
- Do not do B2's job here: a standalone scalar brand contract gets deleted by
  [B12](b12-require-object-contract-brands.md)/[B15](b15-brand-migration.md), not merged by this item.
  Merging one and then having it deleted a phase later wastes the merge work — check first.
- `FolderType`'s fix requires reading both definitions and picking the better check, not mechanically
  keeping whichever side wins the dependency-graph tiebreak.

## Concessions made while executing


## Decisions (4.0, 2026-09-29)

Written by the 4.0 decisions agent. Inputs: a fresh `node tmp/phase34/b11-contract-merge/census.cjs` run on
2026-09-29 (`out/duplicates.json`), each definition read side by side, and the `package.json` dependency graph
(`tmp/phase34/pkg-graph.json`). These decisions override the "Current state" table above and the plan's "39 names
... 19 with no keeper" figures.

### What the census says now, and where the code differs from the plan

- **37 names, not 39.** `folderTypeContract` and `folderDependencyTreeContract` are each declared once now, and
  `dispatchPlayResponseContract` is declared nowhere: `packages/shared/src/contracts/folder-type/` is the only `FolderType`, so the
  `FolderType` decision ("keeps shared's enum") needs no work, and `packages/mcp/CLAUDE.md` no longer mentions the
  bug (the item's "update CLAUDE.md" done-when is moot).
- **14 names have a non-scalar definition** (the census prints 13 "object" plus `packageJsonRawContract`, a
  `z.record`). The other 23 are standalone scalar brands. The plan's W2 says "14 object names": that count holds.
- **19 have no keeper among their own definers** (same as the plan). This agent's answer is that none of the 19
  needs a new dependency edge: 14 of them are scalars that B2 deletes, and the five object names are resolved by
  lifting to `shared` (every loser already depends on it), by a rename, or by dropping a type-only copy.
  The census only looks for a keeper among the packages that DEFINE the name; `shared` is a valid keeper for
  a name it does not define, which is what B11's own step 3 says ("the lowest package every user depends on").
- **Most of the 14 object duplicates are not duplicates.** Read side by side, only two are the same schema
  (`packageJsonRawContract`, `zodIssueErrorContract`). Two more are the same check with different `.describe` text
  or different-size views of one file (`signalBackInputContract`, `packageJsonContract`). Nine are different
  schemas that share a name by accident (`wardResultContract`, `folderConfigContract`, `toolResponseContract`,
  ...): B11 step 5 and the `move.cjs` refusal both say these are NOT merged. They are renamed. One is dead.
  So the plan's premise, that W2 is 14 merges driven by `move.cjs`, is wrong: it is 4 lifts, 9 renames and 1 delete.
- **The shared `WardResult` is not the ward package's `WardResult`.** shared's is a stored record (`id`,
  `createdAt`, `exitCode`, `wardMode`) that `questContract` nests; ward's is a run's result (`runId`, `filters`,
  `checks`, `durationMs`). Same for `folderConfigContract`: config's copy is really `AllowedExternalImports`
  (its own exported type is already named that) and shares nothing with shared's folder config.
- **17 contracts the census marks `dead` are still on disk** (`b02-contract-index` fresh run), among them three
  of this table's losers (`config`'s `filePathContract`, `hydration-recipes`'s `recipeManifestContract`, and
  `orchestrator`'s `stepNameContract`). The plan calls wave 3.1 done. The three dead losers are removed by the
  index's own `delete.cjs`, not by `move.cjs` (see the table).

### Action codes

| Code | Meaning | Driven by |
|---|---|---|
| `B2` | A standalone scalar brand. It goes away when its wave runs (`W1` if every definer's class is `P`, never a field; else the wave named). Nothing to merge here. | The wave's codemod |
| `LIFT` | The schema is the same (or one is a subset of the other). Create the keeper in `shared` (contract, stub, test, `packages/shared/contracts.ts` barrel line), then point each loser at it. | An agent writes the shared copy, then `move.cjs --from=<loser> --to=<keeper>` per loser |
| `LIFT+RECONCILE` | As `LIFT`, but the copies differ in checks or fields, so the agent first writes a keeper that accepts everything the losers accept. `move.cjs` refuses when the schemas differ, so the importers move by hand (counts in the notes) or after a `--accept-superset` flag is added to the script. | Agent, by hand |
| `RENAME` | Different schemas under one name. The loser's contract, stub, type and test take the new name. Nothing moves package. | `b15-rename/rename.cjs --file=<declaration> --from=Old --to=New`, then rename the folder and files by hand |
| `DELETE` | The loser is dead (or type-only) and goes. | `b02-contract-index/delete.cjs` for dead ones; hand for the type-only one |

### Object and non-scalar names (14)

Files are given so `move.cjs` and `rename.cjs` can be driven straight from the row.

| Name | Keeper | Losers | Action | Notes |
|---|---|---|---|---|
| `packageJsonContract` | shared | cli, ward, testing | `LIFT+RECONCILE` + `DELETE` (testing) | Four partial views of one file. Keeper: shared's copy grown to hold every field any loser reads: `name`, `bin`, `dependencies`, `exports` (shared), `workspaces`, `devDependencies` (cli), `scripts`, `peerDependencies` (ward). All optional, `.loose()`. `scripts` values become a branded string (ward had `z.unknown()`). testing's copy is a fifth, stricter shape (`name`, `version`, `scripts` required) and it is type-only (never parsed): C1 removes it. Its users in `packages/testing/src` (middleware, transformers, `integration-environment-create-broker`, `test-guild-contract`) move to `workspacePackageJsonContract`, which testing already owns and parses, or build the object through their own owner. testing gets no edge to shared (see Edges). Importer counts: cli about 9 files, ward about 14, testing about 13; the script refuses this merge, so cli and ward are by hand. |
| `packageJsonRawContract` | shared | cli, ward | `LIFT` | Identical `z.record(z.string().brand<'PackageJsonRawKey'>(), z.unknown())`. Used to read and write a whole package.json without dropping unknown keys. The `z.unknown()` value is a 4.0 item 3 site (`z.json()`). Files: `packages/cli/src/contracts/package-json-raw/`, `packages/ward/src/contracts/package-json-raw/`. |
| `zodIssueErrorContract` | shared | server, siegelense | `LIFT` | Byte-identical. The census keeper is `server`, but siegelense has no direct dependency on server (it reaches it only through cli) and server has no contracts barrel. Both depend on shared. Files: `packages/server/src/contracts/zod-issue-error/`, `packages/siegelense/src/contracts/zod-issue-error/`. |
| `signalBackInputContract` | shared | mcp, server | `LIFT+RECONCILE` | Same fields and `.strict()`. Only the `blockedReason` `.describe` text differs. Keep mcp's longer text: it is the tool description the model reads. `server -> mcp` is not a cycle but would make the HTTP server depend on the MCP package; shared avoids it. Importers: mcp 5 files plus 2 tests, server 2 plus 2, so by hand. |
| `wardResultContract` | shared (name kept) | ward | `RENAME` to `wardRunResultContract` | Two different things (see above). shared's is nested by `questContract` and read by web, orchestrator and session-forensics; ward's has 14 importers, all inside ward. Rename ward's: `--file=packages/ward/src/contracts/ward-result/ward-result-contract.ts --from=wardResultContract --to=wardRunResultContract`, then the type `WardResult` to `WardRunResult`, then the folder and stub. |
| `folderConfigContract` | shared (name kept) | config | `RENAME` to `allowedExternalImportsContract` | config's copy is a map of folder type to allowed package names; its exported type is already `AllowedExternalImports`. Users: config 2 files, eslint-plugin 2, mcp 3 (type name). |
| `getQuestInputContract` | shared (name kept) | mcp | `RENAME` to `mcpGetQuestInputContract` | mcp's copy is `sharedGetQuestInputContract.extend({ format })` with its own brand `McpGetQuestInput`, so it is already a different check under a different brand text. Moving `format` into shared would add a field to orchestrator's and hydration-recipes' callers, who never send it. This is the case `move.cjs` refused. |
| `questWorkInputContract` | orchestrator (name kept) | mcp | `RENAME` to `mcpQuestWorkInputContract` | mcp's is the tool-facing schema: `.describe` on every field and `plan` as `z.record(..., z.unknown())`. orchestrator's re-checks the same input with the typed plan envelope. Different checks; collapsing them would change the MCP tool's published JSON schema. mcp 3 files plus 2 tests. |
| `chatOutputPayloadContract` | web (name kept) | server | `RENAME` to `chatOutputRoutingContract` | server's `.loose()` copy reads only the routing keys (`slotIndex`, `questId`, `workItemId`, `chatProcessId`) so it can pass entries through untouched; web's carries `entries`, `sessionId`, `replay`. 2 files plus 2 tests each. Web's `entries` and `slotIndex` `z.unknown()` are 4.0 item 3 sites. |
| `commentBatchResponseContract` | web (name kept) | server | `RENAME` to `commentBatchDeliveredContract` | server's is the success body with both fields required; web's is the envelope with every field optional plus `staleAnchors` and `error`. Different checks. |
| `cleanupAnswerContract` | siegelense (name kept) | orchestrator | `RENAME` to `cleanupCliAnswerContract` | siegelense's is the strict shape the `cleanup` command emits (`.strict()`, `leftAlone`, `freedMB`). orchestrator's is a deliberately loose view of that output (`z.array(z.unknown())`) parsed in `step-handler-cleanup-broker.ts`, because orchestrator cannot depend on siegelense. Its `z.unknown()` arrays are 4.0 item 3 sites. |
| `toolResponseContract` | mcp (name kept) | hooks | `RENAME` to `hookToolResponseContract` | Not the same thing at all: hooks' is the PostToolUse `tool_response` (`filePath`, `success`); mcp's is an MCP `CallToolResult` (`content[]`, `isError`) and is type-only, so C1 and G04 (hand-written MCP SDK types) will remove it, not this item. Rename hooks': 4 files. |
| `transcriptLineContract` | hooks (name kept) | hydration-recipes | `RENAME` to `recipeTranscriptLineContract` | hooks' reads tool-use items (`name`, `input`); hydration-recipes' requires `uuid` and `timestamp` and reads `toolUseResult.agentId`. Merging into a superset would loosen the recipes' required keys. 2 files plus 2 tests. |
| `recipeManifestContract` | hydration | hydration-recipes | `DELETE` | hydration's is a `z.array(recipeDefContract)` with a duplicate-name refine; `hydration-recipes/index.ts:17` already imports it from `@dungeonmaster/hydration/contracts`. hydration-recipes' copy is a per-recipe object, class `dead`, and is in `tmp/phase34/b02-contract-index/out/delete-candidates.txt`. |

### Scalar names (23), all `B2`

None of these needs work in W2. The "wave" column is the first wave that removes the last definer, from
`phase34-scripts/brand-census/standalone-brands.csv` (class `P` never a field, class `F` used as a field). Where a
definer is an alias (`server`'s `processIdContract` and `isoTimestampContract` re-export another package's), the
same wave drops it.

| Name | Definers (class) | Wave that clears the name |
|---|---|---|
| `globPatternContract` | shared P, tooling P, ward P | W1 |
| `eslintRuleNameContract` | eslint-plugin P, hooks F | W1 then W5 |
| `errorMessageContract` | mcp P (test-only), shared F | W1 then W5 |
| `fileContentsContract` | config P (test-only), hooks F, shared F | W1 then W5 |
| `fileNameContract` | eslint-plugin P, testing P, shared F | W1 then W5 |
| `filePathContract` | config P (dead), eslint-plugin P, hooks P, server P, shared F, testing F | W1 then W5 |
| `exitCodeContract` | testing P, shared F, tooling F | W1 then W5 |
| `timeoutMsContract` | web P, shared F | W1 then W5 |
| `toolNameContract` | web P, mcp F | W1 then W5 |
| `pixelCoordinateContract` | web P, siegelense F | W1 then W5 |
| `processOutputContract` | testing P, tooling F | W1 then W5 |
| `recipeInputKeyContract` | hydration-recipes P, siegelense F | W1 then W5 |
| `absoluteFilePathContract` | shared F, tooling F | W5 |
| `contentTextContract` | mcp F, shared F | W5 |
| `importPathContract` | shared F, testing F | W5 |
| `isoTimestampContract` | orchestrator F, session-forensics F, web F, server (alias) | W5 |
| `moduleSpecifierContract` | tooling F, ward F | W5 |
| `agentIdContract` | orchestrator F, shared F | W4 |
| `processIdContract` | shared F, server (alias) | W4 |
| `runIdContract` | siegelense F, ward F | W4 |
| `stepNameContract` | shared F, orchestrator F (dead) | W4 |
| `toolUseIdContract` | hydration-recipes F, orchestrator F | W4 |
| `recipeNameContract` | hydration F, hydration-recipes F, siegelense F | W3 or W4 (4.0 item 2 decides its owner) |

Consequences for R9 (`enforce-unique-contract-names`):

1. **R9 must scan object contracts only, and only turn on at W10.** Scalar duplicates persist until W5; a rule that
   counted them could never be switched on before then. This is B11 step 2's own split, made a hard requirement.
2. **Brand TEXT collisions are a separate problem from name collisions.** Two scalars that are both inline field
   brands `'RunId'` after W4 would mint the same text. B3's owner-derived text (`'WardRunResultRunId'`) removes
   that; nothing in B11 needs to handle it.

### Edges the census asked for, and why none is added

Every "missing edge" the census printed, with whether it would close a cycle (computed over `dependencies`, then
`dependencies` plus `devDependencies`):

| Edge | Names that wanted it | Closes a cycle? | Decision |
|---|---|---|---|
| testing -> shared | contentText, errorMessage, exitCode, fileName, filePath, importPath, packageJson | Yes through devDependencies (`shared` has `testing` as a devDependency, and `testing` depends only on the gateway packages); dependencies only: no | Not added. Scalars go via B2; testing's `packageJson` is dropped (C1). `testing` stays a leaf above the gateway. |
| hydration-recipes -> siegelense | recipeInputKey | Yes (siegelense reaches hydration-recipes through dev edges) | Not added; scalar, B2. |
| hooks -> eslint-plugin | eslintRuleName | No | Not added; scalar, B2. |
| session-forensics -> orchestrator, web -> orchestrator | isoTimestamp | No | Not added; scalar, B2. |
| ward -> tooling | moduleSpecifier | No | Not added; scalar, B2. |
| ward -> cli | packageJsonRaw | No | Not added; lifted to shared. |
| tooling -> testing | processOutput | No | Not added; scalar, B2. |
| siegelense -> hydration | recipeName | No | Not added; scalar, W3/W4. |
| ward -> siegelense | runId | No | Not added; scalar, W4. |
| server -> mcp | signalBackInput | No | Not added; lifted to shared. |
| web -> mcp | toolName | No | Not added; scalar, B2 (W1 then W5). |
| hooks -> mcp | toolResponse | No | Not added; renamed. |
| hydration-recipes -> hooks | transcriptLine | No | Not added; renamed. |

**No new dependency edge is created by W2.** Every loser package that receives a lift already depends on `shared`
(cli, config, hooks, mcp, server, siegelense, ward, web, orchestrator: all list it under `dependencies`).

### Counts per action (2026-09-29)

| Action | Names |
|---|---|
| `B2` (scalars) | 23 |
| `LIFT` | 2 (`packageJsonRaw`, `zodIssueError`) |
| `LIFT+RECONCILE` | 2 (`packageJson`, `signalBackInput`); `packageJson` also drops testing's copy |
| `RENAME` | 9 |
| `DELETE` | 1 (`recipeManifest`, hydration-recipes' copy) |
| Total | 37 |

### Order and traps for the W2 agent

1. Run `delete.cjs` for `recipeManifest` first (it needs the loser still `dead` in a fresh index).
2. The four lifts touch `packages/shared/contracts.ts` (the barrel) and each loser package's barrel; the operator
   commits one lift at a time.
3. Renames run last, one at a time, and each one starts with a fresh `rename.cjs` dry run: `rename.cjs` refuses when the
   new name already appears in a touched file, and does not rename brand text (B12's autofix does) or the folder and
   file names.
4. `move.cjs` reports a loser importer whose package does not depend on shared; none is expected.
5. Renames stay renames. Do not later "simplify" `mcpQuestWorkInputContract` back into orchestrator's: it changes the
   published MCP tool schema.
