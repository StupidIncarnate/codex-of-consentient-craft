# B14: no exported alias of a field's type; an object type leaving a function is a contract

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), B5 "no exported alias of a field's type", lines 708-722; B9 "an object type that can leave a function is a contract", lines 890-994; C2's alias refusal, lines 1096 and 1118-1119; rows 2229, 2257-2258 |
| Needs | [A19](../a19-adapters-folder-type-gone-caller-rules-on.md) |
| Unblocks | [B15](b15-brand-migration.md), and Z01–Z07 |
| Packages touched | Every package with a return type, module-level type alias, module-level variable type or module-level type argument built from an object literal — the whole repo; the source doc's own 2026-09-24 census (see Current state) put implementation-file hits in brokers (107), adapters (38, now gone post-Phase-2), responders (30), transformers (25), bindings (18), startup (11), state (11), flows (4) |
| Checks to run | `lint,typecheck,unit` per package split |
| Split | Operator splits the ~244 shape fixes per package, 2-4 files per agent; the rule-building work (`ban-type-aliases`, the `ban-adhoc-types` extension) is one agent, separate from the migration |
| Runs alone | No |

## Why

**B5.** `export type QuestId = Quest['id'];` creates no new check — it only brings back the vocabulary
of standalone brand names that B2 ([B12](b12-require-object-contract-brands.md)) removes. Models would
recreate `QuestId` in every package that needs it. The fix is to write the indexed type
(`Quest['id']`) directly where it is used, never alias it.

**B9.** `ban-adhoc-types` refuses an `interface` and an `as { … }` cast today, but misses a `type` alias
and a return type built from an object literal — exactly the side door models use to keep inventing
one-off shapes. An object shape that can leave a function is data another function receives, so it is a
contract, and [B12](b12-require-object-contract-brands.md)'s B1 brands it.

"Can leave a function" means: the return type of a function declared at module level, a type alias at
module level (exported or not), a variable's type at module level, or a type argument at module level.

```
// before — orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts:81
type CarveResult =
  | { ok: true; branchName: QuestBranchName }
  | { ok: false; error: ErrorMessage };
export const stepHandlerRiftcarverBroker = async (…): Promise<CarveResult> => { … };

// after — contracts/carve-result/carve-result-contract.ts
export const carveResultContract = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), branchName: questContract.shape.branchName }).brand<'CarveResult'>(),
  z.object({ ok: z.literal(false), error: z.string().brand<'CarveResultError'>() }).brand<'CarveResult'>(),
]);
export type CarveResult = z.infer<typeof carveResultContract>;
export const stepHandlerRiftcarverBroker = async (…): Promise<CarveResult> =>
  carveResultContract.parse({ ok: true, branchName });
```

```
// before — cli/src/transformers/kebab-case-variants/kebab-case-variants-transformer.ts:19
export const kebabCaseVariantsTransformer = ({ name }: { name: string }):
  { camel: Identifier; pascal: Identifier; testId: Identifier } => …;

// after — contracts/kebab-case-variants/kebab-case-variants-contract.ts
export const kebabCaseVariantsContract = z
  .object({
    camel: z.string().brand<'KebabCaseVariantsCamel'>(),
    pascal: z.string().brand<'KebabCaseVariantsPascal'>(),
    testId: z.string().brand<'KebabCaseVariantsTestId'>(),
  })
  .brand<'KebabCaseVariants'>();
export const kebabCaseVariantsTransformer = ({ name }: { name: string }): KebabCaseVariants =>
  kebabCaseVariantsContract.parse({ camel: …, pascal: …, testId: … });
```

