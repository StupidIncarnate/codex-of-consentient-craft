# B14: no exported alias of a field's type; an object type leaving a function is a contract

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), chunks R3 and W7. That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

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


## Decisions (4.0, 2026-09-29)

Written by the 4.0 decisions agent for 4.0 item 4: the hydration generic interfaces, `JestSuiteName`, and every
contract file the B02 index says exports a type that is not `z.infer`. Inputs: a fresh
`node tmp/phase34/b02-contract-index/index.cjs` run (2026-09-29, `out/contract-index.json`, field `notZodInfer`), every
declaration read from source, and rules B5 (no alias of a field's type), B9 (method sets stay inline; data plus
functions is a contract for its data) and C1 (every type a contract file exports is `z.infer`).

### The exception, in the words the rule text should use

R1's `require-contract-parse` refuses an exported type in a `-contract.ts` file that is not `z.infer`, `z.input` or
`z.output` of a schema in that file. It exempts exactly three shapes, because Zod has no schema for any of them and
none has a runtime value to check:

1. **A function type, or a method set.** A function type (`(params) => R`), or an object type every member of which
   is a function (`{ send: (data: string) => void }`, optional members included). This is B9's own test for a method
   set; the rule reuses it, so the two rules cannot disagree.
2. **A compile-time type.** An alias or interface that has type parameters and only computes over other types
   (mapped, conditional, indexed, phantom-keyed members such as `readonly [OP]: true`). The type-level builder in
   `hydration` is the whole population today.
3. **Data plus functions.** An intersection `z.infer<typeof xContract> & { …functions }` (or `Omit<…> & { … }` of
   an inferred type), where the data half is inferred from a schema in the same file and the functions are attached
   outside the parse. B9 and `contracts-constraints.md:132-133` already teach it.

Anything else is a contract: a hand-written object of data members, a union of literals, an alias of a field
(B5), a second name for a library type (C2), a second name for another contract (re-export alias).

The reasons the rule message names, one sentence each: "Zod cannot check a function"; "this type is computed from
other types and holds no data"; "the data half is inferred, the functions cannot be parsed".

Two consequences for the rule and its index:

- **The index has a bug.** Five of the 45 files are false positives: `export type X = z.infer<\n  typeof xContract\n>`
  split over two lines does not match the index's line pattern (`tsconfig-compiler-options-locate-result`,
  `inflated-task-notification-content`,
  `normalized-stream-line-content-item`, `workspace-package-export-source-path`,
  `platform-crossing-resolve-cache-key`). R1 builds its own version of this index as a broker: it must read the type
  from the syntax tree, or these five are refused for a formatting choice.
- **Twelve of the 45 files carry a contract nothing parses.** Their class is `type-only`: the exported const is an
  empty carrier (`z.object({}).loose()`, kept only so the file has a schema for the intersection) or is never called.
  C1 already says a contract only imported for its type is unused. Decision: delete the const, its stub and its
  test, and keep the method-set or generic types where they are. A `-contract.ts` file that exports no const is
  then a types-only file: the R1 agent must confirm `enforce-contract-declarations` and the file-name rules accept
  that, and if they do not, allow it for a file whose every export is a type in the exempt list. The empty-carrier
  trick (`z.object({}).loose()` plus an intersection) is retired: `browserSessionContract` and
  `endpointControlContract` become plain method-set types.

### The hydration generic interfaces: kept, as exception 1 and 2

`Collection`, `RowVerbs` and `Op` (with `Handle`, `Matched`, `Entry`, `Registry`, `Ingredient`, `IngredientConfig`,
`HydrationFor`, `Plan`, `RecipeDef`, the route and reach function types, and the rest of `packages/hydration/src/contracts/`)
stay. Reasons, read from `hydration-collection`, `ingredient-handle`, `matched-set`, `ingredient-config`:

- `Op<TSaved>` is a phantom token: `{ readonly [OP]: true; readonly __saved?: TSaved }`. Its only job is to carry
  `TSaved` through a builder chain. There is no value to parse.
- `RowVerbs<I>` and `Collection<R, I, Anc>` are method sets whose parameter and return types are computed from a
  registry generic (`Settable<I>`, `SavedOf<Ops>`). Each member is a function.
- The cycle the plan mentions is real (`Collection` names `Handle`, which names `RowVerbs`, which names `Op` and
  `Collection` through `ChildAccessors`), and every edge is an `import type`, so it is erased at runtime and needs no
  fix. Do not merge the files to break it: the type-level API is one type per file by design, and each of those
  files keeps its own schema (`hydrationCollectionContract`, `ingredientHandleContract` ... all class `parsed`).
