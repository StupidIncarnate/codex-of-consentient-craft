# Chunks 4, 5, 6 and 6b — the runner, and everything it executes

`run(plan, target)`: the depth-first walk, link resolution, route dispatch, every pre-flight refusal,
`transitions`/`reach`, `filter` reading live state, `fromSaved` resolving — and **every row of Part 5's
sad-path table, as behaviour with its own named test.**

**All paths are relative to the worktree root
`/home/brutus-home/projects/codex-of-consentient-craft/worktrees/recipes-doc`.** Never the main
checkout.

**The specification is `scrolls/seigelense/siegelense-recipes.md`, Part 5.** Every `delivers` below
quotes a Part 5 heading verbatim. Where Part 3A differs from Part 5, Part 5 wins.

**The chunk 1–3 plan is `scrolls/seigelense/plans/recipes-chunk-01-03-framework-types.md`.** Its
§10b Amendments and §11 Rulings are inherited here and are not re-opened. Where that plan's body and
its §10b disagree, §10b wins — and that applies to this plan too.

---

## 0. What is on disk, and what this plan is written against

**Four agents have each found the chunk 1–3 plan wrong about something, so this plan was written
against the code, not against that document.** What follows was read file by file on 2026-09-16.

### On disk and finished

| | |
|---|---|
| `src/contracts/` | **23 domains** — every A1 scalar, every A2a part (`saved-ref`, `field-values`, `link-spec`, `transition-spec`, `hydration-routes`, `hydration-target`), all six A2b op kinds, plus `type-diagnostic`. Each with a `.stub.ts` and a `-contract.test.ts` |
| `src/errors/` | **13 classes**, all of them, each with a test |
| `src/statics/` | `reserved-verb-statics` (`['set','setRaw','remove','saveRecordAs']`), `hydration-statics` |
| `src/adapters/typescript/program-diagnostics/` | the tsc-diagnostics adapter, its empty proxy, its test, and `test/adapter-fixtures/{clean,one-error}.ts` |
| `packages/hydration/CLAUDE.md` | written, and it already carries the two tsconfig `exclude` reasons and the "ward runs jest with `cwd` at the package directory" rule |

### NOT on disk — chunk 4 is gated on all of it

| Missing | Group in the 1–3 plan |
|---|---|
| `ingredient-config` · `hydration-op` · `hydration-plan` · `recipe-def` · `recipe-manifest` · `seed-step` | A2c |
| `hydration-collection` · `ingredient-handle` · `matched-set` · `filter-args` | A2e |
| every `src/transformers/**` | D1 · D2 · D3 · D5 |
| every `src/brokers/**` | C1 · D4 |
| the root barrels `contracts.ts` · `brokers.ts` · `transformers.ts` · `errors.ts` | F |

**So chunk 4 cannot finish before chunk 3's D4 lands.** §1 splits chunk 4 into the part that can be
written TODAY against contracts already on disk, and the part that waits.

### Six things the code says that the chunk 1–3 plan does not

Each was read, and each changes a file below.

| Found in | What is true |
|---|---|
| `transition-spec-contract.ts` | `transitionSpecContract` is `{ field, to }` — **no `reach`**. `ReachFn<TTarget, TValue>` is declared in the same file, exported, and **nothing imports it**. Chunk 5 is what wires it on, through `ingredient-config`'s intersection. And `proto/ingredients.ts` declares `transitions: { field, to }` with no `reach` either, so the prototype never proved that half |
| `hydration-routes-contract.ts` | `RouteFn<TTarget>` is `({ target, fields }) => unknown`. The route receives **no record, no row identity, no recipe name** — which is why `set` on an existing row, `remove` and `filter`'s query have nowhere to land. See **Q2** |
| `op-filter-contract.ts` | `scope` is `rowRefContract.optional()` and `matchedRef` is required. `exactOptionalPropertyTypes` is on, so a top-level filter **omits the `scope` key entirely** rather than setting it `undefined` |
| `op-create-contract.ts` | `ancestors` is `RowRef[]`, not ingredient names. The runner recovers an ancestor's ingredient from the ref's last segment — hence `rowRefIngredientTransformer` below |
| the 13 error classes | they **fold every value into the message and store no fields**. Every test asserts `{ name, message }` with `toStrictEqual` plus `toBeInstanceOf`. Their exact message strings are transcribed in §6 so no agent guesses one |
| `install-testbed-create-broker.ts` | the testbed's temp-dir property is **`guildPath`**, not `projectPath`. The repo-root `CLAUDE.md` says `testbed.projectPath`; that field does not exist on `InstallTestbed`. Use `testbed.guildPath`, as `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.integration.test.ts:27` does |

---

## 1. Build order, with the parallel groups marked

Three agents work from this at once. A group may be written in parallel; a group waits for every
group above it. **A gate is a hard stop — starting past one produces files that do not compile.**

### Group R0 — startable TODAY, in parallel with chunks 2 and 3

Twelve files. **Every one depends only on contracts already on disk.** This is the whole reason
chunk 4 is not idle until D4 lands.

| Agent | Files |
|---|---|
| **R0-α** | `guards/is-saved-ref/` · `transformers/row-ref-ingredient/` · `transformers/route-select/` |
| **R0-β** | `contracts/http-response/` → `adapters/fetch/post/` · `adapters/fs/ensure-write/` |
| **R0-γ** | `contracts/route-failure/` → `transformers/route-failure/` · `contracts/write-failure/` → `transformers/write-failure/` · `transformers/saved-ref-resolve/` · `transformers/field-values-resolve/` |

Inside R0-β and R0-γ the arrows are sequential (the transformer parses into its contract); across the
three agents nothing is shared.

> **GATE A — A2c has landed.** `hydration-op-contract.ts`, `hydration-plan-contract.ts` and
> `ingredient-config-contract.ts` exist and their own tests are green.

### Group R1 — the plan-shaped transformers, three agents in parallel

| Agent | Files |
|---|---|
| **R1-α** | `contracts/op-description/` → `transformers/op-describe/` · `contracts/route-plan/` |
| **R1-β** | `transformers/plan-saved-names/` · `transformers/plan-fold-writes/` |
| **R1-γ** | `contracts/hydration-run-state/` · `contracts/hydration-run-result/` · `transformers/link-values/` |

### Group R1H — the harness, one agent, parallel with R1

`test/harnesses/file-target/file-target.harness.ts`. It needs only `installTestbedCreateBroker` and
node builtins, so it is the longest-lead item after R0 and nothing in R2/R6 can be tested without it.
**Start it with R1, not after.**

> **GATE B — D4 has landed.** `registryCreateBroker`, `recipeDeclareBroker` and
> `hydrationCreateBroker` exist, and `hydrationCreateBroker` returns `{ ingredient, registry, recipe }`.

### Group R2 — the runner, ONE agent, sequential

**Do not split this.** The pre-flight, the walk and its layers share one state carrier and one
dispatch switch; three agents writing three of them produce three disagreeing carriers. This is the
same reasoning the 1–3 plan's D3 used for the chain knot, and it applies for the same measured reason.

1. `brokers/plan/preflight/plan-preflight-broker.ts` + proxy + test
2. `brokers/plan/run/plan-run-broker.ts` + proxy + test
3. `brokers/plan/run/op-create-apply-layer-broker.ts` + proxy + test
4. `brokers/plan/run/op-save-record-apply-layer-broker.ts` + proxy + test
5. `brokers/plan/run/op-remove-apply-layer-broker.ts` + proxy + test — **gated on Q2**
6. `brokers/plan/run/op-extra-apply-layer-broker.ts` + proxy + test — **gated on Q3**
7. EDIT `brokers/hydration/create/hydration-create-broker.ts` — add `run`
8. EDIT the root barrels; ADD the `./adapters` subpath to `package.json` `exports` (§9)

### Group R3 — chunk 4's disk proof, one agent, after R2 step 4

`brokers/plan/run/plan-run-broker.integration.test.ts` ·
`adapters/fs/ensure-write/fs-ensure-write-adapter.integration.test.ts`

### Group R4 — chunk 5, two agents, sequential between them

| | Files |
|---|---|
| **R4-α** (first) | EDIT `contracts/transition-spec/transition-spec-contract.ts` (**Q4**) · EDIT `contracts/ingredient-config/ingredient-config-contract.ts` · EDIT `brokers/ingredient/declare/ingredient-declare-broker.ts` · `guards/is-reachable-transition/` |
| **R4-β** (after α) | `transformers/transition-from/` · `brokers/plan/run/op-set-apply-layer-broker.ts` |

### Group R5 — chunk 6, two agents, sequential between them

**Gated on Q2's ruling.** Without it there is no query route and `filter` cannot run at all.

| | Files |
|---|---|
| **R5-α** (first) | EDIT `contracts/hydration-routes/hydration-routes-contract.ts` · `transformers/filter-scope-where/` · `transformers/matched-row-rebind/` · `guards/is-filter-expect-satisfied/` |
| **R5-β** (after α) | `brokers/plan/run/op-filter-apply-layer-broker.ts` · `brokers/plan/run/op-update-apply-layer-broker.ts` |

### Group R6 — chunk 6b, three agents in parallel, after R2/R4/R5 land their subjects

| Agent | Rows it owns | Files |
|---|---|---|
| **R6-α** | the `api`-route rows 1 · 2 · 3 | `test/harnesses/api-target/api-target.harness.ts` · `adapters/fetch/post/fetch-post-adapter.integration.test.ts` |
| **R6-β** | the `write`-route rows 4 · 5, the serial row 9, the no-undo rule | extends `file-target.harness.ts` with fault injection; adds cases to `plan-run-broker.integration.test.ts` |
| **R6-γ** | the transition row 6, the query/expect rows 7 and D, the transaction row 8 | `test/harnesses/sql-target/sql-target.harness.ts` · cases in `op-set-apply-layer-broker.test.ts`, `op-filter-apply-layer-broker.test.ts`, `plan-run-broker.integration.test.ts` |

### The whole order, numbered

1. **R0-α ‖ R0-β ‖ R0-γ** — today, against chunk 1's contracts
2. *GATE A*
3. **R1-α ‖ R1-β ‖ R1-γ ‖ R1H**
4. *GATE B*
5. **R2** — one agent, eight steps in order
6. **R3** ‖ **R4-α**
7. **R4-β** ‖ **R5-α**
8. **R5-β**
9. **R6-α ‖ R6-β ‖ R6-γ**

---

## 2. Every row of Part 5's sad-path table, with its owner and its test