```
// flagged — outside contracts/ and widgets/, in implementation and test files
type CarveResult = { ok: true } | { ok: false };                              // a module-level alias
export type WorktreeProvisionResult = { ok: true } | { ok: false; … };        // exported from a broker
(): { camel: string; pascal: string } => …                                    // a module-level function's return type
const cache: { entries: Entry[] } = { entries: [] };                          // a module-level variable's type
brokers/quest/cleanup/…-broker.ts:   (): Promise<{ removed: boolean }> => …   // one fact is better as Promise<boolean>
transformers/x/x-transformer.test.ts:   type LooseHandle = Record<string, unknown> & { operations: … };
interface Foo { … }                                                            // flagged today
value as { type: string }                                                      // flagged today

// left alone
({ questId, limit }: { questId: Quest['id']; limit: number }) => …            // a parameter's type: the repo's convention
(): CarveResult => …                                                           // a contract type
(): { stop: () => void; flush: () => Promise<void> } => …                     // every member is a function: a method set
const totals: { passed: number; failed: number } = { passed: 0, failed: 0 };  // inside a function body
items.reduce<{ seen: string[] }>(…, { seen: [] })                             // inside a function body
type Handle = ReturnType<typeof spawnDetached>;                               // no object literal in it
brokers/x/x-broker.proxy.ts:   (): { setupReturns: (…) => void; child: ChildProxy } => …   // proxies are exempt
widgets/card/card-widget.tsx:   interface CardProps { … }                      // widgets/ stays exempt
```

## Current state

Census as measured by the source doc, 2026-09-24 (`tmp/adhoc-scope2.cjs` — scratch, gitignored, likely
gone in this worktree; re-run an equivalent scan at the start of this item rather than trusting this
table blind):

| Where | Data shapes that become contracts | Method sets, left alone |
|---|---|---|
| Implementation files | 244: brokers 107, adapters 38, responders 30, transformers 25, bindings 18, startup 11, state 11, flows 4 | 35 |
| Tests | 3 | 2 |
| Proxies (exempt) | 224 | About 971 |

