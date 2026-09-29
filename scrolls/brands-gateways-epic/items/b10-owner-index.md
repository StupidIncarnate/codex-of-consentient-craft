# B10: the owner index — object contracts, their owner names and their declared keys

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), chunk R6. That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), B4 "How the rule decides a name", lines 688-706; C8's shared index, line 1526; open decisions 6 and 8, lines 2418-2425 |
| Needs | [B02](b02-contract-index-and-unused-contracts.md) |
| Unblocks | [B11](b11-unique-contract-names.md), [B12](b12-require-object-contract-brands.md), [B13](b13-owner-field-reuse.md), and Z01–Z07 |
| Packages touched | Wherever B02's parse index lives (see that item's Work step 1) — this item extends the same code, not a new location |
| Checks to run | `lint,typecheck,unit` on the index's own package |
| Split | One agent |
| Runs alone | No — runs with [B14](b14-type-alias-and-adhoc-type-rules.md), [B17](b17-predicates-and-json-parse.md), [B18](b18-returns-say-what-happened.md) |

## Why

Several rules downstream of this item all need the same underlying fact: given a name like `questId`, is
there an object contract called `Quest` with a key called `id`, and if so, what does `Quest.shape.id`
look like? [B11](b11-unique-contract-names.md) (C8, unique names), [B12](b12-require-object-contract-brands.md)
(B1/B3, brand text derivation) and [B13](b13-owner-field-reuse.md) (B4, owner field reuse) all read this
same index. Building it once, here, and having each of those three items extend or read it, is cheaper
than three items each building their own partial version and disagreeing about what counts as an owner.

BR is explicit that B4 and C8 "need the same kind of index, a record of declared contract names and
keys, so they can share one," and that C1's index (built in [B02](b02-contract-index-and-unused-contracts.md))
is a *different* index — of parse calls, not of owners and keys — that B07 (layers) reuses separately.
This item is the owners-and-keys index, extending B02's file-scanning machinery rather than rebuilding it.

## Current state