From *"The sad paths, which no type catches"*. **A row with no owner is the failure this plan exists
to prevent**, so every row below names a file and a test, including the two that belong to another
package.

| # | The row, verbatim | Chunk | Owner file | The test that proves it, and what it asserts |
|---|---|---|---|---|
| 1 | *the connection is refused* — an `api` route — *halt before the next op. Name the ingredient, the route and the URL* | 4 + 6b | `plan-run-broker.ts` (the catch) + `transformers/route-failure/` | `fetch-post-adapter.integration.test.ts` — **ERROR: {a port nothing is listening on} => rejects**, asserting the thrown value's `code` is `'ECONNREFUSED'`. Then `plan-run-broker.test.ts` — **ERROR: {api route rejects with ECONNREFUSED} => throws HydrationRouteFailedError**, asserting `{name, message}` equals ``recipe "r": ingredient "guild"'s "api" route at http://127.0.0.1:1/api/guilds refused the connection: Error: connect ECONNREFUSED`` |
| 2 | *the server answers 4xx or 5xx* — **and carry the response body verbatim** | 6b | same | `plan-run-broker.integration.test.ts` — a real `node:http` server answering `500` with `{"error":"database unavailable"}`. **ERROR: {api route answers 500} => the message carries the body verbatim**, asserting the whole message string with `toStrictEqual`, body included. A `toMatch` on the status alone would pass against a swallowed body |
| 3 | *the server answers 2xx with a shape `record` rejects* — *halt and name the field* | 4 | `op-create-apply-layer-broker.ts` | `op-create-apply-layer-broker.test.ts` — **ERROR: {route returns {name:'Siege'} for a record needing id} => throws HydrationRecordShapeError naming "id"**, asserting `{name, message}` equals ``recipe "r": ingredient "guild"'s route answered 2xx with a record that field "id" rejects: Required`` |
| 4 | *the write fails — `EACCES`, `ENOSPC`, a read-only mount* — *Name the path, not just the errno* | 6b | `plan-run-broker.ts` + `transformers/write-failure/` | `plan-run-broker.integration.test.ts` — the harness `chmod 0o500`s the real temp dir. **ERROR: {write route into a read-only directory} => the message names the real path**, asserting the message equals ``recipe "r": ingredient "quest"'s write route failed writing "<the actual absolute path>": Error: EACCES: permission denied, …``. The path comes from the harness, not a literal |
| 5 | *the parent directory does not exist* — **create it** | 4 | `adapters/fs/ensure-write/fs-ensure-write-adapter.ts` | `fs-ensure-write-adapter.integration.test.ts` — **VALID: {a path three directories deep, none of them present} => writes the file and creates every parent**, asserting `harness.read({relativePath:'a/b/c/quest.json'})` equals the exact content. **No error is asserted, and that is the row.** Part 5 ties it to *"binding under an absent directory failed as `EACCES`, not `ENOENT`, and three sessions read it as permissions"* |
| 6 | *`reach` throws — the gates refused the transition* — *Name `from`, `to`, and what the gate said* | 5 | `brokers/plan/run/op-set-apply-layer-broker.ts` | `op-set-apply-layer-broker.test.ts` — **ERROR: {reach throws 'a quest needs at least one session before it can start'} => throws HydrationTransitionRefusedError**, asserting the message equals ``recipe "r": ingredient "quest" cannot go to "in_progress" from "created": a quest needs at least one session before it can start``. *"a stack trace is not"* a real answer, so the test asserts the whole string |
| 7 | *the query fails mid-plan* — *say so DISTINCTLY from "matched zero rows"* | 6 | `brokers/plan/run/op-filter-apply-layer-broker.ts` | **Two tests side by side, in one `describe`, and neither is complete without the other.** `ERROR: {query rejects with ECONNREFUSED} => throws HydrationQueryFailedError` and `INVALID: {query resolves [] under expect 'some'} => throws HydrationFilterExpectationError`, each asserting its own `{name, message}`. The pair IS the assertion — one class asserted alone cannot show the two are distinct |
| 8 | *the transaction rolls back* — *Report which op triggered it* | 6b | the repo's own target wrapper (**Q6**) | `plan-run-broker.integration.test.ts` with `sqlTargetHarness` — **ERROR: {the third op's INSERT rejects} => the tx records ROLLBACK and the error names the op**, asserting `harness.statements()` ends `['BEGIN', …, 'ROLLBACK']` and the message equals ``recipe "r": the transaction rolled back, undoing the whole plan — triggered by create comment[2] on ingredient "comment": Error: foreign key violation on post_id`` |
| 9 | *two ops race the same file* — **the runner is serial, and that is a requirement, not an implementation detail** | 4 | `plan-run-broker.ts` | **Two tests, and the second is the one that matters.** Unit: `VALID: {two create ops whose routes each record start and end} => the recorded order is start:0, end:0, start:1, end:1`, asserted with `toStrictEqual` on the whole array. Integration: `VALID: {two guild creates read-modify-writing ONE config.json} => the file holds both ids`, asserting `harness.readJson({relativePath:'config.json'})` equals `{guilds:['guild[0]','guild[1]']}`. **A parallel runner loses one of the two** — this is `guildHarness`'s own measured race, one layer over |
| 10 | *the recipes package was never built* — **Never report an empty list** | **8** | `packages/siegelense` | **Not this plan's.** The chunk 1–3 plan's **Q8 ruling** — *"Accepted. Both errors belong to siegelense, chunk 8"* — places it there, because it has no ingredient and Part 5 requires every framework error to carry one. Named here so it is not read as unowned |
| 11 | *a recipe's params fail validation* — *refuse before seeding anything* | **8** | `packages/siegelense` | **Not this plan's**, same Q8 ruling. It fires at the `seed` step's wire boundary, which no plan reaches |

### Three rules in the same section that are behaviour, not error classes

| The rule, verbatim | Owner | The test |
|---|---|---|
| *"The framework implements no undo and must not, because half-undoing is worse than a dirty tree nobody trusted"* | `plan-run-broker.ts` — there is **no** try/catch that cleans up | `plan-run-broker.integration.test.ts` — **ERROR: {the second create fails} => the first row is still on disk**, asserting `harness.read({relativePath:'guilds/g1.json'})` equals its exact written content. A runner that quietly unwound would fail this |
| *"Every one of these must fail LOUDLY and name what it was doing"* | `transformers/op-describe/` | `op-describe-transformer.test.ts` asserts `'create quest[1]'`, `'set guild[0]/quest[2]'`, `'filter operation under guild[0]/quest[0]'` as VALUES — and every mid-run error message in §6 is asserted whole, so a message that lost its op description reddens its own test |
| *"A mid-batch seed that fails HALTS the batch and marks the instance unusable"* | **chunk 8**, `packages/siegelense` | Out of scope. The framework's half is that the error propagates rather than being swallowed, which the no-undo test above already grades |

---

## 3. The two refusal tables, each row mapped

From *"Mechanics the framework has to implement"*. **The split is load-bearing: a plan's SHAPE is
known before anything runs; a plan's RESULTS are not, and conflating them is a bug.** The pre-flight
is a separate broker from the walk precisely so the two cannot bleed into each other.

### Before the first write — computed off the plan alone

| The check, verbatim | Error class | Owner | The test |
|---|---|---|---|
| *an ingredient needs a route this target cannot serve* — names *the ingredient, the routes it has, and what the target lacks* | `HydrationRouteUnavailableError` | `plan-preflight-broker.ts` via `transformers/route-select/` | **Two tests.** `INVALID: {an api-only guild, a target with no baseUrl} => throws` asserting the message equals ``recipe "r": ingredient "guild" needs a route this target cannot serve. Routes it declares: api. The target lacks a baseUrl, so the api route has nothing to call``. Then **the ALL, not the ANY**: `INVALID: {three writable ingredients and one api-only, no baseUrl} => still refuses, naming the api-only one`. Part 5: *"That is an ALL, not an ANY, and the distinction is the whole point"* — a test against a plan of one proves nothing |
| *a `fromSaved` names a record no op in this plan saves, or one declared LATER* — names *the name, and the names that are saved* | `HydrationSavedRecordMissingError` | `plan-preflight-broker.ts` via `transformers/plan-saved-names/` | **Two tests, because the row is two cases.** `INVALID: {fromSaved('origin'), nothing saves it} => throws` with `Names saved by this plan: (none)`. `INVALID: {fromSaved('origin') declared before the saveRecordAs that makes it} => throws` with `Names saved by this plan: origin` — **the same name appears in the available list, which is what proves this is the ORDERING case and not the missing case.** This is the chunk 1–3 plan's **Q11 ruling**: *"Accepted. Pre-flight, chunk 4"* |
| *a row whose `links` no ancestor supplies — including one added at TOP LEVEL* — names *the ingredient and the link it cannot fill* | `HydrationUnlinkedRowError` | `plan-preflight-broker.ts` via `transformers/row-ref-ingredient/` | **Three tests.** `INVALID: {dm.quests.add(1, …) at top level} => throws` asserting the message names `quest` and `guild`. `VALID: {dm.sessions.under({guildId}).add(1, …)} => passes` — an `under()`-supplied field satisfies the link, which is the whole point of `under`. `INVALID: {an operation under a quest with no guild anywhere} => throws naming guild` — the two-link case, where one link is satisfied and the other is not |

### Mid-run — they depend on what the app actually did

| The check, verbatim | Error class | Owner | The test |
|---|---|---|---|
| *a `filter` matched fewer rows than `expect` allows* — names *the ingredient, the `where`, and what WAS there* | `HydrationFilterExpectationError` | `op-filter-apply-layer-broker.ts` | `it.each` over `filterExpectContract.options` — never a hardcoded list — pairing each value with the smallest match count that satisfies it, plus the case below it. `INVALID: {expect 'one', two rows matched} => throws` asserting `… expected "one" but matched 2 row(s)`. **`expect: 'any'` is the one value zero satisfies**, and its test asserts the walk continues with a real subsequent op |
| *a route threw* — *see the sad-path table above* | the four route classes | `plan-run-broker.ts` | rows 1 · 2 · 3 · 4 above |

---

## 4. Decisions this plan makes

**A build agent that disagrees raises it rather than choosing differently.** Every one of these is a
place the specification stops short, and three files choosing differently is the failure this section
exists to prevent. The ones that change a shipped contract are **open questions** instead — §5.

