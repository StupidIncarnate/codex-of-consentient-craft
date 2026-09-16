# Chunks 1–3 — the hydration framework's types, declaration surface and chain builder

The package `@dungeonmaster/hydration`: every contract a later chunk names, every refusal error,
`createHydration` / `ingredient` / `registry` / `recipe`, and the chain that turns `add` · `set` ·
`setRaw` · `saveRecordAs` · `remove` · `filter` · `fromSaved` · `under` into ops.

**All paths in this file are relative to the worktree root
`/home/brutus-home/projects/codex-of-consentient-craft/worktrees/recipes-doc`.** Never the main
checkout.

**The specification is `scrolls/seigelense/siegelense-recipes.md`, Part 5.** Every `delivers` field
below quotes a Part 5 heading verbatim. Where Part 3A differs from Part 5, Part 5 wins.

**Every construct below is re-expressed against this repo's folder rules**: one export per file,
`export const` arrow, one destructured object parameter, explicit branded return type, PURPOSE above
the imports. The machinery itself now lives in `packages/hydration/src/contracts/**` — copy from
there, never from a prototype's file layout.

**The package skeleton is another agent's job.** Assume `packages/hydration/` exists with
`package.json`, `tsconfig.json`, `tsconfig.build.json` and `jest.config.js` written by
`dungeonmaster create-package`. Create none of them.

---

## 1. Scope

### What lands here

| Chunk | Scope | Folder types |
|---|---|---|
| 1 | `IngredientConfig`, `Plan`, `Op`, `Target`, the recipe manifest, the errors | `contracts/`, `errors/`, `statics/` |
| 2 | `createHydration`, `ingredient`, `registry` — declaration only, nothing runs | `brokers/`, `contracts/` |
| 3 | the chain builder — every verb producing ops, and `recipe` wrapping them into a plan | `transformers/`, `brokers/` |

Plus one file the map does not anticipate: the TypeScript-diagnostics adapter that grades the thirty
type cases. Section 4 says why it is here and not in chunk 4.

### What is NOT here

| Deferred | To | Why it is safe to wait |
|---|---|---|
| `run(plan, target)` — the depth-first walk, link resolution, the routes | chunk 4 | it is the first thing that touches disk, and §2's rule says nothing in 1–3 may |
| every PRE-FLIGHT refusal's *firing* | chunk 4 | the error CLASSES land here so chunk 4 invents none; the checks that throw them read a plan against a target, which is the runner |
| route helpers — an HTTP post, a file write | chunk 4 | `adapters/`, and both do I/O |
| `transitions.reach` actually walking | chunk 5 | the `transitions` DECLARATION and `set`'s narrowing to `to` land here; running `reach` needs the runner |
| `filter` reading live state | chunk 6 | `filter` producing a `filter` OP lands here. Querying is the runner's |
| this repo's own ingredients and recipes | chunk 7 | `packages/hydration-recipes`. The two ingredient sets in this chunk's fixture tree are fixtures, not that package |
| `recipes {}`, discovery, the `seed` step's params VALIDATION | chunk 8 | `packages/siegelense`. The seed step's TYPE and the manifest CONTRACT land here |

### Two rules that bind every file below

**A plan is DATA.** The chain builds; it does not execute. Callbacks run at BUILD time. **No file in
chunks 1–3 opens a socket or touches disk** — except the one test-only adapter in §4, which the
framework's own import graph never reaches.

**Determinism is structural.** No file below calls `Date.now()`, `Math.random()` or
`crypto.randomUUID()`. A row's build-time identity is derived from its ancestor path and its index —
see `rowRefTransformer` — because *"the chain owns the index and hands it to `defaults(i)`"*.

---

## 2. Build order

Three agents work from this at once. A group may be written in parallel; a group must wait for every
group above it.

### Group A — contracts and errors, all parallel (chunk 1)

Twenty-six files with no dependency on anything but each other's branded scalars. **Write the eight
branded scalars first (A1), then everything in A2 in parallel.**

| | Files |
|---|---|
| **A1** | `ingredient-name` · `recipe-name` · `saved-record-name` · `field-name` · `row-ref` · `row-index` · `copies-target` · `hydration-route` · `filter-expect` · `extra-verb-name` · `reserved-verb-statics` |
| **A2a** (needs A1) | `saved-ref` · `field-values` · `link-spec` · `transition-spec` · `hydration-routes` · `hydration-target` |
| **A2b** (needs A1) | `op-create` · `op-set` · `op-remove` · `op-save-record` · `op-filter` · `op-extra` |
| **A2c** (needs A2a+A2b) | `ingredient-config` · `hydration-op` · `hydration-plan` · `recipe-def` · `recipe-manifest` · `seed-step` |
| **A2d** (needs A1 only) | every `errors/` class — fourteen files, fully parallel, zero imports |
| **A2e** (needs A2a+A2c) | `hydration-collection` · `ingredient-handle` · `matched-set` |

**A2d is the widest parallel slot in the build.** `errors/` imports nothing, so fourteen error
classes can be written simultaneously by three agents with no coordination at all.

### Group B — the type-fixture harness (chunk 1, parallel with A2)

| | Files |
|---|---|
| **B1** | `typescript-program-diagnostics-adapter` + its proxy + its test · `type-diagnostic` contract |
| **B2** (needs A2e) | the fixture tree's two ingredient sets — `dm-target` and `sql-target` |

B1 depends only on A1 (`field-name` is not even needed — it needs `repo-relative-path` from
`@dungeonmaster/shared/contracts`). **Start B1 in parallel with A1.** It is the longest-lead item in
the plan, because every negative case in §4 waits on it.

### Group C — declaration (chunk 2), after A and B

| | Files |
|---|---|
| **C1** | `ingredient-declare-broker` + proxy + test, and its fixture set (D1–D8) |

**Chunk 2 before chunk 3 is the ordering Part 5 insists on**, under *"A suggested spine, for the
first planner round"*: *"the types are the risk; get them compiling against two real ingredients
before anything executes"*. C1 is where that happens — the two ingredient sets in B2 are those two
real ingredients, and C1's test is the first thing that proves the declaration surface refuses what
it must.

**Nothing in group D starts until C1's fixture suite is green.**

### Group D — the chain (chunk 3), after C

| | Files | Parallel? |
|---|---|---|
| **D1** | `row-ref-transformer` · `from-saved-ref-transformer` | yes, two agents |
| **D2** | the seven op transformers — `op-create` · `op-set` · `op-set-raw` · `op-remove` · `op-save-record` · `op-filter` · `op-extra` | yes, three agents × 2–3 files |
| **D3** | `matched-set-chain-transformer` · `row-handle-chain-transformer` · `collection-chain-transformer` · `entry-chain-transformer` | **NO — one agent, all four** |
| **D4** | `registry-create-broker` · `recipe-declare-broker` · `hydration-create-broker` | sequential in that order, one agent |
| **D5** | `plan-runs-transformer` · `plan-makes-transformer` | yes, two agents, any time after A2c |

