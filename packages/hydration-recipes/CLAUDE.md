# @dungeonmaster/hydration-recipes

This repo's OWN states — which ingredients exist, what each one `copies:`, and the root-`dependencies`
rule that keeps the package unpublished. See `scrolls/seigelense/siegelense-recipes.md` for the
specification this package builds against, and
`scrolls/seigelense/plans/recipes-chunk-07-repo-ingredients.md` for the plan this package's own
ingredients and recipes were built from.

## The five ingredients, and what each one copies

| Ingredient | Routes | `copies:` |
|---|---|---|
| `guild` (`brokers/guild/ingredient/`) | `api`, `write`, `query`, `remove` | `guildAddBroker` |
| `quest` (`brokers/quest/ingredient/`) | `api`, `write`, `update`, `query`, `remove` | `questPersistBroker` |
| `operation` (`brokers/operation/ingredient/`) | `write`, `update`, `query`, `remove` — no `api`: `operations` is off the modify-quest allowlist entirely | `questOperationsUpdateBroker` |
| `session` (`brokers/session/ingredient/`) | `write`, `query`, `remove` — no `api` | `external:claude-cli` |
| `subagent` (`brokers/subagent/ingredient/`) | `write`, `query`, `remove` — no `api` | `external:claude-cli` |

`quest` declares `transitions` on `status`, walked by `quest-reach-route-broker.ts`
(`brokers/quest/reach-route/`). `set({ status: … })` on a quest is a WALK, never a plain field
write, for every value on the declared `to` list: `explore_flows`, `review_flows`,
`flows_approved`, `explore_observables`, `review_observables`, `approved`, `explore_design`,
`review_design`, `design_approved`, `in_progress`, `complete`, `abandoned`. `created`, `pending`,
`paused`, `blocked`, `merging` and `merged` are deliberately off the list — see
`quest-ingredient-broker.ts`'s own header for why each one is excluded. `setRaw({ status: … })` is
still the only way onto an excluded value, or onto a value the real gates would refuse.