**This item runs after Phase 2 (A19)**, which deletes the `adapters/` folder type entirely — so the 38
"adapters" figure above is stale by construction; those shapes have either already become
brokers/transformers (per Phase 2's own migration) or are gone. Re-derive the real per-folder-type census
fresh; do not plan work against the 2026-09-24 numbers.

No rule folder named `ban-type-aliases` exists in `packages/eslint-plugin/src/brokers/rule/` (confirmed
this session). `ban-adhoc-types` exists and is confirmed present, and is the rule this item extends
rather than replaces.

## Work

1. **Re-census.** Walk the repo (via `discover` or a `python3` scan, since `grep`/`find` are blocked) for
   every module-level function return type, module-level type alias, module-level variable type, and
   module-level type argument that is, or contains, an object type literal where not every member is a
   function. Exclude `.proxy.ts` files (exempt by rule) and `widgets/`/`contracts/` folders (exempt by
   folder). Produce a fresh per-package, per-folder-type list for the operator to split into 2-4-file
   batches.
2. **Build `ban-type-aliases` (B5).** Refuses an exported `type X = Y['k']` (an alias of a field's
   type) anywhere, and an alias that gives a library type a second name (C2's refusal — e.g. `export type
   EslintContext = TSESLint.RuleContext<string, []>;`; this second half overlaps with
   [B04](b04-eslint-rules-on-real-tsestree.md)'s and [B05](b05-other-library-type-copies.md)'s work —
   coordinate so the rule is built once and both migrations rely on it). Syntax only — pre-edit.
3. **Extend `ban-adhoc-types` (B9).** Also refuses an object type literal, or a union/intersection
   containing one, in: a module-level function's return type, a module-level type alias, a module-level
   variable's type, or a module-level type argument — unless every member of the literal is a function
   (a "method set", left alone). Skips `.proxy.ts` files. The gateway's lint block omits the rule
   entirely (the gateway's own wrapper types, like `FsError` or `WalkedFile`, describe an outside
   package's structures, not our data, and the gateway imports none of our contracts — they stay plain
   TypeScript types). Message changes from "Define types in contracts/ and import them" to "Define our
   types in contracts/ and import them. A library's types are imported through the gateway." Syntax only
   — pre-edit, as today.
4. **Fix every flagged shape from the re-census**, per package, in batches of 2-4 files:
   - **A shape that stays inside one function is left alone** — a reduce accumulator or a local total
     never leaves the function, so it creates no vocabulary and needs no contract. Do not "fix" these;
     confirm the rule itself does not flag them (they are inside a function body, not module level).
   - **An object type whose every member is a function is a method set** (e.g. a timer wrapper's return
     handle) — zod cannot check a function, so it stays inline. Do not force these into contracts.
   - **A shape mixing data and functions is a contract for its data.** The data members are parsed, the
     functions are attached outside the parse — `contracts-constraints.md:132-133` already teaches this
     and `browser-session-contract.ts` already does it. A hook return value in `bindings/` is the common
     case (18 of the 244 in the 2026-09-24 census were in `bindings/`).
   - **Many of the 244 already have a matching contract.** Where a return type spells out a shape an
     existing contract already describes, name that contract — do not write a new, parallel one.
   - **A branch of a union takes the owner's name** ([B12](b12-require-object-contract-brands.md)'s B3):
     every object branch of `carveResultContract` is `.brand<'CarveResult'>()`, and fields add their keys
     (`'CarveResultError'`). A key in several branches must use the same schema in each, so one brand
     text never means two checks.
5. **New contracts get branded later by [B15](b15-brand-migration.md)'s autofix — write them
   unbranded-compatible or branded per B1 now.** Recommended — the executing agent may change it with a
   reason in DECISIONS: **write every new contract fully branded per B1 now**, rather than leaving it
   unbranded for [B15](b15-brand-migration.md) to fix later. Reasoning: [B12](b12-require-object-contract-brands.md)'s
   rules land switched OFF specifically so the repo is not blocked while unbranded contracts exist, but a
   *new* contract this item writes has no excuse to be unbranded from birth — writing it correctly the
   first time means [B15](b15-brand-migration.md)'s migration has one less file to touch, and this item's
   own `ban-adhoc-types` extension already forces the shape into `contracts/`, so branding it fully costs
   nothing extra at the same sitting.

## Lint rules this item adds or changes

| Rule | What it refuses | Message | Pre-edit? | Autofix |
|---|---|---|---|---|
| `ban-type-aliases` (new) | An exported alias of a field's type (`Quest['id']`); an alias giving a library type a second name | (per case — no single canonical message given by the source; write one for each of the two cases, following the style of existing messages) | **Yes** — syntax only | None specified by the source doc |
| `ban-adhoc-types` (extended) | An object type literal (or union/intersection containing one) in a module-level return type, alias, variable type, or type argument, unless every member is a function | "Define our types in contracts/ and import them. A library's types are imported through the gateway." | **Yes**, as today | None specified — this is a structural refusal, the fix is writing a contract, not something a fixer can invent |

## Teaching text this item changes

From BR "Today's rules and docs that change" (row 2229, area): `ban-adhoc-types` — "Refuses `interface`
and `as { … }` casts. Skips `contracts/`, `adapters/` and `widgets/`. Misses `type X = { … }` aliases and
inline object return types. Message: 'Define types in contracts/ and import them'" → "Extended by B9:
also refuses an object type literal in a module-level function's return type, a module-level alias,
variable type or type argument, unless every member is a function. Skips `.proxy.ts` files. The gateway's
lint block omits the rule. Message: 'Define our types in contracts/ and import them. A library's types
are imported through the gateway.'"

From BR "New rules" (rows 2257-2258): B5's `ban-type-aliases` and B9's `ban-adhoc-types` extension, both
built by this item, both pre-edit, both syntax-only.

Finished in full in [Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md).

## Done when

- [ ] `ban-type-aliases` exists, refuses both B5 cases, is pre-edit, syntax-only.
- [ ] `ban-adhoc-types` is extended per B9, skips `.proxy.ts`, and the gateway's lint block omits it.
- [ ] Every re-censused flagged shape is either turned into a contract (branded per B1), confirmed as a
      method set left alone, or confirmed as staying inside one function (left alone).
- [ ] Every new contract this item writes is fully branded per B1, not left for
      [B15](b15-brand-migration.md) — or, if the executing agent chose otherwise, that choice and its
      reason are recorded in Concessions.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0, per package split.

## Traps

- The 2026-09-24 census figures are stale after Phase 2 deletes `adapters/` — re-derive fresh counts, do
  not plan batches against the old table.
- Do not force a method-set return type (all members are functions) into a contract — zod cannot check a
  function, and the rule itself should already exempt these; if it doesn't, that is a rule bug to fix,
  not a shape to force-brand.
- A shape mixing data and functions needs its data half parsed and its functions attached outside the
  parse — do not try to make the whole shape one `z.object()` including function fields (this collides
  with [B01](b01-zod-v4.md)'s `z.function()` removal too).
- `widgets/`'s interfaces (component props) stay exempt — do not touch them as part of this item's
  migration.

## Concessions made while executing

