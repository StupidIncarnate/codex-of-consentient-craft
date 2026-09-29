# B15: brand the repo — the largest item

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), chunk 4.0 and waves W1 to W10. That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), applies B1 ("What gets a brand"/rule table, lines 133-396), B2 (398-497), B3 (499-552), B4 (554-706), B6 (724-800) across the whole repo; open decisions 2, 4 and 5 (lines 2407-2417); standalone scalar brand figures 45-58 and 96-108; `z.unknown()`/`z.any()` refusal (254-262); build-through-root-parse (321-331); stub shrinkage and dead re-parses (757-776); transformer/broker/widget figures (783-799); "Found along the way" rows for `retryCount`/`FailCount`, `JestSuiteName`, `as never` dead casts, `ExecutionStepStatusStub`, `questId` beside `quest` (2478-2486) |
| Needs | [B06](b06-gateway-schema-fields-in-contracts.md), [B07](b07-layers-and-statics-regex.md), [B11](b11-unique-contract-names.md), [B12](b12-require-object-contract-brands.md), [B13](b13-owner-field-reuse.md), [B14](b14-type-alias-and-adhoc-type-rules.md) |
| Unblocks | [B16](b16-real-owner-and-id-rebrand.md), and Z01–Z07 |
| Packages touched | Every workspace package. **Order: `shared` first, then every other package in dependency order** (a package migrates only after every package it depends on has already been migrated, since a downstream contract's reuse of an upstream owner's field needs the upstream owner to already carry the correct brand). |
| Checks to run | `lint,typecheck,unit,integration` per package, plus a full `npm run ward` as the final regression pass once every package is migrated and both rules are switched on |
| Split | Operator splits per package, then per folder within a package once a package proves too large for one agent's batch. This is the largest item in the epic — expect many waves. |
| Runs alone | No, but no two agents migrate the same package's contracts at once — the operator gives disjoint file lists. |

## Why

Every rule this migration applies was already built, and switched OFF, by three earlier items:
[B12](b12-require-object-contract-brands.md) (`require-object-contract-brands`,
`require-object-contract-brands-indexed`), [B13](b13-owner-field-reuse.md) (`enforce-owner-field-reuse`,
`ban-join-id-beside-child`), and B14's extensions. This item is the actual work those rules exist to
check: rewrite every contract in the repo so every object, every nested object, and every leaf carries
its derived brand; every reuse of another owner's field is written as a reuse, not a fresh brand; every
standalone scalar brand contract is deleted; and every value with no owner is left plain. Only once this
migration is real can [B12](b12-require-object-contract-brands.md)'s and
[B13](b13-owner-field-reuse.md)'s rules be switched from OFF to ON without breaking the whole repo at
once.

## What this item actually does, by rule

### B1 — every object, nested object and leaf is branded (autofix does most of this)

Run `require-object-contract-brands`'s autofix (built OFF in [B12](b12-require-object-contract-brands.md))
across the repo package by package, in dependency order. The autofix derives every text from the const
name and key path, so it needs no model judgement for the mechanical cases. What it cannot autofix, or
autofixes wrong, needs a human read:

- `z.unknown()`/`z.any()` refusals have no autofix (deciding each field's replacement contract is this
  item's own judgement call, not the rule's). Re-scan for the current count (the source doc measured 128
  uses in 85 contract files on 2026-09-26; treat that as stale by the time this item runs — Phase 2 and
  earlier Phase 3 items already remove some). For each:

  | What it holds today | Example | Becomes |
  |---|---|---|
  | Our own data, typed later or never | `responderResultContract`'s `data`, `quest-work-input-contract.ts`'s `z.record(z.unknown())` | That data's contract. Each responder's result contract holds its own `data` contract, one branch per status it returns. |
  | Any JSON value, by nature | `json-rpc-request-contract.ts`'s `params`, `tool-contract.ts`'s `inputSchema`, `file-metadata-contract.ts`'s `metadata` | `z.json()` — checked 2026-09-26 against zod's v4 build: accepts nested objects, arrays, strings, numbers, booleans and `null`; rejects a function, `undefined` and a `Map`. |
  | A library object | `mcp-server-client-contract.ts`'s `process`, `typescript-program-contract.ts` | The gateway's schema for that type ([B06](b06-gateway-schema-fields-in-contracts.md)'s C9), or deleted with its copy (already done by [B02](b02-contract-index-and-unused-contracts.md)/[B05](b05-other-library-type-copies.md) if these specific files were dead) |
  | Arguments recorded from a mock call | `staged-call-contract.ts`'s `args`, in `@dungeonmaster/testing` | **Not settled by the source doc.** `registerMock`'s own record holds whatever values a test passed, functions and predicates included, beside an `impl` function. No schema can check an arbitrary JavaScript value, and B9 (handled in [B14](b14-type-alias-and-adhoc-type-rules.md)) still treats the record as a contract. **Recommended — the executing agent may change it with a reason in DECISIONS:** leave this one field as `z.unknown()` with an explicit lint suppression and a comment stating why (per the comment-discipline rule: record the decision and the state — "no schema can check an arbitrary mock-call argument; this is the one field this repo's B1 cannot brand"), rather than inventing a fake contract that would check nothing and recreate the `ContentText` problem this whole epic exists to remove.

- **A contract that always holds the child does not also hold its id** — this is `ban-join-id-beside-child`'s
  fifth check (built OFF in [B13](b13-owner-field-reuse.md)), which has no autofix by design. Fix each
  flagged instance by hand: remove the id key, and change every caller that read it to read
  `child.id` off the (now-required) child object instead.
- **The self-referencing contracts** already got the getter-form rewrite in [B01](b01-zod-v4.md) — this
  item does not redo that work, only confirms `require-object-contract-brands`'s "self-reference" row
  passes on all five once the rule is run against them.

### B2 — no standalone brand contract; delete every one

Every standalone scalar brand contract (a `z.string()`/`z.number()` with `.brand()` and no owning
object) is deleted, its exported type with it. The source doc's 2026-09-24 figures (re-scan fresh, do not
trust these as current counts): 941 brand names declared in `*-contract.ts` files, 542 declared only
inline on one object field (these are already fine under B1 and need no B2 work), 212 standalone brand
contracts never used as an object field (51 with no type use at all — these are the clearest deletions),
187 standalone brand contracts also used as an object field (these need the field's own inline brand
written per B1, then the standalone contract deleted).

For the one exception — an owner that points at itself (`WorkItem` holding `dependsOn`/`insertedBy`/
`mintedBy`) — keep the local, unexported id const, named per the field that uses it as `id`. Do not
delete this one; it is the B2-compliant form, not a violation.

A format check many owners need (a regex pattern, for instance) moves to `statics/` rather than staying
a standalone contract:

```typescript
// statics/path/path-statics.ts
export const pathStatics = { absolutePattern: /^(\/|[A-Za-z]:\\)/u } as const;
// guild-contract.ts
path: z.string().regex(pathStatics.absolutePattern).brand<'GuildPath'>(),
```

This needs [B07](b07-layers-and-statics-regex.md)'s `allowsLayerFiles`/`allowRegex` config to already be
live (it is one of this item's Needs).

### B3 — brand text is owner-plus-key, derived, never chosen

The autofix from [B12](b12-require-object-contract-brands.md) handles this mechanically for every
non-indexed case; `require-object-contract-brands-indexed` (also from that item) handles layer-contract
texts. This item's job is to run both, confirm the text they land on is what B3 actually derives (spot-
check, do not blindly trust every autofix output), and fix the cases where autofix cannot safely rename
(e.g., a brand text used inside a string literal elsewhere, or a brand referenced by name in a comment or
doc that also needs updating).

### B4 — reuse another owner's field; do not invent a parallel brand

Run `enforce-owner-field-reuse`'s autofix (built OFF in [B13](b13-owner-field-reuse.md)) across the
repo, in the same dependency order. Its four autofixable checks (contract-key reuse, parameter-type
reuse, inline-object-copy reuse, inline-enum-copy reuse) do most of the mechanical work. Its fifth check
(join-id-beside-child) has no autofix — fix by hand per B1's section above.

**Open decision 4 — ids with no owner** is this item's to execute: `SessionId`, `ProcessId`, `AgentId`,
`ToolUseId`, `InstanceId` and `RunId` are carried by many contracts today, but none is any contract's own
`id`. For each:

