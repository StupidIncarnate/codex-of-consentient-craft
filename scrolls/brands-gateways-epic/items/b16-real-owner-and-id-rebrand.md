# B16: an owner must be a real, parsed object; an id may never be re-branded into another field

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), section 4.3. That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), B7 "an owner must be a real object", lines 801-816; B8 "an id may not be re-branded into another field", lines 818-888; rows 2259-2260 |
| Needs | [B15](b15-brand-migration.md) |
| Unblocks | T-items (Phase 5 runs alongside/after this), and Z01–Z07 |
| Packages touched | Wherever B15's migration created a contract only to get a name (B7), and wherever a re-brand of an id into another field exists today (B8) — census both at the start of this item, since B15's own migration may have already fixed some incidentally |
| Checks to run | `lint,typecheck,unit` |
| Split | One agent builds `require-real-owner` (reuses [B02](b02-contract-index-and-unused-contracts.md)'s C1 index); one agent builds `ban-id-rebrand` (needs the type checker); a third wave fixes whatever either rule flags |
| Runs alone | No |

## Why

**B7.** [B12](b12-require-object-contract-brands.md)'s B2 and B3 (no standalone brand, derived text)
close off inventing a new brand name directly — but a model blocked by those two rules could still invent
an *object* only to get a name for one field:

```
// flagged — contentContract is never parsed or built as a whole; only its field is used
const text = contentContract.shape.text.parse(raw);

// left alone — questContract is parsed as a whole when quest.json is read
const quest = questContract.parse(JSON.parse(raw));
```

An owner contract must count as parsed as a whole, in C1's sense (built in
[B02](b02-contract-index-and-unused-contracts.md)), somewhere in production code. C1 also counts a parse
of one field (`contentContract.shape.text.parse(raw)`) as the *contract* being used — B7 does not; that
difference is B7's whole job. A use of the owner as a type does not count either, since a branded object
can only come from a parse ([B12](b12-require-object-contract-brands.md)'s B1) — a type-only use adds
nothing except a way out: a function typed on `Content` that nothing calls.

**B8.** A value that carries an owner's `id` brand may not be parsed into a field with a different
brand. This closes the one way around B1's compiler refusal: since the compiler already refuses an id in
a differently-branded field, the only way around that refusal today is a re-parse — B8 refuses the
re-parse too, so the only fix left is the right one: reuse the id schema ([B13](b13-owner-field-reuse.md)'s
B4).

```
// before — mintedBy has its own brand, so the id is re-branded to fit
mintedBy: z.string().uuid().brand<'WorkItemMintedBy'>().optional(),
const next: WorkItem = { ...item, mintedBy: workItemContract.shape.mintedBy.parse(parent.id) };

// after — mintedBy reuses the id schema, so the id fits as it is
mintedBy: workItemId.optional(),
const next: WorkItem = { ...item, mintedBy: parent.id };
```

```
// flagged — parent.id carries 'WorkItemId', an owner's id
workItemContract.shape.mintedBy.parse(parent.id)

// left alone — createdAt is not an id, so copying the value is fine
workItemContract.shape.startedAt.parse(item.createdAt)
// left alone — a plain string from outside, parsed once
questContract.shape.id.parse(rawFromUrl)
```

## What counts as an id, and the three known re-brands (B8)

An id is a brand declared on an owner's `id` key. B8 only sees ids that **have** an owner — three
re-brands in the code (as of the source doc's read) show the edge:

| Re-brand | Where | Does B8 catch it? |
|---|---|---|
| `QuestWorkItemId` becomes `ProcessId` | `command-chat-output-emit-transformer.ts:48`: `processIdContract.parse(String(workItemId))` | Yes — the source is a work item's `id`. The fix depends on whether `ProcessId` got an owner ([B15](b15-brand-migration.md)'s open decision 4). |
| `ToolUseId` becomes `ToolName`, to use as a Map key | `merge-tool-entries-transformer.ts:37`: `toolNameContract.parse(toolUseId)` | No — `ToolUseId` is declared on `chatEntry.toolUseId`, not on an `id` key. |
| `AgentIdCorrelation` becomes `AgentId` | `tool-use-id-from-parent-lines-transformer.ts:45`: `agentIdContract.parse(toolUseResult.agentId)` | No — `AgentIdCorrelation` is declared on a stream line's `agentId`. |

Once each of these ids has an owner (resolved in [B15](b15-brand-migration.md)'s open decision 4), B4
([B13](b13-owner-field-reuse.md)) makes `toolUseId` and `agentId` reuse the owner's id, and B8 then sees
them too — this item runs *after* [B15](b15-brand-migration.md), so check whether these three re-brands
already disappeared as a side effect of that migration before treating them as still-open work.

**Most re-brands between brands that are not ids disappear under B2** ([B12](b12-require-object-contract-brands.md),
already executed by [B15](b15-brand-migration.md)) — the target is usually a standalone brand, which B2
removed, so the value now passes as a plain string with no parse at all:

| Re-brand (pre-migration) | Where | Under the rules |
|---|---|---|
| `displayLabelContract.parse(operation.text)`, from `OperationText` | `execution-panel-widget.tsx:341`, and twice more in the same file | `DisplayLabel` is gone; `operation.text` passes to a plain prop |
| `claudePermissionContract.parse(permission)`, from `McpPermission` | `settings-permissions-add-broker.ts:76` | Both gone; the settings contract's field brands the value when the settings are parsed |
| `filePathContract.parse(String(sessionFilePath))`, from `AbsoluteFilePath` | `quest-monitor-watcher-start-broker.ts:142` | Both gone; the path is a plain string |
| `repoRootCwdContract.parse(quest.worktreePath)` | `quest-cwd-resolve-broker.ts:81` | `RepoRootCwd` is gone (open decision 2, per [B15](b15-brand-migration.md)) |

Confirm each of these four is actually gone (i.e., [B15](b15-brand-migration.md) already removed the
standalone brand and the re-parse) before spending time on it in this item — if it is already gone,
check the box and move on; if it somehow survived the migration, fix it here.

**An object's own id copied into another of its own fields is a value, not a reference, and is left
alone.** `quest-write-route-broker.ts:54` sets `folder: questContract.shape.folder.parse(fields.folder ??
id)`, so a new quest's folder name defaults to its id, by design. B8 allows this specifically when the id
and the target field are properties of the **same object literal being parsed**:

```
// left alone — the quest's own id, into the same quest's folder
questContract.parse({ id, folder: fields.folder ?? id, … })
// flagged — another work item's id, into this work item's field
const next: WorkItem = { ...item, mintedBy: workItemContract.shape.mintedBy.parse(parent.id) };
```

## Current state

No rule folder named `require-real-owner` or `ban-id-rebrand` exists in
`packages/eslint-plugin/src/brokers/rule/` (confirmed this session, same scan as other items). This is
new work.

The three specific re-brand file/line citations above (`command-chat-output-emit-transformer.ts:48`,
`merge-tool-entries-transformer.ts:37`, `tool-use-id-from-parent-lines-transformer.ts:45`) and the four
"disappears under B2" citations were **not re-checked this session** — by the time this item runs,
[B15](b15-brand-migration.md) will already have changed most of the surrounding code; re-read each file
fresh rather than trusting these line numbers.

## Work

1. **Build `require-real-owner`.** Reuses [B02](b02-contract-index-and-unused-contracts.md)'s C1 index
   (parse-site tracking) — an owner contract is flagged when nothing in production code parses it *as a
   whole* (not just one of its fields via `.shape.<key>.parse(...)`). This needs the same index C1 uses,
   so it runs **ward only**, for the same three reasons C1 does (per BR "Where each rule runs": it reads
   other files; a contract is flagged for what other files do not contain; the fix — adding a whole-object
   parse — usually lands in a different file than the one holding the contract).
2. **Build `ban-id-rebrand`.** Needs the type checker: check the static type of the argument to a field
   schema's `.parse` call. Flag when that argument's static type carries a brand declared on some owner's
   `id` key, and the field being parsed into carries a *different* brand. The same-object exception needs
   a syntax check too: the id and the target field must be properties of the same object literal being
   parsed (`questContract.parse({ id, folder: fields.folder ?? id })`). Ward only — the type checker.
3. **Census both rules' likely hits fresh**, after [B15](b15-brand-migration.md) has landed, rather than
   trusting this file's pre-migration citations.
4. **Run both rules as a scan over the whole repo before switching them on**, hand-check a sample.
5. **Fix every flagged instance.** For `require-real-owner`: either delete the object (it was only ever a
   name-holder — inline its one field's brand directly where it's used, or restructure so the object is
   actually parsed as a whole somewhere real) or add a real whole-object parse where the data genuinely
   enters production (e.g., at a boundary that currently reads only one field off it). For `ban-id-rebrand`:
   change the target field to reuse the source id's schema (per [B13](b13-owner-field-reuse.md)'s B4),
   removing the field's own separate brand.
6. **Switch both rules on** once the repo passes clean.

## Lint rules this item adds or changes

| Rule | What it checks | Pre-edit? |
|---|---|---|
| `require-real-owner` | An owner contract must be parsed as a whole somewhere in production, not only through one of its fields | **No** — needs [B02](b02-contract-index-and-unused-contracts.md)'s repo-wide parse-site index |
| `ban-id-rebrand` | An id-branded value (declared on some owner's `id` key) may not be parsed into a differently-branded field, except when both are properties of the same object literal being parsed | **No** — needs the type checker |

## Teaching text this item changes

From BR "Architecture docs" (rows 2259-2260, referenced by line number in the item prompt — cross-check
against the actual table before writing, since this item's own read of BR's architecture-docs table did
not find distinct 2259/2260-specific rows beyond what [B13](b13-owner-field-reuse.md) already covers for
B4/B8 jointly at row 2332-2333). Confirm during execution which exact doc rows are still open for B7/B8
specifically and fold them into the Z-phase sweep
([Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md)) rather than
duplicating [B13](b13-owner-field-reuse.md)'s already-claimed rows.

## Done when

- [ ] `require-real-owner` exists, is ward-only, reads [B02](b02-contract-index-and-unused-contracts.md)'s
      index, and is scanned/hand-checked before switching on.
- [ ] `ban-id-rebrand` exists, is ward-only, uses the type checker, respects the same-object exception,
      and is scanned/hand-checked before switching on.
- [ ] Every flagged owner-only-for-a-name object is fixed (deleted or given a real whole-object parse).
- [ ] Every flagged id re-brand is fixed by reusing the source id's schema.
- [ ] Both rules are switched ON.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- Every file/line citation in this item is pre-[B15](b15-brand-migration.md)-migration — re-read fresh,
  do not trust the numbers.
- Do not build `ban-id-rebrand` as a syntax-only rule — it genuinely needs the type checker to know
  whether the argument's static type carries an id brand; a text-pattern match will both over- and
  under-fire.
- The same-object exception is narrow: id and target field must be in the *same* object literal being
  parsed. Do not widen it to "the same function" or "the same broker" — that would let real bugs (a
  different object's id copied in) through.

## Plan

Planned 2026-09-30 by a read-only planning agent, after the big-bang run (HEAD 1bf2437aa). This section overrides
"Current state", "Work" and "Split" above where they differ. Everything here is checked against the code as it stands;
no code was changed.

### What the code looks like now

- The five W10 brand rules are on at error in `config-dungeonmaster-broker.ts`; R1 (`require-contract-parse`) is
  registered, ward-only, and still waits on its switch-on rescan. The B7 and B8 rules do not exist yet.
- **The contract index (C1) is file-granular and cannot tell a whole parse from a field parse.**
  `contractUsesScanLayerTransformer` walks the receiver of every `.parse`/`.safeParse` and records one
  `{ targetFile, site }` per contract file it finds anywhere in the receiver, so `sessionContract.shape.id.parse(x)` and
  `sessionContract.parse(x)` both land as a parse site of `session-contract.ts`. `ContractIndexEntry` carries
  `parseSites`, `nestedInFiles` and `isParsed` (transitive through parsed parents), and nothing else. B7 therefore needs a
  shared change before its rule can be written: a `wholeParseSites` list beside `parseSites`, and an `isWholeParsed`
  beside `isParsed`. Every other part of the index stays as it is.
- **`ban-id-rebrand` needs a helper nothing has yet:** read the brand names off a `ts.Type`. No transformer in
  `packages/eslint-plugin/src/transformers/` does it. The census script below proves the approach works
  (`checker.typeToString(type, undefined, NoTruncation | InTypeAlias)` and a match on `$brand<"Name">`), but the rule should
  read the `$brand` property's keys from the checker instead of matching text.
- Ward-only rules carry no `dungeonmasterRuleEnforceOnStatics` entry, so `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`
  is **not** touched. The two new names go into `WARD_ONLY_TYPE_CHECKED_RULES` in
  `packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts` instead, exactly as
  `enforce-owner-field-reuse` and `require-object-contract-brands-indexed` are. Without that, the test at its
  "every registered rule needs an enforce-on entry" check fails.
- Registration mirrors `require-object-contract-brands-indexed` (R7-f and R7-g in `b12-require-object-contract-brands.md`):
  the create responder (import, `rules` type entry, `rules` object entry), its proxy and test; the config broker
  (`'off'` plus a comment) and its test; the enforce-on integration test; and the two plugin-list integration tests.
  The stale `eslint-plugin/CLAUDE.md` step 5 ("categorize in the shared statics") does not apply to ward-only rules.

### The census (2026-09-30, read-only)

Both censuses are reproducible: `node --max-old-space-size=16000 tmp/b16-plan/typed-census.cjs` (about 80 s, one
TypeScript program per package, writes `tmp/b16-plan/b8-hits.json` and `tmp/b16-plan/b7-hits.json`). The syntax-only
first pass is `tmp/b16-plan/census.py` then `census2.py`. `tmp/` is gitignored; after the rules exist, the rule scans
(`npm run ward -- scan @dungeonmaster/<rule> -- packages/<pkg>`, one package at a time) replace these scripts and are the
authority. The numbers are this run's observations, not an inventory.

**B8 (`ban-id-rebrand`).** The fixer rounds did not leave thousands of id re-brands. 6,735 `.parse(arg)` calls in the
repo (tests and proxies included) parse an argument into a branded target; 257 are production field parses
(`<owner>Contract.shape.<key>.parse(arg)`), and in only 51 of those does the argument carry a brand at all. The other
206 parse a plain string at a boundary, which B8 leaves alone. Of the 51:

| Kind | Count | B8 verdict |
|---|---|---|
| Argument brand equals the target brand, `String()` and `as` wrappers looked through (a dead re-parse: orchestrator 31, siegelense 3, hydration-recipes 2, web 1) | 37 | Not flagged (same brand). Dead code for the W9 class, not this item; see LEFT STANDING below. |
| Argument carries an owner's `id` brand and the target brand differs | **1** | **Flagged.** `packages/orchestrator/src/transformers/task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer.ts:43`, `agentContract.shape.id.parse(item.id)`, `item.id` is `NormalizedStreamLineContentItemId`. |
| Argument carries a non-id brand, target is another brand (for example `FlowEdgeFrom` into `FlowNodeId`, `GuildPath` into `SessionFieldsShapeCwd`; two of the 13 have an object argument with several brands) | 13 | Not flagged (the source is not an id). These are B13 reuse gaps. See open decision 3. |

The three re-brands this file cites from 2026-09-26 are gone: `processIdContract` and `toolNameContract` no longer
appear in `packages/orchestrator/src`, and `tool-use-id-from-parent-lines-transformer.ts` now parses an `AgentId` into an
`AgentId`. The four "disappears under B2" re-brands are also gone (the four standalone brands no longer exist).

Per package, flagged production re-brands: orchestrator 1, every other package 0. A whole-object parse whose argument
is an object literal holding one id-branded property is a false positive for a rule that only reads the argument's brand:
the first census pass (before the target was narrowed to a scalar field) showed such calls in `packages/server/src/responders/server/init/server-init-responder.ts` (lines 264, 320, 414, 450, 481, 868, 895) and `packages/orchestrator/src/flows/clarify-answer/clarify-answer-flow.ts:34`.
**The rule must therefore require the target to be a scalar field schema (its output type is a branded string or
number, not an object).**

**B7 (`require-real-owner`).** 765 object-contract consts sit in production `*-contract.ts` files; 68 exported ones have
no parse of their own as a whole. By definition, which is the open decision below:

| Definition of "parsed as a whole" | Exported owners flagged | Where |
|---|---|---|
| Strict: a direct whole parse of that const somewhere in production | 68 | shared 36, orchestrator 9, hooks 4, siegelense 4, hydration 3, testing 3, web 3, tooling 2, config 1, eslint-plugin 1, mcp 1, ward 1. Nearly all are members of a parsed union or fields of a parsed object (`chatEntryContract`'s eight members); the only fix would be to parse each member again, which is wrong. |
| C1's sense: a direct whole parse, or nesting inside a contract that is itself parsed (R1's definition) | **5** | shared `systemInitStreamLineContract`, `resultStreamLineContract`, `claudeQueueResponseContract`; testing `recordedCallsContract`, `isolateModulesMockContract` |

The five owners that are parsed **only through their fields** (`.shape.<key>.parse(...)`, the literal B7 example) are all
in shared: `sessionContract` (18 field parses), `agentContract` (15), `siegeInstanceContract` (11), `siegeRunContract`
(10), `flowNodeContract` (3). Every one of them is nested in a parsed parent, so under C1's sense none is flagged. B7's
distinct yield today is therefore **zero** beyond R1, and the five in the second row are also what R1 reports as
`contractNeverParsed`. Facts about those five: the three shared ones are used only by test harnesses
(`packages/orchestrator/test/harnesses/orchestration-jsonl/orchestration-jsonl.harness.ts`,
`packages/web/test/harnesses/claude-mock/claude-mock.harness.ts`); the two testing ones are type-only contracts whose
exported type is hand-written because the object holds functions (concession 25c).

The earlier draft of this census counted three more ward consts (`playwrightTestResultContract` and two siblings); they are
file-local, not exported, so they are not owners and are not flagged.

### Files: the two rules and their wiring

**Shared (the C1 extension for B7; one agent at a time, in this order).** All under `packages/shared/src/`.

| Batch | Files | What |
|---|---|---|
| S1 | `contracts/contract-uses-scan-layer/contract-uses-scan-layer-contract.ts`, `contracts/contract-uses-scan-layer/contract-uses-scan-layer-contract.test.ts`, `contracts/contract-uses-scan-layer/contract-uses-scan-layer.stub.ts` | Add `wholeParseSites` (same shape as `parseSites`). |
| S2 | `transformers/contract-index-from-sources/contract-uses-scan-layer-transformer.ts`, `transformers/contract-index-from-sources/contract-uses-scan-layer-transformer.test.ts` | In the receiver walk, an identifier whose parent is not a `.shape` access is a whole parse; a `z.array(xContract).parse(...)` counts as whole. A `.shape.key` reach is a field parse and lands in `parseSites` only. Needs S1. |
| S3 | `contracts/contract-index-entry/contract-index-entry-contract.ts`, `contracts/contract-index-entry/contract-index-entry-contract.test.ts`, `contracts/contract-index-entry/contract-index-entry.stub.ts` | Add `wholeParseSites` and `isWholeParsed`. Needs S1. |
| S4 | `transformers/contract-index-from-sources/contract-index-from-sources-transformer.ts`, `transformers/contract-index-from-sources/contract-index-from-sources-transformer.test.ts`, `brokers/contract-index/build/contract-index-build-broker.test.ts` | Collect whole sites, and compute `isWholeParsed` with the same transitive pass `isParsed` uses (decision 1 picks the definition). The broker test is listed because its assertions read whole entries; if it needs no edit the agent says so. Needs S2 and S3. |

BUILD NEEDED after S4: `@dungeonmaster/shared` (the operator builds alone). Lint loads shared from `dist`, and the B7 rule
reads the new field at lint time, so the scan cannot run before the build. Unit and integration read source and do not wait.

**eslint-plugin, `ban-id-rebrand` (B8).** All under `packages/eslint-plugin/src/`. Each layer is used by the rule broker only.

| Batch | Files | What |
|---|---|---|
| E1 | `transformers/type-brand-texts/type-brand-texts-transformer.ts`, `transformers/type-brand-texts/type-brand-texts-transformer.integration.test.ts` | Brand names on a `ts.Type` (a union gives the set of each member; an intersection its `$brand` keys). Integration test, because it needs a real program, like `typed-return-is-void-like-transformer.integration.test.ts`. |
| E2 | `brokers/rule/ban-id-rebrand/same-object-exemption-layer-broker.ts`, `brokers/rule/ban-id-rebrand/same-object-exemption-layer-broker.proxy.ts`, `brokers/rule/ban-id-rebrand/same-object-exemption-layer-broker.test.ts` | Pure AST: the id and the target field are properties of the same object literal being parsed. Narrow, per Traps. |
| E3 | `brokers/rule/ban-id-rebrand/arg-id-brand-layer-broker.ts`, `brokers/rule/ban-id-rebrand/arg-id-brand-layer-broker.proxy.ts`, `brokers/rule/ban-id-rebrand/arg-id-brand-layer-broker.integration.test.ts` | The checker half: the parsed argument's brand (looking through `String(x)`, `x as string`, `` `${x}` ``, `.toString()`), the parse's own output brand, and "target is a scalar field schema". Needs E1. Composes `ownerIndexBuildBrokerProxy` for the set of brands declared on an owner's `id` key. |
| E4 | `brokers/rule/ban-id-rebrand/rule-ban-id-rebrand-broker.ts`, `brokers/rule/ban-id-rebrand/rule-ban-id-rebrand-broker.proxy.ts`, `brokers/rule/ban-id-rebrand/rule-ban-id-rebrand-broker.integration.test.ts` | The rule: `CallExpression` on `parse`, `safeParse`, `parseAsync`, `safeParseAsync`; report `idRebranded`, no autofix (the fix is a contract edit). Typed RuleTester (`typedRuleTesterHarness`, real `filename` under a real tsconfig), like `ban-proxy-empty-called-with`. Needs E2 and E3. |

Message (teaching text, in the rule, not a doc file): `{{source}} carries {{brand}}, an owner's id. {{key}} is a different brand. Reuse {{ownerContract}}.shape.id for {{key}}, or keep the value in the type it already has.`

**eslint-plugin, `require-real-owner` (B7).**

| Batch | Files | What |
|---|---|---|
| E5 | `packages/eslint-plugin/src/brokers/rule/require-real-owner/rule-require-real-owner-broker.ts`, `packages/eslint-plugin/src/brokers/rule/require-real-owner/rule-require-real-owner-broker.proxy.ts`, `packages/eslint-plugin/src/brokers/rule/require-real-owner/rule-require-real-owner-broker.test.ts` | Copies the shape of `rule-require-contract-parse-broker.ts`: `Program:exit` on a `-contract.ts` file, `contractIndexBuildBroker({ rootDir })`, find the entry, report `ownerNeverParsedWhole` for each exported object contract const in the file when `isWholeParsed` is false. Skips the record-key, constraint-only and function-holding cases of concession 25, and a file whose exported types are all `isExempt`. RuleTester, `.test.ts`, like R1. Proxy composes `contractIndexBuildBrokerProxy`. Needs S4 (source only; the test does not wait for a build). |

Message: `Contract {{contractName}} is never parsed as a whole, only through its fields. Parse it at the boundary that receives the value, or delete it and brand the field where it is used.`

**eslint-plugin, registration (all three batches edit disjoint files; run beside each other after E4 and E5).**

| Batch | Files | What |
|---|---|---|
| E6 | `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts`, `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.proxy.ts`, `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.test.ts` | Import both rule brokers, add both to the `rules` type and object, both proxies, both names into the test's expected list. |
| E7 | `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`, `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.test.ts`, `packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts` | `'@dungeonmaster/require-real-owner': 'off'` and `'@dungeonmaster/ban-id-rebrand': 'off'` with comments that state the rule as it stands (ward-only, off until its scan reads 0, no enforce-on entry); a config test that each is `off` with no `ruleEnforceOn` entry (mirror the `require-object-contract-brands-indexed` test); both names into `WARD_ONLY_TYPE_CHECKED_RULES`. No other agent edits the config broker while this runs. |
| E8 | `packages/eslint-plugin/src/flows/eslint-plugin/eslint-plugin-flow.integration.test.ts`, `packages/eslint-plugin/src/startup/start-eslint-plugin.integration.test.ts` | Both names into each expected-rule list. |

Files NOT touched, on purpose: `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts` and its test (ward-only rules carry no entry), `eslint.config.js`, every doc file. Teaching rows 2259-2260 fold into the Z01 to Z03 sweep, per the "Teaching text" section above; B16 edits no doc.

### Files: the fix batches

The scan decides the final lists; the census says they are small. Conditional on the open decisions below.

| Batch | Files | What |
|---|---|---|
| F1a | `packages/orchestrator/src/transformers/task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer.ts`, `packages/orchestrator/src/transformers/task-tool-use-ids-from-content/task-tool-use-ids-from-content-transformer.test.ts`, `packages/orchestrator/src/contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract.ts` | The one B8 hit (decision 2). Gate: typecheck on orchestrator and web. |
| F1b | `packages/orchestrator/src/contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract.test.ts`, `packages/orchestrator/src/contracts/normalized-stream-line-content-item/normalized-stream-line-content-item.stub.ts`, `packages/orchestrator/src/transformers/chat-line-process/chat-line-process-transformer.ts` | Only if F1a's contract change breaks them. The agent reports the typecheck output; the operator confirms the batch before F1b runs. |
| F2a | `packages/shared/src/contracts/system-init-stream-line/system-init-stream-line-contract.ts`, `packages/shared/src/contracts/system-init-stream-line/system-init-stream-line-contract.test.ts`, `packages/shared/src/contracts/system-init-stream-line/system-init-stream-line.stub.ts` | B7 (decision 3): give the contract a real production parse at the boundary that reads the line, or move it out of production. |
| F2b | `packages/shared/src/contracts/result-stream-line/result-stream-line-contract.ts`, `packages/shared/src/contracts/result-stream-line/result-stream-line-contract.test.ts`, `packages/shared/src/contracts/result-stream-line/result-stream-line.stub.ts` | Same, for the result line. |
| F2c | `packages/shared/src/contracts/claude-queue-response/claude-queue-response-contract.ts`, `packages/shared/src/contracts/claude-queue-response/claude-queue-response-contract.test.ts`, `packages/shared/src/contracts/claude-queue-response/claude-queue-response.stub.ts` | Same, for the mock queue response. |
| F2d | `packages/orchestrator/test/harnesses/orchestration-jsonl/orchestration-jsonl.harness.ts`, `packages/web/test/harnesses/claude-mock/claude-mock.harness.ts` | Only if F2a to F2c move or delete a contract these two import. |

The two testing contracts (`recordedCallsContract`, `isolateModulesMockContract`, in
`packages/testing/src/contracts/recorded-calls/recorded-calls-contract.ts` and
`packages/testing/src/contracts/isolate-modules-mock/isolate-modules-mock-contract.ts`) get no fix batch: decision 3
exempts them, and they are R1's rows anyway.

### Order, and what runs beside what

1. **Wave 1, in parallel** (disjoint packages and folders): shared S1 then S2, S3, S4 (one agent at a time, in the
   dependency order above); eslint-plugin E1 and E2 (disjoint files, no shared dependency).
2. **Operator, alone, after S4:** build `@dungeonmaster/shared`.
3. **Wave 2, in parallel:** E3 (after E1), then E4 (after E2 and E3); E5 (after S4, runs beside E3 and E4: disjoint files).
4. **Wave 3, in parallel** after E4 and E5: E6, E7, E8. Each gates `lint,typecheck,unit` on its own files; E7 and E8 also run
   `integration` on their files, since those are integration tests.
5. **Operator: scan.** `npm run ward -- scan @dungeonmaster/ban-id-rebrand -- packages/<pkg>` and the same for
   `@dungeonmaster/require-real-owner`, one package at a time (several at once runs out of memory), over every package
   under `packages/`, the four `@gateway/*` included. Hand-check the flagged site per package, and compare with the census
   (expect B8: 1 in orchestrator; B7 under decision 1's pick: 5, or 0 for the three shared plus nothing once decision 3 exempts
   the testing two). A scan far above the census means a rule bug; fix the rule, not the repo.
6. **Wave 4, fixes:** F1a then F1b (orchestrator), beside F2a, F2b, F2c (shared; three disjoint contract folders), then F2d. Two
   agents in one package need disjoint lists, which these are. Shared changes need a shared build before the next lint.
7. **Operator: switch on.** E7's config broker flips both entries to `'error'`, in one final batch (`config-dungeonmaster-broker.ts`
   and its test only), after both scans read 0. Then `npm run ward -- --only lint,typecheck,unit -- <touched files>`
   plus the integration run for the two plugin-list tests, then the full `--uncommitted`.

Batch total: 4 shared, 8 plugin, up to 6 fix. Files created: 14 (`ban-id-rebrand` 9, `type-brand-texts` 2, `require-real-owner` 3). Files edited: 11 shared, 8 plugin
registration, plus the fix files above. Nothing deleted.

### Open decisions for the operator

1. **What "parsed as a whole" means for B7.** Strict (a direct whole parse of that const) flags 68 exported owners, almost all
   union members and nested objects whose only possible fix is a meaningless second parse. C1's sense (R1's: direct, or
   nested inside a contract that is parsed) flags 5. **Recommend C1's sense**, and say so in the rule's header. A field parse
   (`.shape.key.parse`) then counts for nothing on its own, which is the whole of B7's difference from C1. It also means B7
   adds nothing to R1 today; it stays useful as the guard against a model inventing an owner to name one field.
2. **How to fix the one B8 hit.** The tool-use id is deliberately stamped as the agent key (orchestrator `CLAUDE.md`,
   "Two-source sub-agent correlation", step 1). B8's own remedy, reuse the source id's schema, would make `agentId` a
   `NormalizedStreamLineContentItemId`, which is wrong for the real internal id that arrives later. **Recommend** the content
   item's `agentId` take either id (`agentContract.shape.id.or(normalizedStreamLineContentItemContract.shape.id)`), so
   `item.id` fits as it is and no parse remains. The alternative is a B8 exemption for this one site, which B8's Traps
   forbid widening. If the union breaks web's chain grouping, stop at F1a and ask.
3. **What to do with owners only a test builds.** The three shared stream-line contracts are read by harnesses only, and the two
   testing contracts are type-only (function-holding, concession 25c). **Recommend:** B7 and R1 both skip a contract whose
   exported types are all `isExempt` (covers the two testing ones, so no fix batch); for the three shared ones, add a real
   parse where production already reads that line shape (orchestrator's session-id and result handling), and move the contract
   to test support only if no production site reads it. Also **recommend leaving the 13 non-id brand-to-brand re-parses** (the
   table above) for B13's reuse pass and R8; B8 does not see them by design. Record them as a follow-up, not as B16 work.
4. **Whether B8 looks through `String(x)`, `x as string` and template wrapping.** The fixer rounds stripped most of these,
   so the census finds none that change a verdict, but a model will reach for them first once the rule bites.
   **Recommend yes:** unwrap them, and keep the same-object exemption narrow.
5. **Whether `recordedCallsContract`-style type-only exemptions belong in B7 or only in R1.** Recommend one shared guard in
   eslint-plugin used by both rules, so the exemption has one definition; that guard would be a sixth file
   (`packages/eslint-plugin/src/guards/is-ast-type-only-contract/is-ast-type-only-contract-guard.ts` and its test) in E5, taken
   from R1 if it already exists under another name. The E5 agent reports which.
6. **Where to keep the census script.** `tmp/b16-plan/typed-census.cjs` is gitignored. Recommend leaving it there: the rule
   scans replace it, and the EPIC's "Scripts used" table is for scripts that edit.

### LEFT STANDING by this planning pass

- 37 production field parses whose argument already carries the target's brand (dead re-parses; orchestrator 31, siegelense 3,
  hydration-recipes 2, web 1). Not this item and not flagged by either rule; W9's dead-parse finder covers the same class.
  The regenerating command is the census script above (rows where `inner` is a subset of `ret` and `support` is false).
- 13 non-id brand-to-brand field re-parses (decision 3). The list: `tmp/b16-plan/b8-hits.json`, key `all`, same filter with the
  argument brand not in the return brands.

## Concessions made while executing