**D3 is one agent's job and must not be split.** Those four files are a single recursive knot — a
collection builds handles, a handle exposes child collections, a collection's `filter` builds a
matched set. Three agents writing three of them produce three disagreeing shapes, and the
disagreement surfaces as `TS7022` (the inference cycle Part 5 already measured under *"Linking a
child to its parent"*). One agent, four files, one commit.

### Group E — the negative and positive suites (chunk 3), after D3

| | Files |
|---|---|
| **E1** | the fixture files for call-site rows 1–11 and 7b, and the positive tree |
| **E2** | the colocated tests in `hydration-collection` · `ingredient-handle` · `matched-set` · `filter-args` · `recipe-def` · `seed-step` · `collection-chain-transformer` |

### Group F — the barrels (any time after D4)

`contracts.ts` · `brokers.ts` · `transformers.ts` · `errors.ts` at the package root, plus the
`package.json` `exports` entries. **No `./adapters` subpath** — see §4.

### The whole order, numbered

1. **A1** (branded scalars + the reserved-verb statics) ‖ **B1** (the tsc adapter)
2. **A2a** ‖ **A2b** ‖ **A2d** (errors — the widest slot)
3. **A2c** ‖ **A2e**
4. **B2** (the two fixture ingredient sets)
5. **C1** (`ingredient`) — *gate: its fixture suite green before step 6*
6. **D1** ‖ **D2** ‖ **D5**
7. **D3** (one agent, four files)
8. **D4** (sequential: registry → recipe → createHydration)
9. **E1** ‖ **E2**
10. **F** (barrels and the `exports` map)

---

## 3. Decisions this plan makes, beyond what the type prototype specified

A build agent that disagrees with one of these raises it rather than choosing differently — three
files choosing differently is the failure this plan exists to prevent.

**A row has a build-time identity, and it is derived, never minted.** `RowRef` is a branded string
of the form `guild[0]/quest[2]`: the ancestor path, each segment an ingredient name and a 0-based
index. Ops target rows by `RowRef`. It is derived from the chain position, so the same plan built
twice produces byte-identical refs — which is what *"Determinism is structural, not a rule to
remember"* requires and what a clock or a uuid would break.

**`setRaw` produces a `set` op, not a sixth op kind.** Part 5's Op table has five rows and `set`
holds *"the row it targets and the values, split into written fields and a transition"*. `setRaw`
puts the transition field in `written` and emits no `transition` key. One op, two producers —
`opSetTransformer` and `opSetRawTransformer` — because transformers give each output shape its own
file.

**An `extra` gets a SIXTH op kind, which Part 5's Op table omits.** Part 5 requires extras
(*"Each becomes a method on that ingredient's rows and on nothing else"*) and gives them no op. An
`extra` op carrying `{ ref, verb, args }` is the smallest thing that works. Raised as open question
**Q1**.

**A `filter` op carries its SCOPE.** `{ ingredient, scope: RowRef | null, where, expect, matchedRef,
ops }`. `scope` is the immediate host's `RowRef`, so `q[0].operations.filter(…)` records that it
means *operations under `q[0]`*, not *every operation in the instance*. Part 5's Known-gaps table
says *"A `filter` inside a nested `add` has undefined scope … Decide it before anyone writes one"* —
this decides it, in the DATA, so chunk 6's runner has nothing to invent. Raised as **Q2**.

**`add` takes `<N extends number>` with NO `const` modifier.** Part 5, *"What the type suite proves,
and what it changed"*: *"the `const` modifier on `add`'s count is unnecessary … It is harmless to keep
and misleading to cite as the reason the tuple works."*

**`all` is `add`'s second builder ARGUMENT.** Never a property beside the handles. Part 5 measured
that `Tuple<T, N> & { all: T }` silently loses the out-of-bounds check.

**`fromSaved` produces a tagged value, and `Settable` admits it.** `SavedRef` is
`{ __savedRef: true; name; field? }`. `Settable<I>` becomes
`{ [K in keyof F]?: F[K] | SavedRef }` rather than `Partial<F>`, so a cross-link compiles without the
`as never` the prototype needed. This partially closes Part 5's gap *"`fromSaved` is not typed
against the field it lands in"* — it admits the value; it does not yet type the saved field against
the landing field. Raised as **Q3**.

**A `recipe` declares its inputs as a zod schema, and that one declaration serves three readers.**
`recipe({ name, description, inputs? }, build)`. The listing prints the input line off it, the
in-process union infers its type off `z.infer`, and chunk 8's wire validation parses `params` with
it. Part 5 requires *"`inputs` | the recipe's input contract — static data, so the listing never runs
anything"* and `proto/` carries no runtime carrier for inputs at all. Raised as **Q4**.

**`createHydration` returns `{ ingredient, registry, recipe }` in chunks 1–3, and chunk 4 ADDS
`run`.** That is the one file in this plan a later chunk edits, and the edit is additive.

---

## 4. The negative type cases

### The problem, stated

This repo bans `@ts-expect-error` and `@ts-ignore` outright — `get-architecture` under *"Types"*,
enforced by ESLint. `proto/negative.ts` and `proto/declarations.ts` are **twenty-nine
`@ts-expect-error` lines between them**, and Part 5's tables *"What the compiler enforces"* and
*"the ten malformed declarations"* enumerate every case. Carried across as written, the suite does
not lint. Dropped, the entire proof goes with it.

### The decision

**A real `tsc` run over a fixtures directory, asserted by a colocated test, is the mechanism for
EVERY case.** A type-level `Equal`/`Expect` helper is the mechanism for the six shape facts Part 5
records as mutation-tested — **and those six are ALSO fixtures**, expressed inside the positive tree
where no lint rule reaches them.

**Why the real run, for every case.** `get-testing-patterns`, under *"Unit Tests vs Integration
Tests"*: *"Logic expressed in an external system's DSL/query language … The external system must
interpret your logic for the test to prove anything."* The type system IS that external system here,
and the ESLint `RuleTester` is the named template — the same repo already grades a rule by making
ESLint parse real code rather than by asserting on a selector string. Every row in Part 5's two
tables is a claim of the form *"this code does not compile"*. Only a compiler can answer it.

**Why not a type-level helper as the primary mechanism.** `Equal<A, B>` answers questions about
ASSIGNABILITY, and a third of the cases are not assignability questions:

| Case | Refused by | A conditional type sees |
|---|---|---|
| `set({ nope: 1 })` · `filter({ where: { nope: 1 } })` · `defaults: () => ({ notAField: 1 })` | excess-property (freshness) checking on a fresh object literal | nothing — freshness is not part of the assignability relation |
| `write` route with no `copies:` · `defaults` returning a bad field | contextual typing through a generic inference site | nothing — it would have to restate the whole instantiation |
| `sessionWithNestedChain()` with no argument | arity and the `void`-parameter rule | a `Parameters<…>['length']` of `1` either way |

A helper that passes on those three rows while the call site is still accepted is a green suite that
cannot go red — which is precisely the *"A green type suite says nothing"* caution in Part 5's *"Two
kinds of probe"*.

**Why the type-level helper survives anyway, for six rows.** Part 5's mutation table records five
breaks that were applied and reverted, each *"caught by the test that owns it"*. Those are statements
about type SHAPE, they cost nothing, and they run in ward's `typecheck` pass rather than waiting on a
`tsc` spawn inside jest — *"the type suite … runs every ward, in milliseconds"*. They name the REASON
a case is refused where the fixture only proves the refusal. `Equal` and `Expect` are declared inside
the fixture tree (`test/type-fixtures/expect.ts`), not in `src/`, so they need no `*Contract` export,
no `@types/` folder and no ESLint width.

### How it is wired

```
packages/hydration/
  src/adapters/typescript/program-diagnostics/
    typescript-program-diagnostics-adapter.ts        # wraps `typescript`: paths in, diagnostics out
    typescript-program-diagnostics-adapter.proxy.ts  # EMPTY — a DSL adapter runs real
    typescript-program-diagnostics-adapter.test.ts
  test/type-fixtures/
    expect.ts                    # Equal<A,B> · Expect<T extends true>
    dm-target.ts                 # the FILE-backed ingredient set
    sql-target.ts                # the DATABASE-backed ingredient set
    positive/                    # must compile CLEAN — every verb, both repos, the six shape facts
    declaration/                 # D1–D9, one file per case
    call-site/                   # rows 1–13 and 7b, one file per case
    seed-step/                   # rows 14–17
```

**One fixture file holds exactly ONE deliberate error.** The test asserts the fixture's path, the
line, and the TypeScript error code — not "some diagnostic appeared". That gives back the property
the `@ts-expect-error` suite had: widen `transitions.to` and that one fixture goes clean, and its one
test goes red naming the rule that stopped working.

**The fixture tree must be excluded from two places, and both edits carry a comment.** They are
deliberate type errors, so the package's own checking `tsconfig.json` must not compile them and
ESLint must not lint them:

| File | Edit |
|---|---|
| `packages/hydration/tsconfig.json` | `"exclude": ["test/type-fixtures/**"]` — deliberate type errors; `typescriptProgramDiagnosticsAdapter` compiles them instead |
| `eslint.config.js` | an `ignores` entry for `packages/hydration/test/type-fixtures/**` — **a SECOND entry, separate from the `ban-primitives` one** |
| `packages/hydration/tsconfig.build.json` | verify `test/**` is already excluded; the skeleton's own exclude list should cover it |

**The two ingredient sets are fixtures, not `hydration-recipes`.** `dm-target.ts` is the file-backed
repo (guild · quest · operation · session against a home directory) and `sql-target.ts` is the
database-backed one (user · post · comment against a transaction). Part 5, *"An ingredient for a FILE,
and an ingredient for a DATABASE ROW"*: *"the framework names neither files nor SQL, and a repo
instantiates it once with its own TARGET type"* — and the mutation table's `u[0].comments` row is
only reachable on the database shape. Both are required; one is not enough.

### The table — every case, by name, with its mechanism and its owner

`FIX` = a fixture graded by a real `tsc` run. `SHAPE` = additionally an `Expect<Equal<…>>` assertion
in `positive/`. `RUN` = a runtime test, because no type reaches it.

#### Part 5 — *"What the compiler enforces"*

| # | The case | Fixture | Mech. | Test that owns it |
|---|---|---|---|---|
| 1 | `q[3]` after `add(3, …)` — out-of-bounds index | `call-site/out-of-bounds.ts` | FIX + SHAPE | `hydration-collection-contract.test.ts` |
| 2 | an unknown field in `set` — `set({ nope: 1 })` | `call-site/unknown-field.ts` | FIX | `ingredient-handle-contract.test.ts` |
| 3 | a status outside `transitions.to` — `set({ status: 'blocked' })` | `call-site/unreachable-transition.ts` | FIX + SHAPE | `ingredient-handle-contract.test.ts` |
| 4 | a value that is not a status at all — `set({ status: 'nonsense' })` | `call-site/not-a-status.ts` | FIX | `ingredient-handle-contract.test.ts` |
| 5 | an extra the ingredient never declared — `withNestedChain` on a quest | `call-site/extra-not-declared.ts` | FIX | `ingredient-handle-contract.test.ts` |
| 6 | a wrongly typed argument to an extra — `withNestedChain({ depth: 'two' })` | `call-site/extra-arg-typed.ts` | FIX | `ingredient-handle-contract.test.ts` |
| 7a | a child accessor on the wrong host, IMMEDIATE-PARENT — `q[0].sessions` | `call-site/child-wrong-host.ts` | FIX + SHAPE | `ingredient-handle-contract.test.ts` |
| 7b | a child accessor on the wrong host, ALL-LINKS-SATISFIED — `u[0].comments` | `call-site/child-links-unsatisfied.ts` | FIX + SHAPE | `ingredient-handle-contract.test.ts` |
| 8 | indexing a filtered set — `filter(…)[0]` | `call-site/filter-has-no-index.ts` | FIX | `matched-set-contract.test.ts` |
| 9 | `add` on a filtered set — `filter(…).add(…)` | `call-site/filter-has-no-add.ts` | FIX + SHAPE | `matched-set-contract.test.ts` |
| 10 | a bad `expect` value — `expect: 'exactly-two'` | `call-site/bad-expect.ts` | FIX | `filter-args-contract.test.ts` |
| 11 | an unknown field in `where` — `filter({ where: { nope: 1 } })` | `call-site/bad-where-field.ts` | FIX | `filter-args-contract.test.ts` |
| 12 | a recipe input of the wrong type — a bare string for a branded `GuildId` | `call-site/recipe-input-type.ts` | FIX | `recipe-def-contract.test.ts` |
| 13 | a recipe called with no input when it needs one | `call-site/recipe-input-missing.ts` | FIX | `recipe-def-contract.test.ts` |
| 14 | a seed step missing its `params` | `seed-step/missing-params.ts` | FIX | `seed-step-contract.test.ts` |
| 15 | a seed step with the wrong `params` shape | `seed-step/wrong-param-shape.ts` | FIX | `seed-step-contract.test.ts` |
| 16 | `params` on a recipe that takes none | `seed-step/params-on-paramless.ts` | FIX | `seed-step-contract.test.ts` |
| 17 | a seed step naming an unknown recipe | `seed-step/unknown-recipe.ts` | FIX | `seed-step-contract.test.ts` |

Rows 3, 7b and 11 are re-proven on the DATABASE shape as well —
`call-site/db-unreachable-status.ts`, `call-site/db-comment-needs-a-post.ts`,
`call-site/db-unknown-column.ts` — because the mutation table names `u[0].comments` specifically, and
nothing proves those three rows against a foreign-key shape until these fixtures exist.

#### Part 5 — *"the ten malformed declarations"*

| # | The malformed declaration | Fixture | Mech. | Test that owns it |
|---|---|---|---|---|
| D1 | `transitions.field` naming no field | `declaration/bad-transition-field.ts` | FIX | `ingredient-declare-broker.test.ts` |
| D2 | `transitions.to` holding a value that field cannot take | `declaration/bad-transition-value.ts` | FIX | `ingredient-declare-broker.test.ts` |
| D3 | a `write` route with no `copies:` | `declaration/write-without-copies.ts` | FIX + **RUN** | `ingredient-declare-broker.test.ts` |
| D4 | no routes at all | `declaration/no-routes.ts` | FIX + **RUN** | `ingredient-declare-broker.test.ts` |
| D5 | an extra named `set` | `declaration/extra-named-set.ts` | FIX + **RUN** | `ingredient-declare-broker.test.ts` |
| D6 | an extra named `remove` | `declaration/extra-named-remove.ts` | FIX + **RUN** | `ingredient-declare-broker.test.ts` |
| D7 | `defaults` returning a field that does not exist | `declaration/bad-defaults.ts` | FIX | `ingredient-declare-broker.test.ts` |
| D8 | `links.as` naming no field | `declaration/bad-link-field.ts` | FIX | `ingredient-declare-broker.test.ts` |
| D9 | `links.of` naming an unregistered ingredient | `declaration/dangling-link.ts` | FIX + **RUN** | `registry-create-broker.test.ts` |
| D10 | two ingredients sharing a `name` | — | **RUN only** | `registry-create-broker.test.ts` |

**D10 is the row Part 5 marks *"no — runtime check"***: *"not expressible in the type system. A
runtime check at `registry()`, throwing with both keys."* It gets `RegistryDuplicateNameError` and a
plain jest test, and it is the case the whole table exists to keep visible.

**D3 · D4 · D5 · D6 · D9 get a RUNTIME backstop as well as a fixture**, because each is also
reachable from JavaScript, from a `JSON.parse`d config, or from a consumer repo that skips the
typecheck — and Part 5 states as a bare requirement that `routes` is *"must, at least one"* and
`copies` is *"must, with a `write` route"*. The type refuses the declaration; `IngredientDeclarationError`
refuses the value.

#### The six SHAPE assertions, in `positive/shape-assertions.ts`

Each is `const x: Expect<Equal<A, B>> = true;` asserted through a jest `toBe(true)` — the value is
real, and its TYPE only exists while the rule holds. These are the five breaks Part 5's mutation
table names, plus the `Settable` narrowing:

| Assertion | The mutation it catches |
|---|---|
| `Handles<…, 3, …>['length']` is `3`, and `Handles<…, number, …>['length']` is `number` | *"make `Tuple` always degrade to an array"* |
| `Extract<keyof Matched<Quest>, 'add'>` is `never` | *"drop `Matched`'s restriction so a filtered set gains `add`"* |
| `Extract<keyof Handle<Quest>, 'sessions'>` is `never` | *"drop the child accessor's IMMEDIATE-PARENT condition"* |
| `Extract<keyof Handle<User>, 'comments'>` is `never` | *"drop the child accessor's ALL-LINKS-SATISFIED condition"* |
| `NonNullable<Settable<Quest>['status']>` is `'created' \| 'approved' \| 'in_progress' \| 'complete'` | *"widen `transitions.to` so `blocked` becomes reachable"* |
| `Extract<keyof Handle<Session>, 'withNestedChain'>` is `'withNestedChain'` | an extra that silently stops appearing — the positive half, which no negative case covers |

### Where the adapter lives, and why not `adapters/` in chunk 4

The map puts `adapters/` in chunk 4 for *"route helpers — an HTTP post, a file write"*. This is not
one. It is the instrument that grades chunks 1–3, nothing in the framework's import graph reaches it,
and without it not one of the thirty cases can be proven. Its shape is copied exactly from this
repo's own DSL precedent — `eslintRuleTesterAdapter` in `packages/eslint-plugin`, an adapter that
runs the external system real with an empty proxy.

`typescript` is a devDependency of the package. The package's `exports` map exposes `./contracts`,
`./brokers`, `./transformers` and `./errors` and **no `./adapters` subpath**, so no consumer can
reach the emitted file and its `require('typescript')` never fires. Open question **Q5** offers two
alternatives.

---

## 5. Chunk 1 — contracts

Pattern: `contracts/[domain]/[domain]-contract.ts` · `[domain].stub.ts` · `[domain]-contract.test.ts`.
Export is camelCase with a `Contract` suffix; the inferred type is PascalCase beside it. Tests import
the `.stub.ts`, never the contract — `ban-contract-in-tests`.

**Every contract file below exports a real zod value.** Where the subject is mostly functions — the
chain nodes — the contract validates the node's own IDENTITY DATA and the function surface arrives by
intersection. That is this repo's `eslintContextContract` pattern, cited in `get-folder-detail
({folderType:'contracts'})` under *"Mixed Data + Function Stubs"*, and it is what keeps the file
exporting something a lint rule can find.

### A1 — branded scalars

Each is a one-line zod chain with a `.brand<…>()`, a stub taking `{ value }`, and a test asserting
one valid parse and one rejection with the real message.

| path | export | PURPOSE | delivers |
|---|---|---|---|
| `src/contracts/ingredient-name/ingredient-name-contract.ts` | `ingredientNameContract` | Names one ingredient, and is what a child's `links.of` points at. Reach for this over `recipeNameContract` when the value identifies the ROW-MAKER rather than the named plan a `seed` step asks for. | *"Every property on an ingredient, and what goes in it"* |
| `src/contracts/recipe-name/recipe-name-contract.ts` | `recipeNameContract` | Names one recipe, and is the key of its entry in the generated input union. Reach for this over `ingredientNameContract` wherever the value crosses the MCP wire — a `seed` step names a recipe, never an ingredient. | *"What a recipe declares"* |
| `src/contracts/saved-record-name/saved-record-name-contract.ts` | `savedRecordNameContract` | Names one ROW inside a recipe, for `saveRecordAs` and `fromSaved`. Reach for this over a batch step's own `as:` — that names a STEP's output, and the two are different levels. | *"`as:` and `saveRecordAs` are different levels"* |
| `src/contracts/field-name/field-name-contract.ts` | `fieldNameContract` | One key on an ingredient's `fields` contract. Reach for this wherever a field is referred to by name rather than carried by value — `links.as`, `transitions.field`, `fromSaved.field`. | *"Every property on an ingredient"* |
| `src/contracts/row-ref/row-ref-contract.ts` | `rowRefContract` | A row's BUILD-TIME identity, as its ancestor path — `guild[0]/quest[2]`. Reach for this, never a runtime id: the ids do not exist while the chain builds, and `saveRecordAs` is how a runtime id travels. | *"The builder hands you HANDLES, not records"* |
| `src/contracts/row-index/row-index-contract.ts` | `rowIndexContract` | A row's 0-based position inside ITS OWN `add`, the one value `defaults(index)` receives. Reach for this over any counter that spans the plan — two separate `add(2, …)` calls both see 0 and 1. | *"`defaults` — per-row values from the index"* |
| `src/contracts/copies-target/copies-target-contract.ts` | `copiesTargetContract` | Names the production code a `write` route imitates, so a diagnosis starts at the counterpart instead of a hunt. | *"A `write` route must declare `copies:`"* |
| `src/contracts/hydration-route/hydration-route-contract.ts` | `hydrationRouteContract` | The three ways an ingredient can make its row — `api`, `write`, `recording` — each carrying a different risk. | *"Routes: how an ingredient makes its state"* |
| `src/contracts/filter-expect/filter-expect-contract.ts` | `filterExpectContract` | How many rows a `filter` must match to be satisfied. **Defaults to `some`, and a zero match THROWS** — reuses the tool's own no-pick rule. | *"`filter` selects rows that only exist at RUN time"* |
| `src/contracts/extra-verb-name/extra-verb-name-contract.ts` | `extraVerbNameContract` | Names one verb only this ingredient could have. Refuses every reserved verb, so an extra can never shadow a built-in. | *"the ten malformed declarations"* rows 5 and 6 |

- **depends on**: nothing but `zod`. `extraVerbNameContract` additionally imports
  `reservedVerbStatics`.
- **its test**, for each: `VALID: {value: 'quest'} => returns 'quest'` asserting the parsed string
  with `toBe`; `INVALID: {value: ''} => throws /…/u` asserting the real thrown message.
  `filterExpectContract` uses `it.each` over `filterExpectContract.options`, never a hardcoded list.
  `extraVerbNameContract` uses `it.each(reservedVerbStatics.verbs)` asserting each one throws.

**One statics file, because a list must not be hardcoded:**

| path | export | PURPOSE | delivers |
|---|---|---|---|
| `src/statics/reserved-verb/reserved-verb-statics.ts` | `reservedVerbStatics` | The verbs the framework owns on every row, which an ingredient's `extras` may never shadow. One source, read by the `ExtrasFree` type, by `extraVerbNameContract` and by the tests that enumerate them. | *"Three tiers, and only the middle one is written per entity"* |

- **its test**: `VALID: {} => holds exactly set, setRaw, remove, saveRecordAs` with `toStrictEqual`.
- The statics folder is not in the map's table. It is here because `get-testing-patterns` under
  *"No Magic Numbers"* and *"Parameterize State Matrices"* forbids a hardcoded list in either the
  implementation or the tests, and three files read this one.

### A2a — the declaration's parts

**`src/contracts/saved-ref/saved-ref-contract.ts`** → `savedRefContract`

- PURPOSE: A cross-link to a row the tree cannot reach, as DATA the runner resolves. Reach for this
  over a link wherever the parent is not an ancestor — a link is structural, this is a name pointing
  sideways.
- depends on: `saved-record-name`, `field-name`.
- delivers: *"`fromSaved({ name, field })` — a cross-link to a row the tree cannot reach"*,
  *"A link to something that is NOT an ancestor is a cross-link"*.
- its test: `VALID: {name: 'origin', field: 'sessionId'} => returns {__savedRef: true, name: 'origin', field: 'sessionId'}` with `toStrictEqual`; `VALID: {name: 'origin'} => returns the ref with no field key` (OMIT an optional property — `exactOptionalPropertyTypes`); `INVALID: {name: ''} => throws`.

**`src/contracts/field-values/field-values-contract.ts`** → `fieldValuesContract`

- PURPOSE: The values one op carries onto a row, each either a literal or a `SavedRef` the runner
  resolves first. Reach for this over a bare record wherever a value may have come from
  `fromSaved`.
- depends on: `field-name`, `saved-ref`.
- delivers: *"A plan is data, and one plan runs three ways"*.
- its test: `VALID: {title: 'The running one'} => returns {title: 'The running one'}`;
  `VALID: {userRequest: SavedRefStub()} => returns the ref unchanged`;
  `INVALID: {'': 'x'} => throws`.
- **Supporting type beside the export**: `FieldValuesFor<TFields> = { [K in keyof TFields]?:
  TFields[K] | SavedRef }` — the generic form `Settable` and `where` both narrow through.

**`src/contracts/link-spec/link-spec-contract.ts`** → `linkSpecContract`

- PURPOSE: One foreign key on a row — the parent's NAME and the field on THIS row carrying its id.
  Reach for this over passing a parent id by hand: the runner fills every one, and nothing else may.
- depends on: `ingredient-name`, `field-name`.
- delivers: *"`links` — the foreign keys, named by parent NAME"*, *"Linking a child to its parent"*.
- its test: `VALID: {of: 'guild', as: 'guildId'} => returns {of: 'guild', as: 'guildId'}`;
  `INVALID: {of: 'guild'} => throws /Required/u`.
- **Supporting type**: `LinkSpecFor<TFields, TParentName extends string> = { of: TParentName; as:
  keyof TFields }`. **`TParentName extends string` is the literal-preserving form Part 5 calls
  `of: string`** — see §8, it is one of the files the ESLint entry must cover.
- **The direction is load-bearing**: *"A link names its parent by NAME, never by reference … an
  inference cycle, and TypeScript answers `TS7022`"*. No file below holds a reference to a parent
  ingredient.

**`src/contracts/transition-spec/transition-spec-contract.ts`** → `transitionSpecContract`

- PURPOSE: The one field on an ingredient whose value is reached by WALKING rather than writing, and
  the end states a caller may ask for. Reach for this over widening `fields` — `to` being NARROWER
  than the field's own type is what makes `set({ status: 'blocked' })` refuse to compile.
- depends on: `field-name`.
- delivers: *"`transitions` — the field that is walked rather than written"*, *"`to` being narrower is
  the point"*.
- its test: `VALID: {field: 'status', to: ['created','approved']} => returns both`;
  `INVALID: {field: 'status', to: []} => throws` (an empty `to` reaches nothing);
  `INVALID: {to: ['created']} => throws /Required/u`.
- **Supporting types**: `TransitionSpecFor<TFields>` — the distributive mapped union in
  `transition-spec-contract.ts`, `{ [K in keyof TFields]: { field: K; to: readonly TFields[K][] } }[keyof
  TFields]` — which is what makes D1 and D2 compile errors. `ReachFn<TTarget, TValue>` arrives by
  intersection; `reach` is a function and stays out of the zod half.

**`src/contracts/hydration-routes/hydration-routes-contract.ts`** → `hydrationRoutesContract`

- PURPOSE: How an ingredient's row actually gets made, as one function per route, with at least one
  required. Reach for this over a route on the recipe — the TARGET picks, which is what lets an
  integration test with no server into the catalogue at all.
- depends on: `hydration-route`.
- delivers: *"`routes` — one function per way of making the row"*, *"AN INGREDIENT declares the
  routes; a recipe does not"*, *"An ingredient with only one route, and what it costs"*.
- its test: `VALID: {write: fn} => returns the write route`; `VALID: {api: fn, write: fn} => returns
  both`; `INVALID: {} => throws /at least one route/u` — the runtime half of D4.
- **Supporting types**: `RouteFn<TTarget>`, `RoutesFor<TTarget>` (the three-branch union in
  `hydration-routes-contract.ts` that forces at least one), and `CopiesFor<R>` — `R extends { write:
  RouteFn<never> } ? { copies: CopiesTarget } : { copies?: never }`, which is what makes D3 a compile
  error.
- Functions are validated with `z.custom`, never `z.function()` — the folder detail records that
  `z.function()` breaks inference.

**`src/contracts/hydration-target/hydration-target-contract.ts`** → `hydrationTargetContract`

- PURPOSE: The one thing the framework knows about any repo's target — whether a server is reachable.
  Reach for this as the CONSTRAINT on `createHydration<TTarget>`; the target's own shape is the
  repo's, and the framework names neither files nor SQL.
- depends on: nothing but `zod` and `@dungeonmaster/shared/contracts` for `Url`.
- delivers: *"An ingredient for a FILE, and an ingredient for a DATABASE ROW"*, *"A plan runs without
  a server only if EVERY ingredient in it declares a `write` route"*.
- its test: `VALID: {} => returns an empty target` (a targetless caller is legal);
  `VALID: {baseUrl: 'http://localhost:3737'} => returns the url`.
- **This constraint is new and deliberate.** Every real target (`DmTarget`, `SqlTarget`) leaves
  `baseUrl` optional and stops there, which is Part 5's first Known gap: *"A plan containing an
  `api`-only ingredient cannot say so before it runs."* `HydrationTargetBase = { baseUrl?: Url }` plus
  `planRunsTransformer` (§7) gives chunk 4 everything it needs to refuse at the call. Raised as **Q6**.

### A2b — the six op kinds

Six files, one per op, each `contracts/op-<kind>/op-<kind>-contract.ts`. They are separate domain
folders rather than one file because `contracts/` allows no layer files and one file holding six
discriminated members plus six stubs plus a test outgrows 300 lines.

| path | export | holds | delivers |
|---|---|---|---|
| `src/contracts/op-create/op-create-contract.ts` | `opCreateContract` | `{ op: 'create', ingredient, ref, index, ancestors, fields }` — `fields` is `defaults(index)`'s output and nothing else | *"A plan is a TREE of ops"* row `create` |
| `src/contracts/op-set/op-set-contract.ts` | `opSetContract` | `{ op: 'set', ref, written, transition? }` — the values split into written fields and a transition | *"A plan is a TREE of ops"* row `set` · *"One verb sets state"* |
| `src/contracts/op-remove/op-remove-contract.ts` | `opRemoveContract` | `{ op: 'remove', ref }` | *"A plan is a TREE of ops"* row `remove` |
| `src/contracts/op-save-record/op-save-record-contract.ts` | `opSaveRecordContract` | `{ op: 'saveRecord', ref, name }` | *"A plan is a TREE of ops"* row `saveRecord` · *"`saveRecordAs` saves the RECORD, not an id"* |
| `src/contracts/op-filter/op-filter-contract.ts` | `opFilterContract` | `{ op: 'filter', ingredient, scope, where, expect, matchedRef, ops }` | *"A plan is a TREE of ops"* row `filter` · *"`filter` reads live state, not the plan"* |
| `src/contracts/op-extra/op-extra-contract.ts` | `opExtraContract` | `{ op: 'extra', ref, verb, args }` | *"`extras` — verbs only this ingredient could have"* — **see Q1** |

- **depends on**: `ingredient-name`, `row-ref`, `row-index`, `field-name`, `field-values`,
  `filter-expect`, `saved-record-name`, `extra-verb-name`. `op-filter` additionally holds a
  self-referential `ops` array typed against `hydrationOpContract` via `z.lazy`.
- **each test**: one `VALID:` asserting the whole parsed op with `toStrictEqual`, one `INVALID:`
  per required field, and for `op-set` one `VALID:` proving that a transition-free op omits the
  `transition` key entirely rather than carrying `undefined`.
- **each stub**: `OpCreateStub` and siblings, `StubArgument<…>` spread through `contract.parse`.

### A2c — the composites

**`src/contracts/ingredient-config/ingredient-config-contract.ts`** → `ingredientConfigContract`

- PURPOSE: Everything one ingredient declares about itself. Reach for this when writing an
  ingredient; reach for `hydrationRoutesContract` alone when the question is only how a row gets
  made.
- depends on: `ingredient-name`, `field-name`, `copies-target`, `link-spec`, `transition-spec`,
  `hydration-routes`, `extra-verb-name`, `reserved-verb-statics`.
- delivers: *"Every property on an ingredient, and what goes in it"* — every row of that table —
  and *"Table 1 — what an ingredient MUST have, and what it MAY have"*.
- its test: `VALID: {the whole quest ingredient} => returns every declared property` with
  `toStrictEqual`; `INVALID: {no description} => throws /Required/u`; `INVALID: {extras: {set: …}}
  => throws` naming the reserved verb; `INVALID: {routes: {write: fn}, no copies} => throws` naming
  `copies`.
- **Supporting types**: the generic `IngredientConfig<TTarget, TFields, TName extends string>`,
  the opaque `Ingredient<C>` and `AnyIngredient` brands, and the accessors `ConfigOf` · `FieldsOf` ·
  `RecordOf` · `NameOf` · `LinkNames` · `ExtrasFree<E>` · `Registry`, all in
  `ingredient-config-contract.ts`.
- **`TName extends string` is the second file the ESLint entry must cover** — `name` must stay a
  literal through `const` inference or D9's registry check degrades to `string extends string`.
- **`fields` and `record` are two contracts, never one**: *"A guild's id and `urlSlug` are on the
  record and not on the fields, because the server mints them — and that difference is exactly what
  makes `saveRecordAs` worth having."*

**`src/contracts/hydration-op/hydration-op-contract.ts`** → `hydrationOpContract`

- PURPOSE: One node of the plan tree, as a discriminated union over the six op kinds. Reach for this
  wherever a plan is read whole; reach for one `op-*` contract when only that kind is in hand.
- depends on: all six `op-*` contracts.
- delivers: *"A plan is a TREE of ops, and the runner walks it depth-first in declaration order"*.
- its test: `it.each` over `hydrationOpContract.options` deriving the kinds from the union itself,
  asserting each stub round-trips; `INVALID: {op: 'nope'} => throws` naming the valid discriminants.

**`src/contracts/hydration-plan/hydration-plan-contract.ts`** → `hydrationPlanContract`

- PURPOSE: What a recipe returns — the recipe's name and its ops, as data nothing has run. Reach for
  this over a hand-written summary anywhere: the listing prints this object, so there is nothing for
  a description to drift from.
- depends on: `recipe-name`, `hydration-op`.
- delivers: *"A plan is data, and one plan runs three ways"*, *"A plan being data is also what
  removes the hand-written summary sentence"*.
- its test: `VALID: {recipeName: 'guild-mid-execution', ops: [OpCreateStub()]} => returns both`;
  `VALID: {ops: []} => returns an empty plan` (a recipe that makes nothing is legal data);
  `INVALID: {no recipeName} => throws`.
- **Supporting type**: `Plan<TOut> = HydrationPlan & { readonly __out?: TOut }`. The phantom carrier
  is how `run` knows its return type while the object stays printable data. `TOut` is
  `Record<string, unknown>` in chunks 1–3 — see **Q7**.

**`src/contracts/recipe-def/recipe-def-contract.ts`** → `recipeDefContract`

- PURPOSE: What `recipe()` hands back — a callable carrying its own name, its one-line description
  and its input schema. Reach for the schema on this over a second copy anywhere: the listing prints
  it, the in-process union infers off it, and chunk 8's wire validation parses with it.
- depends on: `recipe-name`.
- delivers: *"What a recipe declares"*, *"A recipe takes typed inputs, so it can stack on what an
  EARLIER STEP made"*, *"The listing `recipes {}` prints"* row `inputs`.
- its test: `VALID: {name, description} => returns both and no inputs key`;
  `VALID: {name, description, inputs: schema} => returns the schema`;
  `INVALID: {description: ''} => throws` — a blank description degrades the listing and Part 5's
  Table 1 says nothing else reports it.
- **Supporting type**: `RecipeDef<TName extends string, TInput>` — the callable-with-properties shape
  in `recipe-def-contract.ts`, with the **two overloads ordered NO-INPUT FIRST**, because
  `() => Op[]` also satisfies the input form and the input overload would otherwise win and demand an
  argument nobody has.
- **`TName extends string` — third ESLint-entry file.**

**`src/contracts/recipe-manifest/recipe-manifest-contract.ts`** → `recipeManifestContract`

- PURPOSE: What `siegelense` reads after importing the recipes package's compiled output — every
  recipe's name, description and inputs, as static data. Reach for this over calling a recipe: the
  listing must never run anything.
- depends on: `recipe-name`, `recipe-def`.
- delivers: *"The listing `recipes {}` prints"*, *"How siegelense finds recipes without importing
  them"*.
- its test: `VALID: {one entry} => returns the entry`; `VALID: {[]} => returns an empty manifest` —
  and the test name says why: *"an empty `hydration-recipes` returns an empty list, meaning no
  recipes yet"*; `INVALID: {two entries sharing a name} => throws` naming both.
- `runs` and `makes` are NOT stored here. They are computed off a plan by `planRunsTransformer` and
  `planMakesTransformer` (§7), because Part 5 says the listing *prints the plan*.

**`src/contracts/seed-step/seed-step-contract.ts`** → `seedStepContract`

- PURPOSE: One `seed` step in a batch — a recipe name, its params and the `as:` that names the step's
  output. Reach for this over flattening the params onto the step: a recipe input named `as`, `step`
  or `recipe` would shadow the step's own keys, and the collision is silent.
- depends on: `recipe-name`.
- delivers: *"Steps that are new"* (`seed`), *"Inputs go in their own `params` object, never
  flattened onto the step"*, and rows 14–17 of *"What the compiler enforces"*.
- its test: the four fixture rows, plus `VALID: {step:'seed', recipe:'guild-mid-execution', as:'g'}
  => returns the step with no params key`.
- **Supporting types**: `SeedStepFor<TInputs, K extends keyof TInputs & string>` and
  `SeedStep<TInputs>`, in `seed-step-contract.ts`. The per-repo `RecipeInputs` map is generated
  from the manifest and belongs to the consumer, not here — the fixture tree supplies a stand-in.
- **`K extends keyof TInputs & string` — fourth ESLint-entry file.**

**A2d is §6** — the fourteen error classes are a different folder type and get their own section.

### A2e — the chain's types

The last two files in this section — `filter-args` and `type-diagnostic` — belong to groups A2c and
B1 respectively, and sit here because they are read alongside the chain's types.

Three files. Each exports a zod contract over the chain node's own IDENTITY DATA — the fields the
transformer needs anyway to build an op — and the verb surface arrives by intersection.

**`src/contracts/hydration-collection/hydration-collection-contract.ts`** → `hydrationCollectionContract`

- PURPOSE: A set of rows you may still `add` to — what a registry accessor and a child accessor both
  are. Reach for `matchedSetContract` instead when the rows already exist: a filtered set knows no
  count, so it has no index and no `add`.
- depends on: `ingredient-name`, `row-ref`, `field-values`, `filter-expect`, `ingredient-config`,
  `ingredient-handle`.
- delivers: *"`add(n, build)` — creates n rows"*, *"`under({ … })`"*, *"A literal `n` types the handle
  list as a fixed-length tuple"*, *"`all` is a second ARGUMENT to `add`'s builder"*, *"Entry points:
  one per registered ingredient"*.
- its test: rows 1 and 9 of the negative table, and the tuple SHAPE assertions.
- **Supporting types**: `Tuple<T, N extends number>` (the recursive accumulator in
  `hydration-collection-contract.ts`, degrading to `T[]` for a widened `number`), `Handles<R, I, N, Anc>`,
  `Collection<R, I, Anc>`, `Entry<R>`, `FilterArgsFor<I>`.
- **`N extends number` appears twice here — fifth ESLint-entry file**, and the widest one.
- `add` is `<N extends number>(count: N, build: (rows, all) => Op[]) => Op` — **no `const`
  modifier**, per §3.

**`src/contracts/ingredient-handle/ingredient-handle-contract.ts`** → `ingredientHandleContract`

- PURPOSE: One row the chain will make, and every verb that may be called on it. Reach for this over
  a record: nothing has been created when the builder runs, so `q[0].id` is not readable and must not
  be made so.
- depends on: `ingredient-name`, `row-ref`, `field-values`, `ingredient-config`, `saved-ref`.
- delivers: *"The chain: every call names what it affects"*, *"One verb sets state, and the
  INGREDIENT decides whether that means a walk"*, *"Every verb but `add` takes an object"*,
  *"A child accessor appears on its IMMEDIATE parent only"*, *"Three tiers, and only the middle one
  is written per entity"*.
- its test: rows 2, 3, 4, 5, 6, 7a, 7b of the negative table, and the child-accessor and `Settable`
  SHAPE assertions.
- **Supporting types**: `RowVerbs<I>` · `ExtraMethods<I>` · `ChildAccessors<R, Host, Anc>` ·
  `Settable<I>` · `Handle<R, I, Anc>`.
- **`ChildAccessors` carries BOTH conditions.** The host must be named in the child's own `links`,
  AND every one of that child's links must be satisfied by something already in the ancestor chain.
  Part 5 measured that *"Condition 2 alone gives you the second case wrong … dropping it makes
  `q[0].sessions` compile."*
- **`Settable<I>` narrows the transition field to `TransitionTo<I>` and admits a `SavedRef`** — §3.

**`src/contracts/matched-set/matched-set-contract.ts`** → `matchedSetContract`

- PURPOSE: The rows a `filter` matched, which exist only at RUN time. Reach for this over a
  collection wherever the count is a fact about the gates rather than about the recipe — it has no
  index and no `add`, and the type is the statement.
- depends on: `ingredient-name`, `row-ref`, `field-values`, `filter-expect`, `ingredient-config`.
- delivers: *"`filter` selects rows that only exist at RUN time"*, *"`expect` reuses the tool's own
  no-pick rule"*.
- its test: rows 8 and 9, and the `Matched` SHAPE assertion.
- **Supporting type**: `Matched<I> = RowVerbs<I> & ExtraMethods<I>`. *"what you may then call: `set`,
  `setRaw`, `saveRecordAs`, `remove`, and that ingredient's extras"* — and nothing else.

**`src/contracts/filter-args/filter-args-contract.ts`** → `filterArgsContract`

- PURPOSE: What `filter` is asked for — a match object and how many rows satisfy it. Reach for a
  match OBJECT, never a closure: a predicate cannot cross the MCP wire.
- depends on: `field-values`, `filter-expect`.
- delivers: *"`filter` selects rows that only exist at RUN time"* — the `where` and `expect` rows.
- its test: rows 10 and 11; `VALID: {where: {role: 'ward'}} => returns expect 'some'` asserting the
  default is applied.

**`src/contracts/type-diagnostic/type-diagnostic-contract.ts`** → `typeDiagnosticContract`

- PURPOSE: One TypeScript diagnostic, reduced to what a negative-case assertion needs — the fixture,
  the line and the error code. Reach for this over the compiler's own `Diagnostic`: that carries a
  `SourceFile` and cannot be compared with `toStrictEqual`.
- depends on: `@dungeonmaster/shared/contracts` for `RepoRelativePath` and `LineCount`.
- delivers: the mechanism §4 chooses; no Part 5 heading names it.
- its test: `VALID: {file, line, code: 2353, message} => returns all four`; `INVALID: {code: 0}
  => throws`.

---

## 6. Chunk 1 — errors

Pattern: `errors/[domain]/[domain]-error.ts`, `export class`, `this.name` set in the constructor,
context properties `readonly`, constructor taking one destructured object. **`errors/` imports
nothing** — it is a leaf, so parameters are raw strings, exactly as
`packages/shared/src/errors/guild-root-not-found/guild-root-not-found-error.ts` does.

**Every one carries `ingredientName` and `recipeName`**, because *"Every error is an `errors/` class
carrying the ingredient and the recipe name … a failure inside a five-ingredient plan is unreadable
without both."*

Each test asserts the COMPLETE message string with `toStrictEqual` on `{name, message}` plus
`toBeInstanceOf`, following the shared-package precedent. **A test asserting only that the class
exists is a false positive.**

### Declaration-time — thrown by chunk 2

| path | export | PURPOSE | delivers |
|---|---|---|---|
| `src/errors/ingredient-declaration/ingredient-declaration-error.ts` | `IngredientDeclarationError` | Refuses an ingredient whose own declaration cannot be honoured — no routes, a `write` route with nothing to compare against, an extra shadowing a built-in. Reach for this over a zod message: it names the ingredient, and a consumer reaching the declaration from JavaScript gets the same refusal the types give TypeScript. | *"the ten malformed declarations"* rows 3–6 · *"Table 1"* rows `routes`, `copies`, `extras` |
| `src/errors/registry-duplicate-name/registry-duplicate-name-error.ts` | `RegistryDuplicateNameError` | Refuses two ingredients sharing a `name` in one registry, naming BOTH keys. **The one malformed declaration no type catches**, so this class is the whole check. | *"the ten malformed declarations"* row 10 · *"Known gaps"* row `Two ingredients may share a `name`` |
| `src/errors/registry-dangling-link/registry-dangling-link-error.ts` | `RegistryDanglingLinkError` | Refuses a `links.of` naming an ingredient this registry does not hold, naming the link and the names it does hold. The runtime counterpart of the compile error, for a caller that never typechecked. | *"the ten malformed declarations"* row 9 |

### Pre-flight — defined here, thrown by chunk 4

*"Before the first write — computed off the plan alone"*.

| path | export | PURPOSE |
|---|---|---|
| `src/errors/hydration-route-unavailable/hydration-route-unavailable-error.ts` | `HydrationRouteUnavailableError` | Refuses a plan whose ingredient needs a route this target cannot serve, naming the ingredient, the routes it has and what the target lacks — before anything is on disk, never partway through. |
| `src/errors/hydration-saved-record-missing/hydration-saved-record-missing-error.ts` | `HydrationSavedRecordMissingError` | Refuses a `fromSaved` naming a record no op in this plan saves, or one declared LATER, and lists the names that ARE saved. Reach for this rather than letting declaration order become folklore somebody learns from a failure. |
| `src/errors/hydration-unlinked-row/hydration-unlinked-row-error.ts` | `HydrationUnlinkedRowError` | Refuses a row whose `links` no ancestor supplies — including one added at TOP LEVEL, which the type system hands out freely — naming the ingredient and the link it cannot fill. |

- delivers, all three: *"The runner's refusals split into two groups"* (the before-the-first-write
  table) and *"Known gaps"* row *"A row added at TOP LEVEL whose `links` nothing supplies compiles
  clean"*.

### Mid-run — defined here, thrown by chunk 4

*"Mid-run — they depend on what the app actually did"*, and every row of *"The sad paths, which no
type catches"*.

| path | export | PURPOSE | the sad-path row |
|---|---|---|---|
| `src/errors/hydration-route-failed/hydration-route-failed-error.ts` | `HydrationRouteFailedError` | Halts a plan whose route threw, naming the ingredient, the route and the URL, and **carrying the response body verbatim** — that body is usually the real diagnosis. | the connection is refused · the server answers 4xx or 5xx |
| `src/errors/hydration-record-shape/hydration-record-shape-error.ts` | `HydrationRecordShapeError` | Halts a plan whose route answered 2xx with a shape `record` rejects, naming the field. Reach for this over letting the row through: a silently wrong record poisons every `fromSaved` and every link after it. | 2xx with a shape `record` rejects |
| `src/errors/hydration-write-failed/hydration-write-failed-error.ts` | `HydrationWriteFailedError` | Halts a plan whose `write` route could not write, naming the PATH and not just the errno. | `EACCES`, `ENOSPC`, a read-only mount |
| `src/errors/hydration-transition-refused/hydration-transition-refused-error.ts` | `HydrationTransitionRefusedError` | Halts a plan whose gates refused a transition, naming `from`, `to` and what the gate said. "Cannot go to in_progress from created" is a real answer; a stack trace is not. | `reach` throws |
| `src/errors/hydration-filter-expectation/hydration-filter-expectation-error.ts` | `HydrationFilterExpectationError` | Halts a plan whose `filter` matched fewer rows than `expect` allows, naming the ingredient, the `where` and what WAS there. Reach for this over `HydrationQueryFailedError`: one means the row was not there, the other means the app was unreachable, and conflating them is a bug. | a `filter` matched fewer rows than `expect` allows |
| `src/errors/hydration-query-failed/hydration-query-failed-error.ts` | `HydrationQueryFailedError` | Halts a plan whose `filter` could not query at all. Reach for this over `HydrationFilterExpectationError` whenever the app did not answer — the distinction is the diagnosis. | the query fails mid-plan |
| `src/errors/hydration-transaction-rolled-back/hydration-transaction-rolled-back-error.ts` | `HydrationTransactionRolledBackError` | Reports that a database-backed plan was undone whole, naming the op that triggered it. | the transaction rolls back |

**Two sad-path rows get no error class, deliberately.** *"the parent directory does not exist"* — the
runner **creates it**, because *"binding under an absent directory failed as `EACCES`, not `ENOENT`,
and three sessions read it as permissions"*. *"two ops race the same file"* — the runner is SERIAL,
*"and that is a requirement, not an implementation detail"*. Both are chunk 4 behaviours, recorded
here so chunk 4 does not reach for a class that should not exist.

**Two sad-path rows belong to `siegelense`, not here.** *"the recipes package was never built"* is a
discovery failure, and *"a recipe's params fail validation"* fires at the `seed` step's wire
boundary. Both are chunk 8. Raised as **Q8**.

---

## 7. Chunks 2 and 3 — brokers and transformers

### Chunk 2 — the declaration surface

**`src/brokers/ingredient/declare/ingredient-declare-broker.ts`** → `ingredientDeclareBroker`

- PURPOSE: Declares one ingredient — the identity, the two contracts, the routes and whatever it opts
  into. Reach for this over writing a config object by hand: it is where a malformed declaration is
  refused, and the refusal a consumer sees from JavaScript is the same one the types give TypeScript.
- depends on: `ingredient-config`, `hydration-routes`, `reserved-verb-statics`,
  `IngredientDeclarationError`.
- delivers: *"Every property on an ingredient, and what goes in it"* · *"A whole ingredient, every
  property in use"* · *"Table 1 — what an ingredient MUST have, and what it MAY have"* · *"the ten
  malformed declarations"* rows 1–8.
- its proxy: EMPTY — `Record<PropertyKey, never>`. Nothing is mocked; the declaration is pure.
- its test:
  - `VALID: {the quest ingredient} => returns the config unchanged` — `toStrictEqual` on every
    declared property, so a dropped `copies` or a swallowed `links` entry fails.
  - `INVALID: {routes: {}} => throws 'ingredient "quest" declares no routes'` — asserting the exact
    message with an anchored regex.
  - `INVALID: {routes: {write}, copies omitted} => throws` naming `copies` and `quest`.
  - `it.each(reservedVerbStatics.verbs)` — `INVALID: {extras: {%s}} => throws` naming the verb.
  - `VALID: {defaults: (i) => ({title: 'Quest ' + (i+1)})} => defaults(0) returns 'Quest 1' and
    defaults(1) returns 'Quest 2'` — **the two-of-anything rule, asserted on VALUES**, because Table 1
    says a `defaults` that varies by nothing *"silently breaks"* it.
  - the eight declaration fixtures D1–D8, asserted through `typescriptProgramDiagnosticsAdapter`.
- **The generic signature is the subject.** `ingredientDeclareBroker<TTarget, TFields extends object,
  TName extends string, const C extends IngredientConfig<TTarget, TFields, TName>>(config: C &
  { fields: Contract<TFields> } & CopiesFor<C['routes']> & { extras?: ExtrasFree<C['extras']> })`.
  The intersections are what make D3 and D5/D6 compile errors; `ingredient-config-contract.ts` is
  where they live. **Sixth ESLint-entry file.**

### Chunk 3 — the chain, bottom up

#### D1 — the two value producers

**`src/transformers/row-ref/row-ref-transformer.ts`** → `rowRefTransformer`

- PURPOSE: Derives a row's build-time identity from where it sits in the chain — the ancestor path
  and its index. Reach for this over any minted id: ids do not exist while the chain builds, and a
  derived ref is what keeps the same plan built twice byte-identical.
- depends on: `row-ref`, `row-index`, `ingredient-name`.
- delivers: *"Determinism is structural, not a rule to remember"*, *"A plan is a TREE of ops"*.
- its test: `VALID: {ancestors: [], ingredient: 'guild', index: 0} => returns 'guild[0]'`;
  `VALID: {ancestors: ['guild[0]'], ingredient: 'quest', index: 2} => returns 'guild[0]/quest[2]'`;
  `VALID: {the same arguments twice} => returns the identical string` — the determinism assertion,
  on the value.

**`src/transformers/from-saved-ref/from-saved-ref-transformer.ts`** → `fromSavedRefTransformer`

- PURPOSE: Points a field at a row the tree cannot reach, by the name an earlier `saveRecordAs` gave
  it. Reach for this only for a CROSS-link — a parent in the ancestor chain is a `links` entry, and
  the runner fills those.
- depends on: `saved-ref`, `saved-record-name`, `field-name`.
- delivers: *"`fromSaved({ name, field })` — a cross-link to a row the tree cannot reach"*, *"A link
  to something that is NOT an ancestor is a cross-link"*.
- its test: `VALID: {name: 'origin', field: 'sessionId'} => returns {__savedRef: true, name: 'origin',
  field: 'sessionId'}`; `VALID: {name: 'origin'} => returns a ref with no field key`.
- **A forward reference is refused BEFORE the first write, not here.** This transformer is pure and
  knows nothing about declaration order; `HydrationSavedRecordMissingError` fires in chunk 4's
  pre-flight, which is where Part 5 puts it.

#### D2 — the seven op producers

Seven files under `src/transformers/op-*/`. Each output shape gets its own file — the transformers
folder inverts the extension rule, and an `includeTransition` flag on one `opSetTransformer` is
exactly the kind of option that rule forbids.

| path | export | PURPOSE | its test asserts |
|---|---|---|---|
| `transformers/op-create/op-create-transformer.ts` | `opCreateTransformer` | Builds the op that makes one row, carrying the fields `defaults(index)` produced and the ancestor chain the runner fills links from. | `VALID: {ingredient:'quest', index:1, ancestors:['guild[0]']} => returns the whole op` with `toStrictEqual`, including `ref: 'guild[0]/quest[1]'` |
| `transformers/op-set/op-set-transformer.ts` | `opSetTransformer` | Builds the op that puts values on a row, splitting them against the ingredient's `transitions.field` — the walked one goes in `transition`, everything else in `written`. Reach for `opSetRawTransformer` when the field must be written and NOT walked. | `VALID: {status:'in_progress', title:'The running one'} => returns {written:{title:'The running one'}, transition:{field:'status', to:'in_progress'}}` — one call, one plain field, one transition |
| `transformers/op-set-raw/op-set-raw-transformer.ts` | `opSetRawTransformer` | Builds the op that writes a transition field and walks NOTHING — a row the gates would never have produced, for an adversarial walk. Its name is the warning; nobody reaches for it by accident. | `VALID: {status:'complete'} => returns {written:{status:'complete'}} and NO transition key` |
| `transformers/op-remove/op-remove-transformer.ts` | `opRemoveTransformer` | Builds the op that deletes one row, or every row a filter matched. | `VALID: {ref:'guild[0]/quest[1]'} => returns {op:'remove', ref:'guild[0]/quest[1]'}` |
| `transformers/op-save-record/op-save-record-transformer.ts` | `opSaveRecordTransformer` | Builds the op that puts a row's WHOLE record on the plan's output under a name — server-assigned fields included, because the ids come along inside the record. | `VALID: {ref, name:'third'} => returns {op:'saveRecord', ref, name:'third'}` |
| `transformers/op-filter/op-filter-transformer.ts` | `opFilterTransformer` | Builds the op that selects rows at RUN time and carries the ops to apply to what it matched, scoped to the host it was called on. | `VALID: {scope:'guild[0]/quest[0]', where:{role:'riftcarver'}, expect:'one', ops:[remove]} => returns the whole op`; `VALID: {expect omitted} => returns expect 'some'` |
| `transformers/op-extra/op-extra-transformer.ts` | `opExtraTransformer` | Builds the op for a verb only this ingredient has. Reach for an extra only when no second ingredient would ever want the verb — the moment a second one would, it belongs in the framework as a capability. | `VALID: {ref, verb:'withNestedChain', args:{depth:2}} => returns the whole op` |

- delivers, collectively: *"Every chainable, with an example"*, *"A plan is a TREE of ops"*, *"One
  verb sets state, and the INGREDIENT decides whether that means a walk"*, *"`setRaw` is the escape
  hatch, and its name is the warning"*.
- Each depends on the matching `op-*` contract, `row-ref`, and (for `op-set`) `transition-spec`.

#### D3 — the recursive knot, ONE agent

**`src/transformers/matched-set-chain/matched-set-chain-transformer.ts`** → `matchedSetChainTransformer`

- PURPOSE: Builds what `filter` hands back — the row verbs and this ingredient's extras, over a set
  whose size nothing knows yet. Reach for `collectionChainTransformer` instead wherever the count IS
  known: this one deliberately has no index and no `add`.
- depends on: `matched-set`, `ingredient-config`, every `op-*` transformer, `row-ref`.
- delivers: *"`filter` selects rows that only exist at RUN time"*, rows 8 and 9.
- its test: `VALID: {filter over operations}.remove() => returns one remove op targeting the
  filter's matchedRef`; `VALID: {…}.set({text:'noop'}) => returns one set op`; `VALID: {an ingredient
  with an extra} => the extra is on the matched set`.

**`src/transformers/row-handle-chain/row-handle-chain-transformer.ts`** → `rowHandleChainTransformer`

- PURPOSE: Builds one handle — a reference to a row this `add` will make, carrying every verb the
  ingredient allows and an accessor for each child whose links this row's ancestry can fill. Reach
  for this over a record: nothing exists yet.
- depends on: `ingredient-handle`, `ingredient-config`, every `op-*` transformer,
  `collection-chain-transformer` (mutually recursive), `row-ref`.
- delivers: *"The chain: every call names what it affects"*, *"The builder hands you HANDLES, not
  records"*, *"One verb sets state"*, *"Every verb but `add` takes an object"*, *"A child accessor
  appears on exactly one host: its immediate parent"*, rows 2–7b.
- its test: `VALID: {g[0].set({name:'Siege'})} => returns one set op with written {name:'Siege'}`;
  `VALID: {g[0].quests} => returns a collection scoped to guild[0]`;
  `VALID: {q[0] on a quest} => holds no sessions accessor` asserting the runtime key set with
  `toStrictEqual`, paired with the 7a fixture;
  `VALID: {s[0].withNestedChain({depth:2})} => returns one extra op`.

**`src/transformers/collection-chain/collection-chain-transformer.ts`** → `collectionChainTransformer`

- PURPOSE: Builds a set of rows you may still add to, and is where `add` mints the handles a builder
  is handed. Reach for `entryChainTransformer` for the top level and for this one everywhere a child
  accessor hangs off a handle.
- depends on: `hydration-collection`, `ingredient-config`, `row-handle-chain-transformer`,
  `matched-set-chain-transformer`, `op-create-transformer`, `op-filter-transformer`,
  `row-ref-transformer`.
- delivers: *"`add(n, build)` — creates n rows"*, *"`all` is a second ARGUMENT to `add`'s
  builder"*, *"`under({ … })`"*, *"A recipe takes typed inputs"*, rows 1 and 9.
- its test:
  - `VALID: {add(3, (q, all) => [all.set({userRequest:'seeded'}), q[0].set({title:'first'})])}
    => returns three create ops and four set ops, in declaration order` — asserting the complete op
    array with `toStrictEqual`, which is what proves depth-first declaration order.
  - `VALID: {add(2, …) called twice} => each add's indexes are 0 and 1` — asserting the four refs,
    because *"Two separate `add(2, …)` calls both see indexes 0 and 1."*
  - `VALID: {defaults: (i) => ({title: 'Quest ' + (i+1)})} => the three create ops carry 'Quest 1',
    'Quest 2', 'Quest 3'` — the two-of-anything rule, on values.
  - `VALID: {under({guildId})} => the create op carries guildId from the input, not an ancestor`.
  - `VALID: {the whole positive fixture tree} => zero diagnostics` — the positive half of the
    experiment, proving every chainable compiles clean over a real ingredient set.