- They are public API (`inPublicBarrel: true`) consumed by `hydration-recipes`; changing them is not a brand
  problem.

Three aliases inside them are not exempt and convert (see the table): `AnyZodSchema = z.ZodType`,
`AnyZodObjectSchema = z.ZodObject<z.ZodRawShape>`, `AnyRecipeInputSchema = z.ZodTypeAny`, `NoRecipeInputSchema =
z.ZodType<undefined>`. Each is a second name for a library type (C2); the use sites write the library type through the
gateway. `OpFilterNestedOp = OpFilter['ops'][number]` is B5's own example of an alias of a field's type.

### `JestSuiteName`: keep as an inline field brand; the plan's premise is out of date

`JestSuiteName` is not a standalone brand contract. It is the inline brand on `name` of `jestSuiteResultContract`, a
nested local const in `packages/ward/src/contracts/jest-json-report/jest-json-report-contract.ts:22`. B2 forbids
nothing here. Under B1/B3 the nested object takes its own brand and the field's text is derived, so R2's autofix writes
`.brand<'JestSuiteResult'>()` on the object and `'JestSuiteResultName'` on the field. Decisions:

- **It stays a branded string, not a file-path contract.** Its value is an absolute test file path, but `filePath`
  is a standalone value brand that W1/W5 remove; B1 wants each field to carry its own text.
- **The fields stay optional.** The observation in the rules doc ("a brand that checks nothing, every field optional")
  is true and stays true on purpose: `jest-json-parse-transformer.ts:39-46` and `jest-json-parse-passing-transformer.ts:27-34`
  already handle `testResults === undefined`, and a crashed Jest run emits suites with only some keys. Making `name` and
  `status` required is a check change with its own failure test, not part of the brand migration. It is recorded, not
  done, and belongs on the T-series test-gap list.
- **No standalone `JestSuiteName` contract or stub is created.** Nothing outside that file names it.

### Per-file table (45 files, 2026-09-29)

Action codes: `KEEP-1` method set or function type, `KEEP-2` compile-time type, `KEEP-3` data plus functions,
`FP` false positive of the index, `CONV` convert, `DROP` delete, `LIB` library copy owned by wave 3.5, `carrier` =
the empty-carrier const is deleted by C1 (class `type-only`). File paths are under `packages/`, and `src/contracts/`
is elided.