**D1 — the runner reads the registry from `createHydration`'s closure, and `run(plan, target)` keeps
its two arguments.** An op carries `ingredient: IngredientName` and nothing else; the runner needs
that ingredient's `routes`, `links`, `record` and `transitions`. A plan must stay printable data, so
it cannot carry function-valued configs. `proto/ingredients.ts` calls
`createHydration<DmTarget>()` once and destructures `{ ingredient, registry, run }` from the same
object, so `registry(entries)` and `run` share a scope and `run` reads what `registry` was handed.
This also makes the lookup **total by construction**: a plan's ops can only come from the accessors
`registry()` returned — see **Q1** for the hand-built-plan case.

**D2 — route selection is per ingredient, and the order is `api` → `write` → `recording`.** A target
carrying `baseUrl` uses `api` where the ingredient declares one; otherwise `write`; otherwise
`recording`; otherwise refuse. Per ingredient, not per plan: a plan with a baseUrl may run an
api-only guild through `api` and a write-only operation through `write` in the same walk, which is
what *"The target picks; the caller does not"* means. See **Q9** for the `api`-over-`write`
preference and **Q7** for `recording` going last.

**D3 — every route returns the row's RECORD, and the runner parses it through `config.record`.**
Nothing in Part 5 says this outright, but three things require it: `saveRecordAs` puts *"that row's
WHOLE record"* on the output, the runner *"writes each ancestor's id into the named field"*, and
`HydrationRecordShapeError` exists for *"a shape `record` rejects"*. A route returning `undefined` is
therefore a record-shape failure, and its test asserts that message rather than a crash.

**D4 — a `set`/`setRaw`'s WRITTEN half is folded into the row's `create` call.** One route call per
row. Part 5's own worked example is `q[0].set({ status: 'in_progress', title: 'The running one' })` —
one call, one plain field, one transition — and every real seeder this framework replaces takes the
whole row in one call (`writeQuestFile({ questId, title, status, workItems })`,
`createQuest({ guildId, title, userRequest })`). *"Seed data is about the END state"*, and the fold is
how the chain's end state becomes one write.

The fold is **pure and testable**: `planFoldWritesTransformer` is a plan→plan transform that runs
after the pre-flight and before the walk. It folds a `set` into the `create` with the same `ref` only
when **every `SavedRef` among those values names a record saved by a `saveRecord` op that appears
before that `create` op**. Without that condition the fold moves a cross-link earlier than the save it
depends on, and a plan the pre-flight passed dies at run time:

```ts
g[0].quests.add(2, (q) => [
  q[0].saveRecordAs({ name: 'first' }),
  q[1].set({ userRequest: fromSaved({ name: 'first' }) }),   // NOT foldable
]);
```

A `set` that fails the condition, and every `set` on a row a `filter` matched, is an **update** — and
the framework has no verb for one. That is **Q2**, and it is the gating question of this plan.

**D5 — an explicit field beats an ancestor-derived link value.** `linkValuesTransformer` writes an
ancestor's id only into link fields the create op's own `fields` does not already carry. `under({
guildId })` puts `guildId` in `fields`, and the caller saying so outranks anything inferred.

**D6 — the walk is `for…of` with `await` inside, and never `Promise.all`.** This is a deliberate
departure from `get-architecture`'s *"use `Promise.all` whenever the calls do not depend on each
other"*, and it carries a comment recording why: `guildHarness` deletes sequentially because
*"concurrent DELETEs corrupt config.json (race on read-modify-write)"*, and Part 5 makes it a
requirement rather than an implementation detail. **The comment names that measured race**, or the
next reader parallelises it back.

**D7 — no undo, and therefore no try/catch that cleans up.** The runner's only `catch` is the one
that classifies a route failure into an error class and re-throws. Nothing is removed, nothing is
rewound. *"A failed plan leaves nothing behind"* is the caller's property — a throwaway home, a
transaction — not the framework's.

**D8 — the missing parent directory is created by the ADAPTER, not by the runner.** The runner never
learns a path; the route writes. So `fsEnsureWriteAdapter` does `mkdir -p` then write, and every
repo's `write` route goes through it. `HydrationWriteFailedError`'s own header already says so:
*"When the parent directory is merely absent — the runner creates it, and that is not a failure at
all."*

**D9 — a failure is classified by the ROUTE KIND the runner chose, and the context is mined off the
caught value.** `routeFailureTransformer` reads `{ url, status, responseBody }` off an unknown throw
(a `Response`-shaped object, an `HttpError`-shaped one, or nulls); `writeFailureTransformer` reads
`{ path }` off node's `SystemError.path`. **This is the floor, and it works for any route a repo
writes by hand.** A repo that uses the framework's own `fetchPostAdapter` and `fsEnsureWriteAdapter`
gets the richest message, because their thrown shapes are exactly what those two transformers mine.

**D10 — every mid-run error message carries `opDescribeTransformer`'s string.** *"Every one of these
must fail LOUDLY and name what it was doing."* One transformer, one test, one place a description can
go stale.

**D11 — a top-level `filter` has no `scope` key and is instance-wide.** `opFilterContract.scope` is
optional, `exactOptionalPropertyTypes` is on, and *"A `filter` inside a nested `add` is scoped to its
immediate host"* says nothing about a top-level one. Nested is scoped; top level is not. The test says
so in its name.

**D12 — `saveRecordAs` records the record as of the save, and a later `remove` does not retract it.**
Round C asks *"is the saved record stale, absent, or an error?"* The plan's output is a log of what
this plan made; a stale record a caller can inspect beats a hole it cannot. Chunk 6b test.

**D13 — the pre-flight runs on the DECLARED plan, before the fold.** Declaration order is what
*"declared LATER"* is measured against, and folding changes positions. Pre-flight, then fold, then
walk.

---

## 4b. Two facts about a matched reference, established by review

**Two filters sharing an ingredient and a scope receive the SAME `matchedRef`.** It is derived from
the ingredient and the scope with a fixed placeholder index, so the collision is guaranteed rather
than possible. Measured: both filters in the specification's own worked example — a quest's operations
filtered by one role and then another — come back as `guild[0]/quest[0]/operation[0]`.

**That collision is harmless, and the reason is structural.** A filter's nested ops are a subtree
hanging off that filter's own node, so a nested op's reference is only ever matched against the
`matchedRef` of the node it sits inside. **Nothing resolves a row reference globally.** `fromSaved`
reaches a row by SAVED RECORD NAME, a different namespace, so even a `saveRecordAs` nested inside a
filter cannot leak the collision outward.

**So the runner's correctness here rests on a discipline, not on a type.** A placeholder reference is
textually indistinguishable from a real row's reference at the same scope, ingredient and index. Keep
the per-node scoping; nothing in the type system will catch it if a later change resolves a matched
reference by string across the tree.

### The harness leak test does not run, and chunk 6b owns moving it

**`packages/hydration/test/harnesses/file-target/file-target.harness.integration.test.ts` exists, is
correct, and ward never executes it.** This package's jest config scopes `roots` to `src` alone, so a
test file under `test/` is not discovered — it does not fail, it is simply never run. The suite was
proven red-then-green by hand, against a real `ENOENT`, using a throwaway config.

**What it guards is real**: a permission restore that throws must not skip the cleanup that discards
the throwaway home, because discarding that home is the framework's entire rollback story for a
file-backed target.

**Chunk 6b's fault-injection work is where this lands for good.** That group extends this harness and
its own suite lives under `src/`, so it is the first consumer that ward actually runs. **Move the leak
assertion into it**, and delete the orphan — a test nobody runs is worse than no test, because it
reads as coverage.

**The general rule, which has now cost two groups time:** a suite lives under `src/`, beside the thing
it proves. Fixtures and harnesses live under `test/`. A test file written anywhere else is silently
skipped.

### The test chunk 6 owes

**Nothing anywhere exercises two sibling filters sharing a scope and an ingredient**, and that is the
specification's own worked example. **Chunk 6 adds it when the filter-apply layer lands**: two filters
over one parent, different `where` clauses, each with its own nested op, asserting that each op reached
only the rows ITS filter matched.

It is the one test that would fail if someone later resolved a matched reference globally, and it does
not exist today.

---

## 5. Open questions — none picked silently

**The orchestrator rules on each. A build agent follows the ruling; until there is one, it follows the
recommendation and says in the commit that it did.**

### Rulings — read these before the questions below

**Every question is ruled. A build agent follows the RULING, not the recommendation, wherever the two
differ.**

| Q | Ruling |
|---|---|
| **Q2** | **Accepted.** `hydrationRoutesContract` gains optional `query`, `update` and `remove`; a plan needing one an ingredient does not declare is refused in the PRE-FLIGHT, naming the ingredient and the verb; a fourteenth error class carries it. The alternatives both lose: re-calling the create route makes a second row through `api`, and refusing the calls deletes a worked example from the specification. **This is the largest finding this build has produced and it goes back into Part 5** |
| **Q3** | **Accepted.** An `extras` value becomes `{ args, apply }`. A verb declared with arguments and no body is behaviour nothing can run |
| **Q4** | **Accepted.** `ReachFn` gains `record`. The specification's own example cannot work under `add(3, …)` without it |
| **Q5** | **Accepted.** `linkSpecContract` gains an optional `from`, defaulting to `'id'`. It makes the mechanism total rather than true by coincidence for the records that happen to carry an `id` |
| **Q1** | **Accepted.** No class and no defensive throw. A state the types make unreachable does not get a runtime guard |
| **Q6** | **Accepted, with the smell named rather than lived with.** Nothing inside the framework throws it; the repo's own wrapper does. **The class stays exported, and `packages/hydration/CLAUDE.md` says who throws it** — an error class with no thrower in its own package is unreadable without that line |
| **Q7** | **Accepted.** The gap stays, and the silence is named so a reviewer does not read it as coverage |
| **Q8** | **Accepted, and fix the WORDING.** Parse every route's return through `record`. Do not ship a message saying *"answered 2xx"* for a `write` route that answered nothing — this repo's rule is that an error names the operation and the input that broke it. The class is not committed, so the wording is free to fix now and misleading forever if it is not |
| **Q9** | **Accepted: `api` wins when both are declared and a base URL exists.** Migration step 2's whole claim is that it proves the `api` routes. The integration half has no base URL and takes `write` regardless, so the speed cost lands only where the honesty is wanted |
| **Q10** | **Accepted.** `planRunsTransformer` is re-expressed on `routeSelectTransformer`. Two implementations of one rule can disagree, and the listing is the line that stops a wasted run |
| **Q11** | **Accepted.** Build against the untyped shape; chunk 3b widens it. Widening a return type is additive |