**`src/transformers/entry-chain/entry-chain-transformer.ts`** → `entryChainTransformer`

- PURPOSE: Builds the top-level accessor per registered ingredient — the object a recipe opens with.
  Reach for this over `collectionChainTransformer` only at depth zero; below that a collection comes
  from a handle's child accessor and carries its ancestors.
- depends on: `hydration-collection`, `ingredient-config`, `collection-chain-transformer`.
- delivers: *"The registry inverts them"*, *"Entry points: one per registered ingredient"*.
- its test: `VALID: {a four-ingredient registry} => returns exactly guilds, quests, operations,
  sessions` asserting the key set through `toStrictEqual` on the built object's shape;
  `VALID: {dm.quests.add(1, …) at top level} => still builds` — **and the test says why in its name**:
  the type hands out a collection for every registered ingredient, so an unsatisfiable top-level row
  compiles, and only the runner can refuse it. That is Part 5's Known gap *"A row added at TOP LEVEL
  whose `links` nothing supplies compiles clean"*, and `HydrationUnlinkedRowError` is waiting for it.

#### D4 — the three brokers, in order

**`src/brokers/registry/create/registry-create-broker.ts`** → `registryCreateBroker`

- PURPOSE: Turns named ingredients into the accessors a chain opens with, and is the one place two
  ingredients sharing a name is caught. Reach for this over an object literal of ingredients: the
  KEY is the accessor name a chain uses, and nothing else inverts the links.