**`to` is `questTransitionTargetStatusesStatics.value`, an inline literal tuple, not a `.filter()`
call.** `@dungeonmaster-local/ban-quest-status-literals` refuses an inline array or set holding two
or more recognized status literals everywhere except the one path its allowlist names for exactly
this list — `statics/quest-transition-target-statuses/` — so the tuple lives there instead of at the
declaration site, and `quest-ingredient-broker.ts` imports it. `to`'s STATIC TYPE is therefore the
twelve-member literal union the statics file declares, not the un-narrowed `QuestStatus[]` a
`.filter()` call would produce, so `set({ status: 'blocked' })` correctly FAILS TO COMPILE here,
matching the specification. `isTransitionTargetQuestStatusGuard` still computes the same set at
run time (and still backs `questStatusWalkPathTransformer`'s BFS pruning) — the guard's own test
asserts the statics list matches exactly what a fresh `.filter()` through the guard produces, so an
enum change either file misses fails a test instead of silently narrowing or widening `to`. The
pre-flight (`HydrationTransitionUnreachableError`) still refuses an unreachable status at run time
too, unchanged, since the pinned list holds the identical runtime set the guard always computed.

**Every multi-field ingredient hands `ingredient({fields: ...})` an UPCAST schema, never the raw
`ZodObject` a `.pick()`/`.omit()`/`.extend()`/`z.object()` chain infers to.**
`ingredient-config-contract.ts`'s own header documents why: `IngredientConfig['fields']` and
`IngredientConfigInferenceAnchor['fields']` both type `fields` as the phantom `{ readonly _output:
TFields }`, and `ingredient()`'s generic signature checks a real value against BOTH sites —
re-checking one concrete `ZodObject<Shape>` against two independently-inferred phantom-carrier sites
routes the comparison through `ZodObject`'s own generic methods (`deepPartial()` among them) and
fails, even though the schema is perfectly valid. This is not specific to a `transitions`-declaring
ingredient — `session` and `subagent` declare no `transitions` and still need it, so their own
`session-fields-contract.ts`/`subagent-fields-contract.ts` bake the upcast directly into the field
contract's own export. `guild`, `quest` and `operation` instead keep their field contract a plain
`ZodObject` (their ingredient's own `defaults` reads `.shape.<field>` off it, which an upcast export
would lose) and pair it with a sibling `*-fields-schema-contract.ts` — `questFieldsSchemaContract`,
`guildFieldsSchemaContract`, `operationFieldsSchemaContract` — that upcasts to
`z.ZodType<Fields, …, z.input<typeof fieldsContract>>` and is used ONLY in the `fields:` property of
`ingredient({...})`.

`reach` walks every ordinary hop through `questModifyBroker`, over a shortest path computed by
`questStatusWalkPathTransformer` off the same `questStatusTransitionsStatics` edge list
`questModifyBroker` itself enforces. The one hop that is NOT a plain field write is `in_progress`:
it seeds the operations relay, which nothing but `POST /api/quests/:questId/start` does, and that
responder's logic is not exported from `@dungeonmaster/orchestrator`'s barrel. So `reach` calls the
real route through `dmHttpRequestAdapter` when the target carries a `baseUrl`, and THROWS a named,
actionable error on a write-only target rather than flipping the field and leaving the ledger
empty — the exact silent drift `packages/orchestrator/CLAUDE.md` warns `writeQuestFile` produces.

**`questModifyBroker` and `questGetBroker` escape the target the same way `StartOrchestrator` does.**
Both resolve the quest file via the GLOBAL `process.env.DUNGEONMASTER_HOME`, never via
`target.home` — confirmed by reading `quest-modify-broker.ts` and `quest-get-broker.ts` directly,
neither takes a `target` parameter at all. `quest-reach-route-broker.ts` and
`quest-update-route-broker.ts` both inherit this, as does `operationWriteRouteBroker`: closing it
is a `@dungeonmaster/orchestrator` change (an optional `home` parameter threaded to every path the
broker touches, the shape `guildAddBroker` now carries), not an ingredient one. `fileTargetHarness`
sets that env var for a test's duration for exactly this reason — a caller building a `DmTarget` by
hand and skipping the harness will see these routes read and write whatever `~/.dungeonmaster` the
process already defaults to.

**`quest-update-route-broker.ts` returns the reloaded `Quest` record, never `questModifyBroker`'s own
result envelope.** `ModifyQuestResult` is `{ success, error?, failedChecks? }` — it carries no quest
data at all — so a successful modify is followed by a `questGetBroker` reload, and a failed modify OR
a failed reload both throw a plain `Error`. The runner's own `opUpdateApplyLayerBroker` already
wraps whatever this route throws through `routeFailureTransformer` into a `HydrationRouteFailedError`,
the same way it does for every ingredient's `update` route, so this file adds no error-shaping logic
of its own. This is the same defect the `api` routes were fixed for (an envelope handed back where
the runner expects the ingredient's `record` contract to parse) — `dmHttpResponseUnwrapAdapter` is
that fix's own adapter, and it does not apply here directly: it unwraps an HTTP `{status, body}`
envelope, and `questModifyBroker` is an in-process call returning `{success, error?}`, a different
shape entirely. Reusing it would have meant reshaping one to fit the other for no real gain; the
route instead reuses the SAME two-part pattern (return the real data on success, throw on failure)
without a second unwrap adapter. `quest-ingredient-broker.integration.test.ts`'s
`g[0].quests.filter({...}).set({title})` case is what exercises this route through a real, non-mocked
plan — nothing did before `transitions` existed, because a `set()` on `status` was the only way most
plans ever touched a quest after its create.

## `session` and `subagent`'s `copies:` names an EXTERNAL tool, not a broker

Nothing in this repo writes a Claude session transcript in production — the Claude CLI does. So
`copies: 'external:claude-cli'` names that producer, not an in-repo broker. `copiesTargetContract`
requires the `external:` prefix for exactly this case and refuses a slash, so this no longer names a
path into `packages/web/test/harnesses/claude-mock/bin/claude` — see each ingredient's own header for
the full reasoning.

## This package is NOT in the root `package.json` `dependencies`, and a test pins it

`src/hydration-recipes-not-shipped.integration.test.ts` reads the root `package.json`
(walking UP from `__dirname`, never `process.cwd()`) and asserts
`rootPackageJson.dependencies['@dungeonmaster/hydration-recipes']` is `undefined`, and that this
package's OWN `package.json` carries `"private": true`. `dungeonmaster create-package` adds a
`dependencies` entry automatically — that is what would put this package back, and nothing else
would say so without this test.

## Build before a listing is honest

`recipes {}` (chunk 8, `@dungeonmaster/siegelense`) globs
`packages/hydration-recipes/dist/index.js` and dynamically imports it — it reads COMPILED output,
never source. Run `npm run build --workspace=@dungeonmaster/hydration-recipes` before trusting the
listing after editing a recipe.

## The three exports chunk 8 reads, and why they are three, not one

`recipesConventionStatics.exports` (`@dungeonmaster/shared/statics`) names three exports `index.ts`
carries for `@dungeonmaster/siegelense` to read. `recipesManifest` holds each recipe's `recipeName`,
`description` and `inputs` schema as data — it cannot answer `runs` or `makes`, which need a real
`Plan` a recipe's builder has already assembled. `recipesListingBuildBroker` is the zero-argument
function that builds one off `recipeListingProbeStatics` and folds `dmRegistryBroker.listing(plan)`
into `runs`/`makes` per recipe. `recipesSeedRunBroker` — the entry a `seed` step calls to run a
recipe's plan against a live instance — resolves a recipe by name off this package's own three,
validates `params` through that recipe's own `inputs` schema, points `process.env.DUNGEONMASTER_HOME`
at the target's `home` for the run's duration (restored in a `finally`, since the driver process that
runs a seed inherits the OPERATOR's environment, not the lane's), and runs the plan through
`dmRegistryBroker.run` — never a fresh `recipesHydrationCreateBroker()` call.

`src/hydration-recipes-exports.integration.test.ts` asserts `index.ts`'s export names against this
same statics file, so a rename on either side of the boundary goes red here instead of only at run
time, in a consumer's repo.

## The listing probe, and what breaks if one drifts

`quest-advances-one-step` and `session-with-nested-chain` both parse their own `inputs` inside their
build callback, so `recipesListingBuildBroker` cannot assemble either one's `Plan` with no input
values. `recipeListingProbeStatics` (`src/statics/recipe-listing-probe/`) holds a fixed, plausible
value for each — an all-zero id, a path under a directory named for exactly this purpose — never
seeded, since the chain builds and does not execute.

The broker parses each probe through that recipe's own `inputs` contract before calling it. A probe
that stops satisfying its recipe's contract fails there, naming the recipe and the key that broke,
rather than reaching the listing with a wrong answer.

## It may not import `web`

`@dungeonmaster/web` has no `main` and no `exports`, and builds through `vite build` — an import of
it from here resolves to nothing at run time. Nothing in this package needs it: every route runs
through a broker reached BY PATH from `@dungeonmaster/orchestrator`'s `/brokers` subpath, or a
direct filesystem write. Routes deliberately do NOT import `StartOrchestrator` from the main `.`
barrel: that barrel evaluates `startup/start-orchestrator.ts` on import, which boots a rate-limits
watcher and a stale-process watchdog at module scope — fatal for a short-lived command like
`dungeonmaster siegelense recipes`, which would otherwise never exit.

## A quest's `write` route appends the outbox line, exactly like `questPersistBroker`

`quest-write-route-broker.ts` calls `questPersistDirectBroker`, which reimplements
`questPersistBroker`'s own effect — atomic temp-then-rename write, then
`event-outbox.jsonl` append — because `questPersistBroker` itself is unreachable from this package
(internal to `@dungeonmaster/orchestrator`, absent from its public barrel). A seeder that skips the
append (`packages/orchestrator/test/harnesses/quest-seed/quest-seed.harness.ts` does) is the
counterpart to diff against when a converted test needs the outbox and doesn't have it.

## An ingredient never calls a clock or a random source

The chain supplies each row's index via `defaults(index)`; that is the only variation an ingredient
may have. Every value production mints that no ingredient can supply is a documented gap, not a
silent omission — see each route broker's own header (`guild-add-broker.ts` mints `id` and
`createdAt`; `quest-write-route-broker.ts` mints `id`, `folder` and `createdAt` the same way,
justified inline as `volatile` fields a two-route comparison would project away).

## `registry()` and `run()` MUST come from the SAME `recipesHydrationCreateBroker()` call — a measured framework interaction, not a style preference

`recipesHydrationCreateBroker()` (this package's own binding over `@dungeonmaster/hydration`'s
`hydrationCreateBroker<DmTarget>()`) closes `registeredIngredients` over ONE call's own instance.
`registry()` populates that closure; `run()` reads it back. `ingredient()` and `recipe()` are BOTH
stateless (confirmed by reading `hydration-create-broker.ts` directly — neither touches
`registeredIngredients`), so every ingredient and recipe file in this package may keep calling
`recipesHydrationCreateBroker()` on its own. But a `run` fetched from a SECOND, fresh call sees an
EMPTY ingredient list, and every `filter`/`update`/`remove` in a real plan then fails preflight with
`HydrationRouteVerbUnavailableError`, naming a route that really is declared on the ingredient — the
runner is asking a registry that was never told about it. `dm-registry-broker.ts` is therefore the
ONE binding this package exports `run` off (`dmRegistryBroker.run`), and nowhere else in this
package calls `.run()` off its own local `recipesHydrationCreateBroker()`.

## A `DmTarget` alone does not isolate every `write` route from the real machine

`guildWriteRouteBroker` is the one route that no longer depends on the environment: it hands
`guildAddBroker` an explicit `home: target.home`, and that broker resolves the config read, the
`guilds/<id>/quests` directory and the config write against it, reaching
`process.env.DUNGEONMASTER_HOME` only when no caller supplies a home.
`packages/orchestrator/src/brokers/guild/add/guild-add-broker.integration.test.ts` pins the env var
at one temp directory, hands the broker another, and reads both back.

`operationWriteRouteBroker` still routes through `questGetBroker`, which takes no `target`
parameter at all and resolves the GLOBAL `process.env.DUNGEONMASTER_HOME`. A test (or a future
`seed` step caller) that only builds a `DmTarget` and never sets this env var writes its quest and
guild FILES correctly under `target.home` and then cannot find the quest it needs.
`test/harnesses/file-target/file-target.harness.ts` sets and restores this env var (and seeds an
empty `config.json`, since `guildConfigReadBroker`'s ENOENT fallback tests `cause instanceof Error`
and under jest the cause is an `fs/promises` error from outside the sandbox realm) for exactly this
reason — reach for that harness rather than building a `DmTarget` by hand in a new test.

## `saveRecordAs` freezes a row's record at CREATE time — it is not a live read

`state.records.set(op.ref, parsedRecord.data)` (`op-create-apply-layer-broker.ts:112`) runs ONCE,
when a row is created, and nothing in the runner ever updates it afterward. A quest row saved via
`saveRecordAs` BEFORE a sibling `operation` create appends onto the SAME on-disk quest file reads
back its ORIGINAL `operations: []` — not the ledger that exists by the time the whole plan
finishes — regardless of where the `saveRecordAs` call sits in declaration order relative to the
`operations.add()` calls. `readQuestFileOperations` on `file-target.harness.ts` reads the real file
off disk for exactly this reason; reach for it wherever a claim is about a row's ledger rather than
its own directly-set fields (`status`, `title`, … are fine off `saveRecordAs`, since nothing else in
a plan mutates those after create).

## `.under()` does not carry ancestor names forward for child accessors

`dm.quests.under({ guildId }).add(1, (q) => [...])` type-checks, but `q[0].operations` inside that
builder does NOT — `TS2339`. `collectionChainTransformer`'s own `under` implementation passes the
SAME `ancestorNames` the ORIGINAL (usually empty, top-level) collection carried into the child
collection it returns, so a row made via `.under()` has no ancestors as far as the type system is
concerned, even though the runtime link value is real. The specification's own worked `.under()`
fixture (`packages/hydration/test/type-fixtures/positive/every-chainable.ts`) never chains a child
accessor off it either — read in hindsight, that is this same limitation, not an unexercised case.
`quest-advances-one-step-recipe-broker.ts`'s own header carries the full finding; its own
workaround is to write the ledger through the quest's plain `operations` FIELD via `set()` rather
than through the `operation` ingredient's child accessor.

## Two of the three recipes diverge from Part 5's own worked examples, by necessity

- **`session-with-nested-chain`** declares `inputs: { guildPath }`, not `{ guildId }` as Part 5's
  own example shows. The session ingredient links to its guild via
  `{ of: 'guild', as: 'cwd', from: 'path' }` (see `session-ingredient-broker.ts`), so `.under()`
  needs the guild's `path`, not its `id` — and that value is branded `GuildPath`, re-parsed to the
  session's own `AbsoluteFilePath` brand inside the recipe rather than cast.
- **`quest-advances-one-step`** does not reach into a quest an EARLIER step created, as Part 5's own
  example describes. It seeds a FRESH quest under an existing guild instead, for the two reasons in
  "`.under()` does not carry ancestor names forward" and "`quest` declares no `transitions` yet"
  above. Its description says exactly what it does: "its ledger already one operation along", not
  "advanced" — nothing in this recipe walks anything.

## Two known gaps this chunk did not close, named rather than worked around

- **Every operation-status change in this package's own tests arrives already-set** — through
  `defaults`/`set` at create time, or a quest's own `operations` field written wholesale. No
  ingredient here reaches a single operation row and flips its OWN status field after creation
  (`operation` declares no `transitions` either, and nothing in this chunk's build order names an
  `operationReachRouteBroker`).
- **No recipe or ingredient here can modify a row an EARLIER seed step created, addressed only by
  its id** — Q7-6 of the chunk-7 plan names this directly: "If a verb is wanted later it is
  `attach({id})` on a collection." `quest-advances-one-step`'s own divergence above is the
  concrete cost of that gap.
