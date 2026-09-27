# B15: brand the repo — the largest item

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