- depends on: `ingredient-config`, `entry-chain-transformer`, `RegistryDuplicateNameError`,
  `RegistryDanglingLinkError`.
- delivers: *"The registry inverts them"*, *"the ten malformed declarations"* rows 9 and 10,
  *"Known gaps"* row *"Two ingredients may share a `name` inside one registry"*.
- its proxy: EMPTY.
- its test:
  - `VALID: {guilds, quests, operations, sessions} => returns one collection per key`.
  - `INVALID: {two ingredients both named 'quest'} => throws 'registry keys "quests" and "tasks"
    both declare the ingredient name "quest"'` — **both keys in the message**, asserted anchored.
    This is D10, and it is the only mechanism it has.
  - `INVALID: {an ingredient linking to 'no-such-ingredient'} => throws` naming the link and the
    names the registry holds — the runtime half of D9.
  - the D9 fixture, asserted through the adapter.
- **The compile-time half of D9 is the phantom-property intersection on `registry`'s own parameter**:
  `entries: R & (LinkNames<R[keyof R]> extends NameOf<R[keyof R]> ? unknown : {
  LINK_NAMES_AN_UNREGISTERED_INGREDIENT: LinkNames<R[keyof R]> })`. The property name IS the error
  message a caller reads. **Seventh ESLint-entry file.**