- Trace whether it can be attached to a real object. The source doc names three concrete cases: "a
  siegelense instance has a fleet registry entry, a ward run has its saved result, a session has its
  record, and a tool use has its stream block." Where such an object exists (or should exist — check
  whether it is a contract already, or needs one per [B14](b14-type-alias-and-adhoc-type-rules.md)'s B9),
  give that object an `id` field with the real check (e.g., a regex for the id's actual shape), and let
  every other contract holding that id type reuse the owner's field via B4.
  - **The argument object at an entry point is parsed as a contract too**, and B4 then makes its
    `instanceId` (or similarly-named field) reuse `instanceContract.shape.id`, so the format check runs
    where a person's typing enters the system, not deep inside some later consumer.
- `ProcessId` specifically joins work item ids and spawn ids built from a template
  (`command-chat-output-emit-transformer.ts:48`, `agent-launch-broker.ts:126` — confirm these files and
  line numbers still match before editing; the source doc's figures are from 2026-09-24 to 2026-09-26 and
  drift). It goes plain **unless** one real object turns out to own both shapes — check before deciding,
  do not default to plain without looking.
- An id that genuinely cannot be traced to any real object goes plain (B6): no brand, a bare `string`.

### B6 — values outside object contracts are plain, and the pressure that minted `ContentText` is gone

Once `ban-primitives` is removed and `require-zod-on-primitives` is replaced (both already done in
[B12](b12-require-object-contract-brands.md)'s statics edit), no rule demands a brand on a loose value.
This item's job: find every function that parses a loose string/number through a brand *only* to satisfy
the old rule, and return the plain value instead.

```
// before — loose text needs a brand, so a brand is invented
export const summaryLineTransformer = ({ quest }: { quest: Quest }): ContentText =>
  contentTextContract.parse(`${quest.title} — ${quest.status}`);

// after — loose text is a plain string
export const summaryLineTransformer = ({ quest }: { quest: Quest }): string =>
  `${quest.title} — ${quest.status}`;
```

Re-scan for the current scope (the doc's 2026-09-24/25 read of every transformer; treat as stale):

| Package | Transformers that brand a loose value only to avoid a plain return (2026-09-24 snapshot — re-derive) |
|---|---|
| shared | 73 of 87 typed transformers; `contentTextContract.parse(...)` appears 227 times |
| siegelense and web | 94 functions, 39 of them returning `ContentText` |
| orchestrator | 69 parse calls into `ErrorMessage`, `ContentText` or `PromptText`; 34 return types |
| ward, hooks, mcp and server | About 190 parse calls, led by `errorMessageContract` (40) and `globPatternContract` (34) |
| cli, config, hydration, hydration-recipes, session-forensics, testing, tooling | 17 of 91 transformers |

The same holds outside transformers:

| Where | Sampled parses that brand a loose value (2026-09-24/25 snapshot — re-derive) |
|---|---|
| Brokers | 44 of 129 |
| Adapters | 24 of 41 (this folder type is gone post-Phase-2; the code has already moved to brokers/transformers — find it there) |
| Widgets | 27 of 35, all prop values: test ids, button labels, pixel sizes, counts |

**Open decision 2, settled — loose values lose their brand.** Paths built by `join`, timeouts, and `cwd`
values are plain until they enter an owned field. This costs the path brands (about 45% of path mints
come from a join or a template) and `cwd` role labels such as `RepoRootCwd`. A `cwd` that IS a field of
an owner (e.g., a spawn request) keeps a brand — do not blanket-remove every `cwd`-shaped brand, only the
loose ones.

**Stub shrinkage** follows automatically once the standalone brands the stubs wrapped are gone:

| Test files | Lines that only wrap a literal in a stub (2026-09-24 snapshot — re-derive) | How many go |
|---|---|---|
| 13 largest in web, server and mcp | 857 | About half: standalone brands with no owner (`ProcessId`, `SessionId`, `ErrorMessage`, `ContentText`, `CssPixels`, UI labels). Wraps of owned ids (`QuestId`) stay. |
| 15 largest in orchestrator, ward, siegelense and shared | About 773 | About 729, on brands with no owner |

An expected value shrinks the same way: `expect(result).toBe(WardSummaryStub({ value: 'run: …' }))`
becomes `expect(result).toBe('run: …')`. Enum brands go too, since B1 puts no brand on an enum
(`ChatLineSourceStub`, 53 uses in one file, per the doc, disappears). **Do not touch repeated string
literals as a side effect** — a test repeating `'add-auth'` 169 times is a missing named constant, not a
brand problem; leave those as-is unless a separate item asks for it.

**Dead re-parses disappear with the brand**: the type checker finds 83-87 calls (per the doc) in shared,
orchestrator and web that re-parse a value that already has the brand — 47 of them are
`filePathContract.parse(...)` on a value an adapter already returned as a `FilePath`. Once
`filePathContract` (a standalone scalar brand) is deleted per B2, these calls simply pass the plain value
through — remove the now-pointless parse call, do not leave a dead reference to a deleted contract.

### Build through the root parse

Wherever code builds an object field-by-field or re-parses after building, convert it to build through
one root `contract.parse({ … })` call:

| Style today | Example | Under B1 |
|---|---|---|
| Parse each leaf, push an unparsed literal | `results.push({ filePathArg: contentTextContract.parse(rawArg) })` in `fs-watch-tail-calls-extract-transformer.ts:47` (one of 7 such files in shared — re-confirm the count) | `results.push(fsWatchTailCallContract.parse({ filePathArg: rawArg }))` |
| Build field by field, then parse the whole again | `cli-args-parse-transformer.ts` parses fields at (approximately) lines 58, 72 and 80, then the whole object again at line 173 | Collect raw values, parse once at the end |
| A generic helper that merges any object with an id, and casts | `quest-item-deep-merge-transformer.ts:57`, `quest-array-upsert-transformer.ts:44` | The helper cannot know the owner at each key, so it re-parses the root object after merging, and casts nothing |

Confirm every file/line reference above against the actual code before editing — these are 2026-09-24
snapshot citations and may have moved or already changed under earlier Phase 2/3 work.

## "Found along the way" — specific fixes this item makes

| What | Where | Fix |
|---|---|---|
| `retryCount` branded `'FailCount'` | `packages/shared/src/contracts/work-item/work-item-contract.ts:49` (confirm current line) | Rename the brand text to the derived `'WorkItemRetryCount'` per B3 — this is exactly the kind of name-mismatch B1's autofix corrects; confirm it actually catches this specific one |
| `JestSuiteName` brands what is really a file path, and every field of the Jest report contract is optional | ward's Jest report contracts | Read the actual contract; if `JestSuiteName` checks nothing (a brand that checks nothing, same family as `ContentText`), decide whether it needs a real check (it is a file path — could reuse a path format check from `statics/`) or should go plain since it may have no real owner. Report your decision. |
| `as never` on stub fields that `StubArgument` already unbrands | ~552 across 5 of the largest core test files (311 in `flow-graph-to-text-transformer.test.ts`), ~527 in the largest web/server/mcp tests (2026-09-24 snapshot, "not compiled to confirm each is unneeded") | For each file: remove the `as never` cast, run the test, and confirm it still compiles and passes without it. If it does, the cast was dead. If it does not, the cast was hiding a real type mismatch — investigate before deleting (`stub-argument.type.ts:4` says it "Allows tests to pass raw values", so removing `as never` where it is genuinely load-bearing would be wrong; this is why the source doc explicitly did not just delete them all). |
| `ExecutionStepStatusStub` wraps a contract that is a bare `z.enum(...)` with no brand; 111 calls in one file | `packages/web/src/contracts/execution-step-status/` | Since B1 puts no brand on an enum, this stub wraps nothing worth wrapping — delete the stub, replace its 111 calls with the plain enum value literal. |
| Contract files export hand-written generic interfaces (`Collection`, `RowVerbs`, `Op`), not `z.infer` types, importing each other in a cycle | `packages/hydration/src/contracts/hydration-collection/`, `ingredient-handle/`, `matched-set/` | `require-contract-parse` (from [B02](b02-contract-index-and-unused-contracts.md)) refuses an exported type that is not `z.infer`. Read all three files together (the cycle) before touching any one — decide whether these become real `z.infer`-based contracts (branded per B1) or are deleted as never-parsed. Not decided by the source doc; this item's agent decides and records the reason in DECISIONS. |
| `questId` sits beside `quest: z.unknown()`, with the quest "validated separately" | `packages/web/src/contracts/quest-modified-payload/quest-modified-payload-contract.ts:14-15` (confirm current line) | Once `quest` becomes `questContract` (its own `z.unknown()` fix, per this item's B1 work), `ban-join-id-beside-child` ([B13](b13-owner-field-reuse.md)) removes `questId` — callers read `quest.id` instead. Fix the callers by hand, since this check has no autofix. |

## Current state

This item's real "current state" is simply: **nothing in the repo is branded per B1-B6 yet**, since every
rule that would enforce it landed switched OFF in earlier items. Confirm before starting that
[B06](b06-gateway-schema-fields-in-contracts.md), [B07](b07-layers-and-statics-regex.md),
[B11](b11-unique-contract-names.md), [B12](b12-require-object-contract-brands.md),
[B13](b13-owner-field-reuse.md) and [B14](b14-type-alias-and-adhoc-type-rules.md) are all marked `done`
in EPIC.md before dispatching any batch of this item — a batch run against an unfinished dependency will
either find the rule missing (nothing to autofix against) or find the index incomplete (wrong autofix
output).

No specific file-by-file check was done for this item beyond what earlier items already confirmed
(`work-item-contract.ts` exists per [B01](b01-zod-v4.md)'s and [B02](b02-contract-index-and-unused-contracts.md)'s
sessions; the hydration cycle files exist per [B02](b02-contract-index-and-unused-contracts.md)'s
Current state). Every specific line number and count cited above is a 2026-09-24-to-26 snapshot from the
source doc — re-verify each one against the live file before editing it, since Phase 2 and earlier Phase 3
items reshape the repo considerably before this item runs.

## Work

1. **Confirm every Needs item is `done`.**
2. **Migrate `shared` first.** It is the package the most other packages depend on, so migrating it first
   means every downstream reuse (B4) has a correctly-branded upstream owner to reuse from.
3. **Migrate every other package in dependency order** — a package's own `package.json` dependencies (on
   other workspace packages) decide the order; never migrate a package before every workspace package it
   depends on is already migrated.
4. **Per package: run `require-object-contract-brands`'s and `enforce-owner-field-reuse`'s autofixes
   first**, then hand-fix everything the autofixes could not reach (see the per-rule sections above).
5. **Delete every standalone scalar brand contract** as its last user is migrated off it.
6. **Fix every `z.unknown()`/`z.any()` per the table above**, deciding each field's replacement.
7. **Fix every `join-id-beside-child` violation by hand**, updating every caller.
8. **Execute open decision 4** for the six ownerless ids, per the guidance above.
9. **Convert every parse-style anti-pattern to build-through-root-parse.**
10. **Remove every now-dead re-parse and now-pointless stub wrap.**
11. **Fix the five specific "found along the way" items above.**
12. **Run the full per-package ward suite (`lint,typecheck,unit,integration`) after each package's
    migration, before moving to the next package** — do not batch all packages' edits together and test
    once at the end; a dependency-order migration only works if each package is actually green before the
    next one starts reusing its fields.
13. **Once every package is migrated: switch `require-object-contract-brands`,
    `require-object-contract-brands-indexed`, `enforce-owner-field-reuse` and `ban-join-id-beside-child`
    ON** (remove whatever OFF-mechanism [B12](b12-require-object-contract-brands.md)/[B13](b13-owner-field-reuse.md)
    used).
14. **Run a full, bare `npm run ward`** as the final regression pass. Fix every failure — this is the
    epic's standing rule ("FIX EVERY PRE-EXISTING FAILURE YOU FIND").

## Lint rules this item adds or changes

None new. This item switches ON the four rules built OFF by
[B12](b12-require-object-contract-brands.md) and [B13](b13-owner-field-reuse.md):
`require-object-contract-brands`, `require-object-contract-brands-indexed`,
`enforce-owner-field-reuse`, `ban-join-id-beside-child`. Tag `require-object-contract-brands` and
`ban-join-id-beside-child` `'pre-edit'` in `dungeonmaster-rule-enforce-on-statics.ts` (confirm they were
already tagged when built OFF — if the earlier items already added the tag, this step is just confirming
it, not re-adding it).

## Teaching text this item changes

This item makes true the content of every B1-B6-related row already catalogued in
[B12](b12-require-object-contract-brands.md)'s and [B13](b13-owner-field-reuse.md)'s "Teaching text"
sections. It does not itself edit `get-architecture`, `get-folder-detail` or `get-testing-patterns` text —
that is [Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md)'s job,
done once every A/B/G/T item (this one included) is `done`.

## Done when

- [ ] Every workspace package's contracts pass `require-object-contract-brands` and
      `require-object-contract-brands-indexed` with the rules switched ON.
- [ ] Every workspace package's field/parameter naming passes `enforce-owner-field-reuse` and
      `ban-join-id-beside-child` with both switched ON.
- [ ] No standalone scalar brand contract remains anywhere in the repo (except the one B2 exception: a
      local, unexported id const on a self-referencing owner).
- [ ] No `z.unknown()`/`z.any()` remains in any `contracts/` folder, except the one explicitly-recorded
      exception (the mock-call-argument record), if the executing agent chose to keep it — with the
      decision recorded.
- [ ] Every loose value that was branded only to satisfy the old return-type rule is now plain.
- [ ] Every one of the five "found along the way" items is resolved, with a recorded decision where the
      source doc left it open.
- [ ] `require-object-contract-brands`, `require-object-contract-brands-indexed`,
      `enforce-owner-field-reuse` and `ban-join-id-beside-child` are all switched ON.
- [ ] A full, bare `npm run ward` exits 0.

## Traps

- Migrating packages out of dependency order produces autofix output that reuses a field from an
  upstream owner that has not been branded correctly yet — the autofix will "succeed" and still be wrong.
  Enforce the order.
- Every count and line number cited in this file is a snapshot from 2026-09-24 to 2026-09-26 — re-verify
  before editing; the repo has moved since, especially through Phase 2's adapter deletion.
- The mock-call-argument `z.unknown()` field and the hydration generic-interface cycle are both
  explicitly *not decided* by the source doc — do not silently pick an answer with no record; write it in
  DECISIONS.
- Do not switch [B12](b12-require-object-contract-brands.md)'s or
  [B13](b13-owner-field-reuse.md)'s rules ON until every package is actually migrated — switching early
  turns the whole repo red at once and blocks every other in-flight item.

## Concessions made while executing


## Decisions (4.0, 2026-09-29)

Written by the 4.0 decisions agent (items 2 and 3). Every table is one row per line, fixed columns, `|` never inside a cell, so SD3, SD4 and SD7 read them with a line split. Paths are repo-relative from `packages/`. `status` is `exists` (the file is in the tree now), `create` (it is not) or `inline` (a field-level schema with a derived brand, no file).

### Re-measured numbers (tree of 2026-09-29, after waves 3.1 and 3.2 so far)

Method: `phase34-scripts/brand-census/census.cjs`, run against the current tree with its output moved to `tmp/b15-dec/out/`; plus `tmp/b15-dec/uses2.cjs` (every reference to a standalone brand contract inside a `*-contract.ts`, attributed to its enclosing key), `tmp/b15-dec/idowners.cjs` (every `id` key in a contract) and `tmp/b15-dec/unk.cjs` (every `z.unknown()` / `z.any()` in a `contracts/` folder).

| what | census CSV (stale) | now | note |
|---|---|---|---|
| standalone brand contracts | 349 | 329 | `standalone-brands.csv` rows; a same-name copy in another package is its own row |
| field class (used as a key in a contract) | 196 | 188 | the CSV `F` rows; `uses2.cjs` confirms every one is a keyed contract reference |
| never a field | 153 | 141 | 137 referenced by no contract file, 4 referenced only unkeyed (a `z.record` key or a union member): EslintRuleName (eslint-plugin), RelativeFilePath, SeedBindingName, ToolInputKey |
| owned id | - | 21 | table 2.2 |
| ownerless id | - | 14 | table 2.4 (owner-id, owner-field or plain) |
| value brand | - | 153 | table 2.6 |
| `z.unknown()` in contracts | 124 | 107 | `z.any()`: 0. Item 3 table |

### Item 2: standalone brand classes

Class rule used for every row: a brand is an **owned id** when some contract declares it as its own `id` (B2/B3: the owner keeps the check, the standalone file goes); an **ownerless id** when the name is an identifier that no contract has as `id` (open decision 4: give it an owner that declares `id`, or `plain`); a **value brand** for everything else (W5: each field gets its own derived inline brand, `B3` text owner+key). `fanOut` and `dup` come from the census; `uses` is the number of keyed references in contract files now.

#### 2.2 Owned ids (W3)

| pkg | brand | standalone file | owner path | owner const | key | b3 text | text changes | uses | other owners of this id | inline copies | same-name group | fanOut | note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| orchestrator | WorkItemId | orchestrator/src/contracts/work-item-id/work-item-id-contract.ts | shared/src/contracts/work-item/work-item-contract.ts | workItemContract | id | WorkItemId | no | 7 | - | 0 | - | 11 | same identity as shared QuestWorkItemId (5 fields, all in orchestration-callbacks); after the change they reuse `workItemContract.shape.id`; brand text WorkItemId equals the B3 text |
| shared | BlightChecklistItemId | shared/src/contracts/blight-checklist-item-id/blight-checklist-item-id-contract.ts | shared/src/contracts/blight-checklist-item/blight-checklist-item-contract.ts | blightChecklistItemContract | id | BlightChecklistItemId | no | 3 | - | 0 | - | 4 | - |
| shared | DesignDecisionId | shared/src/contracts/design-decision-id/design-decision-id-contract.ts | shared/src/contracts/design-decision/design-decision-contract.ts | designDecisionContract | id | DesignDecisionId | no | 2 | modifyQuestInput | 0 | - | 4 | - |
| shared | FlowEdgeId | shared/src/contracts/flow-edge-id/flow-edge-id-contract.ts | shared/src/contracts/flow-edge/flow-edge-contract.ts | flowEdgeContract | id | FlowEdgeId | no | 6 | deletableEdge | 0 | - | 3 | - |
| shared | FlowId | shared/src/contracts/flow-id/flow-id-contract.ts | shared/src/contracts/flow/flow-contract.ts | flowContract | id | FlowId | no | 25 | deletableFlow,questSummaryFlow | 1 | - | 29 | - |
| shared | FlowNodeId | shared/src/contracts/flow-node-id/flow-node-id-contract.ts | shared/src/contracts/flow-node/flow-node-contract.ts | flowNodeContract | id | FlowNodeId | no | 17 | deletableNode | 0 | - | 158 | - |
| shared | FlowRecipeName | shared/src/contracts/flow-recipe-name/flow-recipe-name-contract.ts | shared/src/contracts/flow-recipe/flow-recipe-contract.ts | flowRecipeContract | id | FlowRecipeId | yes -> FlowRecipeId | 2 | - | 0 | - | 2 | the id is the recipe name; B3 text becomes FlowRecipeId; the field is `id`, so the key stays |
| shared | GuildId | shared/src/contracts/guild-id/guild-id-contract.ts | shared/src/contracts/guild/guild-contract.ts | guildContract | id | GuildId | no | 14 | guildCreateResult | 1 | - | 743 | - |
| shared | ObservableId | shared/src/contracts/observable-id/observable-id-contract.ts | shared/src/contracts/flow-observable/flow-observable-contract.ts | flowObservableContract | id | FlowObservableId | yes -> FlowObservableId | 11 | deletableObservable | 0 | - | 28 | B3 text becomes FlowObservableId (owner FlowObservable + Id) |
| shared | OperationItemId | shared/src/contracts/operation-item-id/operation-item-id-contract.ts | shared/src/contracts/operation-item/operation-item-contract.ts | operationItemContract | id | OperationItemId | no | 16 | modifyQuestInput | 1 | - | 150 | - |
| shared | OperationPlanId | shared/src/contracts/operation-plan-id/operation-plan-id-contract.ts | shared/src/contracts/operation-plan/operation-plan-contract.ts | operationPlanContract | id | OperationPlanId | no | 1 | - | 0 | - | 2 | - |
| shared | OperationPlanPieceId | shared/src/contracts/operation-plan-piece-id/operation-plan-piece-id-contract.ts | shared/src/contracts/operation-plan-piece/operation-plan-piece-contract.ts | operationPlanPieceContract | id | OperationPlanPieceId | no | 2 | - | 1 | - | 2 | - |
| shared | PieceId | shared/src/contracts/piece-id/piece-id-contract.ts | orchestrator/src/contracts/work-plan-piece/work-plan-piece-contract.ts | workPlanPieceContract | id | WorkPlanPieceId | yes -> WorkPlanPieceId | 9 | - | 0 | - | 3 | OPEN: owner workPlanPiece lives in orchestrator but two shared fields (work-item.pieceId, quest-projection.pieceId) read the id, and shared cannot import orchestrator; default: move workPlanPieceContract to shared with recipeId and stepName (W2-style move) before W3 runs this brand; distinct from OperationPlanPieceId (uuid vs `pc-1`) |
| shared | QaChecklistItemId | shared/src/contracts/qa-checklist-item-id/qa-checklist-item-id-contract.ts | shared/src/contracts/qa-checklist-item/qa-checklist-item-contract.ts | qaChecklistItemContract | id | QaChecklistItemId | no | 8 | qaVerificationUnit,questSummaryObservable | 0 | - | 19 | - |
| shared | QuestCommentId | shared/src/contracts/quest-comment-id/quest-comment-id-contract.ts | shared/src/contracts/quest-comment/quest-comment-contract.ts | questCommentContract | id | QuestCommentId | no | 2 | modifyQuestInput | 0 | - | 2 | - |
| shared | QuestContractEntryId | shared/src/contracts/quest-contract-entry-id/quest-contract-entry-id-contract.ts | shared/src/contracts/quest-contract-entry/quest-contract-entry-contract.ts | questContractEntryContract | id | QuestContractEntryId | no | 2 | modifyQuestInput | 0 | - | 3 | - |
| shared | QuestId | shared/src/contracts/quest-id/quest-id-contract.ts | shared/src/contracts/quest/quest-contract.ts | questContract | id | QuestId | no | 41 | - | 12 | - | 1817 | quest-contract.ts:36 already declares the id inline (`z.string().min(1).brand<'QuestId'>()`); the standalone is a second copy of the same text; questContract imports contracts that need `questContract.shape.id` back (workItem, flow...), so those fields take the annotated getter (open decision 1) |
| shared | QuestNoteId | shared/src/contracts/quest-note-id/quest-note-id-contract.ts | shared/src/contracts/quest-note/quest-note-contract.ts | questNoteContract | id | QuestNoteId | no | 2 | - | 0 | - | 3 | - |
| shared | QuestWorkItemId | shared/src/contracts/quest-work-item-id/quest-work-item-id-contract.ts | shared/src/contracts/work-item/work-item-contract.ts | workItemContract | id | WorkItemId | yes -> WorkItemId | 35 | workItemForUpsert | 2 | - | 825 | B3 text becomes WorkItemId (owner WorkItem + Id); orchestrator already has a standalone WorkItemId with that text, so the two converge; EPIC W3 says text stays the same, it does not here |
| shared | ToolingRequirementId | shared/src/contracts/tooling-requirement-id/tooling-requirement-id-contract.ts | shared/src/contracts/tooling-requirement/tooling-requirement-contract.ts | toolingRequirementContract | id | ToolingRequirementId | no | 2 | modifyQuestInput | 0 | - | 3 | - |
| shared | UnitId | shared/src/contracts/unit-id/unit-id-contract.ts | shared/src/contracts/qa-checklist-item/qa-checklist-item-contract.ts | qaChecklistItemContract | id | QaChecklistItemId | yes -> QaChecklistItemId | 15 | - | 1 | - | 86 | OPEN: same regex as QaChecklistItemId (three kebab segments joined by colons); no contract has a UnitId `id`; default: same identity, so `unitId` fields (8) reuse `qaChecklistItemContract.shape.id`; if a run of the tests shows they differ, treat as ownerless plain |

`other owners of this id` are contracts that declare their own `id` with the standalone brand (`deletableFlow`, `questSummaryFlow`, ...); they switch to `<owner>.shape.id`. `inline copies` counts `.brand<'<same text>'>()` sites in contract files outside the standalone file (2.3). `text changes = yes` means B3 derives a different text than the brand has today; W3's premise "the brand text stays the same" holds only for rows marked `no`.

#### 2.3 Inline brands that share an id brand's text (re-derive in the same pass, SD3/SD4)

| brand text | inline site (path:line) |
|---|---|
| AgentId | shared/src/contracts/chat-entry/chat-entry-contract.ts:29 |
| AgentId | hooks/src/contracts/folder-detail-hook-data/folder-detail-hook-data-contract.ts:18 |
| AgentId | hooks/src/contracts/subagent-start-hook-data/subagent-start-hook-data-contract.ts:15 |
| FlowId | mcp/src/contracts/quest-work-input/quest-work-input-contract.ts:81 |
| GuildId | mcp/src/contracts/list-quests-input/list-quests-input-contract.ts:12 |
| OperationItemId | mcp/src/contracts/get-quest-work-input/get-quest-work-input-contract.ts:43 |
| OperationPlanPieceId | shared/src/contracts/piece-id/piece-id-contract.ts:5 |
| ProcessId | mcp/src/contracts/get-quest-status-input/get-quest-status-input-contract.ts:16 |
| ProcessId | shared/src/contracts/orchestration-status/orchestration-status-contract.ts:14 |
| QuestId | mcp/src/contracts/start-quest-input/start-quest-input-contract.ts:12 |
| QuestId | mcp/src/contracts/get-quest-work-input/get-quest-work-input-contract.ts:28 |
| QuestId | mcp/src/contracts/get-quest-planning-notes-input/get-quest-planning-notes-input-contract.ts:17 |
| QuestId | mcp/src/contracts/get-quest-summary-input/get-quest-summary-input-contract.ts:23 |
| QuestId | mcp/src/contracts/quest-work-input/quest-work-input-contract.ts:113 |
| QuestId | mcp/src/contracts/get-blight-checklist-input/get-blight-checklist-input-contract.ts:39 |
| QuestId | shared/src/contracts/add-quest-result/add-quest-result-contract.ts:15 |
| QuestId | shared/src/contracts/quest/quest-contract.ts:36 |
| QuestId | shared/src/contracts/quest-list-item/quest-list-item-contract.ts:15 |
| QuestId | shared/src/contracts/orchestration-status/orchestration-status-contract.ts:15 |
| QuestId | shared/src/contracts/get-quest-input/get-quest-input-contract.ts:30 |
| QuestId | shared/src/contracts/modify-quest-input/modify-quest-input-contract.ts:172 |
| QuestWorkItemId | mcp/src/contracts/get-quest-work-input/get-quest-work-input-contract.ts:35 |
| QuestWorkItemId | mcp/src/contracts/quest-work-input/quest-work-input-contract.ts:118 |
| SessionId | orchestrator/src/contracts/stream-json-result/stream-json-result-contract.ts:15 |
| SessionId | shared/src/contracts/result-stream-line/result-stream-line-contract.ts:12 |
| SessionId | shared/src/contracts/system-init-stream-line/system-init-stream-line-contract.ts:13 |
| SessionId | hooks/src/contracts/pre-search-hook-data/pre-search-hook-data-contract.ts:11 |
| SessionId | hooks/src/contracts/worktree-create-hook-data/worktree-create-hook-data-contract.ts:11 |
| SessionId | hooks/src/contracts/pre-tool-use-hook-data/pre-tool-use-hook-data-contract.ts:12 |
| SessionId | hooks/src/contracts/user-prompt-submit-hook-data/user-prompt-submit-hook-data-contract.ts:11 |
| SessionId | hooks/src/contracts/post-tool-use-hook-data/post-tool-use-hook-data-contract.ts:14 |
| SessionId | hooks/src/contracts/subagent-stop-hook-data/subagent-stop-hook-data-contract.ts:13 |
| SessionId | hooks/src/contracts/session-start-hook-data/session-start-hook-data-contract.ts:11 |
| SessionId | hooks/src/contracts/base-hook-data/base-hook-data-contract.ts:11 |
| SessionId | hooks/src/contracts/subagent-start-hook-data/subagent-start-hook-data-contract.ts:11 |
| ToolUseId | shared/src/contracts/tool-result-block-param/tool-result-block-param-contract.ts:19 |
| ToolUseId | shared/src/contracts/tool-use-block-param/tool-use-block-param-contract.ts:13 |
| ToolUseId | shared/src/contracts/chat-entry/chat-entry-contract.ts:71 |
| UnitId | mcp/src/contracts/quest-work-input/quest-work-input-contract.ts:40 |
| WardRunId | shared/src/contracts/ward-result/ward-result-contract.ts:26 |

40 sites. Each becomes a reuse of the owner's `id` (B4), not a new derived text. Also id-shaped inline brands with their own text that B13 will catch later: `devLogEventPayloadContract` (`DevLogProcessId`, `DevLogQuestId`, `DevLogSessionId`, `packages/server/src/contracts/dev-log-event-payload/dev-log-event-payload-contract.ts:21-24`).

#### 2.4 Ownerless ids (W4)

| pkg | brand | standalone file | decision | owner (path, status) | owner key | uses | inline copies | same-name group | fanOut | why |
|---|---|---|---|---|---|---|---|---|---|---|
| orchestrator | AgentId | orchestrator/src/contracts/agent-id/agent-id-contract.ts | owner-id | shared/src/contracts/agent/agent-contract.ts (same owner) | id | 1 | 3 | orchestrator,shared | 103 | Same-name copy of the shared brand (identical `z.string().min(1)`); 1 field (`chatLineAgentDetected.agentId`); retyped with the group |
| shared | AgentId | shared/src/contracts/agent-id/agent-id-contract.ts | owner-id | shared/src/contracts/agent/agent-contract.ts (create; `agentContract`, `id` + `toolUseId`) | id | 22 | 3 | orchestrator,shared | 21 | A sub-agent is an object: it has a transcript file, a spawning tool use and a record (`subagentRecordContract`, `subagentRosterRowContract`). `parentAgentId` ends with `agentId`, so B4 reuses the same field. 15 owner fields across 4 packages, so shared. Fallback if the operator wants fewer contracts: plain |
| web | AttachmentId | web/src/contracts/attachment-id/attachment-id-contract.ts | owner-field | web/src/contracts/composer-attachment/composer-attachment-contract.ts | attachmentId | 4 | 0 | - | 54 | The pasted attachment `composerAttachmentContract` is the object; `composerSegment.attachmentId` and `pastedImageDraft.attachmentId` reuse `composerAttachmentContract.shape.attachmentId`; key not renamed to `id` (renaming touches the composer state and 54 fan-out sites for a name the R8 word rule would not match anyway) |
| siegelense | InstanceId | siegelense/src/contracts/instance-id/instance-id-contract.ts | owner-id | shared/src/contracts/siege-instance/siege-instance-contract.ts (create; `siegeInstanceContract`, `id` regex `inst_[0-9a-f]{4,}` + the manifest fields both consumers read) | id | 27 | 0 | - | 431 | Open decision 4 names the fleet registry entry (`registryEntryContract`, already `id: instanceIdContract`), but shared `flowRecipe.instanceId` and `questNote.instanceId` read the same id and shared cannot import siegelense (and orchestrator has no edge to it), so the owner must be in shared. Six siegelense contracts declare their own `id: instanceIdContract` (instanceStatus, leftAlone, pruneRefusal, pruneRemoval, reapedInstance, registryEntry): all reuse `siegeInstanceContract.shape.id`. B3 text SiegeInstanceId. R8 does not match the bare name `instanceId` (needs siege,instance,id): hand-retype |
| shared | ProcessId | shared/src/contracts/process-id/process-id-contract.ts | plain | - | - | 23 | 2 | shared | 545 | Decision 4: ProcessId joins ids built from a template (`command-chat-output-emit-transformer.ts:48`, `agent-launch-broker.ts:126`) and is `z.string().min(1)` (no check to lose). It is not one object's id: 23 fields hold `chatProcessId` (payloads), `processId` (`orchestrationProcess`), and siegelense uses it for an OS pid (`registryEntry.pid`, `instanceHeartbeat.pid`, `bootLock.heldByPid`) where orchestrator has `processPidContract`. Each field keeps only what its owner's parse checks. The server copy re-exports it (`sharedProcessIdContract`) |
| siegelense | RunId | siegelense/src/contracts/run-id/run-id-contract.ts | owner-id | shared/src/contracts/siege-run/siege-run-contract.ts (create; `siegeRunContract`, `id` regex `run_[1-9][0-9]*`) | id | 13 | 0 | siegelense,ward | 180 | A siege run has its saved result (`runResultContract` carries runId); shared `flowRecipe.runId`, `questNote.runId`, orchestrator `questWorkBaseline.runId` read it, so shared. `runA`, `runB`, `run` reuse it |
| ward | RunId | ward/src/contracts/run-id/run-id-contract.ts | owner-field | ward/src/contracts/ward-result/ward-result-contract.ts | runId | 1 | 0 | siegelense,ward | 39 | A ward run has its saved result, but the result is persisted with the key `runId` (`wardResultContract` `{runId, timestamp, filters, checks}`); renaming it to `id` would break stored result files, so the key stays and the field gets the derived brand WardResultRunId. The regex `^\d+-[a-f0-9]+$` stays on that field |
| shared | SessionId | shared/src/contracts/session-id/session-id-contract.ts | owner-id | shared/src/contracts/session/session-contract.ts (create; `sessionContract`, `id` + `cwd` + `startedAt`) | id | 25 | 12 | - | 599 | A session has a record: hydration-recipes `sessionRecordContract` and shared `questSessionContract` both carry sessionId + cwd; 24 owner fields across 8 packages, so the owner must sit in shared. B3 text SessionId = current text. `sessionId`, `activeSessionId`, `resumeSessionId`, hook `session_id` fields reuse `sessionContract.shape.id` |
| shared | SiegeInstanceId | shared/src/contracts/siege-instance-id/siege-instance-id-contract.ts | owner-id | shared/src/contracts/siege-instance/siege-instance-contract.ts (same owner) | id | 5 | 0 | - | 20 | Shared copy of the siegelense regex; becomes the owner's `id`, keeping its text |
| shared | SiegeRunId | shared/src/contracts/siege-run-id/siege-run-id-contract.ts | owner-id | shared/src/contracts/siege-run/siege-run-contract.ts (same owner) | id | 4 | 0 | - | 13 | Shared copy of the siegelense regex; becomes the owner's `id` |
| shared | SmoketestRunId | shared/src/contracts/smoketest-run-id/smoketest-run-id-contract.ts | owner-field | orchestrator/src/contracts/active-smoketest-run/active-smoketest-run-contract.ts | runId | 1 | 0 | - | 11 | One field, one package (`activeSmoketestRun.runId`, uuid); the brand belongs in orchestrator; the field keeps the uuid check under the derived text ActiveSmoketestRunRunId |
| hydration-recipes | ToolUseId | hydration-recipes/src/contracts/tool-use-id/tool-use-id-contract.ts | owner-id | shared/src/contracts/tool-use/tool-use-contract.ts (same owner) | id | 2 | 3 | hydration-recipes,orchestrator | 5 | Same-name copy; 2 fields (`subagentRecord`, `subagentFields`); hydration-recipes depends on shared |
| orchestrator | ToolUseId | orchestrator/src/contracts/tool-use-id/tool-use-id-contract.ts | owner-id | shared/src/contracts/tool-use/tool-use-contract.ts (rename of `tool-use-block-param-contract.ts`, whose `id` is already `z.string().min(1).brand<'ToolUseId'>()`) | id | 1 | 3 | hydration-recipes,orchestrator | 66 | A tool use has its stream block: `toolUseBlockParamContract` `{type:'tool_use', id, name, input}`. Renamed to `toolUseContract` so B3 text stays ToolUseId (`ToolUseBlockParamId` otherwise) and R8 matches the `toolUseId` name. Collision check: no `toolUseContract` exists |
| shared | WardRunId | shared/src/contracts/ward-run-id/ward-run-id-contract.ts | owner-field | shared/src/contracts/ward-queue-response/ward-queue-response-contract.ts | runId | 1 | 1 | - | 13 | 2 fields (`wardQueueResponse.runId`, shared `wardResult.runId` inline); shared cannot import ward, so each gets its own derived brand; the check is weaker than ward's (`min(1)`); no loss |

Decision words: `owner-id` = the owner declares `id` with the real check and every field reuses `owner.shape.id` (open decision 4); `owner-field` = the identity already lives in a differently named key that is persisted or single-use, so the key stays and the field carries the derived brand; `plain` = W1 treatment. Considered and sent to the value table instead: ProcessGroupId (OS integer, no object), ProcessPid (same), RecipeId (two orchestrator fields; near the FlowRecipe name regex, verify before merging), RowRef and Ref (names inside one plan), PackageName (2.6).

#### 2.5 `questFolder`

**`questFolder` is a field of `Quest`, `Quest['folder']`. It is not an id, not a path, and not a standalone value brand.**

- The owner is `packages/shared/src/contracts/quest/quest-contract.ts:37`, `folder: z.string().min(1).brand<'QuestFolder'>()`. B3 derives Quest + folder = `QuestFolder`, so the text already matches. The docs example in the same file reads `{id: 'add-auth', folder: '001-add-auth'}`: the folder is the quest's directory name, a different value from its id. Paths are built from it (`<guilds>/<guildId>/quests/<questFolder>/quest.json`, `quest.harness.ts:375`), so it is a path *segment* stored on the quest, not a path.
- There is no `questFolderContract` file, so W1 and W3 have nothing to remove; the work is B4/B13: the inline copies below reuse `questContract.shape.folder`, and `questFolder` parameters become `Quest['folder']`. R8's mapping (`questFolder` -> owner Quest + key folder, words `quest,folder`) is correct.
- **The 51 leftovers are a bug in web's test harness, not in R8.** `packages/web/test/harnesses/quest/quest.harness.ts` declares `questFolder: QuestId` in the return types of `createQuest` and `createQuestViaWriteRoute` (lines 114, 121, 362, 397) and builds it with `quest.folder as unknown as QuestId` (lines 382, 419); `warpgate.harness.ts` declares `questFolder: QuestId` at lines 48, 53, 84 and 117, and `dispatch.harness.ts:107` once. A value branded `QuestId` then meets a parameter typed `Quest['folder']`, which is a real type error. The fix is in those three harness files: type it `Quest['folder']` and drop the casts. Of the 51 "not a plain-string-to-brand mismatch" rows in `b13-test-fallout/leftovers.txt`, 39 are the `questFolder` key; the other 12 are the key `value` (guild and agent-id literals such as `String(guild.id)` and `` `launchparent${stamp}` ``), so "51 pass a QuestId where QuestFolder is expected" overcounts.
- The 204 "no stub for brand QuestFolder" rows need a stub: `QuestFolderStub` does not exist because there is no standalone contract. After the change it is `questContract.shape.folder` parsed through the owner; the stub for the owner is `QuestStub`.

| path | line | key | brand text now | relation | decision |
|---|---|---|---|---|---|
| shared/src/contracts/quest/quest-contract.ts | 37 | folder | QuestFolder | owner | owner |
| shared/src/contracts/quest-list-item/quest-list-item-contract.ts | 16 | folder | QuestFolder | same text as the owner | reuse `questContract.shape.folder` (key `folder` has no `quest` prefix, so R8 will not find it: B13 by owner-field match, or by hand) |
| shared/src/contracts/skipped-quest-file/skipped-quest-file-contract.ts | 18 | questFolder | QuestFolder | same text as the owner | reuse `questContract.shape.folder` |
| shared/src/contracts/add-quest-result/add-quest-result-contract.ts | 16 | questFolder | QuestFolder | same text as the owner | reuse `questContract.shape.folder` (optional stays) |
| testing/src/contracts/testbed-config/testbed-config-contract.ts | 16 | questFolder | QuestFolder | same text as the owner | testing does not depend on shared: cannot reuse; keeps an inline brand derived as TestbedConfigQuestFolder (or goes plain), OPEN |


#### 2.6 Value brands (W5)

| pkg | brand | standalone file | kind | native owner (path#key) | uses | owner contracts | top keys | inline copies | same-name group | fanOut | note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| eslint-plugin | EslintPluginName | eslint-plugin/src/contracts/eslint-plugin-name/eslint-plugin-name-contract.ts | string | - | 1 | 1 | plugins | 0 | - | 2 | - |
| hooks | EslintRuleName | hooks/src/contracts/eslint-rule-name/eslint-rule-name-contract.ts | string | - | 3 | 3 | rules | 0 | eslint-plugin,hooks | 2 | - |
| hooks | FileContents | hooks/src/contracts/file-contents/file-contents-contract.ts | string | - | 2 | 1 | oldContent, newContent | 0 | config,hooks,shared | 39 | top-five W5 trial brand; run alone |
| hooks | Message | hooks/src/contracts/message/message-contract.ts | string | - | 1 | 1 | message | 0 | - | 9 | - |
| hooks | ToolInputParamName | hooks/src/contracts/tool-input-param-name/tool-input-param-name-contract.ts | string | - | 1 | 1 | input | 0 | - | 3 | - |
| hydration | CopiesTarget | hydration/src/contracts/copies-target/copies-target-contract.ts | string | - | 1 | 1 | copies | 0 | - | 3 | - |
| hydration | ExtraVerbName | hydration/src/contracts/extra-verb-name/extra-verb-name-contract.ts | string | - | 2 | 2 | extras, verb | 0 | - | 6 | - |
| hydration | FieldName | hydration/src/contracts/field-name/field-name-contract.ts | string | - | 5 | 4 | field, as, from | 0 | - | 14 | - |
| hydration | IngredientName | hydration/src/contracts/ingredient-name/ingredient-name-contract.ts | string | - | 13 | 13 | ingredient, needsServerFor, name | 1 | - | 59 | - |
| hydration | RecipeName | hydration/src/contracts/recipe-name/recipe-name-contract.ts | string | - | 3 | 3 | recipeName | 0 | hydration,hydration-recipes,siegelense | 1 | - |
| hydration | RowIndex | hydration/src/contracts/row-index/row-index-contract.ts | number | - | 1 | 1 | index | 0 | - | 18 | - |
| hydration | RowRef | hydration/src/contracts/row-ref/row-ref-contract.ts | string | - | 12 | 9 | ref, matchedRef, ancestors | 0 | - | 129 | - |
| hydration | SavedRecordName | hydration/src/contracts/saved-record-name/saved-record-name-contract.ts | string | - | 2 | 2 | name | 0 | - | 58 | - |
| hydration-recipes | RecipeName | hydration-recipes/src/contracts/recipe-name/recipe-name-contract.ts | string | - | 2 | 2 | recipeName, name | 0 | hydration,hydration-recipes,siegelense | 17 | - |
| hydration-recipes | RecipeReturnName | hydration-recipes/src/contracts/recipe-return-name/recipe-return-name-contract.ts | string | - | 1 | 1 | name | 0 | - | 1 | - |
| hydration-recipes | TaskDescription | hydration-recipes/src/contracts/task-description/task-description-contract.ts | string | - | 1 | 1 | taskDescription | 0 | - | 2 | - |
| mcp | FolderName | mcp/src/contracts/folder-name/folder-name-contract.ts | string | - | 1 | 1 | name | 1 | - | 33 | - |
| mcp | ResultCount | mcp/src/contracts/result-count/result-count-contract.ts | number | - | 1 | 1 | count | 0 | - | 12 | - |
| mcp | ToolDescription | mcp/src/contracts/tool-description/tool-description-contract.ts | string | - | 1 | 1 | description | 1 | - | 3 | - |
| mcp | ToolName | mcp/src/contracts/tool-name/tool-name-contract.ts | string | - | 1 | 1 | name | 10 | mcp,web | 100 | - |
| mcp | TreeOutput | mcp/src/contracts/tree-output/tree-output-contract.ts | string | - | 2 | 2 | lines, results | 0 | - | 40 | - |
| orchestrator | AgentFamilyName | orchestrator/src/contracts/agent-family-name/agent-family-name-contract.ts | string | - | 1 | 1 | family | 1 | - | 10 | - |
| orchestrator | AgentPromptName | orchestrator/src/contracts/agent-prompt-name/agent-prompt-name-contract.ts | string | - | 1 | 1 | prompt | 0 | - | 49 | - |
| orchestrator | CommitSha | orchestrator/src/contracts/commit-sha/commit-sha-contract.ts | string | - | 1 | 1 | sha | 0 | - | 5 | - |
| orchestrator | IsoTimestamp | orchestrator/src/contracts/iso-timestamp/iso-timestamp-contract.ts | string | - | 2 | 2 | startedAt, writtenAt | 39 | orchestrator,session-forensics,web | 42 | - |
| orchestrator | OrchestrationEventPayloadKey | orchestrator/src/contracts/orchestration-event-payload-key/orchestration-event-payload-key-contract.ts | string | - | 2 | 2 | payload | 0 | - | 10 | - |
| orchestrator | ProcessPid | orchestrator/src/contracts/process-pid/process-pid-contract.ts | number | - | 2 | 2 | osPid, pid | 0 | - | 18 | - |
| orchestrator | PromptText | orchestrator/src/contracts/prompt-text/prompt-text-contract.ts | string | - | 2 | 1 | taskPrompt, resumePrompt | 2 | - | 99 | - |
| orchestrator | RecipeId | orchestrator/src/contracts/recipe-id/recipe-id-contract.ts | string | - | 2 | 2 | recipeId | 0 | - | 3 | verify against FlowRecipe `id` (`FlowRecipeName`, kebab regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`); if same identity, merge under `flowRecipeContract.shape.id` |
| orchestrator | SpawnOptionsEnvName | orchestrator/src/contracts/spawn-options-env-name/spawn-options-env-name-contract.ts | string | - | 1 | 1 | env | 0 | - | 2 | - |
| orchestrator | StepName | orchestrator/src/contracts/step-name/step-name-contract.ts | string | - | 12 | 9 | step, from | 3 | orchestrator,shared | 64 | - |
| orchestrator | StreamText | orchestrator/src/contracts/stream-text/stream-text-contract.ts | string | - | 1 | 1 | capturedOutput | 0 | - | 18 | - |
| orchestrator | TaskAgentToolPrompt | orchestrator/src/contracts/task-agent-tool-prompt/task-agent-tool-prompt-contract.ts | string | - | 1 | 1 | prompt | 0 | - | 10 | - |
| orchestrator | WardCheckType | orchestrator/src/contracts/ward-check-type/ward-check-type-contract.ts | string | - | 1 | 1 | failingCheckTypes | 0 | - | 4 | - |
| orchestrator | WorkPlanValidationCheck | orchestrator/src/contracts/work-plan-validation-check/work-plan-validation-check-contract.ts | number | - | 1 | 1 | check | 0 | - | 20 | - |
| server | PastedImageOrdinal | server/src/contracts/pasted-image-ordinal/pasted-image-ordinal-contract.ts | number | - | 1 | 1 | ordinal | 0 | - | 14 | - |
| server | UserMessage | server/src/contracts/user-message/user-message-contract.ts | string | - | 2 | 2 | message | 0 | - | 8 | - |
| session-forensics | IsoTimestamp | session-forensics/src/contracts/iso-timestamp/iso-timestamp-contract.ts | string | - | 10 | 6 | startedAt, endedAt, windowStart | 39 | orchestrator,session-forensics,web | 7 | - |
| session-forensics | TranscriptRecordToolInputKey | session-forensics/src/contracts/transcript-record-tool-input-key/transcript-record-tool-input-key-contract.ts | string | - | 1 | 1 | input | 0 | - | 2 | - |
| session-forensics | TranscriptRecordUsageKey | session-forensics/src/contracts/transcript-record-usage-key/transcript-record-usage-key-contract.ts | string | - | 1 | 1 | usage | 0 | - | 6 | - |
| shared | AbsoluteFilePath | shared/src/contracts/absolute-file-path/absolute-file-path-contract.ts | string | - | 46 | 37 | path, cwd, home | 0 | shared,tooling | 3083 | top-five W5 trial brand; run alone; same-name copies retyped as one group (SD4) |
| shared | ArrayIndex | shared/src/contracts/array-index/array-index-contract.ts | number | - | 5 | 5 | depth, callOrdinals, nth | 0 | - | 65 | - |
| shared | BlockedReason | shared/src/contracts/blocked-reason/blocked-reason-contract.ts | string | - | 3 | 2 | blockedReason | 0 | - | 5 | - |
| shared | BucketStartKey | shared/src/contracts/bucket-start-key/bucket-start-key-contract.ts | string | - | 1 | 1 | buckets | 0 | - | 3 | - |
| shared | CommentText | shared/src/contracts/comment-text/comment-text-contract.ts | string | - | 3 | 3 | text | 0 | - | 10 | - |
| shared | ContentText | shared/src/contracts/content-text/content-text-contract.ts | string | - | 148 | 71 | value, text, why | 2 | mcp,shared | 2393 | top-five W5 trial brand; run alone |
| shared | ContractName | shared/src/contracts/contract-name/contract-name-contract.ts | string | - | 1 | 1 | name | 0 | - | 9 | - |
| shared | DisplayHeader | shared/src/contracts/display-header/display-header-contract.ts | string | - | 1 | 1 | displayHeader | 0 | - | 10 | - |
| shared | ErrorMessage | shared/src/contracts/error-message/error-message-contract.ts | string | - | 3 | 3 | error, output, reason | 12 | mcp,shared | 454 | top-five W5 trial brand; run alone |
| shared | ExitCode | shared/src/contracts/exit-code/exit-code-contract.ts | number | - | 4 | 4 | exitCode | 5 | shared,testing,tooling | 117 | - |
| shared | FileContents | shared/src/contracts/file-contents/file-contents-contract.ts | string | - | 4 | 4 | contents, lastJson | 0 | config,hooks,shared | 494 | top-five W5 trial brand; run alone |
| shared | FileName | shared/src/contracts/file-name/file-name-contract.ts | string | - | 6 | 4 | lastWardRunId, transcript, logs | 1 | eslint-plugin,shared,testing | 357 | - |
| shared | FilePath | shared/src/contracts/file-path/file-path-contract.ts | string | - | 14 | 10 | folderPath, api, web | 8 | config,eslint-plugin,hooks,server,shared,testing | 2033 | top-five W5 trial brand; run alone; same-name copies retyped as one group (SD4) |
| shared | FlowEdgeRef | shared/src/contracts/flow-edge-ref/flow-edge-ref-contract.ts | string | - | 3 | 2 | from, to, reference | 0 | - | 3 | - |
| shared | GuildName | shared/src/contracts/guild-name/guild-name-contract.ts | string | shared/src/contracts/guild/guild-contract.ts#name | 3 | 3 | name | 1 | - | 89 | - |
| shared | GuildPath | shared/src/contracts/guild-path/guild-path-contract.ts | string | shared/src/contracts/guild/guild-contract.ts#path | 6 | 6 | path, guildPath | 2 | - | 180 | - |
| shared | Identifier | shared/src/contracts/identifier/identifier-contract.ts | string | - | 2 | 2 | name | 0 | - | 478 | - |
| shared | ImportPath | shared/src/contracts/import-path/import-path-contract.ts | string | - | 1 | 1 | graph | 1 | shared,testing | 69 | - |
| shared | InstallMessage | shared/src/contracts/install-message/install-message-contract.ts | string | - | 1 | 1 | message | 0 | - | 49 | - |
| shared | LineCount | shared/src/contracts/line-count/line-count-contract.ts | number | - | 3 | 3 | lineCount, line | 0 | - | 35 | - |
| shared | NetworkPort | shared/src/contracts/network-port/network-port-contract.ts | number | - | 9 | 8 | port, portsReleased, api | 0 | - | 41 | - |
| shared | PackageName | shared/src/contracts/package-name/package-name-contract.ts | string | - | 22 | 18 | packageName, name, packageNames | 6 | - | 218 | also `packageGraphEntry.id` (`packageGraphEntryContract` `id: packageNameContract`): that field gets the derived text PackageGraphEntryId; the `packageName` keys get their own |
| shared | PathSegment | shared/src/contracts/path-segment/path-segment-contract.ts | string | - | 15 | 8 | path, packagesDir, relativePath | 0 | - | 336 | - |
| shared | ProcessSignal | shared/src/contracts/process-signal/process-signal-contract.ts | string | - | 1 | 1 | signal | 0 | - | 9 | - |
| shared | QuestBranchName | shared/src/contracts/quest-branch-name/quest-branch-name-contract.ts | string | shared/src/contracts/quest/quest-contract.ts#branchName | 1 | 1 | branchName | 0 | - | 66 | - |
| shared | QuestTitle | shared/src/contracts/quest-title/quest-title-contract.ts | string | shared/src/contracts/quest/quest-contract.ts#title | 1 | 1 | title | 5 | - | 12 | - |
| shared | RelatedDataItem | shared/src/contracts/related-data-item/related-data-item-contract.ts | string | - | 2 | 2 | resultRef, relatedDataItems | 0 | - | 55 | - |
| shared | RepoRelativePath | shared/src/contracts/repo-relative-path/repo-relative-path-contract.ts | string | - | 6 | 5 | file, paths, uncommittedPaths | 0 | - | 130 | - |
| shared | RepoRootCwd | shared/src/contracts/repo-root-cwd/repo-root-cwd-contract.ts | string | - | 3 | 1 | cwd | 0 | - | 160 | - |
| shared | RoutedGraphNodeKey | shared/src/contracts/routed-graph-node-key/routed-graph-node-key-contract.ts | string | - | 3 | 2 | routes, entry, nodes | 0 | - | 16 | - |
| shared | RoutedGraphOutcomeWord | shared/src/contracts/routed-graph-outcome-word/routed-graph-outcome-word-contract.ts | string | - | 1 | 1 | routes | 0 | - | 5 | - |
| shared | SlotIndex | shared/src/contracts/slot-index/slot-index-contract.ts | number | - | 2 | 2 | slotIndex | 0 | - | 47 | - |
| shared | StepName | shared/src/contracts/step-name/step-name-contract.ts | string | - | 3 | 2 | step, requestedStep | 3 | orchestrator,shared | 5 | - |
| shared | StreamJsonLine | shared/src/contracts/stream-json-line/stream-json-line-contract.ts | string | - | 3 | 3 | lines | 0 | - | 25 | - |
| shared | TimeoutMs | shared/src/contracts/timeout-ms/timeout-ms-contract.ts | number | - | 9 | 5 | timeoutMs, delayMs, bootTimeoutMs | 1 | shared,web | 31 | - |
| shared | UrlSlug | shared/src/contracts/url-slug/url-slug-contract.ts | string | - | 4 | 4 | guildSlug, urlSlug | 0 | - | 46 | - |
| shared | UserInput | shared/src/contracts/user-input/user-input-contract.ts | string | - | 2 | 2 | message, text | 0 | - | 91 | - |
| shared | WeightedTokens | shared/src/contracts/weighted-tokens/weighted-tokens-contract.ts | number | - | 2 | 1 | fiveHour, sevenDay | 0 | - | 10 | - |
| shared | WorkItemPayloadKey | shared/src/contracts/work-item-payload-key/work-item-payload-key-contract.ts | string | - | 2 | 2 | payload | 0 | - | 8 | - |
| siegelense | CountDelta | siegelense/src/contracts/count-delta/count-delta-contract.ts | string | - | 3 | 1 | errors | 0 | - | 11 | - |
| siegelense | ElapsedText | siegelense/src/contracts/elapsed-text/elapsed-text-contract.ts | string | - | 4 | 3 | uptime, lastBeat, olderThan | 0 | - | 23 | - |
| siegelense | EpochMs | siegelense/src/contracts/epoch-ms/epoch-ms-contract.ts | number | - | 24 | 16 | atMs, bootMs, modifiedAtMs | 4 | - | 428 | - |
| siegelense | FileSizeBytes | siegelense/src/contracts/file-size-bytes/file-size-bytes-contract.ts | number | - | 4 | 4 | sizeBytes, freedBytes | 0 | - | 20 | - |
| siegelense | HexColour | siegelense/src/contracts/hex-colour/hex-colour-contract.ts | string | - | 4 | 4 | blankColour, colour | 0 | - | 10 | - |
| siegelense | InstanceOwner | siegelense/src/contracts/instance-owner/instance-owner-contract.ts | string | - | 1 | 1 | owner | 0 | - | 19 | - |
| siegelense | LaneProcessName | siegelense/src/contracts/lane-process-name/lane-process-name-contract.ts | string | siegelense/src/contracts/lane-process/lane-process-contract.ts#name | 1 | 1 | name | 0 | - | 2 | - |
| siegelense | Megabytes | siegelense/src/contracts/megabytes/megabytes-contract.ts | number | - | 18 | 11 | peakMB, freedMB, freeMemMB | 0 | - | 73 | - |
| siegelense | NodeLabel | siegelense/src/contracts/node-label/node-label-contract.ts | string | - | 25 | 3 | node | 0 | - | 2 | - |
| siegelense | PixelChange | siegelense/src/contracts/pixel-change/pixel-change-contract.ts | string | - | 2 | 2 | pixelChange | 0 | - | 12 | - |
| siegelense | PixelCoordinate | siegelense/src/contracts/pixel-coordinate/pixel-coordinate-contract.ts | number | - | 4 | 2 | x, y | 0 | siegelense,web | 9 | - |
| siegelense | PixelCount | siegelense/src/contracts/pixel-count/pixel-count-contract.ts | number | - | 6 | 2 | width, height | 0 | - | 12 | - |
| siegelense | ProcessGroupId | siegelense/src/contracts/process-group-id/process-group-id-contract.ts | number | - | 6 | 5 | pgids, killed, reapedPgids | 0 | - | 101 | - |
| siegelense | ProfilePoolSize | siegelense/src/contracts/profile-pool-size/profile-pool-size-contract.ts | number | - | 4 | 4 | poolSize | 0 | - | 41 | - |
| siegelense | ReadingCount | siegelense/src/contracts/reading-count/reading-count-contract.ts | number | - | 45 | 23 | count, suggested, ceiling | 0 | - | 341 | - |
| siegelense | RecipeInputKey | siegelense/src/contracts/recipe-input-key/recipe-input-key-contract.ts | string | - | 2 | 2 | inputKeys, params | 0 | hydration-recipes,siegelense | 5 | - |
| siegelense | RecipeName | siegelense/src/contracts/recipe-name/recipe-name-contract.ts | string | - | 3 | 3 | recipeName, seed, recipe | 0 | hydration,hydration-recipes,siegelense | 38 | - |
| siegelense | Ref | siegelense/src/contracts/ref/ref-contract.ts | number | - | 10 | 6 | ref, parentRef | 0 | - | 7 | - |
| siegelense | ResultField | siegelense/src/contracts/result-field/result-field-contract.ts | string | - | 2 | 2 | fields | 0 | - | 13 | - |
| siegelense | Selector | siegelense/src/contracts/selector/selector-contract.ts | string | - | 13 | 3 | within, target, visible | 0 | - | 81 | - |
| siegelense | ServerLogByteCount | siegelense/src/contracts/server-log-byte-count/server-log-byte-count-contract.ts | number | - | 2 | 1 | fromByte, toByte | 0 | - | 9 | - |
| siegelense | SnapshotName | siegelense/src/contracts/snapshot-name/snapshot-name-contract.ts | string | - | 3 | 2 | name, as, to | 0 | - | 60 | - |
| siegelense | SpecHash | siegelense/src/contracts/spec-hash/spec-hash-contract.ts | string | - | 4 | 4 | specHash, hash | 0 | - | 38 | - |
| siegelense | SpecName | siegelense/src/contracts/spec-name/spec-name-contract.ts | string | - | 8 | 8 | specName, spec, name | 0 | - | 170 | - |
| siegelense | StepFilePath | siegelense/src/contracts/step-file-path/step-file-path-contract.ts | string | - | 1 | 1 | path | 0 | - | 7 | - |
| siegelense | StepIndex | siegelense/src/contracts/step-index/step-index-contract.ts | number | - | 9 | 9 | step, stepsRun | 0 | - | 182 | - |
| siegelense | StepOutputName | siegelense/src/contracts/step-output-name/step-output-name-contract.ts | string | - | 2 | 2 | as, step | 0 | - | 4 | - |
| siegelense | StepRange | siegelense/src/contracts/step-range/step-range-contract.ts | string | - | 1 | 1 | steps | 0 | - | 7 | - |
| siegelense | StepRef | siegelense/src/contracts/step-ref/step-ref-contract.ts | string | - | 1 | 1 | path | 0 | - | 2 | - |
| siegelense | UntilConsolePattern | siegelense/src/contracts/until-console-pattern/until-console-pattern-contract.ts | string | - | 1 | 1 | console | 0 | - | 3 | - |
| siegelense | UntilFilePath | siegelense/src/contracts/until-file-path/until-file-path-contract.ts | string | - | 1 | 1 | file | 0 | - | 5 | - |
| siegelense | UrlPath | siegelense/src/contracts/url-path/url-path-contract.ts | string | - | 2 | 2 | readyPath, path | 0 | - | 28 | - |
| testing | FactoryFunctionText | testing/src/contracts/factory-function-text/factory-function-text-contract.ts | string | - | 1 | 1 | factory | 0 | - | 13 | - |
| testing | FilePath | testing/src/contracts/file-path/file-path-contract.ts | string | - | 2 | 2 | module, filePath | 8 | config,eslint-plugin,hooks,server,shared,testing | 150 | top-five W5 trial brand; run alone; same-name copies retyped as one group (SD4) |
| testing | IdentifierName | testing/src/contracts/identifier-name/identifier-name-contract.ts | string | - | 4 | 3 | identifierNames, objectIdentifierNames, names | 0 | - | 76 | - |
| testing | ImportPath | testing/src/contracts/import-path/import-path-contract.ts | string | - | 6 | 3 | importPath, source, import | 1 | shared,testing | 78 | - |
| testing | ModuleName | testing/src/contracts/module-name/module-name-contract.ts | string | - | 1 | 1 | moduleName | 0 | - | 65 | - |
| testing | ScriptName | testing/src/contracts/script-name/script-name-contract.ts | string | - | 1 | 1 | scripts | 1 | - | 2 | - |
| testing | SourceFileName | testing/src/contracts/source-file-name/source-file-name-contract.ts | string | - | 1 | 1 | sourceFile | 0 | - | 35 | - |
| testing | WorkspacePackageExportSourcePath | testing/src/contracts/workspace-package-export-source-path/workspace-package-export-source-path-contract.ts | string | - | 1 | 1 | source | 0 | - | 5 | - |
| tooling | AbsoluteFilePath | tooling/src/contracts/absolute-file-path/absolute-file-path-contract.ts | string | - | 2 | 2 | cwd, filePath | 0 | shared,tooling | 127 | top-five W5 trial brand; run alone; same-name copies retyped as one group (SD4) |
| tooling | CensusCount | tooling/src/contracts/census-count/census-count-contract.ts | number | - | 6 | 1 | adapters, passThrough, logic | 0 | - | 12 | - |
| tooling | CensusPath | tooling/src/contracts/census-path/census-path-contract.ts | string | - | 11 | 5 | file, composedBy, proxyFile | 0 | - | 98 | - |
| tooling | ExitCode | tooling/src/contracts/exit-code/exit-code-contract.ts | number | - | 2 | 2 | exitCode, status | 5 | shared,testing,tooling | 12 | - |
| tooling | ExportName | tooling/src/contracts/export-name/export-name-contract.ts | string | - | 7 | 5 | name, exportNames, names | 0 | - | 41 | - |
| tooling | GatewayModuleDir | tooling/src/contracts/gateway-module-dir/gateway-module-dir-contract.ts | string | - | 1 | 1 | moduleDir | 0 | - | 7 | - |
| tooling | LiteralValue | tooling/src/contracts/literal-value/literal-value-contract.ts | string | - | 1 | 1 | value | 0 | - | 67 | - |
| tooling | ModuleSpecifier | tooling/src/contracts/module-specifier/module-specifier-contract.ts | string | - | 5 | 4 | importPath, specifier, module | 0 | tooling,ward | 18 | - |
| tooling | ProcessOutput | tooling/src/contracts/process-output/process-output-contract.ts | string | - | 2 | 1 | stdout, stderr | 0 | testing,tooling | 22 | - |
| tooling | SourceCode | tooling/src/contracts/source-code/source-code-contract.ts | string | - | 1 | 1 | text | 0 | - | 105 | - |
| ward | CliArg | ward/src/contracts/cli-arg/cli-arg-contract.ts | string | - | 1 | 1 | paths | 0 | - | 209 | - |
| ward | DuplicateInstallPackageName | ward/src/contracts/duplicate-install-package-name/duplicate-install-package-name-contract.ts | string | - | 1 | 1 | packageName | 0 | - | 3 | - |
| ward | DurationMs | ward/src/contracts/duration-ms/duration-ms-contract.ts | number | - | 15 | 5 | durationMs, testMs, slowestTestMs | 6 | - | 15 | - |
| ward | ExportedName | ward/src/contracts/exported-name/exported-name-contract.ts | string | - | 1 | 1 | localExportNames | 0 | - | 7 | - |
| ward | GatewayPackageName | ward/src/contracts/gateway-package-name/gateway-package-name-contract.ts | string | - | 4 | 2 | node, bin, browser | 0 | - | 15 | - |
| ward | GitRelativePath | ward/src/contracts/git-relative-path/git-relative-path-contract.ts | string | - | 3 | 2 | filePath, onlyDiscovered, onlyProcessed | 0 | - | 184 | - |
| ward | ImportedName | ward/src/contracts/imported-name/imported-name-contract.ts | string | - | 1 | 1 | importedNames | 0 | - | 13 | - |
| ward | InstalledPackageVersion | ward/src/contracts/installed-package-version/installed-package-version-contract.ts | string | - | 2 | 2 | version | 0 | - | 2 | - |
| ward | ModuleSpecifier | ward/src/contracts/module-specifier/module-specifier-contract.ts | string | - | 1 | 1 | specifier | 0 | tooling,ward | 36 | - |
| ward | PlatformCrossingChainHop | ward/src/contracts/platform-crossing-chain-hop/platform-crossing-chain-hop-contract.ts | string | - | 1 | 1 | chain | 0 | - | 10 | - |
| ward | ScanRuleName | ward/src/contracts/scan-rule-name/scan-rule-name-contract.ts | string | - | 2 | 2 | rule | 0 | - | 18 | - |
| web | ByteLength | web/src/contracts/byte-length/byte-length-contract.ts | number | - | 1 | 1 | byteLength | 0 | - | 34 | - |
| web | CommentCount | web/src/contracts/comment-count/comment-count-contract.ts | number | - | 2 | 2 | commentCount | 0 | - | 20 | - |
| web | ComposerScopeKey | web/src/contracts/composer-scope-key/composer-scope-key-contract.ts | string | - | 1 | 1 | scopeKey | 0 | - | 44 | - |
| web | ContextTokenCount | web/src/contracts/context-token-count/context-token-count-contract.ts | number | - | 2 | 2 | contextTokens, cumulativeContext | 0 | - | 67 | - |
| web | ContextTokenDelta | web/src/contracts/context-token-delta/context-token-delta-contract.ts | number | - | 1 | 1 | contextDelta | 0 | - | 17 | - |
| web | ContractCount | web/src/contracts/contract-count/contract-count-contract.ts | number | - | 1 | 1 | contractCount | 0 | - | 23 | - |
| web | DisplayLabel | web/src/contracts/display-label/display-label-contract.ts | string | - | 1 | 1 | workItemLabel | 0 | - | 71 | - |
| web | FormattedTokenLabel | web/src/contracts/formatted-token-label/formatted-token-label-contract.ts | string | - | 2 | 1 | tokenBadgeLabel, resultTokenBadgeLabel | 0 | - | 28 | - |
| web | ImageDataUrl | web/src/contracts/image-data-url/image-data-url-contract.ts | string | - | 1 | 1 | dataUrl | 0 | - | 80 | - |
| web | IsoTimestamp | web/src/contracts/iso-timestamp/iso-timestamp-contract.ts | string | - | 3 | 1 | startedAt, endedAt, clockReading | 39 | orchestrator,session-forensics,web | 68 | - |
| web | MarkdownSource | web/src/contracts/markdown-source/markdown-source-contract.ts | string | - | 1 | 1 | source | 0 | - | 12 | - |
| web | PixelLength | web/src/contracts/pixel-length/pixel-length-contract.ts | number | - | 4 | 2 | widthPx, heightPx | 0 | - | 2 | - |
| web | ToolResultKey | web/src/contracts/tool-result-key/tool-result-key-contract.ts | string | - | 2 | 1 | label | 0 | - | 1 | - |

`native owner` is filled when some field of some contract already derives to exactly this text by B3 (owner + key), for example `QuestTitle` from Quest + title: that field keeps its text and every other use reuses it (`Quest['title']`, B4/B13); `-` means no contract's derived text equals the brand, so every field gets a new derived text and loose values go plain. The same-name groups (dup > 1) in 2.7 are retyped together.

#### 2.7 Same-name groups (SD4: retype as one group; inline brands with the same text re-derive in the same pass)

| brand | rows | packages | classes | fanOut sum | inline copies |
|---|---|---|---|---|---|
| AbsoluteFilePath | 2 | shared,tooling | value | 3210 | 0 |
| AgentId | 2 | orchestrator,shared | ownerless-id | 124 | 3 |
| ContentText | 2 | mcp,shared | never,value | 2580 | 2 |
| ErrorMessage | 2 | mcp,shared | never,value | 458 | 12 |
| EslintRuleName | 2 | eslint-plugin,hooks | never-nonfield,value | 31 | 0 |
| ExitCode | 3 | shared,testing,tooling | never,value | 135 | 5 |
| FileContents | 3 | config,hooks,shared | never,value | 537 | 0 |
| FileName | 3 | eslint-plugin,shared,testing | never,value | 416 | 1 |
| FilePath | 6 | config,eslint-plugin,hooks,server,shared,testing | never,value | 2789 | 8 |
| GlobPattern | 3 | shared,tooling,ward | never | 271 | 1 |
| ImportPath | 2 | shared,testing | value | 147 | 1 |
| IsoTimestamp | 3 | orchestrator,session-forensics,web | value | 117 | 39 |
| ModuleSpecifier | 2 | tooling,ward | value | 54 | 0 |
| PixelCoordinate | 2 | siegelense,web | never,value | 23 | 0 |
| ProcessOutput | 2 | testing,tooling | never,value | 36 | 0 |
| RecipeInputKey | 2 | hydration-recipes,siegelense | never,value | 12 | 0 |
| RecipeName | 3 | hydration,hydration-recipes,siegelense | value | 56 | 0 |
| RunId | 2 | siegelense,ward | ownerless-id | 219 | 0 |
| StepName | 2 | orchestrator,shared | value | 69 | 3 |
| TimeoutMs | 2 | shared,web | never,value | 34 | 1 |
| ToolName | 2 | mcp,web | never,value | 116 | 10 |
| ToolUseId | 2 | hydration-recipes,orchestrator | ownerless-id | 71 | 3 |

Groups that mix a never-a-field row with a field row (ContentText, ErrorMessage, EslintRuleName, ExitCode, FileContents, FileName, FilePath, PixelCoordinate, ProcessOutput, RecipeInputKey, TimeoutMs, ToolName): retype the field copy first (W5), then the never copy goes plain (W1); a plain copy whose package imports the field copy must follow it, not lead. Two groups share a brand text but are different things and must not be retyped together: `RunId` (siegelense `run_N` regex, ward `<ms>-<hex>` regex; 2.4 sends them to different owners) and `FilePath`/`FileName` copies whose regexes differ (`eslint-plugin` `FileName` has a no-slash regex, the others do not).

#### 2.8 Never-a-field standalone brands (W1: plain)

| pkg | brand | standalone file | W1 verdict | prod parses | test parses | stub calls | fanOut | why |
|---|---|---|---|---|---|---|---|---|
| cli | BuildTimestamp | cli/src/contracts/build-timestamp/build-timestamp-contract.ts | plain | 1 | 4 | 2 | 4 | - |
| config | FileContents | config/src/contracts/file-contents/file-contents-contract.ts | plain | 0 | 7 | 4 | 4 | - |
| config | FilePath | config/src/contracts/file-path/file-path-contract.ts | plain | 6 | 9 | 80 | 93 | - |
| eslint-plugin | DepthCount | eslint-plugin/src/contracts/depth-count/depth-count-contract.ts | plain | 4 | 2 | 6 | 12 | - |
| eslint-plugin | EslintRuleName | eslint-plugin/src/contracts/eslint-rule-name/eslint-rule-name-contract.ts | plain (record key) | 1 | 3 | 28 | 29 | referenced unkeyed in eslint-rules-contract.ts; that site takes an inline derived brand |
| eslint-plugin | FileName | eslint-plugin/src/contracts/file-name/file-name-contract.ts | NOT PLAIN YET | 2 | 2 | 32 | 36 | regex/length/uuid check; 2 production parse(s) would stop checking |
| eslint-plugin | FilePath | eslint-plugin/src/contracts/file-path/file-path-contract.ts | plain | 73 | 16 | 213 | 336 | - |
| eslint-plugin | FolderSuggestion | eslint-plugin/src/contracts/folder-suggestion/folder-suggestion-contract.ts | plain | 2 | 2 | 6 | 9 | - |
| eslint-plugin | ForbiddenFolderName | eslint-plugin/src/contracts/forbidden-folder-name/forbidden-folder-name-contract.ts | plain | 1 | 2 | 15 | 16 | - |
| eslint-plugin | KebabCaseString | eslint-plugin/src/contracts/kebab-case-string/kebab-case-string-contract.ts | NOT PLAIN YET | 1 | 2 | 12 | 14 | regex/length/uuid check; 1 production parse(s) would stop checking |
| hooks | FilePath | hooks/src/contracts/file-path/file-path-contract.ts | plain | 19 | 3 | 103 | 135 | - |
| hooks | ViolationComparisonMessage | hooks/src/contracts/violation-comparison-message/violation-comparison-message-contract.ts | plain | 2 | 7 | 3 | 7 | - |
| hydration | BuildSequence | hydration/src/contracts/build-sequence/build-sequence-contract.ts | plain | 2 | 3 | 2 | 6 | - |
| hydration | CallIndex | hydration/src/contracts/call-index/call-index-contract.ts | plain | 2 | 3 | 16 | 21 | - |
| hydration-recipes | FileStem | hydration-recipes/src/contracts/file-stem/file-stem-contract.ts | plain | 1 | 3 | 1 | 3 | - |
| hydration-recipes | RecipeInputKey | hydration-recipes/src/contracts/recipe-input-key/recipe-input-key-contract.ts | plain | 4 | 2 | 1 | 7 | - |
| mcp | ClaudePermission | mcp/src/contracts/claude-permission/claude-permission-contract.ts | plain | 4 | 7 | 3 | 11 | - |
| mcp | ContentText | mcp/src/contracts/content-text/content-text-contract.ts | plain | 90 | 1 | 75 | 187 | - |
| mcp | ErrorMessage | mcp/src/contracts/error-message/error-message-contract.ts | plain | 0 | 1 | 4 | 4 | - |
| mcp | FileType | mcp/src/contracts/file-type/file-type-contract.ts | plain | 3 | 1 | 10 | 14 | - |
| mcp | FunctionName | mcp/src/contracts/function-name/function-name-contract.ts | plain | 2 | 1 | 47 | 53 | - |
| mcp | HeaderText | mcp/src/contracts/header-text/header-text-contract.ts | plain | 0 | 1 | 10 | 10 | - |
| mcp | LineIndex | mcp/src/contracts/line-index/line-index-contract.ts | plain | 0 | 1 | 4 | 4 | - |
| mcp | McpPermission | mcp/src/contracts/mcp-permission/mcp-permission-contract.ts | plain | 1 | 6 | 2 | 4 | - |
| mcp | ParameterName | mcp/src/contracts/parameter-name/parameter-name-contract.ts | plain | 1 | 1 | 13 | 14 | - |
| mcp | ReturnType | mcp/src/contracts/return-type/return-type-contract.ts | plain | 2 | 1 | 17 | 19 | - |
| mcp | RpcId | mcp/src/contracts/rpc-id/rpc-id-contract.ts | plain | 0 | 1 | 43 | 43 | check only in tests (union of number/string) |
| mcp | RpcMethod | mcp/src/contracts/rpc-method/rpc-method-contract.ts | plain | 0 | 1 | 44 | 44 | - |
| mcp | SignatureRaw | mcp/src/contracts/signature-raw/signature-raw-contract.ts | plain | 2 | 1 | 11 | 13 | - |
| mcp | TypeName | mcp/src/contracts/type-name/type-name-contract.ts | plain | 2 | 1 | 21 | 27 | - |
| orchestrator | ChatEntryContent | orchestrator/src/contracts/chat-entry-content/chat-entry-content-contract.ts | plain | 1 | 2 | 4 | 6 | - |
| orchestrator | ContinuationContext | orchestrator/src/contracts/continuation-context/continuation-context-contract.ts | plain | 2 | 4 | 2 | 6 | - |
| orchestrator | DeletedCount | orchestrator/src/contracts/deleted-count/deleted-count-contract.ts | plain | 1 | 5 | 3 | 5 | - |
| orchestrator | ElapsedMs | orchestrator/src/contracts/elapsed-ms/elapsed-ms-contract.ts | plain | 0 | 5 | 10 | 10 | - |
| orchestrator | FollowupDepth | orchestrator/src/contracts/followup-depth/followup-depth-contract.ts | plain | 0 | 6 | 2 | 2 | - |
| orchestrator | OrchestrationLoopSummary | orchestrator/src/contracts/orchestration-loop-summary/orchestration-loop-summary-contract.ts | plain | 2 | 2 | 6 | 9 | - |
| orchestrator | RemovedCount | orchestrator/src/contracts/removed-count/removed-count-contract.ts | plain | 3 | 4 | 1 | 7 | - |
| orchestrator | SmoketestPlaceholder | orchestrator/src/contracts/smoketest-placeholder/smoketest-placeholder-contract.ts | plain | 0 | 5 | 2 | 2 | - |
| orchestrator | ToolInputDisplay | orchestrator/src/contracts/tool-input-display/tool-input-display-contract.ts | plain | 2 | 5 | 4 | 7 | - |
| orchestrator | ToolUseDisplay | orchestrator/src/contracts/tool-use-display/tool-use-display-contract.ts | plain | 1 | 2 | 2 | 5 | - |
| server | DevLogLine | server/src/contracts/dev-log-line/dev-log-line-contract.ts | plain | 28 | 4 | 2 | 38 | - |
| server | FilePath | server/src/contracts/file-path/file-path-contract.ts | plain | 12 | 1 | 27 | 42 | - |
| server | MtimeMs | server/src/contracts/mtime-ms/mtime-ms-contract.ts | plain | 1 | 8 | 9 | 16 | - |
| server | SessionSummary | server/src/contracts/session-summary/session-summary-contract.ts | plain | 4 | 5 | 7 | 20 | - |
| session-forensics | BucketMinutes | session-forensics/src/contracts/bucket-minutes/bucket-minutes-contract.ts | NOT PLAIN YET | 1 | 7 | 3 | 5 | coerces its input; 1 production parse(s) would stop checking |
| session-forensics | GapFloorSeconds | session-forensics/src/contracts/gap-floor-seconds/gap-floor-seconds-contract.ts | NOT PLAIN YET | 1 | 7 | 3 | 5 | coerces its input; 1 production parse(s) would stop checking |
| shared | CompletedCount | shared/src/contracts/completed-count/completed-count-contract.ts | plain | 1 | 6 | 8 | 11 | - |
| shared | ConfigIndex | shared/src/contracts/config-index/config-index-contract.ts | plain | 1 | 4 | 2 | 5 | - |
| shared | CssPixels | shared/src/contracts/css-pixels/css-pixels-contract.ts | plain | 13 | 7 | 14 | 36 | - |
| shared | DungeonmasterHomeCwd | shared/src/contracts/dungeonmaster-home-cwd/dungeonmaster-home-cwd-contract.ts | plain | 1 | 9 | 0 | 2 | cwd role label (open decision 2); goes plain, the spawn request field keeps its brand |
| shared | FileCount | shared/src/contracts/file-count/file-count-contract.ts | plain | 6 | 9 | 21 | 31 | - |
| shared | FloorName | shared/src/contracts/floor-name/floor-name-contract.ts | plain | 1 | 5 | 4 | 6 | - |
| shared | GlobPattern | shared/src/contracts/glob-pattern/glob-pattern-contract.ts | plain | 18 | 5 | 150 | 184 | - |
| shared | GuildPathCwd | shared/src/contracts/guild-path-cwd/guild-path-cwd-contract.ts | plain | 1 | 8 | 0 | 2 | cwd role label (open decision 2); goes plain, the spawn request field keeps its brand |
| shared | HexColor | shared/src/contracts/hex-color/hex-color-contract.ts | NOT PLAIN YET | 3 | 11 | 2 | 6 | regex/length/uuid check; 3 production parse(s) would stop checking |
| shared | ModulePath | shared/src/contracts/module-path/module-path-contract.ts | plain | 6 | 1 | 58 | 91 | - |
| shared | ProjectRootCwd | shared/src/contracts/project-root-cwd/project-root-cwd-contract.ts | plain | 1 | 8 | 0 | 2 | cwd role label (open decision 2); goes plain, the spawn request field keeps its brand |
| shared | RelativeFilePath | shared/src/contracts/relative-file-path/relative-file-path-contract.ts | NOT PLAIN YET (record key) | 3 | 13 | 0 | 6 | referenced unkeyed in file-path-contract.ts; that site takes an inline derived brand |
| shared | SlotCount | shared/src/contracts/slot-count/slot-count-contract.ts | plain | 2 | 9 | 2 | 7 | - |
| shared | TopologicalDepth | shared/src/contracts/topological-depth/topological-depth-contract.ts | plain | 1 | 4 | 2 | 5 | - |
| shared | TotalCount | shared/src/contracts/total-count/total-count-contract.ts | plain | 3 | 6 | 20 | 27 | - |
| siegelense | BufferLineCount | siegelense/src/contracts/buffer-line-count/buffer-line-count-contract.ts | plain | 3 | 3 | 2 | 8 | - |
| siegelense | ColourChannel | siegelense/src/contracts/colour-channel/colour-channel-contract.ts | NOT PLAIN YET | 3 | 4 | 6 | 12 | upper bound; 3 production parse(s) would stop checking |
| siegelense | FileDescriptor | siegelense/src/contracts/file-descriptor/file-descriptor-contract.ts | plain | 2 | 4 | 33 | 36 | - |
| siegelense | MatchCount | siegelense/src/contracts/match-count/match-count-contract.ts | plain | 1 | 3 | 2 | 5 | - |
| siegelense | SeedBindingName | siegelense/src/contracts/seed-binding-name/seed-binding-name-contract.ts | NOT PLAIN YET (record key) | 1 | 2 | 1 | 4 | referenced unkeyed in seed-bindings-contract.ts; that site takes an inline derived brand |
| siegelense | SnapshotOrdinal | siegelense/src/contracts/snapshot-ordinal/snapshot-ordinal-contract.ts | NOT PLAIN YET | 2 | 4 | 11 | 14 | lower bound from statics; 2 production parse(s) would stop checking |
| testing | BaseName | testing/src/contracts/base-name/base-name-contract.ts | plain | 0 | 7 | 410 | 412 | - |
| testing | CommandName | testing/src/contracts/command-name/command-name-contract.ts | plain | 0 | 4 | 6 | 10 | - |
| testing | EpochTimestamp | testing/src/contracts/epoch-timestamp/epoch-timestamp-contract.ts | plain | 3 | 5 | 2 | 6 | - |
| testing | ExitCode | testing/src/contracts/exit-code/exit-code-contract.ts | plain | 2 | 7 | 3 | 6 | - |
| testing | FileContent | testing/src/contracts/file-content/file-content-contract.ts | plain | 3 | 5 | 187 | 200 | - |
| testing | FileName | testing/src/contracts/file-name/file-name-contract.ts | plain | 2 | 4 | 7 | 23 | - |
| testing | MatchSpecificity | testing/src/contracts/match-specificity/match-specificity-contract.ts | plain | 7 | 5 | 2 | 11 | - |
| testing | MockFunctionName | testing/src/contracts/mock-function-name/mock-function-name-contract.ts | plain | 2 | 6 | 6 | 9 | - |
| testing | MswRequestId | testing/src/contracts/msw-request-id/msw-request-id-contract.ts | plain | 3 | 4 | 2 | 6 | - |
| testing | ProcessOutput | testing/src/contracts/process-output/process-output-contract.ts | plain | 6 | 10 | 4 | 14 | - |
| testing | RelativePath | testing/src/contracts/relative-path/relative-path-contract.ts | plain | 3 | 4 | 312 | 324 | - |
| testing | RequestCount | testing/src/contracts/request-count/request-count-contract.ts | plain | 1 | 4 | 2 | 5 | - |
| testing | UnhandledRequestMessage | testing/src/contracts/unhandled-request-message/unhandled-request-message-contract.ts | plain | 2 | 4 | 2 | 5 | - |
| tooling | GlobPattern | tooling/src/contracts/glob-pattern/glob-pattern-contract.ts | plain | 1 | 1 | 39 | 41 | - |
| tooling | OccurrenceThreshold | tooling/src/contracts/occurrence-threshold/occurrence-threshold-contract.ts | NOT PLAIN YET | 1 | 1 | 29 | 31 | lower bound from statics; 1 production parse(s) would stop checking |
| ward | BinCommand | ward/src/contracts/bin-command/bin-command-contract.ts | plain | 7 | 5 | 27 | 38 | - |
| ward | BundleHash | ward/src/contracts/bundle-hash/bundle-hash-contract.ts | NOT PLAIN YET | 1 | 8 | 2 | 4 | regex/length/uuid check; 1 production parse(s) would stop checking |
| ward | DuplicateInstallDisplayText | ward/src/contracts/duplicate-install-display-text/duplicate-install-display-text-contract.ts | plain | 3 | 4 | 1 | 6 | - |
| ward | GitBranchName | ward/src/contracts/git-branch-name/git-branch-name-contract.ts | plain | 2 | 5 | 7 | 11 | - |
| ward | GlobPattern | ward/src/contracts/glob-pattern/glob-pattern-contract.ts | plain | 25 | 2 | 11 | 46 | - |
| ward | OpenHandleDisplay | ward/src/contracts/open-handle-display/open-handle-display-contract.ts | plain | 1 | 3 | 2 | 4 | - |
| ward | OutOfMemoryReport | ward/src/contracts/out-of-memory-report/out-of-memory-report-contract.ts | plain | 1 | 2 | 2 | 4 | - |
| ward | PlatformCrossingDisplayText | ward/src/contracts/platform-crossing-display-text/platform-crossing-display-text-contract.ts | plain | 3 | 3 | 2 | 7 | - |
| ward | PlatformCrossingResolveCacheKey | ward/src/contracts/platform-crossing-resolve-cache-key/platform-crossing-resolve-cache-key-contract.ts | plain | 1 | 3 | 2 | 4 | - |
| ward | PlatformCrossingWalkMemoKey | ward/src/contracts/platform-crossing-walk-memo-key/platform-crossing-walk-memo-key-contract.ts | plain | 3 | 3 | 2 | 9 | - |
| ward | SummaryLine | ward/src/contracts/summary-line/summary-line-contract.ts | plain | 1 | 2 | 8 | 10 | - |
| ward | WardErrorList | ward/src/contracts/ward-error-list/ward-error-list-contract.ts | plain | 1 | 2 | 8 | 10 | - |
| ward | WardFileDetail | ward/src/contracts/ward-file-detail/ward-file-detail-contract.ts | plain | 2 | 2 | 28 | 31 | - |
| ward | WardSummary | ward/src/contracts/ward-summary/ward-summary-contract.ts | plain | 4 | 2 | 37 | 43 | - |
| web | AnimationIntervalMs | web/src/contracts/animation-interval-ms/animation-interval-ms-contract.ts | plain | 3 | 6 | 2 | 6 | - |
| web | BounceOffsetPx | web/src/contracts/bounce-offset-px/bounce-offset-px-contract.ts | plain | 2 | 6 | 2 | 6 | - |
| web | ButtonLabel | web/src/contracts/button-label/button-label-contract.ts | NOT PLAIN YET | 16 | 8 | 19 | 54 | upper bound; 16 production parse(s) would stop checking |
| web | CssColorOverride | web/src/contracts/css-color-override/css-color-override-contract.ts | plain | 1 | 4 | 4 | 8 | - |
| web | CssDimension | web/src/contracts/css-dimension/css-dimension-contract.ts | plain | 0 | 5 | 4 | 8 | check only in tests (union of number/string) |
| web | CssSpacing | web/src/contracts/css-spacing/css-spacing-contract.ts | plain | 0 | 5 | 3 | 5 | - |
| web | DependencyLabel | web/src/contracts/dependency-label/dependency-label-contract.ts | plain | 2 | 3 | 8 | 14 | - |
| web | DisplayFilePath | web/src/contracts/display-file-path/display-file-path-contract.ts | plain | 0 | 3 | 9 | 14 | - |
| web | DropdownOption | web/src/contracts/dropdown-option/dropdown-option-contract.ts | plain | 2 | 4 | 23 | 30 | - |
| web | FlowLayoutSignature | web/src/contracts/flow-layout-signature/flow-layout-signature-contract.ts | plain | 1 | 2 | 4 | 6 | - |
| web | FormInputValue | web/src/contracts/form-input-value/form-input-value-contract.ts | plain | 0 | 5 | 14 | 21 | - |
| web | FormPlaceholder | web/src/contracts/form-placeholder/form-placeholder-contract.ts | plain | 0 | 4 | 3 | 5 | - |
| web | MarkdownSourceLine | web/src/contracts/markdown-source-line/markdown-source-line-contract.ts | plain | 3 | 7 | 2 | 8 | - |
| web | NormalizedPasteMediaType | web/src/contracts/normalized-paste-media-type/normalized-paste-media-type-contract.ts | plain | 1 | 7 | 2 | 4 | - |
| web | NotificationMessage | web/src/contracts/notification-message/notification-message-contract.ts | plain | 1 | 4 | 2 | 4 | - |
| web | OperationFlowLabel | web/src/contracts/operation-flow-label/operation-flow-label-contract.ts | plain | 1 | 3 | 2 | 4 | - |
| web | PixelCoordinate | web/src/contracts/pixel-coordinate/pixel-coordinate-contract.ts | NOT PLAIN YET | 5 | 11 | 8 | 14 | regex/length/uuid check; 5 production parse(s) would stop checking |
| web | PixelDimension | web/src/contracts/pixel-dimension/pixel-dimension-contract.ts | plain | 0 | 10 | 20 | 35 | - |
| web | ResetDurationLabel | web/src/contracts/reset-duration-label/reset-duration-label-contract.ts | plain | 5 | 4 | 1 | 8 | - |
| web | RiftcarverLogLine | web/src/contracts/riftcarver-log-line/riftcarver-log-line-contract.ts | plain | 1 | 4 | 1 | 3 | - |
| web | RowOrder | web/src/contracts/row-order/row-order-contract.ts | plain | 0 | 7 | 4 | 12 | - |
| web | ScrollOffsetPx | web/src/contracts/scroll-offset-px/scroll-offset-px-contract.ts | plain | 2 | 5 | 15 | 20 | - |
| web | ScrollPositionPx | web/src/contracts/scroll-position-px/scroll-position-px-contract.ts | plain | 3 | 5 | 37 | 52 | - |
| web | ScrollThresholdPx | web/src/contracts/scroll-threshold-px/scroll-threshold-px-contract.ts | plain | 1 | 5 | 3 | 5 | - |
| web | SectionCount | web/src/contracts/section-count/section-count-contract.ts | plain | 0 | 6 | 4 | 7 | - |
| web | SectionLabel | web/src/contracts/section-label/section-label-contract.ts | plain | 0 | 4 | 15 | 23 | - |
| web | ServedImageContent | web/src/contracts/served-image-content/served-image-content-contract.ts | plain | 1 | 4 | 2 | 4 | - |
| web | ShortenedPathText | web/src/contracts/shortened-path-text/shortened-path-text-contract.ts | plain | 5 | 7 | 2 | 10 | - |
| web | StickyZIndex | web/src/contracts/sticky-z-index/sticky-z-index-contract.ts | NOT PLAIN YET | 1 | 6 | 2 | 4 | lower bound from statics; 1 production parse(s) would stop checking |
| web | TagItem | web/src/contracts/tag-item/tag-item-contract.ts | plain | 0 | 4 | 8 | 11 | - |
| web | TailStartIndex | web/src/contracts/tail-start-index/tail-start-index-contract.ts | plain | 14 | 9 | 18 | 38 | - |
| web | TakeCount | web/src/contracts/take-count/take-count-contract.ts | plain | 1 | 6 | 2 | 3 | - |
| web | TestId | web/src/contracts/test-id/test-id-contract.ts | plain | 17 | 4 | 5 | 24 | - |
| web | ThemeSchemeDescription | web/src/contracts/theme-scheme-description/theme-scheme-description-contract.ts | plain | 0 | 8 | 2 | 2 | check only in tests (upper bound) |
| web | ThemeSchemeName | web/src/contracts/theme-scheme-name/theme-scheme-name-contract.ts | plain | 0 | 8 | 2 | 2 | check only in tests (upper bound) |
| web | TimeoutMs | web/src/contracts/timeout-ms/timeout-ms-contract.ts | plain | 1 | 5 | 2 | 3 | - |
| web | ToolDisplayLabel | web/src/contracts/tool-display-label/tool-display-label-contract.ts | plain | 4 | 8 | 2 | 7 | - |
| web | ToolInputKey | web/src/contracts/tool-input-key/tool-input-key-contract.ts | plain (record key) | 0 | 3 | 1 | 1 | referenced unkeyed in parsed-tool-input-contract.ts; that site takes an inline derived brand |
| web | ToolName | web/src/contracts/tool-name/tool-name-contract.ts | plain | 3 | 2 | 9 | 16 | - |
| web | ToolResultDisplayContent | web/src/contracts/tool-result-display-content/tool-result-display-content-contract.ts | plain | 5 | 5 | 10 | 16 | - |
| web | TrailingThinkingIndex | web/src/contracts/trailing-thinking-index/trailing-thinking-index-contract.ts | NOT PLAIN YET | 6 | 6 | 2 | 9 | min -1; 6 production parse(s) would stop checking |
| web | TruncatedContent | web/src/contracts/truncated-content/truncated-content-contract.ts | plain | 2 | 5 | 2 | 5 | - |
| web | UploadPercent | web/src/contracts/upload-percent/upload-percent-contract.ts | NOT PLAIN YET | 4 | 7 | 7 | 14 | upper bound; lower bound from statics; 4 production parse(s) would stop checking |
| web | WardDetailLine | web/src/contracts/ward-detail-line/ward-detail-line-contract.ts | plain | 8 | 3 | 1 | 11 | - |
| web | WsUrl | web/src/contracts/ws-url/ws-url-contract.ts | NOT PLAIN YET | 1 | 5 | 5 | 8 | regex/length/uuid check; 1 production parse(s) would stop checking |

17 rows are flagged NOT PLAIN YET: W1 drops every parse, and each of these carries a check beyond the type (a regex, a bound, a coercion) that runs in production code. Decide per row whether the parsed value comes from outside the process (a string typed by a person, a CLI argument, a network message); if it does, move the check first: into a guard or transformer at the boundary (for example `isHexColorGuard`), or inline on the field that receives the value when one exists. The rest lose only `.min(1)`, `.int()`, `.nonnegative()` (types already say number or string).

W1 big ones, checked against the census: `baseName` (testing, never a field, 410 stub calls), `relativePath` (testing, 324), `fileContent` (testing, 200), `filePath` (eslint-plugin, 336), `globPattern` (shared 184, ward 46, tooling 41, three copies): all confirmed never-a-field. **`cliArg` is not**: `packages/ward/src/contracts/scan-config/scan-config-contract.ts:18` holds it as `paths`, so the EPIC list of W1 big ones is wrong there; it is a value brand (row in 2.6).

### Item 3: the `z.unknown()` sites in contracts

Counts re-measured with `tmp/b15-dec/unk.cjs` (every `z.unknown()` call and `z.any()` call in a file under a `contracts/` folder, tests and stubs included; none are in tests or stubs): 107 sites, 0 `z.any()`. The 124 in the EPIC and the census predate wave 3.1, which moved dead contracts out (for example `mcpServerClientContract.process` is gone). Two lines carry two calls each (`tsestree-contract.ts:39`, a tuple, and `:93`), so 105 lines carry 107 calls.

Decisions: exception 1, gateway 11, json 66, own 29. Gateway schemas: the three that exist today are `childProcessSchema`, `walkedFileSchema` and `bufferSchema` under `packages/@gateway/node/src/`; none of them fits a site here, so every `gateway` row below is a schema to create (G20 pattern: `<subpath>/<type>/<type>-schema.ts` with `.brand<'#Gateway<Type>'>()`).

| # | path:line | field | decision | target | target path | status | why |
|---|---|---|---|---|---|---|---|
| 1 | cli/src/contracts/package-json/package-json-contract.ts:16 | devDependencies | own | z.string() branded PackageJsonDevDependenciesValue | - | inline | the value of a devDependencies entry is a version range string |
| 2 | cli/src/contracts/package-json-raw/package-json-raw-contract.ts:15 | packageJsonRawContract | json | z.json() | - | n/a | a whole package.json passed through by key; the contract exists to accept any file, so any JSON value |
| 3 | cli/src/contracts/package-seed/package-seed-contract.ts:39 | compilerOptions | json | z.json() | - | n/a | tsconfig compilerOptions are JSON values, keyed by option name |
| 4 | eslint-plugin/src/contracts/ast-node/ast-node-contract.ts:30 | parent | gateway | #GatewayTsestreeNode (tsestreeNodeSchema) | packages/@gateway/npm/src/typescript-eslint__utils/tsestree-node/tsestree-node-schema.ts | create | `parent` is an ESTree node; B04 moves rules onto the real TSESTree type, and the gateway owns that type. If B04 deletes `astNodeContract`, this row goes with it |
| 5 | eslint-plugin/src/contracts/eslint-config/eslint-config-contract.ts:13 | plugins | gateway | #GatewayEslintPlugin (eslintPluginSchema) | packages/@gateway/npm/src/eslint/eslint-plugin/eslint-plugin-schema.ts | create | each value is a loaded ESLint plugin object, an outside package's type |
| 6 | eslint-plugin/src/contracts/eslint-config/eslint-config-contract.ts:17 | languageOptions.parser | gateway | #GatewayEslintParser (eslintParserSchema) | packages/@gateway/npm/src/typescript-eslint__parser/eslint-parser/eslint-parser-schema.ts | create | a loaded parser module object, an outside package's type |
| 7 | eslint-plugin/src/contracts/eslint-config/eslint-config-contract.ts:18 | languageOptions.parserOptions | json | z.json() | - | n/a | parserOptions are plain JSON (`project`, `tsconfigRootDir`, `ecmaVersion`) |
| 8 | eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts:23 | options | json | z.json() | - | n/a | rule options as written in eslint.config.js: JSON values (objects, strings, numbers) |
| 9 | eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts:35 | variables | gateway | #GatewayEslintScopeVariable (eslintScopeVariableSchema) | packages/@gateway/npm/src/eslint/eslint-scope-variable/eslint-scope-variable-schema.ts | create | ESLint scope variables are the library's own objects |
| 10 | eslint-plugin/src/contracts/eslint-context/eslint-context-contract.ts:72 | ast | gateway | #GatewayTsestreeNode (tsestreeNodeSchema) | packages/@gateway/npm/src/typescript-eslint__utils/tsestree-node/tsestree-node-schema.ts | create | `ast` is the Program node, a TSESTree node |
| 11 | eslint-plugin/src/contracts/eslint-rule/eslint-rule-contract.ts:24 | meta.schema | json | z.json() | - | n/a | `meta.schema` is a JSON Schema document |
| 12 | eslint-plugin/src/contracts/eslint-rules/eslint-rules-contract.ts:13 | eslintRulesContract | json | z.json() | - | n/a | a rule config tuple: severity then options, all JSON |
| 13 | eslint-plugin/src/contracts/rule-violation/rule-violation-contract.ts:26 | node | gateway | #GatewayTsestreeNode (tsestreeNodeSchema) | packages/@gateway/npm/src/typescript-eslint__utils/tsestree-node/tsestree-node-schema.ts | create | the reported node is a TSESTree node; `.loose()` already lets `fix` through beside it |
| 14 | eslint-plugin/src/contracts/rule-violation/rule-violation-contract.ts:29 | data | json | z.json() | - | n/a | report `data` fills message placeholders: strings and numbers |
| 15 | eslint-plugin/src/contracts/tsestree/tsestree-contract.ts:39 | range | own | z.number().int().nonnegative() branded TsestreeRangeStart | - | inline | a node range is a start offset |
| 16 | eslint-plugin/src/contracts/tsestree/tsestree-contract.ts:39 | range | own | z.number().int().nonnegative() branded TsestreeRangeEnd | - | inline | a node range is an end offset |
| 17 | eslint-plugin/src/contracts/tsestree/tsestree-contract.ts:46 | value | own | z.union([string, number, boolean, null]) branded TsestreeLiteralValue | - | inline | a Literal node's value; RegExp and bigint are not JSON, so not z.json(); B04 may replace the whole contract with the gateway node schema |
| 18 | eslint-plugin/src/contracts/tsestree/tsestree-contract.ts:93 | regex.pattern | own | z.string() branded TsestreeRegexPattern | - | inline | regex literal source text |
| 19 | eslint-plugin/src/contracts/tsestree/tsestree-contract.ts:93 | regex.flags | own | z.string() branded TsestreeRegexFlags | - | inline | regex literal flags |
| 20 | eslint-plugin/src/contracts/workspace-root-package-json/workspace-root-package-json-contract.ts:18 | workspaces | json | z.json() | - | n/a | the object form of `workspaces` carries `packages` and `nohoist` arrays: JSON |
| 21 | hooks/src/contracts/agy-pre-tool-decision/agy-pre-tool-decision-contract.ts:15 | overwrite | json | z.json() | - | n/a | an Antigravity hook payload: JSON from the host |
| 22 | hooks/src/contracts/agy-pre-tool-hook-data/agy-pre-tool-hook-data-contract.ts:21 | toolCall.args | json | z.json() | - | n/a | tool call arguments from the host: JSON |
| 23 | hooks/src/contracts/agy-transcript-line/agy-transcript-line-contract.ts:17 | tool_calls.args | json | z.json() | - | n/a | tool call arguments in a transcript line: JSON |
| 24 | hooks/src/contracts/linter-config/linter-config-contract.ts:13 | rules | json | z.json() | - | n/a | rule config values: JSON |
| 25 | hooks/src/contracts/linter-config/linter-config-contract.ts:15 | plugins | gateway | #GatewayEslintPlugin (eslintPluginSchema) | packages/@gateway/npm/src/eslint/eslint-plugin/eslint-plugin-schema.ts | create | hooks reads a loaded config whose `plugins` are plugin objects |
| 26 | hooks/src/contracts/linter-config/linter-config-contract.ts:16 | languageOptions | own | z.object({ parser: #GatewayEslintParser, parserOptions: z.record(key, z.json()) }) branded LinterConfigLanguageOptions | hooks/src/contracts/linter-config/linter-config-contract.ts | inline | the object has a known shape; only `parser` is an outside type |
| 27 | hooks/src/contracts/mcp-tool-input/mcp-tool-input-contract.ts:12 | mcpToolInputContract | json | z.json() | - | n/a | MCP tool arguments are JSON by protocol |
| 28 | hooks/src/contracts/partial-eslint-config/partial-eslint-config-contract.ts:13 | rules | json | z.json() | - | n/a | rule config values: JSON |
| 29 | hooks/src/contracts/post-tool-use-hook-data/post-tool-use-hook-data-contract.ts:19 | tool_input | json | z.json() | - | n/a | the host's tool input, one shape per tool: JSON at this seam; each tool's own input contract narrows it where a hook reads keys |
| 30 | hooks/src/contracts/pre-search-hook-data/pre-search-hook-data-contract.ts:16 | tool_input | json | z.json() | - | n/a | the input of a native search tool (pattern, path, glob...): JSON at this seam |
| 31 | hooks/src/contracts/raw-eslint-config/raw-eslint-config-contract.ts:14 | project | own | z.union([string, array of string]) branded RawEslintParserOptionsProject | - | inline | `parserOptions.project` is one path or a list |
| 32 | hooks/src/contracts/raw-eslint-config/raw-eslint-config-contract.ts:25 | rules | json | z.json() | - | n/a | rule config values: JSON |
| 33 | hooks/src/contracts/raw-eslint-config/raw-eslint-config-contract.ts:26 | language | own | z.string() branded RawEslintConfigLanguage | - | inline | ESLint's `language` is a plain identifier like `js/js` |
| 34 | hooks/src/contracts/raw-eslint-config/raw-eslint-config-contract.ts:27 | plugins | gateway | #GatewayEslintPlugin (eslintPluginSchema) | packages/@gateway/npm/src/eslint/eslint-plugin/eslint-plugin-schema.ts | create | plugin objects |
| 35 | hooks/src/contracts/transcript-line/transcript-line-contract.ts:16 | input | json | z.json() | - | n/a | a tool_use input, one shape per tool: JSON |
| 36 | hydration/src/contracts/field-values/field-values-contract.ts:20 | fieldValueContract | json | z.json() | - | n/a | a value is a saved-ref marker or any JSON; `z.union([savedRefContract, z.json()])` replaces the `superRefine` probe |
| 37 | hydration/src/contracts/hydration-run-result/hydration-run-result-contract.ts:20 | hydrationRunResultContract | json | z.json() | - | n/a | what each hydration recipe saved under its name: any JSON |
| 38 | hydration/src/contracts/op-set/op-set-contract.ts:31 | transition.to | json | z.json() | - | n/a | the value a set op writes into a field: JSON |
| 39 | hydration/src/contracts/transition-spec/transition-spec-contract.ts:50 | to | json | z.json() | - | n/a | the values a transition allows: JSON |
| 40 | hydration-recipes/src/contracts/dm-http-response/dm-http-response-contract.ts:17 | body | json | z.json() | - | n/a | an HTTP response body, parsed from JSON |
| 41 | hydration-recipes/src/contracts/ward-result-detail-args/ward-result-detail-args-contract.ts:22 | detail | json | z.json() | - | n/a | the ward detail document, opaque to hydration-recipes: JSON |
| 42 | mcp/src/contracts/file-metadata/file-metadata-contract.ts:33 | metadata | json | z.json() | - | n/a | front-matter style file metadata: JSON |
| 43 | mcp/src/contracts/json-rpc-request/json-rpc-request-contract.ts:14 | params | json | z.json() | - | n/a | JSON-RPC params are JSON by the spec |
| 44 | mcp/src/contracts/json-rpc-response/json-rpc-response-contract.ts:13 | data | json | z.json() | - | n/a | JSON-RPC error data is JSON by the spec |
| 45 | mcp/src/contracts/json-rpc-response/json-rpc-response-contract.ts:19 | result | json | z.json() | - | n/a | JSON-RPC result is JSON by the spec |
| 46 | mcp/src/contracts/quest-work-input/quest-work-input-contract.ts:26 | plan | own | workPlanFieldsContract (minus writtenBy, writtenAt) | orchestrator/src/contracts/work-plan-fields/work-plan-fields-contract.ts | exists | the field's own description says it is the work plan without the stamped fields; mcp already depends on orchestrator |
| 47 | mcp/src/contracts/quest-work-input/quest-work-input-contract.ts:63 | plan | own | workPlanFieldsContract (whole replacement plan) | orchestrator/src/contracts/work-plan-fields/work-plan-fields-contract.ts | exists | "the WHOLE replacement plan, in the same shape as the plan payload" |
| 48 | mcp/src/contracts/tool-call-params/tool-call-params-contract.ts:12 | args | json | z.json() | - | n/a | tool call arguments: JSON |
| 49 | mcp/src/contracts/tool-call-params/tool-call-params-contract.ts:13 | meta | json | z.json() | - | n/a | the request `_meta` object: JSON |
| 50 | mcp/src/contracts/tool-list-result/tool-list-result-contract.ts:12 | properties | json | z.json() | - | n/a | JSON Schema `properties`: JSON |
| 51 | mcp/src/contracts/tool-registration/tool-registration-contract.ts:28 | inputSchema | json | z.json() | - | n/a | a tool's input JSON Schema: JSON |
| 52 | orchestrator/src/contracts/ask-user-question-tool-input/ask-user-question-tool-input-contract.ts:17 | questions | own | askUserQuestionContract.shape.questions | shared/src/contracts/ask-user-question/ask-user-question-contract.ts | exists | the questions array of the AskUserQuestion tool input; the other union arm is the raw-JSON-string form and stays |
| 53 | orchestrator/src/contracts/captured-orchestration-emit/captured-orchestration-emit-contract.ts:23 | payload | json | z.json() | - | n/a | an orchestration event payload, sent over the socket: JSON |
| 54 | orchestrator/src/contracts/cleanup-answer/cleanup-answer-contract.ts:25 | reaped | json | z.json() | - | n/a | only `.length` is read (`cleanup-outcome-classify-transformer.ts:25`); orchestrator cannot import siegelense's reaped-instance contract (no dependency edge) |
| 55 | orchestrator/src/contracts/cleanup-answer/cleanup-answer-contract.ts:26 | portsReleased | json | z.json() | - | n/a | only `.length` is read; same reason as reaped |
| 56 | orchestrator/src/contracts/inflated-task-notification-content/inflated-task-notification-content-contract.ts:18 | taskNotification | json | z.json() | - | n/a | the parsed XML of a task notification (fast-xml-parser output): JSON |
| 57 | orchestrator/src/contracts/minted-work-item/minted-work-item-contract.ts:44 | payload | json | z.json() | - | n/a | a piece's brief, one shape per role (`workPlanPayload*` contracts): JSON at the work-item seam |
| 58 | orchestrator/src/contracts/normalized-stream-line/normalized-stream-line-contract.ts:25 | input | json | z.json() | - | n/a | a tool_use input in a stream line: JSON |
| 59 | orchestrator/src/contracts/normalized-stream-line/normalized-stream-line-contract.ts:27 | content | own | z.union([string, array of normalizedStreamLineContentItemContract]) | orchestrator/src/contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract.ts | exists | a tool_result's content is a string or a list of content items; the item contract is the same file family (self-reference through a getter) |
| 60 | orchestrator/src/contracts/normalized-stream-line/normalized-stream-line-contract.ts:40 | content | own | z.union([string, array of normalizedStreamLineContentItemContract]) | orchestrator/src/contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract.ts | exists | a message's content is a string or a list of content items |
| 61 | orchestrator/src/contracts/normalized-stream-line/normalized-stream-line-contract.ts:41 | usage | own | usageLineShapeContract.shape.message.shape.usage | orchestrator/src/contracts/usage-line-shape/usage-line-shape-contract.ts | exists | the same usage object, already spelled out there |
| 62 | orchestrator/src/contracts/normalized-stream-line/normalized-stream-line-contract.ts:82 | agentId | own | agentContract.shape.id (today agentIdContract) | shared/src/contracts/agent/agent-contract.ts | create | the field holds an agent id; item 2.4 gives AgentId its owner |
| 63 | orchestrator/src/contracts/normalized-stream-line/normalized-stream-line-contract.ts:88 | toolUseResult | json | z.json() | - | n/a | an array of tool_result blocks; the object arm beside it is the typed one |
| 64 | orchestrator/src/contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract.ts:22 | input | json | z.json() | - | n/a | a tool_use input in a stream line: JSON (the same field as the row for normalized-stream-line-contract.ts:25; the two files duplicate a shape, a B11 finding) |
| 65 | orchestrator/src/contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract.ts:26 | content | own | z.union([string, array of normalizedStreamLineContentItemContract]) | orchestrator/src/contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract.ts | exists | same field as normalized-stream-line-contract.ts:27 |
| 66 | orchestrator/src/contracts/orchestration-event-envelope/orchestration-event-envelope-contract.ts:19 | payload | json | z.json() | - | n/a | an orchestration event payload: JSON |
| 67 | orchestrator/src/contracts/quest-work-view/quest-work-view-contract.ts:124 | payload | json | z.json() | - | n/a | a piece's brief: JSON at the work-item seam |
| 68 | orchestrator/src/contracts/work-plan-piece/work-plan-piece-contract.ts:89 | payload | json | z.json() | - | n/a | a piece's brief: JSON at the work-item seam |
| 69 | server/src/contracts/dev-log-event-payload/dev-log-event-payload-contract.ts:29 | questions | own | askUserQuestionContract.shape.questions | shared/src/contracts/ask-user-question/ask-user-question-contract.ts | exists | the dev log formats the questions it is handed |
| 70 | server/src/contracts/dev-log-event-payload/dev-log-event-payload-contract.ts:30 | entries | own | z.array(chatEntryContract) | shared/src/contracts/chat-entry/chat-entry-contract.ts | exists | the chat entries a payload carries |
| 71 | server/src/contracts/quest-clarify-body/quest-clarify-body-contract.ts:12 | answers | own | clarificationAnswerContract (`{header, label}`) | orchestrator/src/contracts/clarification-answer/clarification-answer-contract.ts | create | the answers are `{ header: string; label: string }[]` typed ad hoc in clarify-answer-flow.ts:25 and the responder; B14 makes it a contract; server depends on orchestrator |
| 72 | server/src/contracts/quest-clarify-body/quest-clarify-body-contract.ts:13 | questions | own | z.array(clarificationQuestionContract) | orchestrator/src/contracts/clarification-question/clarification-question-contract.ts | exists | the questions the clarify body carries |
| 73 | server/src/contracts/responder-result/responder-result-contract.ts:13 | data | own | one `data` contract per responder, generated from what the responder returns (SD7) | server/src/contracts/<responder>-data/... (create, one per responder; 40 responder files, 171 parses) | create | open decision 5; an error body is `{ error: string }`, a success body is the responder's own return type |
| 74 | server/src/contracts/ws-event-data/ws-event-data-contract.ts:12 | data | json | z.json() | - | n/a | a socket frame body, parsed from JSON |
| 75 | session-forensics/src/contracts/transcript-record/transcript-record-contract.ts:31 | usage | own | transcriptRecordUsageContract (numeric token counts) | session-forensics/src/contracts/transcript-record-usage/transcript-record-usage-contract.ts | create | the usage object is numbers by name (`input_tokens`...); session-forensics cannot import orchestrator's `usageLineShapeContract`; the record key brand goes |
| 76 | session-forensics/src/contracts/transcript-record/transcript-record-contract.ts:49 | toolUseResult | json | z.json() | - | n/a | a tool_result payload, one shape per tool: JSON |
| 77 | session-forensics/src/contracts/transcript-record-content-block/transcript-record-content-block-contract.ts:21 | input | json | z.json() | - | n/a | a tool_use input: JSON |
| 78 | shared/src/contracts/extracted-metadata/extracted-metadata-contract.ts:13 | metadata | json | z.json() | - | n/a | extracted metadata by key: JSON |
| 79 | shared/src/contracts/item-with-id/item-with-id-contract.ts:13 | id | own | z.string().min(1) branded ItemWithIdId | - | inline | the id of any quest sub-item is a string; the guard compares ids only |
| 80 | shared/src/contracts/normalized-line/normalized-line-contract.ts:11 | normalizedLineContract | json | z.json() | - | n/a | a parsed Claude JSONL line; the standalone brand goes with B2, and the downstream parameters already take `unknown` |
| 81 | shared/src/contracts/package-json/package-json-contract.ts:23 | exports | json | z.json() | - | n/a | a package.json `exports` map: nested conditions, JSON |
| 82 | shared/src/contracts/tool-use-block-param/tool-use-block-param-contract.ts:15 | input | json | z.json() | - | n/a | a tool_use block input: JSON |
| 83 | shared/src/contracts/user-tool-result-stream-line/user-tool-result-stream-line-contract.ts:34 | toolUseResult | json | z.json() | - | n/a | an array of tool_result blocks: JSON |
| 84 | shared/src/contracts/ward-queue-response/ward-queue-response-contract.ts:18 | wardResultJson | json | z.json() | - | n/a | the ward result file as the server read it, opaque to shared; ward's own `wardResultContract` is not importable from shared (moving it there is a separate B11 move) |
| 85 | shared/src/contracts/work-item/work-item-contract.ts:110 | payload | json | z.json() | - | n/a | a piece's brief: JSON at the work-item seam |
| 86 | shared/src/contracts/ws-message/ws-message-contract.ts:15 | payload | json | z.json() | - | n/a | a socket message payload: JSON |
| 87 | siegelense/src/contracts/seed-result/seed-result-contract.ts:22 | seedResultContract | json | z.json() | - | n/a | a seeded row's nested values: JSON |
| 88 | siegelense/src/contracts/step/step-contract.ts:205 | params | json | z.json() | - | n/a | recipe step inputs, keyed by input name: JSON |
| 89 | siegelense/src/contracts/step/step-contract.ts:266 | body | json | z.json() | - | n/a | an HTTP request body: JSON |
| 90 | testing/src/contracts/package-json/package-json-contract.ts:21 | eslintConfig | json | z.json() | - | n/a | package.json `eslintConfig`: JSON |
| 91 | testing/src/contracts/package-json/package-json-contract.ts:22 | jest | json | z.json() | - | n/a | package.json `jest` config: JSON |
| 92 | testing/src/contracts/staged-call/staged-call-contract.ts:15 | args | exception | z.array(z.unknown()) | testing/src/contracts/staged-call/staged-call-contract.ts | exists | the one recorded exception: arguments a test staged for a mock call, any type by nature (functions, class instances), never JSON |
| 93 | testing/src/contracts/testbed-config/testbed-config-contract.ts:17 | wardCommands | json | z.json() | - | n/a | a test bed's ward commands by name: JSON |
| 94 | testing/src/contracts/typescript-node-factory/typescript-node-factory-contract.ts:11 | typescriptNodeFactoryContract | gateway | #GatewayTypescriptNodeFactory (typescriptNodeFactorySchema) | packages/@gateway/npm/src/typescript/typescript-node-factory/typescript-node-factory-schema.ts | create | the TypeScript compiler's own node factory; the standalone brand goes with B2/B05 |
| 95 | testing/src/contracts/typescript-program/typescript-program-contract.ts:11 | typescriptProgramContract | gateway | #GatewayTypescriptProgram (typescriptProgramSchema) | packages/@gateway/npm/src/typescript/program/typescript-program-schema.ts | create | the TypeScript compiler's own Program; `typescript/program/` already exists as a gateway subpath |
| 96 | testing/src/contracts/typescript-statement/typescript-statement-contract.ts:11 | typescriptStatementContract | gateway | #GatewayTypescriptStatement (typescriptStatementSchema) | packages/@gateway/npm/src/typescript/typescript-statement/typescript-statement-schema.ts | create | the TypeScript compiler's own Statement |
| 97 | testing/src/contracts/workspace-package-json/workspace-package-json-contract.ts:68 | workspaces | json | z.json() | - | n/a | the object form of `workspaces`: JSON |
| 98 | ward/src/contracts/package-json/package-json-contract.ts:15 | scripts | own | z.string() branded PackageJsonScriptsValue | ward/src/contracts/package-json/package-json-contract.ts | inline | a script value is a command string |
| 99 | ward/src/contracts/package-json-raw/package-json-raw-contract.ts:15 | packageJsonRawContract | json | z.json() | - | n/a | a whole package.json passed through by key: JSON |
| 100 | web/src/contracts/chat-output-payload/chat-output-payload-contract.ts:27 | entries | own | z.array(chatEntryContract) | shared/src/contracts/chat-entry/chat-entry-contract.ts | exists | `entries` are chat entries; web depends on shared |
| 101 | web/src/contracts/chat-output-payload/chat-output-payload-contract.ts:32 | slotIndex | own | z.number().int().nonnegative() branded ChatOutputPayloadSlotIndex | - | inline | a slot index is a small non-negative integer (server `devLogEventPayload.slotIndex` already says so) |
| 102 | web/src/contracts/clarification-request-payload/clarification-request-payload-contract.ts:15 | questions | own | z.array(clarificationQuestionContract) | orchestrator/src/contracts/clarification-question/clarification-question-contract.ts | exists | web does not depend on orchestrator, so the contract moves to shared (B11-style move) or the field goes to `askUserQuestionContract.shape.questions` if the payload really carries the AskUserQuestion shape: decide when the first site is read |
| 103 | web/src/contracts/parsed-tool-input/parsed-tool-input-contract.ts:13 | parsedToolInputContract | json | z.json() | - | n/a | a tool_use input, parsed from JSON |
| 104 | web/src/contracts/parsed-tool-result/parsed-tool-result-contract.ts:16 | parsedToolResultContract | json | z.json() | - | n/a | a tool_result, parsed from JSON |
| 105 | web/src/contracts/quest-modified-payload/quest-modified-payload-contract.ts:15 | quest | own | questContract | shared/src/contracts/quest/quest-contract.ts | exists | the payload carries the whole quest |
| 106 | web/src/contracts/upload-progress-post/upload-progress-post-contract.ts:26 | body | json | z.json() | - | n/a | the JSON body web POSTs (`quest-new-broker.ts:46` builds an object literal) |
| 107 | web/src/contracts/ward-detail-response/ward-detail-response-contract.ts:14 | detail | json | z.json() | - | n/a | the ward detail document, opaque to web: JSON |

Reading the columns: `decision` is `own` (our data's contract), `json` (`z.json()`), `gateway` (a `#Gateway<Type>` schema) or `exception`. For `own` rows with status `inline`, the target is a field-level schema with a derived brand and no file. The eslint-plugin rows (#4 to #19) and the hooks linter-config, partial-eslint-config and raw-eslint-config rows depend on B04: if it deletes `astNodeContract`, `tsestreeContract` and the eslint context contracts in favour of the real TSESTree types, those rows disappear instead of being converted.

### Where the code contradicts the plan

1. **Counts.** The EPIC and the census CSVs say 349 standalone brands, 196 field-class, 153 never-a-field and 124 `z.unknown()` sites; the tree now has 329, 188, 141 and 107. Numbers used above are the re-measured ones.
2. **W1 names `cliArg` as never a field.** It is `scanConfig.paths` in `packages/ward/src/contracts/scan-config/scan-config-contract.ts:18`; it is a value brand (2.6), not a W1 candidate. The other W1 big ones (`baseName`, `relativePath`, `fileContent`, eslint-plugin `filePath`, `globPattern`) are confirmed never-a-field.
3. **W3 says the brand text stays the same. It does not for 5 owned ids** (FlowRecipeName, ObservableId, PieceId, QuestWorkItemId, UnitId): B3 derives owner + `Id`, so `QuestWorkItemId` becomes `WorkItemId` (which orchestrator already uses as its own standalone text), `FlowRecipeName` becomes `FlowRecipeId`, `ObservableId` becomes `FlowObservableId`, `PieceId` becomes `WorkPlanPieceId`, `UnitId` merges into `QaChecklistItemId`. Values still flow only if the types are re-derived in one pass; a codemod that assumes the text is unchanged will leave two texts side by side.
4. **SD12 / item 3 of 4.0: "51 pass a `QuestId` where `QuestFolder` is expected".** 39 of the 51 are the key `questFolder` and all trace to web harnesses typing `questFolder: QuestId` and casting with `as unknown as QuestId` (2.5); the other 12 are key `value` (guild ids and agent-id literals). R8's `questFolder` -> `Quest['folder']` mapping is right; the harness types are wrong.
5. **Open decision 4 puts the InstanceId owner at the fleet registry entry and says B4 makes `instanceId` reuse `instanceContract.shape.id`.** There is no `instanceContract` anywhere, and `registryEntryContract` is in siegelense while shared (`flowRecipe`, `questNote`) and orchestrator read the same id and cannot import siegelense. The owner has to be in shared (2.4). The same holds for RunId.
6. **Open decision 4 says a ward run has its saved result and that result owns the id.** `wardResultContract` (ward) persists it under `runId`, not `id`; shared's `wardResultContract` has a different `id` (`WardResultId`, uuid) plus an optional `runId`. Renaming would break stored files, so the decision above keeps the key (owner-field).
7. **ProcessId.** The decision says it goes plain unless one object owns both id kinds. Beyond the template-built ids, siegelense puts it on OS process ids (`registryEntry.pid`, `instanceHeartbeat.pid`, `bootLock.heldByPid`) where orchestrator has `processPidContract`: one brand, three meanings.
8. **B2 says only the owner declares the brand; the tree has both.** `questContract.id` and `questListItem.id` already declare `QuestId` inline while `questIdContract` also exists, and 176 inline `.brand<'<standalone text>'>()` sites share a standalone brand's text across contract files (2.3 lists the id ones; `IsoTimestamp` 39, `ErrorMessage` 12, `ToolName` 10, `SessionId` 12, `QuestId` 12 are the largest).
9. **Cross-package owners.** `PieceId`'s owner (orchestrator `workPlanPieceContract`) is read by two shared contracts, and `UnitId` has the same regex as `QaChecklistItemId` but no owner of its own. Both are marked OPEN in 2.2 with a default. `testing` does not depend on `shared`, so `testbedConfig.questFolder` cannot reuse `Quest['folder']`.
10. **R8 will miss bare names.** `instanceId` against owner `SiegeInstance`, `runId` against `SiegeRun`, `folder` on `questListItem` and `attachmentId` against `ComposerAttachment` do not end with owner + key; those retypes are by hand or by the owner-field match B13 needs.
11. **B06 says no `#Gateway<Type>` schema exists.** Three do: `packages/@gateway/node/src/child_process/child-process/child-process-schema.ts`, `fs/walk-files-sync/walked-file-schema.ts` and `buffer/buffer-schema.ts`. None of them covers a `z.unknown()` site; every `gateway` row in item 3 is a schema to create.
12. **Decision 5 (`z.unknown()` refused in contracts) is not yet true.** `responderResultContract.data` is still `z.unknown()` with 171 production parses in 40 files under `packages/server` (`packages/server/src/contracts/responder-result/responder-result-contract.ts:13`).

