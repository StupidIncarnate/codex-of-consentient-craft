# B13: `enforce-owner-field-reuse` and `ban-join-id-beside-child` — landed OFF

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), chunks R4 and R8; W3 applies the autofix. That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), B4 "a field or parameter that holds another object's field uses that field's type", lines 554-706 (five-checks table at 671-677, name-resolution algorithm at 688-706); rows 2255-2256 |
| Needs | [B10](b10-owner-index.md) |
| Unblocks | [B15](b15-brand-migration.md), and Z01–Z07 |
| Packages touched | `eslint-plugin` (both rules); `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts` (tagging one of the two) |
| Checks to run | `lint,typecheck,unit` |
| Split | One agent for `enforce-owner-field-reuse` (ward only, needs the index); a second for `ban-join-id-beside-child` (pre-edit, syntax only) |
| Runs alone | No — runs with [B12](b12-require-object-contract-brands.md), [B14](b14-type-alias-and-adhoc-type-rules.md) |

## Why

Production code has 30 parameters named `questId` typed as a plain `string` today, so a model can pass
`'op-id-1'` and nothing stops it. The name already says what the value is — the fix is to type it as
`Quest['id']` (or, inside a contract, to reuse `questContract.shape.id`) rather than inventing a new
brand for it. This is the rule that makes that automatic: a key or parameter named `<owner><Key>`, or
ending in it, must reuse that owner's field when the owner contract exists.

```
// before — referring contracts import a standalone brand; brokers take a plain string
questId: questIdContract,
({ questId }: { questId: string })                                // plain, so any string is accepted

// after — contracts reuse the owner's schema
questId: questContract.shape.id,
({ questId }: { questId: Quest['id'] })
```

```
// flagged in a contract file — questContract exists and has an `id` key
someContract = z.object({ questId: z.string().min(1) }).brand<'Some'>()               // must be questContract.shape.id
someContract = z.object({ questId: z.string().brand<'SomeQuestId'>() }).brand<'Some'>()   // its own brand: still must reuse
someContract = z.object({ questId: z.string().brand<'QuestId'>() }).brand<'Some'>()   // redeclares another owner's brand

// flagged in any file: brokers, transformers, responders, widgets and the rest
({ questId }: { questId: string })                                    // must be Quest['id']
({ parentQuestId }: { parentQuestId: string })                        // ends with QuestId

// left alone
someContract = z.object({ questId: questContract.shape.id }).brand<'Some'>()   // contract file
({ questId }: { questId: Quest['id'] })                                        // any file
({ label }: { label: string })                                                 // no Label owner exists
```

B4 wins over B1 and B3 ([B12](b12-require-object-contract-brands.md)): a field this rule catches is a
reuse, so it declares no brand of its own — the two rules share one index specifically so they never
disagree about a key.

## How the rule decides a name (copied in full — every downstream file needs this exact algorithm)

1. **Build the index.** Read every `*-contract.ts` in the file's own package and in the workspace
   packages it depends on ([B10](b10-owner-index.md) already does this read; this rule consumes it, does
   not rebuild it). Record each object contract's owner (`questContract` gives `Quest`) and each key that
   declares its own brand. A key that reuses another owner's field records nothing, so
   `someContract.questId` does not create a `someQuestId` name.
2. **Turn each owner and key into a name.** `Quest` and `id` give `questId`. `WorkItem` and `id` give
   `workItemId`.
3. **Match names on camelCase word boundaries.** `questId` matches exactly. `parentQuestId` splits into
   *parent*, *quest*, *id*, and ends in *quest*, *id*, so it matches. `requestId` splits into *request*,
   *id*, so it does NOT match `QuestId`, although its raw text ends in "questId". **When two owners
   match, the longest owner name wins** (open decision 6, settled).
4. **Check the declared type.** A match must be typed `Quest['id']`. Anything else is reported, and the
   autofix writes the indexed type and its import.

Only owners the file could import count: its own package and its workspace dependencies. An owner in a
package the file cannot reach does not claim its names.

## Five checks (the full table)