**`src/brokers/recipe/declare/recipe-declare-broker.ts`** → `recipeDeclareBroker`

- PURPOSE: Names a plan and the inputs it needs, and hands back a function that builds that plan as
  DATA. Reach for this over calling the chain directly: the name and the description are what
  `recipes {}` prints, and the input schema is what the wire validates against.
- depends on: `recipe-def`, `hydration-plan`, `recipe-name`.
- delivers: *"What a recipe declares"*, *"A recipe's description is the one a session reads when
  choosing"*, *"A recipe takes typed inputs"*, *"A plan is data, and one plan runs three ways"*,
  rows 12 and 13.
- its proxy: EMPTY.
- its test:
  - `VALID: {name, description, build returning two ops} => calling it returns {recipeName, ops}`
    with `toStrictEqual` on the whole plan.
  - `VALID: {the returned function} => carries recipeName and description as properties`.
  - `VALID: {called twice} => returns two structurally identical plans` — determinism, on values.
  - `VALID: {a builder taking {guildId}} => the ops carry the supplied guildId`.
  - the fixtures for rows 12 and 13.
- **The two overloads go no-input FIRST**, matching `recipe-def-contract.ts`. A build agent that
  reverses them gets a recipe that demands an argument nobody has.

**`src/brokers/hydration/create/hydration-create-broker.ts`** → `hydrationCreateBroker`