**Q2, Q3, Q4 and Q5 each change a contract chunk 1 already shipped.** They are one edit pass over
`hydration-routes-contract`, `ingredient-config-contract`, `transition-spec-contract` and
`link-spec-contract`, made ONCE, before group R1 starts — not folded into whichever group trips over
them first.

**The integration-test precedent question is settled the way this plan settles it.** The chunk 1–3
plan cited `packages/eslint-plugin`'s RuleTester; this plan checked it and found it runs a DSL in
process with no temp directory and no socket, which is right for a compiler fixture and wrong for a
runner whose claim is bytes on disk. **The four broker-colocated `.integration.test.ts` precedents
this plan names are the ones that apply.** Checking a cited precedent rather than repeating it is
exactly what was asked for.

### Q2 — the gating question: the chain has four verbs over rows the plan did not mint, and `routes` declares only how a row is MADE

`hydrationRoutesContract` is `{ api?, write?, recording? }` and `RouteFn` is
`({ target, fields }) => unknown`. Part 5's routes table calls all three *"how the state gets made"*.
But the chain also has:

| The call | What it needs | Part 5 has |
|---|---|---|
| `q[1].remove()` · `filter(…).remove()` | a DELETE | nothing. `guildHarness` does `DELETE /api/guilds/:id` |
| `filter({ where, expect })` | a QUERY | nothing — yet `HydrationQueryFailedError` exists for *"the query fails mid-plan"*, so the framework certainly queries |
| `filter(…).set({ text: 'noop' })` | an UPDATE on a row that already exists | nothing. It is a worked example in *"Every chainable, with an example"* |
| a non-foldable `set` (D4) | the same UPDATE | nothing |