| Check | Where | Message | Autofix |
|---|---|---|---|
| A key named `<owner><Key>`, or ending in it, is `ownerContract.shape.key` | Every `z.object(...)` in `contracts/` | `{{key}} holds {{owner}}'s {{field}}. Use {{ownerContract}}.shape.{{field}}.` | Yes: replace the value with the reuse, and add the import |
| A parameter or destructured property named `<owner><Key>`, or ending in it, is typed `Owner['key']` | Every function, in every folder | `{{name}} holds {{owner}}'s {{field}}. Type it {{Owner}}['{{field}}'].` | Yes: replace the type, and add the type import |
| A nested object written inline is not a copy of an existing object contract | Every nested `z.object(...)` in `contracts/`. It is a copy when it has the same keys as an object contract in the index, and each key has the same schema once brand texts are ignored | `{{key}} copies {{ownerContract}}. Use {{ownerContract}}, or {{ownerContract}}.pick({ … }) for part of it.` | Yes: replace the object with the contract, and add the import |
| An inline `z.enum` is not a copy of another enum's values | Every `z.enum(...)` in `contracts/`, inline or standalone. It is a copy when its value set equals an enum contract in the index, or an inline `z.enum` in another contract | `{{key}} copies the values of {{enumContract}}. Import it.` When the other copy is inline too: `{{key}} has the same values as {{otherKey}} in {{otherContract}}. Move them into {{derivedName}} and import it in both.` | Yes. When an enum contract exists, replace with it. When the other copy is inline, create the enum contract (name derived: owner plus key of the copy already in the repo, e.g. `role` in `workItemContract` gives `workItemRoleContract`) and import it in both — its package follows [B11](b11-unique-contract-names.md)'s C8 rule. No autofix when C8 finds no package every user depends on — the message says to move the enum into a package every user depends on, or into a new package. |
| An object that always holds a child does not also hold the child's id | Every `z.object(...)` in `contracts/`. Flagged when one key holds another owner's contract whole, is not optional/nullable/defaulted, and another key in the same object is that owner's id (a key this rule matches to `<owner>Id`, or a reuse of `ownerContract.shape.id`) | `{{idKey}} copies {{childKey}}.id, and nothing checks that they match. Remove {{idKey}} and read {{childKey}}.id.` | **No.** Removing the key breaks every caller that reads it, so the model changes those callers by hand. |

The first check also accepts the reuse written as a getter whose body returns `ownerContract.shape.key`,
typed `z.core.$ZodType<… & z.$brand<'{{text}}'>>` with the owner field's text — this is for a reuse
across an import cycle (see below). Its autofix writes that getter, not the plain `.shape` access, only
when the file the owner contract lives in already imports this one, directly or through other contracts.

The third check needs the index to record each object contract's **schema**, not only its keys —
[B10](b10-owner-index.md) already builds this. It catches a whole copy only; a subset of keys (`{ id,
name }`) is too common to flag and is left alone.

`require-object-contract-brands` (in [B12](b12-require-object-contract-brands.md)) reads the same index
and leaves alone every key this rule claims — its autofix never brands one: branding `questId` as
`'SomeQuestId'` is exactly what this rule refuses.

## The fifth check is its own rule: `ban-join-id-beside-child`

This one needs no index — the child's contract name comes from its import, and the id key sits next to
it in the same object literal. So it is **pre-edit eligible**, split from `enforce-owner-field-reuse`
(which needs the index and is **ward only**).

## Ins and outs that matter for the migration this rule will drive

- **Short names need a floor.** An owner called `Item` with key `id` would claim every name ending in
  `ItemId`, including `workItemId` — the longest-owner-name-wins rule (step 3 above) is exactly this
  floor.
- **Inside its own contract, an owner's id comes from its local const**, not `.shape.id` (which cannot be
  read while the contract is being declared) — the autofix must write the local id const reference, not
  a `.shape` access, when the match is inside the owner's own contract.
- **A reuse across an import cycle goes through an annotated getter.** `quest-contract.ts` imports
  `work-item-contract.ts`; if a work item needs `questId`, a plain `questId: questContract.shape.id`
  fails twice — the compiler reports a circular type, and the module throws `Cannot access
  'questContract' before initialization`. The fix:
  ```typescript
  // work-item-contract.ts
  import { questContract } from '../quest/quest-contract';
  export const workItemContract = z
    .object({
      id: workItemId,
      get questId(): z.core.$ZodType<string & z.$brand<'QuestId'>> {
        return questContract.shape.id;
      },
    })
    .brand<'WorkItem'>();
  ```
  Checked 2026-09-26 (`tmp/zod-recursive/cycle/`): compiles, `workItem.questId` is a `Quest['id']`, and a
  wrong annotation text fails to compile. The getter is for a cycle only — where no cycle exists, the
  field is a plain `questContract.shape.id`.
- **Several fields of the same kind share one brand; names guard against swapping roles**, enforced
  together with `enforce-object-destructuring-params` (existing rule, unchanged) which makes every
  argument named at the call, so a positional swap cannot happen. This rule does not add a "role brand"
  on top of the kind brand — deciding which fields deserve one is exactly the judgement call this whole
  epic exists to remove.
- **A role name that does not say its kind escapes this rule, and B1 plus B8 catch it instead.**
  `WorkItem.mintedBy`, `insertedBy`, `dependsOn`, and `heldBy` (an `InstanceId`) are real examples this
  rule cannot catch by name alone. [B12](b12-require-object-contract-brands.md)'s B1 refuses
  `mintedBy: z.string()` for having no brand; if it gets its own brand, the compiler refuses
  `mintedBy: workItem.id` (a `WorkItemId` is not a `WorkItemMintedBy`); the only way around that is a
  re-brand via parse, which [B16](b16-real-owner-and-id-rebrand.md)'s B8 refuses. So the only fix left is
  reusing the id schema by hand — this rule does not catch these, note it and move on.

