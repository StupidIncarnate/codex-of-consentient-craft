# B11: a contract name is unique across the repo's workspace packages, and today's duplicates are merged

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