| # | File | Non-`z.infer` exports | Action | Reason or target |
|---|---|---|---|---|
| 0 | cli/install-module | `StartInstallFn` | KEEP-1 | Function type. Its `InstallResult` return follows whatever B18 leaves. |
| 1 | cli/siegelense-module | `StartSiegelenseFn` | KEEP-1 | Function type; returns `AdapterResult`, which B18 deletes (retype then). |
| 2 | cli/start-server-module | `StartServerFn` | KEEP-1 | Function type; same B18 note. |
| 3 | cli/tsconfig-compiler-options-locate-result | (none) | FP | Two-line `z.infer<...>`. |
| 4 | eslint-plugin/eslint-context | `EslintComment`, `EslintRuleFixer`, ... (interfaces) | LIB | A hand-written copy of `TSESLint` types, class `type-only`; L2/C2 replace it with the gateway's types. Not decided here. |
| 5 | hooks/claude-settings | `SettingsHookListEntry` (union of `z.infer` types) | CONV | `settingsHookListEntryContract = z.union([...])` and `z.infer` of it; the union has no other definition to keep. |
| 6 | hooks/pre-edit-lint-config | `PreEditLintConfig` | KEEP-3 | `Omit<z.infer<...>, 'rules'> & { rules }`: the file's own comment explains `ruleConfigContract` keeps `message` outside its schema, so the inferred type loses it. The clean fix is in `rule-config-contract.ts`, not here. |
| 7 | hydration/field-values | `FieldValuesFor<TFields>` | KEEP-2 | Mapped type over a generic. |
| 8 | hydration/hydration-collection | `Tuple`, `Handles`, `FilterArgsFor`, `AttachWhereFor`, `Collection`, `Entry` | KEEP-2 | `Collection` is a method set over a registry generic; `Tuple` and `Handles` are recursive conditional types; `FilterArgsFor` and `AttachWhereFor` are typed from `I`. |
| 9 | hydration/hydration-plan | `Plan<TOut>` | KEEP-2 | `HydrationPlan & { readonly __out?: TOut }`: a phantom parameter. |
| 10 | hydration/hydration-routes | `RouteFn`, `QueryRouteFn`, `UpdateRouteFn`, `RemoveRouteFn`, `RoutesFor`, `CopiesFor` | KEEP-1 and KEEP-2 | Function types, plus a conditional and a union of objects whose members are all functions. |
| 11 | hydration/hydration-target | `HydrationFor<TTarget>` | KEEP-1, carrier | A method set (`ingredient`, `registry`, ...). The const is class `type-only`. |
| 12 | hydration/ingredient-config | `ExtraApplyFn`, `Ingredient`, `AnyIngredient`, `IngredientConfig`, `IngredientConfigInferenceAnchor`, `ConfigOf`, `FieldsOf`, `RecordOf`, `NameOf`, `LinkNames`, `LinkSpecsOf`, `LinkAncestorName`, `SuppliedAncestorNames`, `UnderAncestor`, `Registry`, `ExtrasFree` | KEEP-2 | Phantom keys and conditional types. `Registry = Record<string, AnyIngredient>` is a plain alias over a keep-2 type. |
| 12 | (same file) | `AnyZodSchema`, `AnyZodObjectSchema` | CONV | Second names for `z.ZodType` and `z.ZodObject<z.ZodRawShape>` (C2): delete the aliases, write the library type at each use (through `#gateway/npm/zod`). |
| 13 | hydration/ingredient-handle | `Op`, `SavedOf`, `Settable`, `RowVerbs`, `ExtraMethods`, `ChildAccessors`, `Handle` | KEEP-1 and KEEP-2 | See the hydration section. |
| 14 | hydration/link-spec | `LinkSpecFor<TFields, TParentName>` | KEEP-2 | Its keys are `keyof TFields`. |
| 15 | hydration/matched-set | `Matched<I>` | KEEP-1 | `RowVerbs<I> & ExtraMethods<I>`: a method set. |
| 16 | hydration/op-filter | `OpFilterNestedOp` | CONV | B5: an alias of a field's type. Delete it; its 2 type users write `OpFilter['ops'][number]`. |
| 17 | hydration/recipe-def | `RecipeDef<TName, TInput, TOut>`, `RecipeInputOf` | KEEP-3 and KEEP-2 | `Omit<RecipeDefData, ...> & function & { recipeName: TName }`: inferred data half plus a callable. `RecipeInputOf` is `z.infer` of a generic. |
| 17 | (same file) | `AnyRecipeInputSchema`, `NoRecipeInputSchema` | CONV | C2, as `AnyZodSchema`. |
| 18 | hydration/transition-spec | `ReachFn`, `TransitionSpecFor`, `TransitionSpecWithReachFor` | KEEP-1 and KEEP-2 | A function type and mapped types. |
| 19 | hydration-recipes/dm-http-response | `DmHttpResponse<T>` | KEEP-3 | `{ status: <inferred>; body: T }`: a generic body. The data half is the inferred `status`. |
| 20 | hydration-recipes/dm-target | `HttpRequestFn` | KEEP-1 | Function type. |
| 21 | hydration-recipes/recipe-catalog-entry | `RecipeCatalogEntry` | KEEP-3 | `RecipeCatalogEntryData & { inputs; probeListing; execute }`. |
| 22 | mcp/tool-registration | `ToolHandler` | KEEP-1, carrier | Function type over `ToolResponse`; G04 decides the response type. |
| 23 | orchestrator/chat-line-processor | `ChatLineProcessor` | KEEP-1, carrier | `{ processLine: fn }`: a method set. |
| 24 | orchestrator/inflated-task-notification-content | (none) | FP | Two-line `z.infer<...>`. |
| 25 | orchestrator/node-dispatch-runner | `NodeDispatchWakeHandler`, `NodeDispatchRunnerDeps`, `NodeDispatchRunnerController` | KEEP-1, carrier | Every member is a function; `AdapterResult` returns follow B18. |
| 26 | orchestrator/normalized-stream-line-content-item | (none) | FP | Two-line `z.infer<...>`. |
| 27 | orchestrator/orchestration-callbacks | `OnAgentEntryCallback`, `OnSlotAgentEntryCallback`, `OnWorkItemSessionIdCallback`, `OnFollowupCreatedCallback`, `OnWorkItemSummaryCallback`, `OnWorkItemSignalCallback` | KEEP-1, carrier | Six function types. |
| 28 | orchestrator/orchestration-events-state-facade | `OrchestrationEventsStateFacade` | KEEP-3 | Inferred data plus `on`, `off`. |
| 29 | orchestrator/orchestration-events-state-module | `OrchestrationEventsStateModule` | KEEP-3 | `Omit<...> & { orchestrationEventsState: ...Facade }`. |
| 30 | orchestrator/siegelense-instance-kill-module | `InstanceKillBrokerFn` | KEEP-1 | Function type; the `Promise<unknown>` return is a 4.0 item 3 site. |
| 31 | orchestrator/siegelense-lane-provision-module | `CapacityReadBrokerFn`, `InstanceStartBrokerFn` | KEEP-1 | Function types; same `unknown` note. |
| 32 | server/iso-timestamp | `IsoTimestamp = OrcIsoTimestamp` | DROP | A re-export alias. Cleared with the `isoTimestampContract` B2 wave (B11 table). |
| 33 | server/process-id | `ProcessId = SharedProcessId` | DROP | A re-export alias. Cleared with `processIdContract` (W4). |
| 34 | server/ws-client | `WsClient` | KEEP-1, carrier | `{ send: fn }`. |
| 35 | shared/work-item-for-upsert | `WorkItemForUpsert = ReturnType<typeof ...parse>` | CONV | Same type as `z.infer<typeof workItemForUpsertContract>`; write that. |
| 36 | siegelense/browser-session | `BufferLengths` | CONV | Three-key data object of `BufferLineCount`: a data shape, so `bufferLengthsContract` (B1-branded, `.brand<'BufferLengths'>()`), and the method that returns it parses through it. |
| 36 | (same file) | `BrowserSession` | KEEP-1, carrier | Every member is a function; the `z.object({}).loose()` const is dropped. |
| 37 | testing/endpoint-control | `HttpMethod` | CONV | A union of string literals: `endpointHttpMethodContract = z.enum([...])` (siegelense already owns `httpMethodContract` with another value set, so it takes a different name; testing may not import siegelense). |
| 37 | (same file) | `EndpointResponseContract`, `EndpointControl` | KEEP-1, carrier | `{ parse: fn }` and a method set. The const is dropped. |
| 38 | testing/install-testbed | `InstallTestbed` | KEEP-3 | `InstallTestbedData & { cleanup, writeFile, ... }`. |
| 39 | testing/recorded-calls | `RecordedCalls` | KEEP-1, carrier | An array-like facade: `length` plus functions. |
| 40 | testing/test-guild | `TestGuild` | KEEP-3 | `TestGuildData & { ...functions }`. |
| 41 | testing/timer-handle | `TimerHandle` | KEEP-1, carrier | `{ hasRef?: fn }`. |
| 42 | testing/workspace-package-export-source-path | (none) | FP | Two-line `z.infer<...>`. |
| 43 | ward/platform-crossing-resolve-cache-key | (none) | FP | Two-line `z.infer<...>`. |
| 44 | web/upload-progress-post | `UploadProgressHandler` | KEEP-1, carrier | Function type. |