No index of contract owners and keys exists in this repo today — confirmed by the same scan that found
no `require-contract-parse`-named rule folder in `packages/eslint-plugin/src/brokers/rule/` (see
`b02-contract-index-and-unused-contracts.md`'s Current state). This is new capability being built across
two items ([B02](b02-contract-index-and-unused-contracts.md) for parse sites, this item for owners and
keys) that should end up as one shared reader, not two.

Whatever B02's agent chose as the index's home (a broker or transformer in `eslint-plugin` or in
`@dungeonmaster/shared` — see that item's step 1) is where this item's extension goes. **Read B02's
actual landed code before starting** — do not assume its recommendation (`@dungeonmaster/shared`) is
what was actually built; the item file explicitly allows the executing agent to change it with a reason
in DECISIONS.

## Work

1. **Read what B02 built.** Confirm the index's location, its data shape, and how it is invoked from a
   lint rule.
2. **Extend it to record, for every object contract in the repo's workspace packages:**
   - The owner name: the const name minus its `Contract` suffix, in PascalCase (`questContract` gives
     `Quest`).
   - Every key that declares its own brand at the top level of that object (`id`, `title`, …). A key that
     reuses another owner's field (see [B13](b13-owner-field-reuse.md)) records nothing under its own
     name, so `someContract.questId` does not create a `someQuestId` name of its own.
   - Each object contract's full schema (not only its keys) — this is what B11's third check (a nested
     object that copies another contract's shape) needs, and what B4's third check (an inline copy of an
     existing object) needs too. BR is explicit: "The third check needs the index to record each object
     contract's schema, not only its keys."
3. **Read every `*-contract.ts` in the file's own package and in the workspace packages it depends on**
   — this is the scope rule every downstream reader (B11, B12, B13) must respect: only an owner the file
   could actually import counts as claiming its names. An owner in a package the file cannot reach does
   not claim its names. Build the index with this scoping built in (per-file "reachable owners" rather
   than one global flat list), since a rule computing this per-invocation from a flat list is equivalent
   but slower — either is fine functionally; note which you built.
4. **Turn each owner and key into a name**, the algorithm every downstream rule reuses:
   1. `Quest` and `id` give `questId`. `WorkItem` and `id` give `workItemId`.
   2. **Match names on camelCase word boundaries.** `questId` matches exactly. `parentQuestId` splits
      into *parent*, *quest*, *id*, and ends in *quest*, *id*, so it matches. `requestId` splits into
      *request*, *id*, so it does not match `QuestId`, although its raw text ends in "questId".
   3. **When two owners match, the longest owner name wins** (open decision 6, settled): `workItemId`
      matches `WorkItem` before `Item`, and `itemId` matches `Item`. Build this as an explicit
      longest-match rule in the index's lookup, not as a side effect of iteration order.
   4. A match must be typed `Owner['key']` (checked downstream by B13's rule, not this item's — but the
      index must expose enough to make that check possible: the owner's exported type name and the key).
5. **Layer contracts are not owners.** A nested object moved into its own `*-layer-contract.ts` file
   (C7, built in [B07](b07-layers-and-statics-regex.md)) is treated like an inline nested object, not a
   standalone owner. The index must not record `ownerLayerContract` as an owner called `OwnerLayer` — it
   has no name of its own to give out. Confirm B07's layer-file convention is recognized by filename
   (`*-layer-contract.ts`) before recording an owner, so a layer never pollutes the owner list.
6. **Leave open decision 8 (whether this index can run pre-edit) as still open.** BR settles most
   pre-edit questions but explicitly leaves this one: `enforce-owner-field-reuse` and
   `require-object-contract-brands-indexed` (both in [B12](b12-require-object-contract-brands.md) and
   [B13](b13-owner-field-reuse.md)) *could* run pre-edit if `eslint.config.js` built the index when it
   loads, the way T6's package-name list already does — but that means reading every contract in the
   package and its dependencies on every edit, and its cost is not measured. **Do not attempt to make this
   pre-edit as part of this item.** Build it to run in ward only, and leave a note for
   [B12](b12-require-object-contract-brands.md)/[B13](b13-owner-field-reuse.md)'s agents that the
   pre-edit question is still open if either wants to measure it.
7. **Write a test that asserts the index's real output on a small, real slice of the repo's own
   contracts** — not a synthetic fixture that could pass while the real scan logic is broken. Read
   `get-testing-patterns` first for how a repo-wide-scan test is normally structured in this codebase.

## Lint rules this item adds or changes

None directly — this item builds shared machinery that [B11](b11-unique-contract-names.md),
[B12](b12-require-object-contract-brands.md) and [B13](b13-owner-field-reuse.md) turn into lint rules.
Do not build `enforce-owner-field-reuse`, `enforce-unique-contract-names`, or
`require-object-contract-brands-indexed` here — those are the other items' jobs, reading this index.

## Teaching text this item changes

None directly. This item is infrastructure; the teaching text it makes true is written by
[B11](b11-unique-contract-names.md)/[B12](b12-require-object-contract-brands.md)/[B13](b13-owner-field-reuse.md)
and finished in the Z phase.

## Done when

- [ ] The index records, per object contract: owner name, package, declared top-level keys, and the
      contract's full schema.
- [ ] The owner-and-key-to-name algorithm (steps 4.1-4.4 above) is implemented and covers the
      longest-match rule for overlapping owner names.
- [ ] The index respects per-file reachability: only a file's own package and its workspace dependencies'
      owners count as claiming names for that file.
- [ ] Layer contracts (`*-layer-contract.ts`) are excluded from the owner list.
- [ ] A test asserts the index's real output against a real slice of the repo's contracts, and fails when
      the scan logic is broken (prove it: break the scan, confirm the test goes red, fix it back).
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- Do not build a second, disagreeing index from scratch — read B02's actual landed code first, since its
  location may differ from its item file's recommendation.
- The longest-owner-name-wins rule (open decision 6) is easy to get backwards — write a test with two
  overlapping owners (`Item` and `WorkItem`, both with an `id` key) and confirm `workItemId` resolves to
  `WorkItem`, not `Item`.
- Leaving open decision 8 unresolved is correct for this item — do not spend time trying to make the
  index pre-edit-eligible; that measurement is explicitly out of scope here.

## Concessions made while executing