- PURPOSE: Instantiates the framework once for one repo's own TARGET type, and is the only place that
  type is named. Reach for this at the top of a recipes package; the framework itself names neither
  files nor SQL.
- depends on: `hydration-target`, `ingredient-declare-broker`, `registry-create-broker`,
  `recipe-declare-broker`.
- delivers: *"An ingredient for a FILE, and an ingredient for a DATABASE ROW"*, *"Three packages, and
  what may cross between them"*.
- its proxy: EMPTY.
- its test: `VALID: {createHydration<DmTarget>()} => returns exactly ingredient, registry, recipe`
  asserting the key set with `toStrictEqual`; `VALID: {the returned ingredient} => declares a quest
  against a home-directory target`; `VALID: {createHydration<SqlTarget>()} => declares a post against
  a transaction target` — **both repos, because one does not prove the framework names neither**.
- **Chunk 4 ADDS `run` to the returned object.** That is the one planned edit to a finished file.
  **Eighth ESLint-entry file.**

#### D5 — the two listing transformers

**`src/transformers/plan-runs/plan-runs-transformer.ts`** → `planRunsTransformer`

- PURPOSE: Answers whether a plan can run with no server, as an ALL over its ingredients. Reach for
  this over a union of the routes its ingredients offer — a union answers which routes appear
  anywhere, which is a different and always more optimistic question.
- depends on: `hydration-plan`, `ingredient-config`, `hydration-route`.
- delivers: *"An ingredient with only one route, and what it costs"*, *"The listing `recipes {}`
  prints"* row `runs`, *"`runs` on that listing is the line that stops a wasted run"*.
- its test:
  - `VALID: {every ingredient has a write route} => returns {serverless: true}`.
  - `VALID: {one api-only guild among three writable ingredients} => returns {serverless: false,
    needsServerFor: 'guild'}` — **the ALL, asserted against a majority of writable ingredients**,
    which is the exact shape an ANY would get wrong.
  - `VALID: {two api-only ingredients} => names the first in declaration order`.

**`src/transformers/plan-makes/plan-makes-transformer.ts`** → `planMakesTransformer`

- PURPOSE: Counts what a plan makes, per ingredient, off the plan itself. Reach for this over a
  hand-written sentence: the thing described and the thing run are one object, so there is nothing to
  drift from.
- depends on: `hydration-plan`, `ingredient-config`.
- delivers: *"The listing `recipes {}` prints"* row `makes`.
- its test:
  - `VALID: {one guild, three quests} => returns [{ingredient:'guild', count:1}, {ingredient:'quest',
    count:3}]` with `toStrictEqual`.
  - `VALID: {a plan holding a filter} => the filtered ingredient's count is 'varies'` — *"`varies`
    wherever a `filter` or a transition decides the count"*.
  - `VALID: {a plan holding a transition} => that ingredient's minted children are 'varies'`.

---

## 8. The `ban-primitives` entry — exactly which files depend on it

`ban-primitives` refuses `N extends number` and `of: string`, and it is off only for
`**/@types/**`. `@dungeonmaster/hydration` gets its own `eslint.config.js` entry — **another agent is
adding it.** A reviewer checks the entry is wide enough and no wider against this list.

| # | File | What it carries |
|---|---|---|
| 1 | `src/contracts/hydration-collection/hydration-collection-contract.ts` | `Tuple<T, N extends number>` and `add: <N extends number>(count: N, …)` |
| 2 | `src/contracts/link-spec/link-spec-contract.ts` | `LinkSpecFor<TFields, TParentName extends string>` |
| 3 | `src/contracts/ingredient-config/ingredient-config-contract.ts` | `IngredientConfig<TTarget, TFields, TName extends string>`, `name: TName` |
| 4 | `src/contracts/recipe-def/recipe-def-contract.ts` | `RecipeDef<TName extends string, TInput>` |
| 5 | `src/contracts/seed-step/seed-step-contract.ts` | `SeedStepFor<TInputs, K extends keyof TInputs & string>` |
| 6 | `src/transformers/collection-chain/collection-chain-transformer.ts` | the `<N extends number>` implementation of `add` |
| 7 | `src/brokers/ingredient/declare/ingredient-declare-broker.ts` | `TName extends string`, `const C extends IngredientConfig<…>` |
| 8 | `src/brokers/registry/create/registry-create-broker.ts` | the `LinkNames extends NameOf` phantom-property intersection |
| 9 | `src/brokers/recipe/declare/recipe-declare-broker.ts` | the two `<TName extends string>` overloads |
| 10 | `src/brokers/hydration/create/hydration-create-broker.ts` | re-exports 7's signature bound to `TTarget` |

**`packages/hydration/src/**` is the honest scope, and it is wider than this list by design.** Every
file above is in `contracts/`, `transformers/` or `brokers/`, and narrowing the entry to three
glob patterns buys nothing once a tenth file needs it. **The entry needs a comment saying why, or
somebody deletes it** — Part 5 says so twice.

**Why not `@types/` instead.** `packages/shared/src/@types/stub-argument.type.ts` is a pure generic
type utility, in `src/@types/`, with a colocated test, where `ban-primitives` is ALREADY off. That is
a real alternative and it would need no config entry at all. It is not taken because `@types/` is
documented as being *"ONLY for augmenting built-ins"*, because a folder outside the folder-type
system gets no import rules, and because Part 5 already decided on the entry. Recorded so a reviewer
knows the alternative was considered rather than missed.

**A SECOND, unrelated entry is needed** for the fixture tree — see §4's table. Do not fold the two
together: one says "this package's generics need primitives", the other says "this directory is
deliberately broken and nothing should read it".

---

## 9. The barrels and the public surface

Four files at the package ROOT, outside `src/`, matched by tsconfig `include: ["*.ts"]` and therefore
exempt from `enforce-implementation-colocation` — no `.test.ts` needed.

| path | holds |
|---|---|
| `packages/hydration/contracts.ts` | one `export *` line per contract entry file |
| `packages/hydration/brokers.ts` | `hydration-create` · `ingredient-declare` · `registry-create` · `recipe-declare` |
| `packages/hydration/transformers.ts` | every op transformer, the four chain transformers, `from-saved-ref`, `row-ref`, `plan-runs`, `plan-makes` |
| `packages/hydration/errors.ts` | every error class |

`package.json` `exports` maps `./contracts`, `./brokers`, `./transformers` and `./errors`, each with
`source`, `import`, `require` and `types`. **No `./adapters` subpath** — §4.

**`fromSaved` and `run` are the two names Part 5 requires to be reachable from a spec tree**:
*"`run(plan, target)` is a public export of `@dungeonmaster/hydration` and … `hydration-recipes` must
be importable from a spec tree. A framework reachable only through a `seed` step would satisfy every
other line of this document and be useless to the 118 specs in step 2 of the migration."* `fromSaved`
ships here as `fromSavedRefTransformer` on `./transformers`; `run` arrives in chunk 4 through
`createHydration`.

---

## 10. Part 5 coverage check

Re-read against every Part 5 heading. A heading is listed once, against where it lands.

| Part 5 heading | Where |
|---|---|
| *"Four words this document uses, and two rules that outlive the split"* | §9 (`run` public) · `collection-chain-transformer` test (`defaults(index)`, two-of-anything) |
| *"The problem"* / *"Three packages, and what may cross between them"* | §9 · `hydration-create-broker` |
| *"Three tiers, and only the middle one is written per entity"* | `reserved-verb-statics` · `ingredient-handle-contract` (`ExtraMethods`) · `op-extra-transformer` |
| *"Every property on an ingredient, and what goes in it"* | `ingredient-config-contract` and every A2a contract |
| *"What a recipe declares"* | `recipe-def-contract` · `recipe-declare-broker` |
| *"The listing `recipes {}` prints"* | `recipe-manifest-contract` · `plan-runs-transformer` · `plan-makes-transformer` |
| *"Linking a child to its parent"* | `link-spec-contract` · `registry-create-broker` · `ingredient-handle-contract` (`ChildAccessors`) |
| *"The chain: every call names what it affects"* | `collection-chain-transformer` · `row-handle-chain-transformer` |
| *"One verb sets state, and the INGREDIENT decides whether that means a walk"* | `op-set-transformer` · `op-set-raw-transformer` · `Settable` |
| *"Every verb but `add` takes an object"* | every verb's signature in `ingredient-handle-contract`; `add` keeps its bare count |
| *"`filter` selects rows that only exist at RUN time"* | `matched-set-contract` · `filter-args-contract` · `op-filter-transformer` |
| *"A recipe takes typed inputs, so it can stack on what an EARLIER STEP made"* | `recipe-def-contract` · `seed-step-contract` · `under` on `hydration-collection-contract` |
| *"Every chainable, with an example"* | the positive fixture tree |
| *"A plan is data, and one plan runs three ways"* | `hydration-plan-contract` · §3's no-I/O rule |
| *"Determinism is structural, not a rule to remember"* | `row-ref-transformer` · `row-index-contract` |
| *"Routes: how an ingredient makes its state"* | `hydration-routes-contract` · `copies-target-contract` |
| *"An ingredient for a FILE, and an ingredient for a DATABASE ROW"* | `hydration-target-contract` · `hydration-create-broker` · both fixture ingredient sets |
| *"An ingredient with only one route, and what it costs"* | `plan-runs-transformer` · `HydrationRouteUnavailableError` |
| *"Every ingredient carries a test, and a two-route ingredient tests its routes against each other"* | **chunk 7** — an ingredient's own test needs ingredients |
| *"What the type suite proves, and what it changed"* | §4's whole table |
| *"The sad paths, which no type catches"* | §6's mid-run errors (defined) · chunk 4 (thrown) |
| *"Two kinds of probe, and neither substitutes for the other"* | §4's rationale |
| *"The combinatorial planning session"* | **chunk 12** |
| *"Known gaps, named rather than discovered later"* | Q2 · Q3 · Q6 · Q7 · §8 · §6 (D10) |
| *"Mechanics the framework has to implement"* | the op contracts · §3 · §6's two groups of refusal |
| *"How siegelense finds recipes without importing them"* | `recipe-manifest-contract` (the shape) · **chunk 8** (the walk) |
| *"Where each part lands in this repo's architecture"* | §§5–7, with every departure named in §11 |
| *"The migration IS the validation"* | **chunks 9–10** |
| *"An ingredient touches STATE, never a screen"* | **chunk 7 + the eslint-plugin rule** — no file here holds a DOM handle, and none could |
| *"Some claims can only be asserted in a BROWSER"* | **chunk 7** |
| *"What this is, in industry terms"* / *"Guidance for other repos"* | prose; `defaults(i)` as sequence and extras as traits land above |
| *"Part 6 — Steps that are new"* (`seed`) | `seed-step-contract` (the type) · **chunk 8** (the step) |
| *"A plan's output is FLAT, and there is exactly one shape"* (Part 6) | `op-save-record-contract` · `hydration-plan-contract`'s `TOut` · **Q7** |