### Counts (files, 2026-09-29: 45, not the plan's 48)

The four files that need two actions are counted once, by their larger action.

| Action | Files |
|---|---|
| `FP` (index bug, nothing to change) | 5 (`3`, `24`, `26`, `42`, `43`) |
| `KEEP-1`, `KEEP-2`, `KEEP-3` (sanctioned exception, unchanged) | 30, of which 9 also drop a `type-only` carrier const (`11`, `22`, `23`, `25`, `27`, `34`, `39`, `41`, `44`) |
| `CONV` only | 3 (`5`, `16`, `35`) |
| `KEEP` plus `CONV` in the same file | 4 (`12`, `17`, `36`, `37`); the last two also drop a carrier |
| `DROP` (re-export alias, cleared by B11 and W4/W5) | 2 (`32`, `33`) |
| `LIB` (L2/C2 owns it) | 1 (`4`) |

So the number of contract files that need a hand edit for item 4 is 7 (`5`, `12`, `16`, `17`, `35`, `36`, `37`), plus 12 carrier deletions (nine
clean ones plus `36` and `37`, and `4` by L2), plus the R1 index fix. Nothing else needs to change for R1 to reach 0.

### Where the plan and the code disagree

- The plan says 48 files; the index says 45 today, and five of those 45 are false positives, so 40 are real.
- The plan says `JestSuiteName` is a brand to decide. It is an inline field brand inside one nested contract;
  no standalone contract exists to convert.
- The plan's "convert or keep" framing hides that 12 of the 45 files hold a contract nothing parses. C1 would
  delete those consts; keeping the file requires R1 (and the folder rules) to accept a types-only contract file.
- wave 3.1 is recorded as done, yet the same index run finds 17 `dead` contract files still on disk; this
  agent did not touch them (see the B11 decisions).