## Current state

Confirmed this session (2026-09-26): no rule folder named `enforce-owner-field-reuse` or
`ban-join-id-beside-child` exists in `packages/eslint-plugin/src/brokers/rule/`. This is new work.

This rule **lands switched OFF**, same reasoning as [B12](b12-require-object-contract-brands.md): it
would flag the 30-plus plain `questId: string` parameters (and however many more of similar shape exist
by the time this item runs) across the whole repo before [B15](b15-brand-migration.md) has migrated them.
[B15](b15-brand-migration.md) switches this rule on, alongside [B12](b12-require-object-contract-brands.md)'s
two rules, at the end of its migration.

## Work

1. **Build `enforce-owner-field-reuse`** covering the first four rows of the five-checks table (the
   fifth is its own rule, step 2). Read [B10](b10-owner-index.md)'s index directly — do not rebuild the
   owner/key scan.
2. **Build `ban-join-id-beside-child`** covering the fifth row, pre-edit eligible, no index needed.
3. **Implement the name-decision algorithm exactly as specified** (see "How the rule decides a name"
   above) — this is shared with [B12](b12-require-object-contract-brands.md)'s indexed rule; if that item
   landed first, read its actual implementation and reuse the same matching code rather than writing a
   second, possibly-diverging copy.
4. **Build both autofixes**, per the table (four of five checks have one; the fifth does not, by design).
5. **Run both rules as a scan over the whole repo before switching either on**, hand-checking a sample.
6. **Land both switched OFF**, the same mechanism [B12](b12-require-object-contract-brands.md) used —
   coordinate with that item's agent (or read its landed code, if it ran first) so both items express
   "off" the same way, rather than inventing two different off-switch mechanisms.
7. **Tag `ban-join-id-beside-child` `'pre-edit'`.** **Do not tag `enforce-owner-field-reuse`** — it stays
   ward-only, since it needs the type checker is not quite right (it needs the index, which reads other
   files — see BR "Where each rule runs": "B4 and the indexed brand checks fail the first test only" —
   confirm this stays ward-only per open decision 8, which BR leaves explicitly open; do not resolve open
   decision 8 as part of this item unless you measure the cost and report it).

## Lint rules this item adds or changes

| Rule | Pre-edit? | Autofix? | Landed |
|---|---|---|---|
| `enforce-owner-field-reuse` | **No** — needs the repo-wide index | Yes, for 4 of 5 checks | OFF — [B15](b15-brand-migration.md) switches on |
| `ban-join-id-beside-child` | **Yes** — syntax only | No (by design — breaking callers needs a human) | OFF — [B15](b15-brand-migration.md) switches on |

## Teaching text this item changes

From BR "Architecture docs: `get-architecture` and the session snippets":

- `shared/src/statics/session-snippet/session-snippet-statics.ts:105` (row 2332): "No `as unknown as` on
  a brand mismatch — re-parse it: `dagNodeIdContract.parse(stepId)`" → "No `as unknown as` on a brand
  mismatch. A field that holds another object's id reuses that id's schema. Never parse one id into
  another brand." (this row also touches [B16](b16-real-owner-and-id-rebrand.md)'s B8)
- `shared/src/brokers/architecture/overview/architecture-overview-broker.ts:279` (row 2333):
  `` const dagNodeId = dagNodeIdContract.parse(stepId);  // ✅ re-brands through validation `` → Removed.
- `architecture-overview-broker.ts:274` (row 2206): "take it as `User['id']`" → "Enforced by
  `enforce-owner-field-reuse`."

These are finished in [Z01](../z01-gateway-folder-type-doc.md)–[Z02](../z02-architecture-and-snippet-text.md)
once every item is done; this item should confirm the rule name and behavior are final in its report so
that phase writes accurate text.

## Done when

- [ ] `enforce-owner-field-reuse` covers all four non-fifth-row checks, with autofixes, reads
      [B10](b10-owner-index.md)'s index, is NOT tagged `'pre-edit'`, and is landed switched OFF.
- [ ] `ban-join-id-beside-child` covers the fifth row, has no autofix, is tagged `'pre-edit'`, and is
      landed switched OFF.
- [ ] The name-decision algorithm (longest-owner-wins, camelCase word-boundary matching) matches
      [B12](b12-require-object-contract-brands.md)'s indexed rule exactly — same code, not a parallel
      reimplementation.
- [ ] Both rules were scanned over the whole repo and hand-checked before landing off.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- Do not switch either rule on — [B15](b15-brand-migration.md) does that.
- The fifth check's autofix is deliberately absent — do not add one; removing an id key breaks every
  reader of that key, which needs a human to fix each caller.
- If [B12](b12-require-object-contract-brands.md) already landed its indexed rule's name-matching code by
  the time this item starts, reuse it rather than reimplementing — a second, slightly different matcher
  is exactly the drift this shared-index design exists to prevent.

## Concessions made while executing