**`recording` is declared and exercised by nothing**, which is Part 5's own Known gap.
`hydrationRouteContract` carries the value and `hydrationRoutesContract` accepts it; no fixture
ingredient uses it, so nothing about it is proven here either. That is the gap staying where it is,
not a hole this plan opened.

### Departures from the map's table, and why

| Moved | From | To | Why |
|---|---|---|---|
| `recipe` | brokers/ (unplaced in the spine) | chunk 3 | a plan is what `recipe` wraps, and there are no ops to wrap until the chain exists |
| `planRunsTransformer` · `planMakesTransformer` | unplaced (implied by chunk 8's listing) | chunk 3, `transformers/` | both are pure functions over a plan, and the ALL-not-ANY rule is a fact about PLANS that belongs in the package that owns them, where a test can pin it against a majority of writable ingredients. Chunk 8 then formats, and decides nothing. **Raised as Q9** |
| `typescriptProgramDiagnosticsAdapter` | adapters/, chunk 4 | chunk 1 | it is not a route helper; it is the only instrument that can grade the thirty cases §4 owns |
| `reservedVerbStatics` | unplaced | chunk 1, `statics/` | a list read by three files may not be hardcoded in any of them |
| `Registry` · `Entry` | unplaced | supporting types on `ingredient-config` and `hydration-collection` | contracts/ allows no layer files, and the architecture allows types supporting a file's one export to sit beside it |

---

## 10b. Amendments — what the build found wrong in this plan

**Every agent reads this section before writing a file.** Each row is a defect a build agent hit, and
the resolution it shipped. The plan text above is NOT edited to match; this table is the correction,
and where the two disagree the table wins.

**Report a new one rather than working around it silently.** A defect found once and written here
costs one agent; the same defect worked around quietly costs every agent after.

| Found by | The plan says | What is true, and what shipped |
|---|---|---|
| A1 | every A1 scalar is a zod chain ending in `.brand<…>()`, and `filterExpectContract` tests itself with `it.each` over its own `.options` | **Those two cannot both hold.** `ZodType.brand()` returns a `ZodBranded`, which exposes no `.options` — so a closed enumeration is either branded or self-testing, never both. `hydrationRouteContract` and `filterExpectContract` ship UNBRANDED, as plain `z.enum([…])` inferring the literal unions `'api' \| 'write' \| 'recording'` and `'one' \| 'some' \| 'any'`. This matches what the repo already does for small closed-value contracts. The other eight A1 scalars are branded as planned |
| A2a | `hydration-target-contract` imports `Url` from `@dungeonmaster/shared/contracts` | **That export does not exist.** Shared has `urlSlugContract`, a kebab-case slug, which is a different value. A local `Url` brand ships beside `HydrationTarget` in `hydration-target-contract.ts` |
| A2a | the Q6 ruling constrains `TTarget extends HydrationTargetBase` | **There is no `HydrationTargetBase` export.** `HydrationTarget` fills that role. Import it and `Url` from `hydration-target-contract` |
| A2a | A2c and A2b type against `FieldValues` | **Type against `FieldValuesFor<TFields>`**, which sits beside it in the same file. `fieldValuesContract`'s zod-inferred type is deliberately coarse, because this generic layer cannot know an ingredient's own field types |

| B1 | section 4's wiring never says the compiler adapter needs fixtures of its own to prove itself | it does. `packages/hydration/test/adapter-fixtures/` is B1's, a sibling of group E's `test/type-fixtures/`, with its own `exclude` and `ignores` entries. Group E does not write into it |
| B1 | contracts need no inline brands beyond the A1 scalars | **`require-zod-on-primitives` is a DIFFERENT rule from `ban-primitives`, and the carve-out does not touch it.** It still fires inside `packages/hydration/src/contracts/**`, so a bare `string` or `number` field needs its own inline `.brand<…>()` |
| B1 | an adapter composing another adapter can keep an empty proxy | `enforce-proxy-child-creation` refuses that the moment the implementation imports another adapter, including shared's. Worse, `processCwdAdapterProxy()` answers with a fake `'/default/cwd'` rather than passing through, so satisfying the rule that way silently breaks real path resolution. Use node builtins directly, as `fsEnsureWriteAdapter` does |
| B1 | nothing about the working directory a suite runs in | **Ward spawns each package's jest with `cwd` set to the PACKAGE directory, not the repo root.** Code reading `process.cwd()` as the repo root resolves nowhere under a real ward run. Every fixture-owning suite resolves paths through the compiler adapter, which walks up from `__dirname`, rather than resolving them itself |

| the orchestrator | section 4 says both `exclude` edits "carry a comment" | **A tsconfig in this package carries NO comment.** Ward's typecheck broker parses `tsconfig.json` as strict JSON and its `catch` swallows the failure, leaving an empty object — so a comment does not fail loudly, it silently costs the package its real `include` and `exclude` and leaves ward discovering the wrong file set. The reasoning each `exclude` entry carries lives in `packages/hydration/CLAUDE.md` instead |

| A2d | §2 says A2d is "fourteen files" | **Thirteen classes.** §6 names 3 declaration-time, 3 pre-flight and 7 mid-run, and the Q8 ruling moved two others to siegelense. The count in §2 predates that ruling |
| A2d | errors carry their context as structured readonly properties | **They fold every value into the MESSAGE string and store no context fields**, following this repo's own error precedent in `packages/shared/src/errors/` and `packages/siegelense/src/errors/**`. Every test asserts `{name, message}`. **Chunk 4 and chunk 12 assert on the message, not on fields** — there are none to read |
| A2d | every error carries the ingredient and the recipe name | **The three declaration-time errors carry no recipe name**, because they fire from `ingredientDeclareBroker` and `registryCreateBroker`, which run before any recipe exists. The ten pre-flight and mid-run errors carry both |

| A2b | `op-filter` holds its nested `ops` array typed against `hydrationOpContract` via `z.lazy` | **Impossible as written** — `hydrationOpContract` is A2c's file, and A2c's own dependency line says it needs A2b. No contract in this repo imports another file circularly; every recursive one recurses on ITSELF, in one file. `op-filter-contract.ts` builds the six-branch union LOCALLY from its five A2b siblings plus a self-reference, using the `extend({…}) as unknown as z.ZodType<…>` idiom `widget-node-contract.ts` already uses. **A2c imports `opFilterContract` as-is; nothing needs revisiting** |
| A2b | the nested op union is a `z.discriminatedUnion` | **It is a `z.union`.** The cast that makes the recursive type compile widens the branch to a plain `ZodType`, which `discriminatedUnion` rejects with `TS2345` — confirmed by a real typecheck failure, not inferred. The error shape differs: `invalid_union` with per-branch `unionErrors`, never `invalid_union_discriminator`. **A test asserting on a nested op's failure asserts that shape** |

| A2c | `hydrationOpContract` is a discriminated union | **It is a `z.union`, for the same reason `opFilterContract` is.** A widened branch is rejected by `discriminatedUnion` wherever it appears, top level included. Branch order is create · set · remove · saveRecord · extra · filter, and `.options` exposes them in that order |
| A2c | `SeedStepFor` uses `extends void` for a paramless recipe, as the prototype does | **`@typescript-eslint/no-invalid-void-type` refuses it**, even bracketed. The sentinel is `undefined`. **A generated recipe-inputs map types a paramless recipe's entry as `undefined`, never `void`** |
| A2c | one PascalCase name per composite | **Each composite needs TWO**: a concrete `z.infer` shape for stubs and tests, and a generic for declaration-time typing. They ship as `IngredientConfigData` / `IngredientConfig<…>`, and so on — the split this package already uses for `HydrationRoutes` and `RoutesFor<TTarget>` |
| A2c | nothing about stub arguments and zod-valued fields | **A `z.custom<z.ZodTypeAny>()` field breaks `StubArgument`**, which tries to expand a schema's own methods as properties. Leave the `z.custom` generic unset so it infers `unknown` |

### Why chunk 2 comes before chunk 3, proven on this build

**Three bugs shipped in chunk 1's committed `IngredientConfig`, and every one made a real ingredient
declaration impossible.** They were found by the first agent that tried to declare one.

| The bug | What it broke |
|---|---|
| `links` typed against the CONCRETE branded spec rather than the generic one | the specification's own `links: [{ of: 'guild', as: 'guildId' }]` did not compile |
| `copies` typed against the branded OUTPUT type | the specification's own `copies: 'questPersistBroker'` did not compile |
| `transitions` carried no `reach` key at all | contradicted the amendment that `reach` receives the record, and the specification's own transitions example |

**All three passed chunk 1's own tests and shipped green.** The reason is the lesson:

> **A contract's test exercised its runtime zod parse and never its TypeScript generic.** The half that
> is hard was never run.

**So a contract whose value is its GENERIC is unproven until a real call site compiles against it.**
Its own colocated test cannot do that — a runtime parse walks the schema, not the type parameters.
The proof is a fixture that declares something real, which is exactly what the specification means by
*"get them compiling against two real ingredients before anything executes"*.

**This is the ordering rule earning its place**, and the specification predicted the outcome:

> Chunk 2 before chunk 3 is the one ordering that matters: the types must compose before the runtime is
> written. A contract's own colocated test exercises its runtime zod parse and never its TypeScript
> generic, so a contract whose value IS its generic ships green while broken.

**Apply it to every remaining group whose files are mostly types.** A green unit test over a runtime
value says nothing about them.

### The negative suite's shape, now settled by measurement

**A suite computes ONE compiler program at MODULE scope and every test reads it.** Measured on the
declaration suite: slowest test 11ms, against a whole-file cost of 1891ms paid outside any test's
timer. Ward's per-test bar never sees the compiler. **The six remaining suites follow this shape.**

**A test file must live under `src/`.** `packages/hydration/jest.config.js` sets `roots` to `src`
alone, so **a `.test.ts` anywhere under `test/` is never discovered by ward at all** — it does not
fail, it simply never runs. The fixtures live under `test/`; the suite that grades them is colocated
in `src/`, beside the thing it proves.

**A fixture holds exactly ONE diagnostic, and that takes care.** An inline callback whose contextual
type collapses once the surrounding declaration fails emits several collateral errors, and a test
keyed to one of them is keyed to an accident. Reference a pre-typed function instead of an inline
arrow wherever a fixture's error would otherwise cascade.

### Where the negative suites actually live, and why not where section 4 says

**Section 4 names the chain's own contract suites as the owners of the call-site cases. They cannot be.**
`enforce-import-dependencies` refuses a `contracts/` file importing `adapters/`, test files included,
and the compiler-diagnostics adapter is an adapter. The folders permitted to import one are exactly
the folders that group was forbidden to touch.

| Half | Fixtures | The suite grading them |
|---|---|---|
| declaration | `test/type-fixtures/declaration/` | beside `ingredientDeclareBroker`, under `src/brokers/` |
| call-site and positive | `test/type-fixtures/call-site/`, `.../positive/` | beside the diagnostics adapter, under `src/adapters/` |

**A same-folder import is always allowed**, which is why each suite sits beside something that may
already reach the adapter. Section 4's ownership table is wrong and this is the correction.

### An error's CODE depends on whether the ingredient declares any extras

**For an ingredient with no `extras`, the type that adds extra verbs is a blanket index signature.**
Under `noUncheckedIndexedAccess` that turns every property probe into *possibly undefined* rather than
*does not exist* — so a wrong call on such an ingredient reports one code, and the same wrong call on
an ingredient that declares an extra reports another.

**The rule still holds either way**: both are compile errors and the bad call is refused. What changes
is the message a reader gets, and which code a fixture must assert. **A fixture asserting the wrong
one of the two passes or fails for a reason unrelated to the rule it names**, so pick the host
deliberately and say which shape you chose.

### A coverage hole in this plan, now scheduled

**Negative-fixture rows 12 through 17 have no owner.** Section 4 attributes them to the recipe-def and
seed-step suites; group E1's file list claims only the call-site rows through 11, plus 7b and the
positive tree. **The recipe-input fixtures and the whole seed-step fixture directory are unassigned**,
and they depend on fixtures that do not exist yet.

**Group E owns them.** Its brief covers rows 12-17, the `call-site/recipe-input-*` fixtures and the
`seed-step/` fixture directory, and it adds the adapter-based assertions to both suites once B2's
ingredient sets land. A row nobody owns is a row nobody writes, which is the failure the sad-path
table taught this build once already.

### One defect found in this repo, outside this feature

**`EslintJsonReportStub` in `packages/ward` silently ignores every override.** It rest-destructures an
ARRAY, which copies index-keyed properties and never `.length`, so its `props.length > 0` test is
always false and the default wins whatever a caller passes. A2c found it while looking for a stub
precedent and deliberately did not copy it.

**It is not this feature's to fix**, and it is written here so the next agent hunting a stub precedent
does not copy it either. Reach for the `{ value: [...] }` wrapper form instead.

### Two measurements, and what they settle

**Q10 — one `ts.createProgram` over one fixture subdirectory costs about 1.0 second.** Measured across
four runs (986, 1033, 1002 and 1063 ms) against a fixture importing three real contracts plus zod's
declarations, under the adapter's own compiler options.

**Ruling: the seven suites stay SPLIT, and each builds ONE program for the whole suite.** A second
each is worth paying for colocation — a failure landing next to the diff that caused it is the whole
reason section 4 puts them there. What is not affordable is one program PER TEST.

**Superseding ruling, after a review measured the consequence.** Ward fails a run whose test exceeds
`slowFileThresholdStatics`' `testWarnMs` of 1000ms, **on time rather than on a failed assertion**. The
adapter's own two-test suite measured 1.1s, 1.4s and 1.4s across three runs and reddened every one —
on two minimal fixtures importing no real contracts. Seven suites on a program-per-test shape each
trip that bar independently, and the real fixtures import the whole chain.

**So a suite computes its diagnostics ONCE and every test in it reads that result.** One program per
suite, not per test, which is what keeps a suite near the cost of a single program however many cases
it holds.

**The mechanism has to be found, not assumed.** These are `.test.ts` files, where `jest/no-hooks`
refuses `beforeAll`. The architecture names the other half of that mechanism — a STATIC import does
its work when jest requires the test file, before any test starts — but `jest/require-hook` also
refuses a bare statement at describe scope, and whether it permits one at MODULE scope is unverified.
**Group E's first job is to establish which shape lints clean**, with a real ward run, before it
writes six suites on top of a guess.

**The allowlist fallback does not exist.** A later planning round checked: ward's documented `allowed`
key is not a thing, so there is no entry to add and no escape hatch to reach for. **The amortising
shape is the only answer, and group E does not get to skip it.**

**Two facts that round established, which narrow the shapes worth trying:**

| Fact | Consequence |
|---|---|
| `beforeAll` is lint-permitted ONLY in `*.integration.test.ts` and `*.harness.ts` | a `.test.ts` suite cannot use it, whatever else is true |
| ward excludes `beforeAll` from its slowest-single-test measurement, and the integration bar is 6000ms rather than 1000ms | an integration-named suite has both the hook and the headroom |

**So group E's experiment has a second candidate, and it may be the right one.** Q12 ruled these
suites `.test.ts`, citing `packages/eslint-plugin`'s `RuleTester`. The chunk 4-6 planner then checked
that precedent and found it runs a DSL **in process, with no temp directory and no socket** — which is
why it fits a compiler fixture. But `get-testing-patterns` calls a real run of an external system an
integration test, and four packages already colocate `.integration.test.ts` beside a BROKER, which
ward discovers with no folder-type filter.

**Establish it by running ward, not by reasoning.** The open question is whether a contract-colocated
`.integration.test.ts` reports `DISCOVERY MISMATCH` in this repo. That is one experiment and it
settles the naming for every suite in section 4. **Q12's ruling stands until that experiment
contradicts it**, and if it does, say so in the commit and rename the suites.

**Q12 — the `.test.ts` precedent is real**, confirmed by opening it:
`packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.test.ts` runs a
real ESLint `RuleTester` and is named `.test.ts`. Compiler-spawning suites in this package follow it.

### ~~One scheduled tidy, so it is not lost~~ **DONE**

**Group E's positive fixture tree (`packages/hydration/test/type-fixtures/positive/every-chainable.ts`)
is the source *"Every chainable, with an example"* copies its snippets from now**, and
`scrolls/seigelense/proto/` is deleted. The doc's `under({ … })` example matches the resolved
`recipe({ name, description, inputs }, build)` shape.

### Two traps that have each cost a round

**Verify a zod error message by RUNNING the chain before you assert on it.** `ZodError.message` is
`JSON.stringify(issues)`, so a literal double quote inside your message arrives escaped as `\"` and a
regex containing a bare `"` never matches. Write custom messages with single quotes.

**`exactOptionalPropertyTypes` is on.** An absent optional property is OMITTED, never set to
`undefined`. A top-level `filter` op has no `scope` key at all.

---

## 11. Open questions

**None of these is picked silently. Each carries a recommendation a build agent follows until someone
overrules it.**

### Rulings — read these before the questions below

**The orchestrator has ruled on every question. A build agent follows the ruling, not the
recommendation, wherever the two differ.**

| Q | Ruling |
|---|---|
| Q1 | **Accepted.** Sixth op kind `extra`. This is a finding; it goes back into Part 5's Op table |
| Q2 | **Accepted.** `filter` carries `scope`, the immediate host's `RowRef`. This closes a named Known gap and goes back into Part 5, both at the gap and beside `filter` |
| Q3 | **Accepted**, including leaving the second half open |
| Q4 | **Accepted.** `recipe({ name, description, inputs? }, build)` with a zod schema. This is a finding; it goes back into Part 5 beside *"A recipe takes typed inputs"* |
| Q5 | **Accepted, plus alternative (a).** The adapter lives in `packages/hydration/src/adapters/` AND is listed in `tsconfig.build.json`'s `exclude`. A test-only adapter has no business in a package that ships, and one config line is cheaper than finding it in `dist` later |
| Q6 | **Accepted.** `TTarget extends { baseUrl?: Url }` |
| Q7 | **Overruled in part — deferred, not dropped.** Chunks 1–3 build with an untyped `Op`, as recommended. The threading is then **chunk 3b**, its own scheduled pass before chunk 4, not a Known gap somebody picks up later. A typed plan output is a documented requirement, not an aspiration: Part 6 says *"the plan's output then carries `guild` and `target`, each typed to its own record contract"*. §12 below has the brief and the abort condition |
| Q8 | **Accepted.** Both errors belong to siegelense, chunk 8 |
| Q9 | **Accepted.** Both transformers stay in `hydration` |
| Q10 | **Accepted.** B1 measures one program and reports the wall time before the seven suites are written |
| Q11 | **Accepted.** Pre-flight, chunk 4. This is a finding; the contradiction goes back into Part 5 as a clarification |
| Q12 | **Accepted**, conditional on the precedent being real. The B1 agent opens a `packages/eslint-plugin` RuleTester suite and confirms it is named `.test.ts` before the convention is followed. A precedent nobody checked is not a precedent |

**Five findings go back into `siegelense-recipes.md`: Q1, Q2, Q4, Q7 and Q11.** They are not written
yet, and no build agent writes them — a single agent makes all five edits in one pass, once the
ledger's line numbers are settled. The document's own rule is that *"the round that finds one writes
it into the doc rather than working around it"*.

### 12. Chunk 3b — threading the saved names through the plan's output type

**Scheduled, timeboxed, and it runs after D4 lands and before chunk 4 starts.**

What it changes: every op producer returns `Op<TSaved>` rather than `Op`, `saveRecordAs({ name: 'x' })`
returns `Op<{ x: RecordOf<I> }>`, `add`'s builder is inferred as a tuple rather than an array so the
children's saved types survive, and `recipe`'s returned `Plan<TOut>` is the union of everything saved
beneath it.

The mechanism to try first: a `const` type parameter on the builder's return — `build: <const Ops
extends readonly Op<unknown>[]>(rows, all) => Ops` — so a fresh array literal infers as a tuple, then
a `SavedOf<Ops>` conditional unions the phantom types. Nested `add` collapses its children's union
into its own.

**The abort condition, which matters more than the attempt.** If threading produces a `TS7022`
inference cycle, degrades any existing negative case to `any`, or makes the out-of-bounds tuple check
stop firing, **stop and write it up**. That is a real finding about the design's limits and it goes
into Part 5 beside *"A plan's output is FLAT"*. It is not a failure to hide by loosening a type.

Run §4's whole negative suite before and after. A pass that leaves the suite green but silently
weaker is the outcome this plan's mutation testing exists to catch.

**Q1 — Part 5's Op table has five rows and extras have no op.** *"Each becomes a method on that
ingredient's rows and on nothing else, taking one object typed by its contract"* — but *"A plan is a
TREE of ops"* lists `create`, `set`, `remove`, `saveRecord`, `filter` and nothing for an extra.
**Recommendation: a sixth op kind, `extra`, carrying `{ ref, verb, args }`.** It is the smallest
thing that keeps a plan printable and keeps the runner's dispatch a single switch. Write the finding
back into Part 5's Op table.

**Q2 — a `filter` inside a nested `add` has undefined scope**, and Part 5's Known gaps says *"Decide
it before anyone writes one."* **Recommendation: the `filter` op carries `scope`, the immediate
host's `RowRef`, and the runner matches only rows whose ancestor chain contains it.** Reasons: it is
the reading `q[0].operations.filter(…)` already suggests; it is the only reading that survives two
guilds in one plan; and putting it in the DATA means chunk 6 implements a decision rather than making
one. The alternative — instance-wide — lets a recipe holding two guilds delete ward items belonging to
a quest it did not create.

**Q3 — `fromSaved` is not typed against the field it lands in. ADOPTED**: `Settable<I>` types a plain
field as `{ [K in keyof F]?: F[K] | SavedRef }`, so the cast is gone. The second half — typing the
SAVED field against the LANDING field — stays open, because it needs the saved names threaded through
the plan's output type (Q7).

**Q4 — the listing must print each recipe's inputs. ADOPTED**: `recipe({ name, description, inputs? }, build)` where `inputs` is a zod schema.
One declaration, three readers — the printed line, the in-process union via `z.infer`, and chunk 8's
wire validation. It also closes most of Part 5's gap *"The MCP wire has no compile-time check at
all"*, because the schema is declared rather than generated. The cost is that `recipe-def` imports
`zod`, which `contracts/` already may.

**Q5 — where the tsc-diagnostics adapter lives.** Recommended: **`packages/hydration/src/adapters/`,
`typescript` as a devDependency, no `./adapters` subpath in `exports`.** Two alternatives, both
defensible: (a) additionally list the adapter in `tsconfig.build.json`'s `exclude` so it never
reaches `dist` at all — belt and braces, one more config line; (b) put it in
`@dungeonmaster/testing`, which already holds `adapters/typescript/*` and already depends on
`typescript`. **(b) is the right home on the SECOND consumer and the wrong one today** — which is
this document's own rule for promoting a capability verb, applied to a tool.

**Q6 — should `hydrationCreateBroker` constrain `TTarget`? ADOPTED**:
`hydrationCreateBroker<TTarget extends HydrationTargetBase>()` where
`HydrationTargetBase = { baseUrl?: Url }`. It is one optional property, both real targets (`DmTarget`,
`SqlTarget`) already have it, and it is what lets `planRunsTransformer` and chunk 4's pre-flight refuse
a targetless run at the call instead of partway through with half a plan on disk.

**Q7 — Part 5 claims a typed plan output and none is delivered yet.** *"the plan's output
then carries `guild` and `target`, each typed to its own record contract"*, but `recipeDeclareBroker`
still types a recipe as returning `Plan<Record<string, unknown>>` today. **Recommendation, still
followed: keep `Record<string, unknown>` in chunks 1–3 and log this as a Known gap.** Threading saved
names through the op return type means every verb
returns `Op<TSaved>` rather than `Op`, which changes the signature of all seven op producers — too
large a change to make on the same pass that first gets them compiling. It is worth doing once the
chain is proven, and it would close Q3's second half at the same time.

**Q8 — who owns `RecipeParamsInvalidError` and the never-built-recipes-package refusal.** Both sad
paths fire at siegelense's boundary, not inside a plan. **Recommendation: `packages/siegelense`, in
chunk 8.** Part 5's rule is that every error carries the ingredient and the recipe name; neither of
these has an ingredient, which is the tell that they are not the framework's.

**Q9 — do `planRunsTransformer` and `planMakesTransformer` belong in chunk 3 or chunk 8?** They are
planned here, in `hydration`. **Recommendation: keep them here.** The ALL-not-ANY rule is Part 5's
sharpest listing requirement and it is a fact about a plan; a test in `hydration` can pin it against
a plan whose ingredients are mostly writable, which is the case an ANY gets wrong. If a reviewer
moves them, they move whole — the contracts they return move with them.

**Q10 — how expensive is one `ts.createProgram` per owning test?** Seven tests each build their own
program over their own fixture subdirectory. A minimal `skipLibCheck`, `lib: ['lib.es2022.d.ts']`
program compiling a handful of files is quick, but these fixtures additionally pull in the package's
real contracts and zod's declarations. **Recommendation: the B1 agent measures ONE program
over one subdirectory and reports the wall time.** Under about a second each, leave the seven split —
colocation is worth it, and a failure landing next to the diff that caused it is the whole point.
Over that, collapse them into one suite owned by `collection-chain-transformer.test.ts` and say in
the commit that colocation was traded for run time.

**Q11 — Part 5 says a forward reference is caught in two different places.** *"Every chainable, with
an example"* says *"**A forward reference is a build error.** Records are created in declaration
order … and the builder says so"*, which reads as chunk 3. *"Mechanics the framework has to
implement"* puts *"a `fromSaved` names a record no op in this plan saves, or one declared LATER"* in
the before-the-first-write table, which is chunk 4's pre-flight, and Part 3A agrees with the latter.
**Recommendation: chunk 4's pre-flight, with `HydrationSavedRecordMissingError`.** The chain builds
one op at a time and has not seen the whole plan when a `fromSaved` is written, so "declared later"
is not a question it can answer; the pre-flight walks the finished op tree and can. Nothing is lost —
the pre-flight still runs before the first write, which is the property Part 5 actually wants. Write
the finding back into *"Every chainable"*.

**Q12 — `.test.ts` or `.integration.test.ts` for the suites that spawn a compiler?**
`get-testing-patterns` calls a real run of an external system an integration test, and also says
integration tests are only for startup files and flows. `packages/eslint-plugin` resolves the same
conflict by using `.test.ts` for its RuleTester suites. **Recommendation: `.test.ts`, following that
precedent.** It keeps ward's folder-type → check-type mapping unsurprising — a contract and a
transformer have `unit` and nothing else — and it avoids an `.integration.test.ts` colocated with a
contract, which would report `DISCOVERY MISMATCH`. The cost is that `beforeAll` is unavailable, so
each test builds its own program; Q10 is where that is measured.