**Recommendation: `hydrationRoutesContract` gains three OPTIONAL keys — `query`, `update`, `remove` —
and a plan needing one an ingredient does not declare is refused in the PRE-FLIGHT, naming the
ingredient and the verb.** Reasons: it is the only answer honest for both target kinds (a file repo's
`remove` unlinks; a database repo's is a `DELETE`); it keeps the decision on the ingredient, where
Part 5 already puts *"AN INGREDIENT declares the routes"*; and it means the runner implements a
decision rather than making one. It needs a **fourteenth error class**, because
`HydrationRouteUnavailableError`'s `targetLacks` is target-shaped and reads wrong for a missing verb.

Alternatives considered: (b) re-call the existing route with the merged fields, making it an upsert —
honest for `write`, wrong for `api`, where a second `POST /api/quests` makes a second quest; (c)
refuse these calls in the pre-flight and document the limit — which deletes a worked example from the
specification.

**This is a finding, and it goes back into Part 5 beside *"Routes: how an ingredient makes its
state"*.** **Chunks 5 and 6 cannot be built without a ruling**, and chunk 4 ships its `remove` layer
behind it.

### Q3 — `extras` declares an ARG CONTRACT and no implementation

`extras: { withNestedChain: c<{ depth: number }>() }`. The contract types the args. **Nothing
implements the verb**, so `op-extra`'s runner arm has nothing to call.

**Recommendation: an `extras` value becomes `{ args: Contract<T>; apply: ({ target, record, args }) =>
unknown }`.** One object rather than two parallel maps, so a verb cannot be declared with args and no
body. It is a chunk 2 edit (`ingredient-config-contract.ts`, `ingredientDeclareBroker`) and a Part 5
finding beside *"`extras` — verbs only this ingredient could have"*.

### Q4 — `reach({ from, to, target })` gets no ROW

`ReachFn<TTarget, TValue>` on disk is `(args: { from, to, target }) => unknown`, and Part 5's example
is `reach: ({ from, to, target }) => walkQuestStatus({ from, to, target })`. **With three quests in
one `add`, that cannot know which one to walk.**

**Recommendation: `ReachFn` gains `record`** — one key on a type nothing imports yet, so the edit is
free today and expensive the moment a consumer writes a `reach`. Part 5 finding beside
*"`transitions` — the field that is walked rather than written"*.

### Q5 — which field of a parent record is "its id"?

Part 5: *"the RUNNER writes each ancestor's id into the named field"*. `linkSpec` is `{ of, as }` —
`as` names the field on the CHILD. Nothing names the field on the PARENT. `GuildRecord` has `id`;
`SessionRecord` in `proto/ingredients.ts` has `sessionId` and `url` and **no `id` at all**.

**Recommendation: `linkSpecContract` gains an OPTIONAL `from: FieldName`, defaulting to `'id'`.** One
line, and it makes the mechanism total rather than true-by-coincidence for the two records that
happen to have an `id`. Part 5 finding beside *"`links` — the foreign keys, named by parent NAME"*.

### Q1 — an op naming an ingredient the registry does not hold

**Recommendation: do not add a class, and do not add a defensive throw.** D1 makes the lookup total by
construction: a plan's ops can only come from the accessors `registry()` returned. The one way to
reach it is a test hand-building ops, which is a test bug. `RegistryDanglingLinkError` is the wrong
class — its message is about `links.of`, not about an op. If the orchestrator wants a named refusal it
is a fourteenth class and needs a ruling, because the brief says chunk 4 invents none.

### Q6 — who throws `HydrationTransactionRolledBackError`?

The framework *"names neither files nor SQL"* and does not own the transaction — the target IS the
transaction, and it is the repo's.

**Recommendation: nobody inside the framework.** The repo wraps `run()` and throws the class from its
own `catch`, which is what D7 (no undo) already forces. Chunk 6b proves the shape against
`sqlTargetHarness`. **Flag: a class with no thrower inside its own package is a smell**, and the only
alternative — an optional `target.rollback` hook the runner calls — puts transactional semantics in a
package that must not name them.

### Q7 — `recording` is selected last and nothing exercises it

**Recommendation: leave the Known gap where it is.** D2 selects `recording` only when it is the sole
route, and **no chunk-4, -5 or -6 test asserts anything about it**. Named here so a reviewer does not
read the silence as coverage — Part 5's own gap says *"no ingredient in the prototype uses it, so
nothing about it has been proven"*.

### Q8 — does `HydrationRecordShapeError` cover a `write` route?

Part 5 files *"2xx with a shape `record` rejects"* under the `api` route only. But a `write` route
returning a bad record poisons every `fromSaved` and every link exactly the same way.

**Recommendation: parse every route's return through `record`, and throw it for `write` too**,
accepting that the message says *"answered 2xx"*. Recorded as a wording finding rather than an edit to
a shipped class mid-chunk.

### Q9 — with both `api` and `write` and a baseUrl, which runs?

**Recommendation: `api`.** Part 5's risk table calls it *"none; this is the honest one"*, and
migration step 2's whole claim is *"the **`api` routes**, and that one plan serves a caller with
both"*. The cost is real: a siege prelude seeding one guild and three quests pays four HTTP round
trips where `write` would pay four file writes. If the orchestrator prefers speed, the alternative is
`write`-first with `api` only where `write` is absent — and then migration step 2 proves nothing about
the `api` routes.

### Q10 — `planRunsTransformer` and `routeSelectTransformer` answer the same question twice

Chunk 3's `planRunsTransformer` computes the listing's `runs` line (*"An ALL over the plan's
ingredients, never a union"*); chunk 4's `routeSelectTransformer` computes the pre-flight's refusal.
**Two implementations of one rule can disagree, and the listing is the line that stops a wasted run.**

**Recommendation: chunk 4 re-expresses `planRunsTransformer` on top of `routeSelectTransformer`** —
a small, named edit in R2 step 8. A transformer may import a transformer.

### Q11 — `run`'s return type, against chunk 3b

The chunk 1–3 plan's **Q7 ruling** defers the typed plan output to a scheduled **chunk 3b**, *"its own
scheduled pass before chunk 4"*. If 3b has not landed when R2 starts, `run` returns
`Promise<HydrationRunResult>` — a flat `Record<SavedRecordName, unknown>`.

**Recommendation: build chunk 4 against the untyped shape and let 3b's threading widen it**, saying so
in the commit. Widening a return type is additive; waiting on 3b blocks the only chunk that touches
disk.

---

## 6. Chunk 4 — the runner, file by file

**Pattern reminders that bind every file here.** One export, `export const` arrow, one destructured
object parameter typed inline, explicit branded return type, PURPOSE above the imports. Transformers
are depth 1 (`transformers/[domain]/[domain]-transformer.ts`); guards depth 1 and named `is`/`has`/…;
adapters depth 2 (`adapters/[package]/[operation]/`); brokers depth 2
(`brokers/[domain]/[action]/`). Layer files sit flat beside their parent and each carries its own
proxy and test. **`require-zod-on-primitives` still fires inside `src/contracts/**`** — a bare
`string` or `number` field needs its own inline `.brand<…>()` (hydration's CLAUDE.md records this).

### 6.1 — Group R0: the twelve files that need nothing unbuilt

**`src/guards/is-saved-ref/is-saved-ref-guard.ts`** → `isSavedRefGuard`

- PURPOSE: Answers whether one field value is a cross-link the runner must resolve before the write,
  rather than a literal it may pass straight to the route. Reach for this over `savedRefContract.safeParse`
  at a call site that is deciding what to DO with a value — this returns a boolean and allocates no
  `ZodError` for the overwhelmingly common literal case.
- depends on: `saved-ref-contract`.
- delivers: *"`fromSaved({ name, field })` — a cross-link to a row the tree cannot reach"*.
- its test: `VALID: {value: {__savedRef: true, name: 'origin'}} => returns true`;
  `INVALID: {value: {name: 'origin'}} => returns false` (the `__savedRef` marker is the whole
  discriminant); `INVALID: {value: 'origin'} => returns false`; `EMPTY: {} => returns false`
  (every guard parameter is optional here — `enforce-optional-guard-params`).

**`src/transformers/row-ref-ingredient/row-ref-ingredient-transformer.ts`** → `rowRefIngredientTransformer`

- PURPOSE: Recovers which ingredient a row belongs to from its build-time ref. Reach for this
  wherever an ancestor is known only as a `RowRef` — `op-create`'s `ancestors` is a list of refs, not
  of names, so link resolution and the unlinked-row refusal both have to ask this question.
- depends on: `row-ref-contract`, `ingredient-name-contract`.
- delivers: *"Linking a child to its parent"*, *"A plan is a TREE of ops"*.
- its test: `VALID: {rowRef: 'guild[0]'} => returns 'guild'`;
  `VALID: {rowRef: 'guild[0]/quest[2]'} => returns 'quest'` — **the LAST segment, not the first**;
  `VALID: {rowRef: 'guild[0]/quest[2]/operation[11]'} => returns 'operation'` (a two-digit index, so
  the regex cannot be assumed single-character).

**`src/transformers/route-select/route-select-transformer.ts`** → `routeSelectTransformer`

- PURPOSE: Picks the one route this target can actually run for one ingredient, or `null` when it can
  run none. Reach for this over reading `routes` directly anywhere: the listing's `runs` line and the
  pre-flight's refusal are the same rule asked twice, and two implementations of it can disagree.
- depends on: `hydration-route-contract`, `hydration-routes-contract`.
- delivers: *"An ingredient with only one route, and what it costs"*, *"A plan runs without a server
  only if EVERY ingredient in it declares a `write` route"*, *"Routes: how an ingredient makes its
  state"*.
- its test: `VALID: {routes: {api, write}, hasBaseUrl: true} => returns 'api'` (D2/Q9);
  `VALID: {routes: {api, write}, hasBaseUrl: false} => returns 'write'`;
  `VALID: {routes: {api}, hasBaseUrl: false} => returns null` — **the row the whole pre-flight rests
  on**; `VALID: {routes: {recording}, hasBaseUrl: false} => returns 'recording'`;
  `VALID: {routes: {write, recording}, hasBaseUrl: false} => returns 'write'` (D2's order).

**`src/contracts/http-response/http-response-contract.ts`** → `httpResponseContract`

- PURPOSE: What an `api` route's call actually came back with, before anything decides whether it is a
  record. Reach for this over the fetch `Response` object: that carries a consumed body stream and a
  header map, neither of which a `toStrictEqual` assertion can compare.
- holds: `{ url: Url; status: HttpStatus; body: ResponseBody }` — `status` and `body` branded inline.
- its test: `VALID: {url, status: 200, body: '{"id":"g1"}'} => returns all three`;
  `INVALID: {status: 99} => throws`.

**`src/adapters/fetch/post/fetch-post-adapter.ts`** → `fetchPostAdapter`

- PURPOSE: The `api` route helper an ingredient's `routes.api` calls — one POST of JSON fields,
  returning the status and the raw body TEXT rather than a parsed object. Reach for this over calling
  `fetch` inside a route: the verbatim body is what `HydrationRouteFailedError` carries, and a route
  that parses first has already thrown the diagnosis away.
- depends on: `http-response-contract`, `hydration-target-contract` for `Url`. Global `fetch`
  (node 18+); **no other adapter**, because `enforce-proxy-child-creation` refuses an empty proxy the
  moment an adapter imports one (the chunk 1–3 plan's B1 amendment).
- **Does not throw on 4xx/5xx** — it returns the status. Only a transport failure rejects, and it
  rejects with the original cause so `routeFailureTransformer` can mine `code: 'ECONNREFUSED'`.
- delivers: *"Routes: how an ingredient makes its state"* row `api`, and sad-path rows 1 and 2.
- its proxy: mocks global `fetch` via `registerMock`, addressed by the URL.
- its test: `VALID: {a 201 with a JSON body} => returns {url, status: 201, body: the raw text}`;
  `VALID: {a 500 with an error body} => returns status 500 and the body, and does not throw` —
  **that non-throw is the behaviour row 2 depends on**; `ERROR: {fetch rejects} => rejects with the
  original cause`.
- its `.integration.test.ts`: §8, owned by R6-α.

**`src/adapters/fs/ensure-write/fs-ensure-write-adapter.ts`** → `fsEnsureWriteAdapter`

- PURPOSE: The `write` route helper — `mkdir -p` the parent, then write. Reach for this over
  `writeFile` in any route: **a missing parent directory is created, not refused**, and Part 5 ties
  that to a real bug where binding under an absent directory failed as `EACCES`, not `ENOENT`, and
  three sessions read it as permissions.
- depends on: `mkdir` and `writeFile` from `node:fs/promises`, `dirname` from `node:path`,
  `adapterResultContract` + `absoluteFilePathContract` from `@dungeonmaster/shared/contracts`
  (both verified present in `packages/shared/contracts.ts`). Node builtins directly — shared ships
  `fsMkdirAdapter` but no write counterpart, and composing one would trip the proxy rule above.
- returns `AdapterResult`, per the adapters folder rule that a side-effect adapter must not return void.
- delivers: sad-path row 5, *"the parent directory does not exist — **create it**"*.
- its proxy: mocks `mkdir` and `writeFile`, addressed by path.
- its test: `VALID: {filePath, content} => calls mkdir with the dirname and recursive true, then
  writes` — asserted through `callsMatching`, on the ARGUMENTS, paired with the returned
  `AdapterResult`; `ERROR: {writeFile rejects EACCES} => rejects with the cause` (the adapter adds no
  class of its own — the runner classifies).
- its `.integration.test.ts`: the row-5 proof, §8.

**`src/contracts/route-failure/route-failure-contract.ts`** → `routeFailureContract`
**`src/transformers/route-failure/route-failure-transformer.ts`** → `routeFailureTransformer`

- contract holds `{ url: Url | null; status: HttpStatus | null; responseBody: ResponseBody | null }`.
- transformer PURPOSE: Reads the three things `HydrationRouteFailedError` needs off whatever a route
  actually threw. Reach for this rather than requiring every repo's route to throw a framework type:
  a route is the repo's own code, and the runner has to name the URL and carry the body verbatim
  whether or not that route used the framework's helper.
- delivers: sad-path rows 1 and 2.
- its test — **four shapes, and each asserts VALUES**:
  `VALID: {cause: an HttpResponse-shaped throw} => returns its url, status and body`;
  `VALID: {cause: a Response-shaped throw} => returns url and status, body null`;
  `VALID: {cause: an ECONNREFUSED Error} => returns {url: null, status: null, responseBody: null}` —
  **status null is what makes `HydrationRouteFailedError` print `refused the connection`**;
  `EMPTY: {cause: undefined} => returns all three null`.

**`src/contracts/write-failure/write-failure-contract.ts`** → `writeFailureContract`
**`src/transformers/write-failure/write-failure-transformer.ts`** → `writeFailureTransformer`

- contract holds `{ path: AbsoluteFilePath | null }`.
- transformer PURPOSE: Recovers the PATH a failed write was aimed at, off node's own
  `SystemError.path`. Reach for this because *"Name the path, not just the errno"* — and the errno is
  all a bare `String(error)` gives, which is how a read-only mount reads as a mystery.
- delivers: sad-path row 4.
- its test: `VALID: {cause: an Error carrying path and code EACCES} => returns that path`;
  `VALID: {cause: a plain Error} => returns {path: null}`; `EMPTY: {} => returns {path: null}`.

**`src/transformers/saved-ref-resolve/saved-ref-resolve-transformer.ts`** → `savedRefResolveTransformer`
**`src/transformers/field-values-resolve/field-values-resolve-transformer.ts`** → `fieldValuesResolveTransformer`

- `savedRefResolveTransformer` PURPOSE: Turns one cross-link into the value it points at — the named
  record's field, or the whole record when no field is named. Reach for `fieldValuesResolveTransformer`
  instead when a whole field map is in hand; this one answers for a single value.
- `fieldValuesResolveTransformer` PURPOSE: Replaces every cross-link in one op's values with what it
  resolves to, leaving literals untouched. Reach for this at every point the runner hands values to a
  route — a `create`'s fields, a `set`'s `written`, an `extra`'s args, a `filter`'s `where`.
- delivers: *"`fromSaved({ name, field })`"*, *"A link to something that is NOT an ancestor is a
  cross-link"*.
- their tests: `VALID: {ref: {name:'origin', field:'sessionId'}, saved: {origin: {sessionId: 's1'}}}
  => returns 's1'`; `VALID: {ref: {name:'origin'}, saved: {…}} => returns the whole record`;
  `VALID: {values: {title:'x', userRequest: ref}} => returns {title:'x', userRequest:'s1'}` with
  `toStrictEqual` on the complete object — **the literal surviving unchanged is half the assertion**.
- **The forward-reference refusal is NOT here.** These are pure and know nothing of declaration
  order; `HydrationSavedRecordMissingError` fires in the pre-flight, per the chunk 1–3 plan's Q11
  ruling.

### 6.2 — Group R1: the plan-shaped transformers

**`src/contracts/op-description/op-description-contract.ts`** → `opDescriptionContract`
**`src/transformers/op-describe/op-describe-transformer.ts`** → `opDescribeTransformer`

- PURPOSE: Names what the runner was doing, for the one line a mid-run error puts in front of a
  reader. Reach for this in every mid-run throw: *"A seed that fails quietly is the worst outcome
  this design has"*, and an error naming an ingredient but not the op leaves a five-ingredient plan
  unreadable.
- depends on: `hydration-op-contract`, `row-ref-contract`, `ingredient-name-contract`.
- delivers: *"The sad paths, which no type catches"*, *"Every error is an `errors/` class carrying the
  ingredient and the recipe name"*.
- its test — one per op kind, derived from `hydrationOpContract.options` where the shapes allow:
  `VALID: {op: create quest[1]} => returns 'create quest[1]'`;
  `VALID: {op: set on guild[0]/quest[2]} => returns 'set guild[0]/quest[2]'`;
  `VALID: {op: filter operation scoped to guild[0]/quest[0]} => returns 'filter operation under
  guild[0]/quest[0]'`;
  `VALID: {op: filter operation with no scope} => returns 'filter operation'` — **D11's top-level
  case, which must not print `under undefined`**;
  `VALID: {op: extra withNestedChain on session[0]} => returns 'extra withNestedChain session[0]'`.

**`src/transformers/plan-saved-names/plan-saved-names-transformer.ts`** → `planSavedNamesTransformer`

- PURPOSE: Every name this plan saves, **in declaration order**, so the pre-flight can tell a name
  that is never saved from one saved too late. Reach for this over a `Set`: the order is what makes
  the two cases distinguishable, and losing it collapses them into one message.
- depends on: `hydration-op-contract`, `saved-record-name-contract`.
- delivers: the before-the-first-write table's `fromSaved` row.
- its test: `VALID: {a plan saving guild then third} => returns ['guild', 'third']` with
  `toStrictEqual`; `VALID: {a plan saving inside a filter's nested ops} => includes that name` —
  **a `filter`'s `ops` are part of the tree and a walk that stops at the top level misses them**;
  `VALID: {a plan saving nothing} => returns []`.

**`src/transformers/plan-fold-writes/plan-fold-writes-transformer.ts`** → `planFoldWritesTransformer`

- PURPOSE: Folds each `set`'s written half into the `create` that mints the row, so one row is one
  route call. Reach for this between the pre-flight and the walk: the pre-flight measures declaration
  order and folding changes positions, so running it earlier would change the answer to *"declared
  LATER"*.
- depends on: `hydration-op-contract`, `hydration-plan-contract`, `is-saved-ref-guard`,
  `plan-saved-names-transformer`.
- delivers: *"One verb sets state, and the INGREDIENT decides whether that means a walk"*,
  *"`setRaw` is the escape hatch, and its name is the warning"*, *"Seed data is about the end state"*.
- its test — **five, and each asserts the whole returned op array with `toStrictEqual`**:
  - `VALID: {create quest[0], set {title:'first'}} => returns one create carrying title and no set op`
  - `VALID: {all.set({userRequest}) then q[0].set({title})} => create[0] carries both, create[1] and
    create[2] carry only userRequest` — the `all` case, over three rows
  - `VALID: {set {status:'in_progress', title:'x'}} => title folds, the transition-only set op stays`
    — **one call, one plain field, one transition**, and the transition surviving is the assertion
  - `VALID: {setRaw {status:'complete'}} => folds into create, and no set op remains` — a row the
    gates would never have produced, created that way
  - `VALID: {q[0].saveRecordAs('first') then q[1].set({x: fromSaved('first')})} => the set op is NOT
    folded` — D4's condition. **This is the case that makes the fold correct, and without it a plan
    the pre-flight passed dies at run time.**

**`src/contracts/hydration-run-state/hydration-run-state-contract.ts`** → `hydrationRunStateContract`

- PURPOSE: What the walk carries from one op to the next — the record each ref resolved to, the
  records `saveRecordAs` named, and the recipe name every error message opens with. Reach for this
  rather than threading four parameters: `ban-adhoc-types` refuses an inline structural type, and the
  carrier is the one thing every layer broker touches.
- holds `{ recipeName: RecipeName; records: Map<RowRef, unknown>; saved: Map<SavedRecordName, unknown> }`,
  the two maps arriving by intersection (a `Map` has no zod shape).

**`src/contracts/hydration-run-result/hydration-run-result-contract.ts`** → `hydrationRunResultContract`

- PURPOSE: What `run` hands back — **flat, one key per `saveRecordAs`, and nothing else.** Reach for
  this over the registry accessors or the record map: *"Nothing else appears there — not the registry
  accessors, not a row nobody saved."*
- delivers: *"A plan's output is FLAT, and there is exactly one shape"* (Part 6).
- its test: `VALID: {guild: aRecord, third: another} => returns exactly those two keys` with
  `toStrictEqual`; `VALID: {} => returns an empty result` (a plan saving nothing is legal).
- **Q11**: typed as `Record<SavedRecordName, unknown>` until chunk 3b threads the saved names.

**`src/transformers/link-values/link-values-transformer.ts`** → `linkValuesTransformer`

- PURPOSE: Builds the foreign-key values one row needs from the records its ancestors already
  produced. Reach for this, never a hand-passed parent id: *"Declared once per ingredient, it is
  never passed by hand and never forgotten."*
- depends on: `link-spec-contract`, `ingredient-config-contract`, `row-ref-contract`,
  `row-ref-ingredient-transformer`, `field-values-contract`.
- delivers: *"Linking a child to its parent"*, *"The registry inverts them"*, *"Siblings share it"*.
- its test:
  - `VALID: {links [{of:'guild', as:'guildId'}], ancestors ['guild[0]'], records {guild[0]: {id:'g1'}}}
    => returns {guildId: 'g1'}`
  - `VALID: {an operation linking to both quest and guild} => returns {questId:'q1', guildId:'g1'}` —
    **the two-link case, which is what `operationIngredient` really declares**
  - `VALID: {guildId already present in the op's own fields} => the ancestor value is not written` —
    D5, and the assertion is the complete returned object
  - `VALID: {three siblings under one guild} => all three get the same guildId` — *"Siblings share
    it"*, asserted across three calls

### 6.3 — Group R2: the pre-flight and the walk

**`src/brokers/plan/preflight/plan-preflight-broker.ts`** → `planPreflightBroker`

- PURPOSE: Refuses a plan whose SHAPE cannot work, before anything is on disk. Reach for this over a
  check inside the walk: a plan's shape is known before anything runs and its results are not, and
  *"conflating them is a bug"* — a refusal that fires partway through leaves half a plan behind.
- depends on: `hydration-plan-contract`, `ingredient-config-contract`, `hydration-target-contract`,
  `route-select-transformer`, `plan-saved-names-transformer`, `row-ref-ingredient-transformer`,
  `is-saved-ref-guard`, and `HydrationRouteUnavailableError` · `HydrationSavedRecordMissingError` ·
  `HydrationUnlinkedRowError`.
- **returns the ROUTE PLAN it already computed** — `RoutePlan`, one `HydrationRoute` per ingredient
  name — rather than `void`. The walk then uses it instead of asking `routeSelectTransformer` a second
  time, so the route a plan was ACCEPTED on and the route it RUNS on cannot diverge. It needs its own
  contract, `src/contracts/route-plan/route-plan-contract.ts` → `routePlanContract` (R1-α).
  Never touches disk, never opens a socket.
- delivers: *"The runner's refusals split into two groups, and conflating them is a bug"* — the
  before-the-first-write table entire — plus the Known gap *"A row added at TOP LEVEL whose `links`
  nothing supplies compiles clean"*.
- its proxy: **EMPTY** — nothing is mocked; the pre-flight is pure.
- its test: the eight cases in §3's first table, each asserting `{ name, message }` with
  `toStrictEqual` plus `toBeInstanceOf`, plus `VALID: {the whole guild-mid-execution plan against a
  target with a baseUrl} => returns without throwing`.
- **The order of the three checks is fixed and tested**: routes, then `fromSaved`, then links. A plan
  failing two of them reports the first, and a test asserts which — otherwise the message a caller
  sees depends on map iteration order.

**`src/brokers/plan/run/plan-run-broker.ts`** → `planRunBroker`

- PURPOSE: Walks a plan's op tree depth-first in declaration order, serially, against one target, and
  hands back the records `saveRecordAs` named. Reach for this as the only thing that touches the
  target at all — the chain builds and does not execute, and every I/O in this package is either an
  ingredient's own route or something this broker called.
- depends on: `plan-preflight-broker`, `plan-fold-writes-transformer`, `op-describe-transformer`,
  `route-select-transformer`, `route-failure-transformer`, `write-failure-transformer`, its own
  layers, `hydration-run-state-contract`, `hydration-run-result-contract`, and every mid-run error
  class.
- delivers: *"A plan is a TREE of ops, and the runner walks it depth-first in declaration order"*,
  *"Depth-first in declaration order is what makes the ancestor chain and `fromSaved` work at all, and
  it is the only ordering guarantee"*, *"A failed plan leaves nothing behind"*, *"the runner is
  serial, and that is a requirement, not an implementation detail"*.
- **Shape**: pre-flight → fold → `for (const op of plan.ops) { await dispatch(op, state); }`, where
  `dispatch` is one `switch (op.op)` over the six kinds and each arm is a layer broker. No
  `Promise.all`, anywhere, with D6's comment above the loop.
- its proxy: **EMPTY**. There is nothing to mock — **the I/O is INJECTED, through the ingredient's
  own `routes`.** §7 says why that makes the unit test honest.
- its test — the behavioural core, and every assertion is on a VALUE:
  - `VALID: {two sibling adds} => the routes ran in declaration order`, asserting the recorded array
    `['guild[0]', 'guild[0]/quest[0]', 'guild[0]/quest[1]']` with `toStrictEqual`
  - `VALID: {a quest under a guild} => the quest route received guildId from the guild's record`,
    asserting the **complete fields object** the route was handed, `{ title: 'Quest 1', guildId: 'g1' }`
  - `VALID: {add(3) with defaults} => the three routes received 'Quest 1', 'Quest 2', 'Quest 3'` —
    the two-of-anything rule, on values
  - `VALID: {two separate add(2) calls} => each sees indexes 0 and 1`, asserted on the four refs
  - `VALID: {saveRecordAs on two rows} => the result is exactly those two keys` with `toStrictEqual`
  - `VALID: {two create ops recording start and end} => ['start:0','end:0','start:1','end:1']` — **the
    serial proof, row 9**
  - `ERROR: {api route rejects} => throws HydrationRouteFailedError` — row 1, whole message
  - `ERROR: {write route rejects EACCES} => throws HydrationWriteFailedError` — row 4, whole message
  - `ERROR: {the second create fails} => the first route still ran to completion`, asserting the
    recorded array — **the no-undo rule, in the unit tier**
  - `INVALID: {an api-only ingredient and no baseUrl} => throws before any route runs`, asserting the
    recorded array is `[]`. **This is the difference between refusing at the call and refusing
    partway through with half a plan on disk**, and asserting the empty array is the only way to see it
- its `.integration.test.ts`: §8.

**`src/brokers/plan/run/op-create-apply-layer-broker.ts`** → `opCreateApplyLayerBroker`

- PURPOSE: Makes one row — resolves its cross-links, fills its foreign keys from its ancestors, calls
  the one route this target can serve, and parses what came back through the ingredient's `record`.
  Reach for this over the other layers for anything a plan MINTS; every other op targets a ref this
  one already put in the state.
- depends on: `field-values-resolve-transformer`, `link-values-transformer`,
  `route-select-transformer`, `HydrationRecordShapeError`, `HydrationRouteFailedError`,
  `HydrationWriteFailedError`.
- delivers: *"`routes` — one function per way of making the row"*, *"the RUNNER writes each ancestor's
  id into the named field"*, sad-path row 3.
- its test: `VALID: {a create with two links} => the route received both ids`;
  `ERROR: {route returns a record the contract rejects} => throws HydrationRecordShapeError naming
  the field`; `ERROR: {route returns undefined} => throws HydrationRecordShapeError` (D3);
  `VALID: {a create whose fields carry a SavedRef} => the route received the resolved value`.

**`src/brokers/plan/run/op-save-record-apply-layer-broker.ts`** → `opSaveRecordApplyLayerBroker`

- PURPOSE: Puts one row's whole record on the plan's output under the name the recipe gave it. Reach
  for this rather than saving an id: *"the ids come along inside the record"*, and a second verb for a
  subset would only make callers learn which one carries the slug.
- its test: `VALID: {saveRecord on a created row} => the result carries the WHOLE record`, asserting
  every field including the server-assigned ones; `VALID: {two saves of the same row under two names}
  => both keys hold that record`.

**`src/brokers/plan/run/op-remove-apply-layer-broker.ts`** → `opRemoveApplyLayerBroker` — **gated on Q2**
**`src/brokers/plan/run/op-extra-apply-layer-broker.ts`** → `opExtraApplyLayerBroker` — **gated on Q3**

Both are written to the ruling. Their tests assert the arguments the declared verb received and the
state change that followed — never that a callback was handed over.

**EDIT `src/brokers/hydration/create/hydration-create-broker.ts`** — add `run`

The one planned edit to a finished chunk-2/3 file, and it is additive: the returned object becomes
`{ ingredient, registry, recipe, run }`, with `run` closing over what `registry()` was handed (D1).
Its existing test grows one case: `VALID: {createHydration<DmTarget>()} => returns exactly ingredient,
registry, recipe, run`, asserting the key set with `toStrictEqual`.

---

## 7. Reconciling an I/O broker with "integration tests are only for startup files and flows"

**The tension is real and this repo has already answered it — twice, for two different reasons, and
only one of those answers applies here.**

### The precedent the chunk 1–3 plan cited, and why it does not cover the runner

`packages/eslint-plugin`'s RuleTester convention was checked by opening it.
`packages/eslint-plugin/src/adapters/eslint/rule-tester/eslint-rule-tester-adapter.ts` wraps
`RuleTester` with an **empty proxy**, and its consumers — `rule-*-broker.test.ts` — are named
`.test.ts`. What that precedent actually says is: **a DSL run IN PROCESS, with no temp directory, no
socket and no file, stays a unit test.** That is exactly right for chunk 1–3's `ts.createProgram`
fixtures, and it is the wrong precedent for a runner whose claim is about bytes on disk. Citing it
here would be citing a precedent nobody checked.

### The precedent that does cover it

**Four packages already colocate `.integration.test.ts` beside a BROKER**, each one because a mocked
filesystem could not grade the claim:

| File | What it grades |
|---|---|
| `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.integration.test.ts` | its own header: *"The unit tests beside this one all mock the filesystem, so every one of them would stay green against a broker that built the WRONG path string"* |
| `packages/orchestrator/src/brokers/quest/hydrate/quest-hydrate-broker.integration.test.ts` | the broker the quest ingredient's `write` route will call |
| `packages/orchestrator/src/brokers/worktree/prepare/worktree-prepare-broker.integration.test.ts` | real `git worktree add` |
| `packages/mcp/src/brokers/caller-repo-root/resolve/caller-repo-root-resolve-broker.integration.test.ts` | a real directory walk |

**And ward runs them.** `packages/ward/src/statics/check-commands/check-commands-statics.ts` discovers
integration tests with `src/**/*.integration.test.{ts,tsx,js,jsx}` — **no folder-type filter at all** —
and excludes `**/*.integration.test.ts` from the unit run. So a
`brokers/plan/run/plan-run-broker.integration.test.ts` is discovered by `--only integration` and
skipped by `--only unit`, exactly as a flow's would be.

### The split this plan takes

| Tier | What it grades | Why it is honest there |
|---|---|---|
| **`plan-run-broker.test.ts`** (unit) | the walk order, the fields each route received, link resolution, the fold, the output shape, and every error's whole message | **The runner's I/O is INJECTED through the ingredient's `routes`.** A unit test hands it real functions over an in-memory map — not mocks, *supplied implementations* — so the runner runs completely real against a real (in-memory) target. There is no `registerMock` in this suite and its proxy is empty |
| **`plan-run-broker.integration.test.ts`** | the claims a memory map cannot make: a real parent directory created, a real `EACCES`, two ops read-modify-writing one real file, a real row surviving a later failure | These are the rows a mocked `fs` stays green against — which is the ward broker's own stated reason, one layer over |
| **`fetch-post-adapter.integration.test.ts`** | a refused connection, a 500 with a body, a 2xx with a bad shape | The same: an `fetch` mock cannot refuse a connection the way a closed socket does |

**Nothing else gets an integration test.** Every transformer, guard and contract in chunks 4–6 is
pure and stays `.test.ts` with no proxy, so ward's folder-type mapping stays unsurprising and a
file-scoped run reports no `DISCOVERY MISMATCH`.

---

## 8. How an integration test exercises a runner that touches disk

### The harness — `packages/hydration/test/harnesses/file-target/file-target.harness.ts`

A `.harness.ts` factory created at describe scope, owning its own lifecycle through the `beforeEach`
/ `afterEach` properties the ts-jest transformer auto-wires. **The scenario file imports no
`node:fs`, no `node:path`, no `node:os`** — the harness owns all of it, per the import boundaries in
`get-testing-patterns`. It imports `.stub.ts` files, never a contract's value export.

```
fileTargetHarness()
  beforeEach   -> installTestbedCreateBroker({ baseName: BaseNameStub({ value: 'hydration-runner' }) })
  afterEach    -> testbed.cleanup()
  target()     -> { home: testbed.guildPath }                  // the FILE repo's own target shape
  ingredients()-> guild / quest / operation, whose `write` routes really write JSON
                  through fsEnsureWriteAdapter under `<home>/…`
  read({ relativePath })        -> the file's text, or null
  readJson({ relativePath })    -> the parsed object
  denyWrites({ relativePath })  -> chmod 0o500, and VERIFIES the deny took effect
  failNextWrite({ code })       -> injects an errno into the next write route call
```

**`testbed.guildPath`, not `testbed.projectPath`** — the repo-root `CLAUDE.md` names a field
`InstallTestbed` does not have. Temp directories live under the OS `/tmp`; **nothing is written into
the repo, not even `<repoRoot>/tmp`.**

**`denyWrites` verifies its own effect and throws if it did not take.** Running as root, `chmod 0o500`
is ignored and the EACCES test would pass while asserting nothing. A test body may hold no
conditional, so the check belongs in the harness, where failing loudly is the point. The root-proof
fallback, if this turns out to be a problem on a CI image, is `ENOTDIR` — aim the write at
`<some file>/child.json` — and the harness exposes that as a second method rather than making the
first one clever.

### The four cases, and what each asserts

```
describe('planRunBroker (integration — real disk)')

  VALID: {a plan whose write route lands three directories deep, none present}
      => every parent is created and the file holds the row
      -> harness.readJson({ relativePath: 'guilds/g1/quests/q1/quest.json' })
         toStrictEqual the complete written object.          [sad-path row 5]

  ERROR: {the target directory is read-only}
      => throws HydrationWriteFailedError naming the real path
      -> toStrictEqual({ name, message }) where message is built from
         harness.absolutePath({ relativePath }) — never a literal.  [row 4]

  VALID: {two guild creates read-modify-writing ONE config.json}
      => the file holds BOTH ids
      -> harness.readJson({ relativePath: 'config.json' })
         toStrictEqual({ guilds: ['guild[0]', 'guild[1]'] }).
         A parallel runner loses one.                        [row 9 — the serial requirement]

  ERROR: {the second create fails}
      => the first row is still on disk
      -> harness.readJson({ relativePath: 'guilds/g1.json' })
         toStrictEqual its complete content.                 [no undo]
```

### The api half — `packages/hydration/test/harnesses/api-target/api-target.harness.ts`

A real `node:http` server on an ephemeral port, started in `beforeEach` and closed in `afterEach`,
with `answerNext({ status, body })` and `close()`. **Not MSW**: `get-testing-patterns` says
`StartEndpointMock` is for frontend fetch and explicitly not for server-side tests. A real socket is
also the only way to produce a genuine `ECONNREFUSED`.

### The database half — `packages/hydration/test/harnesses/sql-target/sql-target.harness.ts`

A fake transaction — `{ tx: { query } }`, matching `proto/db.ts`'s `SqlTarget` — recording every
statement, able to reject on the Nth call, and issuing `ROLLBACK` in its own wrapper. It proves the
framework works for **both target kinds**, which is the claim `proto/ingredients.ts` and `proto/db.ts`
make at type level and which nothing has yet made at run time.

---

## 9. Chunk 5 — `transitions` and `reach`

**Three EDITs and three new files.** The edits come first; nothing in R4-β compiles without them.

| File | Change | Why |
|---|---|---|
| EDIT `src/contracts/transition-spec/transition-spec-contract.ts` | `ReachFn<TTarget, TValue>` gains `record` | **Q4.** `reach({ from, to, target })` cannot know which of three quests to walk. Nothing imports `ReachFn` today, so the edit is free now |
| EDIT `src/contracts/ingredient-config/ingredient-config-contract.ts` | `transitions` intersects `{ reach: ReachFn<TTarget, TValue> }` | The zod half stays `{ field, to }` — a function has no shape a parse can compare — and `reach` arrives by intersection, which is the same split `hydrationRoutesContract` already uses for `RouteFn` |
| EDIT `src/brokers/ingredient/declare/ingredient-declare-broker.ts` | refuse `transitions` with no `reach` → `IngredientDeclarationError` | The runtime backstop for a consumer reaching the declaration from JavaScript, matching the existing `routes`/`copies`/`extras` refusals. Message: ``ingredient "quest" declares transitions with no reach`` |

**`src/guards/is-reachable-transition/is-reachable-transition-guard.ts`** → `isReachableTransitionGuard`

- PURPOSE: Answers whether a value is one of the end states this ingredient lets a caller ask for.
  Reach for this as the RUNTIME half of `transitions.to` — the type refuses `set({ status: 'blocked'
  })` at the call site, and this refuses it for a caller that never typechecked.
- its test: `VALID: {to:'in_progress', spec:{field:'status',to:['created','in_progress']}} => true`;
  `INVALID: {to:'blocked', …} => false` — **`blocked` is Part 5's own worked example of a state
  nothing reaches by asking**; `EMPTY: {} => false`.

**`src/transformers/transition-from/transition-from-transformer.ts`** → `transitionFromTransformer`

- PURPOSE: Reads a row's CURRENT value of its transition field off the record the route returned, so
  `reach` is told where it is starting from. Reach for this over the plan: the plan says where the row
  should END, and the gates need both ends.
- its test: `VALID: {record:{status:'created'}, field:'status'} => returns 'created'`;
  `EMPTY: {record:{}, field:'status'} => returns undefined` — which is a legal `from` for a row a
  `write` route created with no status at all.

**`src/brokers/plan/run/op-set-apply-layer-broker.ts`** → `opSetApplyLayerBroker`

- PURPOSE: Applies one `set` — the transition half, by walking the row through the ingredient's own
  gates. Reach for `opCreateApplyLayerBroker` for the written half: `planFoldWritesTransformer` has
  already folded it into the create, so a `set` op reaching this broker with written values is one
  the fold refused and is an update (Q2).
- depends on: `transition-from-transformer`, `is-reachable-transition-guard`,
  `HydrationTransitionRefusedError`.
- delivers: *"One verb sets state, and the INGREDIENT decides whether that means a walk"*,
  *"A transition is not free, and the doc should say so where somebody will read it"*, sad-path row 6.
- its test — **behaviour, never "was called"**:
  - `VALID: {set status in_progress on a created quest} => reach received from 'created', to
    'in_progress' and the row's own record`, asserting the **complete recorded argument object**
  - `VALID: {reach returns the walked record} => the state now holds it`, asserting the record a
    later `saveRecordAs` hands back carries `status: 'in_progress'` — **the walk's RESULT, not its
    invocation.** A test asserting only that `reach` fired is the false positive this repo's
    instructions name twice
  - `VALID: {a transition that mints rows} => a later filter sees them` — the composition Round C
    asks about, proved with a `reach` that really adds operations to the in-memory target
  - `ERROR: {reach throws} => throws HydrationTransitionRefusedError` — row 6, whole message
  - `VALID: {setRaw on the transition field} => reach is never invoked`, asserting the recorded call
    list is `[]` **paired with** the written value landing on the row — the pairing is what makes it
    an assertion rather than an absence

---

## 10. Chunk 6 — `filter` reading live state, and `fromSaved` resolving

**Gated on Q2.** `filter` has no query without a ruling.

**A departure, named**: the brief puts *"`fromSaved` resolving"* in chunk 6, and this plan ships
`savedRefResolveTransformer` and `fieldValuesResolveTransformer` in **chunk 4, group R0**. The reason
is mechanical — the create path cannot run a plan containing a `fromSaved` at all without them, and
Part 5's own worked `guild-mid-execution` recipe contains one — so deferring them would leave chunk 4
untestable against the specification's own example. What chunk 6 keeps is the half that genuinely
needs live state: `fromSaved` pointing into a filtered set, and the interactions Round C enumerates.

| File | Export | PURPOSE / what its test asserts |
|---|---|---|
| EDIT `src/contracts/hydration-routes/hydration-routes-contract.ts` | — | adds `query` (and `update`, `remove`) per Q2's ruling; `RoutesFor<TTarget>` keeps its at-least-one union over the three CREATION routes |
| `src/transformers/filter-scope-where/filter-scope-where-transformer.ts` | `filterScopeWhereTransformer` | PURPOSE: Narrows a filter's `where` to the rows under its immediate host, by the same `links` entry that put the host's id on those rows in the first place. Reach for this over matching every row of that ingredient in the instance — *"makes a recipe holding two guilds delete rows belonging to a parent it did not create"*. Test: `VALID: {where {role:'riftcarver'}, scope guild[0]/quest[0], records {…: {id:'q1'}}} => returns {role:'riftcarver', questId:'q1'}` with `toStrictEqual`; `VALID: {no scope} => returns the where unchanged` (D11) |
| `src/transformers/matched-row-rebind/matched-row-rebind-transformer.ts` | `matchedRowRebindTransformer` | PURPOSE: Points a filter's nested ops at one real matched row, by rebinding the `matchedRef` placeholder the chain gave them. Reach for this once per matched row: the chain could not know the count, so it wrote one set of ops against one stand-in ref. Test: `VALID: {ops targeting operation[0], a matched row} => the state resolves operation[0] to that row`, asserted through the record a nested `saveRecordAs` hands back |
| `src/guards/is-filter-expect-satisfied/is-filter-expect-satisfied-guard.ts` | `isFilterExpectSatisfiedGuard` | Test: `it.each(filterExpectContract.options)` — **derived from the contract, never a hardcoded list** — plus `INVALID: {expect 'one', count 2} => false` and `VALID: {expect 'any', count 0} => true` |
| `src/brokers/plan/run/op-filter-apply-layer-broker.ts` | `opFilterApplyLayerBroker` | The query, the expectation check, and the serial replay of the nested ops once per matched row. Delivers *"`filter` selects rows that only exist at RUN time"*, *"`filter` reads live state, not the plan"*, sad-path row 7 and the mid-run table's first row. Tests: the distinct pair in §2 row 7; `VALID: {a filter over rows a transition in the same plan just minted} => it sees them` (Round C, and the reason `filter` reads live state at all); `VALID: {a filter under q[0] with rows under q[1] present} => only q[0]'s are matched`, asserting the complete removed set — **the scope, proved against a plan holding two parents** |
| `src/brokers/plan/run/op-update-apply-layer-broker.ts` | `opUpdateApplyLayerBroker` | The non-foldable `set` and `filter(…).set(…)`, per Q2's ruling |

---

## 11. Chunk 6b — what it adds beyond the tests already named

Chunk 6b is **mostly tests**, and §2 places every one of them against the row it proves. What it adds
as files:

| File | Owner | Why |
|---|---|---|
| `test/harnesses/api-target/api-target.harness.ts` | R6-α | rows 1 · 2 |
| `test/harnesses/sql-target/sql-target.harness.ts` | R6-γ | row 8, and the *"one plan, two target kinds"* claim |
| fault injection on `file-target.harness.ts` | R6-β | rows 4 · 9 and no-undo |

**Before chunk 6b is called done, re-read *"Two kinds of probe, and neither substitutes for the
other"*.** It exists to say that *"A green type suite says nothing about any row in the table above,
and it is worth writing that down because the type work is visible and thorough and reads like
coverage."* Chunk 1–3 built the type probe. **Chunk 6b is the other one, and it is the only thing in
this build that has ever driven a refused connection or a failed write.** A chunk 6b that lands green
without a real socket ever being refused and a real directory ever being read-only has not done its
job.

---

## 12. Part 5 coverage check

Every Part 5 heading, once, against where it lands. Headings already closed by chunks 1–3 are marked
as such rather than re-listed.

| Part 5 heading | Where |
|---|---|
| *"Mechanics the framework has to implement"* | §4 · §3's two tables · `plan-run-broker` · `plan-preflight-broker` |
| *"The sad paths, which no type catches"* | §2, every row |
| *"Two kinds of probe, and neither substitutes for the other"* | §11 · §7's tier split |
| *"Routes: how an ingredient makes its state"* | `route-select-transformer` · `fetch-post-adapter` · `fs-ensure-write-adapter` · **Q2** |
| *"An ingredient for a FILE, and an ingredient for a DATABASE ROW"* | `file-target.harness` · `sql-target.harness` — **both, because one does not prove the framework names neither** |
| *"An ingredient with only one route, and what it costs"* | `route-select-transformer` · `HydrationRouteUnavailableError` · §3's ALL-not-ANY test |
| *"Linking a child to its parent"* | `link-values-transformer` · `row-ref-ingredient-transformer` · **Q5** |
| *"One verb sets state, and the INGREDIENT decides whether that means a walk"* | `plan-fold-writes-transformer` · `op-set-apply-layer-broker` |
| *"`filter` selects rows that only exist at RUN time"* | chunk 6 entire |
| *"`setRaw` is the escape hatch, and its name is the warning"* | `plan-fold-writes-transformer`'s fourth test · `op-set-apply-layer-broker`'s last test |
| *"A plan is data, and one plan runs three ways"* | `plan-run-broker`'s three target shapes in §8 |
| *"Determinism is structural, not a rule to remember"* | no file in chunks 4–6 calls a clock or a random source; the `add(3)` defaults test asserts the three values |
| *"A plan's output is FLAT, and there is exactly one shape"* (Part 6) | `hydration-run-result-contract` · `op-save-record-apply-layer-broker` · **Q11** |
| *"Every property on an ingredient"* · *"What a recipe declares"* · *"The chain"* · *"Every chainable"* · *"The listing `recipes {}` prints"* | **chunks 1–3** |
| *"Every ingredient carries a test, and a two-route ingredient tests its routes against each other"* | **chunk 7** |
| *"How siegelense finds recipes without importing them"* · the `seed` step · the two siegelense sad-path rows | **chunk 8**, per the Q8 ruling |
| *"The migration IS the validation"* | **chunks 9–10** |
| *"The combinatorial planning session"* | **chunk 12** — Round D DRIVES §2's rows; chunk 6b OWNS them |
| *"An ingredient touches STATE, never a screen"* · *"Some claims can only be asserted in a BROWSER"* | **chunk 7 + the eslint-plugin rule.** No file here holds a DOM handle and none could |

---

## 13. What a build agent reports back rather than working around

**Report a new one rather than working around it silently.** A defect found once and written down
costs one agent; the same defect worked around quietly costs every agent after — that is the chunk
1–3 plan's §10b rule, and it applies here.

- **Any of Q1–Q11 answered differently by the code than by its recommendation.** A ruling that turns
  out not to compile is a finding, not a thing to route around.
- **A message string in §2 or §3 that does not match what the class actually throws.** They were
  transcribed from the files on 2026-09-16; a class edited since is a finding.
- **`installTestbedCreateBroker`'s field names.** The repo-root `CLAUDE.md` says `projectPath` and
  `InstallTestbed` has `guildPath`. If that has been fixed either way, say which.
- **A `chmod 0o500` that does not deny.** The harness throws; report the environment rather than
  softening the test.
- **The fold changing an assertion in a converted test.** Chunks 9–10's rule is that *"a converted
  test keeps its assertions, exactly"* — a conversion that needs a looser assertion has found a
  defect in the fold, and the finding is the deliverable.

### Five findings this plan owes back to `siegelense-recipes.md`

Written by ONE agent in one pass, once the rulings land — not by a build agent mid-chunk.

| Finding | Where it goes in Part 5 |
|---|---|
| **Q2** — the chain has four verbs over rows the plan did not mint, and `routes` declares only how a row is MADE | *"Routes: how an ingredient makes its state"*, and a new Known-gaps row if it is deferred |
| **Q3** — `extras` declares an arg contract and no implementation | *"`extras` — verbs only this ingredient could have"* |
| **Q4** — `reach` gets no row, so it cannot know which of three to walk | *"`transitions` — the field that is walked rather than written"* |
| **Q5** — nothing names which field of a parent record is its id | *"`links` — the foreign keys, named by parent NAME"* |
| **D3/D4** — a route returns the row's RECORD, and a `set`'s written half folds into the create | *"Mechanics the framework has to implement"*, beside the Op table |
