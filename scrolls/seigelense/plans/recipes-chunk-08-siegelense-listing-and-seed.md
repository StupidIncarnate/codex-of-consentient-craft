# Chunk 8 — the siegelense `recipes` listing and the `seed` step

> **This is the chunk where the framework becomes reachable from the tool.** Chunks 1–7 built
> `@dungeonmaster/hydration` and this repo's own `packages/siegelense-recipes`, and every caller so
> far has been a Jest file importing a recipe as a function. Nothing a person can type reaches any of
> it. Chunk 8 closes that: a `recipes` call that prints what states exist, and a `seed` step that
> makes one.
>
> **The interface is the CLI.** Every call is `dungeonmaster siegelense <call>`. There is no MCP
> layer, no tool registration and no prefix — *"the name typed after `dungeonmaster siegelense` IS
> the call"* (`siegelense-recipes.md:2004`). **Part 6 is authoritative for the surface, and Part 5
> wins over Part 3A wherever the two disagree** — a rule the specification states about itself.
>
> Written against the tree on **2026-09-16**, file by file, in
> `worktrees/recipes-doc` with master merged in. Every path below was opened. Where this plan and
> another document disagree, §6 says so by name rather than silently picking one.
>
> **The hard problem this chunk exists to answer is one sentence:** `packages/siegelense` must list
> and seed the recipes in `packages/siegelense-recipes`, a package it may not import and a consumer
> will not have. §1 decides how, and says what it rejected.

---

## 0. What is on disk, and what this plan is written against

### The siegelense surface as it stands

| Thing | State |
|---|---|
| `src/statics/siegelense-call/siegelense-call-statics.ts` | pins the closed call-name set. **`recipes` is already in it** |
| `src/flows/siegelense/siegelense-flow.ts` | `CALL_ROUTES`, a `Map` keyed by the built call names. **No `recipes` entry**, so `recipes` falls through the flow's own three-way refusal and answers *"is a siegelense call but is not built yet"* |
| `src/statics/siegelense-help/siegelense-help-statics.ts` | one entry per BUILT call under `calls`; `index.notBuiltYet` holds the rest as a hand-typed array, and `index.headline` counts the built ones in prose |
| `src/statics/step/step-statics.ts` | `verbs.all` is `goto`, `waitFor`, `click`, `type`, `screenshot`, `eval`. **`seed` is in neither `all` nor the deferred list its comment names** |
| `src/contracts/step/step-contract.ts` | a `z.discriminatedUnion('step', …)`, every member `.strict()` |
| `src/brokers/step/dispatch/step-dispatch-broker.ts` | throws `BrowserStepUnsupportedError` for a browser verb on a browserless lane, then narrows `lane.browser` to non-null for **every** verb, because every verb this repo ships is a browser verb |
| `src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.ts` | creates `packages/siegelense-recipes/src/` in any repo siegelense installs into. **Already named and already scaffolding the right directory** — nothing here renames it |
| `package.json` `dependencies` | `@dungeonmaster/cli`, `@dungeonmaster/shared`, `pixelmatch`, `pngjs`, `zod`. **Neither `@dungeonmaster/hydration` nor `@dungeonmaster/siegelense-recipes`**, and §1 keeps it that way |

### What chunk 7 left on disk for this chunk to read

`packages/siegelense-recipes/index.ts` is a root barrel that declares one export:

```ts
export const recipesManifest = recipeManifestContract.parse([
  guildMidExecutionRecipeBroker,
  questAdvancesOneStepRecipeBroker,
  sessionWithNestedChainRecipeBroker,
]);
```

Its own header names this chunk: *"Chunk 8's listing responder globs
`packages/siegelense-recipes/dist/index.js`, dynamically imports it, and reads `recipesManifest` off
it."* That is the seam, and it works — with two gaps §1 closes.

`packages/hydration` already ships the pieces the listing's two computed lines need:
`planRunsTransformer`, `planMakesTransformer`, `planRunsResultContract`, `planMakesEntryContract`,
all exported from `@dungeonmaster/hydration/transformers` and `/contracts`.

### Six things the code says that the specification does not

Each one changes a decision below. Each was read, not inferred from a name.

| Found in | What is true |
|---|---|
| `siegelense-recipes.md:349` | the three-package table's last column reads **`neither of the others`** for `@dungeonmaster/siegelense`. So the tool may not import `@dungeonmaster/hydration` either — not just the recipes package. Every hydration type the tool needs, it re-declares as a wire contract |
| `recipe-def-contract.ts:15-28` | `recipeDefContract` is a `z.object`, so `recipeManifestContract.parse([...])` hands back **plain objects, not the callables it was given**. The manifest can name a recipe; it cannot build its plan |
| `recipe-manifest-contract.ts:4-5` | *"`runs` and `makes` are NOT stored here — they are computed off a plan"*. So the manifest chunk 7 exports is, by its own design, not enough for the listing the specification describes |
| `plan-runs-transformer.ts:28-34` | `planRunsTransformer` takes `ingredients: readonly IngredientConfigData[]`. Nothing a recipes package holds hands those back — `registry()` returns accessors, and an `Ingredient<C>` is *"opaque on purpose"* (`ingredient-config-contract.ts:110`) |
| `instance-start-broker.ts:155-173` | the driver process is spawned with `env: inheritedEnv` — a snapshot of the **caller's** `process.env`. Nothing points `DUNGEONMASTER_HOME` at the lane's throwaway home for the driver itself; only the spawned api process gets `DUNGEONMASTER_HOME: '{home}'` (`lane-boot-broker`'s spec env) |
| `url-path-contract.ts:15` | `urlPathContract` is `z.string().startsWith('/')`. A `{s.nested.url}` reference does not start with `/`, so a batch carrying one cannot pass `stepContract` as it stands |

---

## 1. The discovery mechanism, decided

### What the specification asks for, verbatim

> *"**`siegelense` must list every recipe's name, description and inputs, and must not import
> `hydration-recipes`** — an import would weld one repo's states into the published tool."*
> — `siegelense-recipes.md:1626-1627`

> *"**The mechanism already exists in this repo.** The CLI discovers each package's install script by
> globbing `packages/*/dist/startup/start-install.js` and dynamically importing it at run time.
> Recipe discovery is the same move, one path over: 1. glob `packages/hydration-recipes/dist/index.js`
> 2. dynamically import it 3. read the manifest it exports — every recipe's `name`, `description`,
> input contract, and the routes its ingredients declare"* — `siegelense-recipes.md:1629-1636`

### The decision

**A filesystem convention plus a dynamic import of COMPILED output, naming one package, reading
three named exports, and parsing everything that comes back through siegelense's own contracts.**

| Step | How |
|---|---|
| find the repo | `cwdResolveBroker({ startPath: process.cwd(), kind: 'repo-root' })` from `@dungeonmaster/shared/brokers` — the directory holding `.dungeonmaster.json` |
| find the package | `<repoRoot>/packages/siegelense-recipes`, from `recipesConventionStatics` (§3, A1) |
| find the entry | `<package>/dist/index.js`, from the same statics |
| load it | `runtimeDynamicImportAdapter({ path })` from `@dungeonmaster/shared/adapters` |
| read it | three named exports: `recipesManifest` (data), `recipesListingBuildBroker` (a function), `recipesSeedRunBroker` (a function) |
| trust it | not at all. Whatever comes back is `unknown` until a siegelense contract parses it |

### Does `dungeonmaster init`'s mechanism fit? Half of it, and the half that does is worth copying deliberately

`packageDiscoverBroker` + `installExecuteBroker` is the structural precedent, and this plan follows
it in three respects: it addresses compiled output by PATH rather than by module specifier, it loads
with a dynamic `import()` behind an adapter so tests can stage the module, and it treats the loaded
module's exports as untyped values.

It does **not** fit in two respects, and both are the actual design work:

1. **`init` globs a wildcard; recipes name one package.** `packages/*/dist/startup/start-install.js`
   is a wildcard because *any* package may carry an install script. Exactly one package carries
   recipes, and the convention says which. A wildcard here would import every package's barrel to
   find out, running every module's top-level side effects to answer a question the convention
   already answers.
2. **`init`'s payload is a function the CLI fully owns the arguments to.** `StartInstall({ context })`
   takes an `InstallContext` the CLI builds. A seed's argument is a TARGET, and a target's shape
   belongs to the repo — `dmTargetContract` (`packages/siegelense-recipes/src/contracts/dm-target/`)
   carries `claudeHome` and an optional `request` function, neither of which siegelense has ever
   heard of. So the boundary hands over the two things siegelense genuinely holds — the lane's home
   path and its base URL — and the repo builds its own target from them.

### The alternatives, and why each loses

| Rejected | Why |
|---|---|
| **A static import of `@dungeonmaster/siegelense-recipes`** | *"an import would weld one repo's states into the published tool"* (`1627`). And it cannot work anyway: the package is `"private": true` and absent from the root `dependencies`, so a consumer installing `dungeonmaster` never receives it |
| **A generated registry FILE** — the recipes package writes `recipes.json` at a known path, siegelense reads it with `fs` | Carries names, descriptions and counts fine. Carries neither a live input schema nor the `seedRecipe` callable, so `seed` still needs a dynamic import — two mechanisms where one does. Worse, it goes stale **silently**: edit a recipe, forget to regenerate, and the listing lies with no signal. A dynamic import of `dist/` at least fails loudly when `dist/` is missing |
| **Globbing `packages/*/dist/index.js`** — the literal shape of `packageDiscoverBroker` | Imports every package's barrel to discover that one of them has recipes, running every module's top-level side effects. The convention already names the package |
| **siegelense importing `@dungeonmaster/hydration` to compute `runs` and `makes` itself** | `siegelense-recipes.md:349` — the tool *"may import: neither of the others"*. It is also the wrong shape: the transformers need the plan AND the ingredient configs, and both live on the recipes side |
| **A `@dungeonmaster/siegelense/statics` import from the recipes package, to share the export names** | It puts the tool in the recipes package's dependency graph, which is the coupling the three-package split exists to prevent. The shared home in §3 A1 is `@dungeonmaster/shared`, which both already depend on and neither owns |

### Why siegelense parses the imported module with its OWN contracts, and why that is not duplication

Because it may import neither producer, siegelense declares its own `recipeListingEntryContract`,
`recipesListingContract` and `seedStepContract`. Those describe the same shapes
`@dungeonmaster/hydration` describes on the producing side.

That is the correct shape regardless of the import rule. A dynamically imported module is **outside
the process** in exactly the sense this codebase's own boundary rule means: *"Anything arriving from
outside the process is `unknown` until a contract parses it."* A tool that trusted the type of a
value it loaded off disk at run time would be trusting a compiler that never saw it. The import
fence and the boundary rule agree here; the fence is not what makes the second contract necessary.

### Three states, not two

> *"**An absent directory and an empty one must not report the same thing.** An empty
> `hydration-recipes` returns an empty list, meaning *no recipes yet*. A missing one is an
> installation problem and says so."* — `siegelense-recipes.md:1642-1645`

Because the listing reads compiled output, there are **three**:

| On disk | `recipes` answers |
|---|---|
| `packages/siegelense-recipes/` absent | `RecipesPackageMissingError` — an installation problem, naming the path it looked for and `dungeonmaster init` as what creates it |
| the package present, `dist/index.js` absent | `RecipesBuildMissingError` — naming `npm run build --workspace=@dungeonmaster/siegelense-recipes` |
| present and built, `recipesListingBuildBroker()` returns `[]` | `{ recipes: [] }`, rendered as `no recipes declared yet` |

The third state is what the `InstallRecipesScaffoldResponder` already makes reachable: *"An EMPTY
folder is a real answer where a MISSING one is not."* The second is the one the specification does
not name, and it follows directly from *"It reads COMPILED output, which means the recipes package
must be built before a listing is honest"* (`1638`).

---

## 2. Build order, with the groups marked

A group may be built in parallel; a group waits for every group above it. **A gate is a hard stop —
past it an agent writes files that do not compile.**

| # | Item | Files | Folder types | Depends on |
|---|---|---|---|---|
| **A1** | the convention both sides read | 2 | statics (+ a barrel line) | — |
| **A2** | hydration's binding gains `listing(plan)` | 2 edits | brokers, contracts | — |
| **A3** | siegelense's wire contracts for the listing | 4 domains | contracts | — |
| **GATE A** | A1, A2 and A3 typecheck | | | |
| **B1** | the listing probe, and the broker that builds a listing | 2 domains | statics, brokers | A1, A2 |
| **B2** | the seed entry the tool calls | 1 domain | brokers | A2 |
| **B3** | `index.ts`, the conformance test, the CLAUDE.md entries | 3 | root barrel, test, doc | A1, B1, B2 |
| **C1** | the five refusals | 5 domains | errors | A3 |
| **C2** | locate the recipes module, and tell the three states apart | 1 domain | brokers | A1, C1 |
| **C3** | import it and parse the listing | 1 domain | brokers | A3, C1, C2 |
| **C4** | the answer contract, the args parse, the `--human` render | 4 domains | contracts, transformers | A3 |
| **C5** | `SiegelenseRecipesResponder` | 1 domain | responders | C3, C4 |
| **C6** | route it, help it, and prove the CLI reaches it | 3 edits | flows, statics | C5 |
| **GATE B** | `dungeonmaster siegelense recipes` prints one block per recipe this repo declares | | | |
| **D1** | `seed` joins the step vocabulary | 2 edits | statics, contracts | A3 |
| **D2** | `stepSeedBroker` | 1 domain | brokers | B2, C2, D1 |
| **D3** | the dispatcher stops assuming every verb is a browser verb | 2 edits | brokers | D1, D2 |
| **D4** | `run`'s help page, and the package CLAUDE.md entry | 2 edits | statics, doc | D3 |
| **GATE C** | a one-step `run` batch seeds a guild against a live instance | | | |
| **E1** | the reference grammar | 2 domains | contracts, transformers | D1 |
| **E2** | `goto.path` admits a reference | 1 edit | contracts | E1 |
| **E3** | the run holds each step's output and substitutes into the next | 1 edit | brokers | E1, E2, D3 |

**Group E is separable, and that is deliberate.** Groups A–D deliver a `recipes` call and a `seed`
step a person can type. Group E delivers `{g.guild.id}` — composing two seeds in one batch. If the
coordinator wants chunk 11 to start sooner, E may ship as 8b; the cost is named in §6 F11 and it is
that chunk 11's batches paste ids by hand between two `run` calls, which is slower but not blocked.
**Do not cut E silently.**

---

## 3. Every item

### A1 — `recipesConventionStatics`, in `@dungeonmaster/shared`

| | |
|---|---|
| Files | `packages/shared/src/statics/recipes-convention/recipes-convention-statics.ts`, `…-statics.test.ts`, plus one line in `packages/shared/statics.ts` |
| Folder type | `statics/` |

Holds the workspace directory name, the recipes package's directory name, the dist entry's
package-relative path, and the three export names the boundary agrees on.

**Why `@dungeonmaster/shared` and not either end.** `siegelense` may import neither producer
(`349`), and putting the tool in the recipes package's dependency graph is the coupling the split
exists to prevent. `shared` is the one package both already depend on, it ships, and a `statics/`
file may import `statics/` across a package boundary. The alternative — two hand-typed copies with a
test on each side — is what this removes.

**Tests, as behaviour:**

- `VALID: {} => holds the package directory, the dist entry and the three export names` —
  `toStrictEqual` over the complete object. Not a key-set assertion: the VALUES are the contract,
  and a typo in `dist/index.js` is exactly the failure this file exists to prevent.

---

### A2 — hydration's binding gains `listing(plan)`

| | |
|---|---|
| Files | `packages/hydration/src/brokers/hydration/create/hydration-create-broker.ts` (edit), `packages/hydration/src/contracts/hydration-target/hydration-target-contract.ts` (edit — `HydrationFor` gains a member), and the existing colocated test |
| Folder types | `brokers/`, `contracts/` |

`HydrationFor<TTarget>` gains a fifth member beside `ingredient`, `registry`, `recipe` and `run`:

```ts
listing: (plan: HydrationPlan) => { runs: PlanRunsResult; makes: readonly PlanMakesEntry[] };
```

implemented as `planRunsTransformer({ plan, ingredients: registeredIngredients })` plus
`planMakesTransformer({ plan })`.

**Why the framework and not the recipes package.** `planRunsTransformer` needs
`readonly IngredientConfigData[]`, and nothing a recipes package holds hands those back:
`registry()` returns accessors, and a declared ingredient is *"opaque on purpose — a declared
ingredient is a token later chunks pass around, not a record"* (`ingredient-config-contract.ts:110`).
`hydrationCreateBroker` already closes over exactly that array for `run` (`hydration-create-broker.ts:65`),
so this reuses the closure that exists rather than making every consumer's recipes package cast an
opaque token back to a record. `planRunsTransformer` and `planMakesTransformer` stay exported from
`transformers.ts` for a caller assembling its own ingredient list — the same shape `brokers.ts`
already keeps for `planRunBroker`.

**Tests, as behaviour** (extending `hydration-create-broker`'s existing suite):

- `VALID: {a plan over two write-route ingredients} => listing().runs is {serverless: true}` — built
  through the same binding's own `registry()` call, so the assertion proves the closure is read, not
  that a parameter was forwarded.
- `VALID: {a plan whose ingredient declares only an api route} => listing().runs is {serverless: false, needsServerFor: '<that ingredient>'}`.
- `VALID: {a plan making one guild and three quests} => listing().makes is [{ingredient:'guild',count:1},{ingredient:'quest',count:3}]` — `toStrictEqual` on the complete array, in declaration order.
- `ERROR: {listing() from a binding whose registry() was never called} => runs reports needsServerFor for the first ingredient` — the same empty-closure failure `dm-registry-broker.ts`'s own header records for `run`, asserted here so nobody rediscovers it through the listing.

---

### A3 — siegelense's wire contracts for the listing

| | |
|---|---|
| Files | `src/contracts/recipe-listing-entry/{recipe-listing-entry-contract.ts, …-contract.test.ts, recipe-listing-entry.stub.ts}`, `src/contracts/recipes-listing/{…}`, `src/contracts/recipe-name/{…}`, `src/contracts/recipe-input-key/{recipe-input-key-contract.ts, …-contract.test.ts, recipe-input-key.stub.ts}` |
| Folder type | `contracts/` |

`recipeInputKeyContract` is its own domain, not a local inside `recipe-listing-entry-contract.ts`: D1's
`stepContract` member needs it from a different file, this repo allows one exported value per file, and
a value two files need earns its own domain.

```
recipeListingEntryContract = z.object({
  recipeName:  recipeNameContract,
  description: z.string().min(1).brand<'RecipeDescription'>(),
  inputKeys:   z.array(recipeInputKeyContract),        // [] when the recipe declares no inputs
  runs:        z.discriminatedUnion('serverless', [ … ]),
  makes:       z.array(z.object({ ingredient: …, count: z.union([…, z.literal('varies')]) })),
}).strict()

recipesListingContract = z.array(recipeListingEntryContract)
```

`.strict()`, for the same reason `stepContract`'s members are: a key the producing side added and
this side has not learned about must be refused, not silently stripped. An unrecognised key across a
version boundary is the one failure mode this contract exists to catch.

**Tests, as behaviour:**

- `VALID: {a paramless entry} => parses with inputKeys []`.
- `VALID: {runs: {serverless:false, needsServerFor:'guild'}} => parses and keeps the ingredient name`.
- `INVALID: {runs: {serverless:false}} with no needsServerFor => throws` — the union's discriminated
  half must carry the ingredient, because *"a caller with no server reads `needs a server:
  <ingredient>` and stops there"* (`2026`).
- `INVALID: {an entry carrying an unrecognised key} => throws naming that key`.
- `INVALID: {two entries with the same recipeName} => throws naming both indexes` — the listing is
  what a caller picks from, and two rows with one name make the pick ambiguous. Mirrors what
  `recipeManifestContract` already does on the producing side.

---

### B1 — the listing probe, and `recipesListingBuildBroker`

| | |
|---|---|
| Files | `packages/siegelense-recipes/src/statics/recipe-listing-probe/{…-statics.ts, …-statics.test.ts}`, `src/brokers/recipes-listing/build/{…-broker.ts, .proxy.ts, .test.ts}` |
| Folder types | `statics/`, `brokers/` |

**This is where the specification's hardest gap is closed, and the gap is real.** `runs` and `makes`
are *"computed off the plan"* — but a plan only exists once the recipe's builder has run, and a
recipe declaring `inputs` cannot run its builder without input VALUES. Two of this repo's three
recipes declare inputs, and both parse them:
`sessionWithNestedChainRecipeBroker` calls `absoluteFilePathContract.parse(guildPath)` at build time
(`session-with-nested-chain-recipe-broker.ts:41`). Hand it nothing and the listing throws.

So the recipes package owns a **listing probe** per input-taking recipe — a fixed, plausible input
value used only to build the plan. **Nothing runs.** *"The chain builds; it does not execute.
Callbacks run at BUILD time, so calling a recipe materialises the whole plan as data before anything
touches disk or opens a socket"* (`packages/hydration/CLAUDE.md`). A probe never reaches disk,
a socket or a screen.

The statics file holds the literals; the broker parses each through that recipe's own `inputs`
contract before calling it, so a probe that stops satisfying its schema fails a test rather than
printing a wrong listing.

The broker pairs each recipe with its probe, calls it, and folds
`dmRegistryBroker.listing(plan)` into a listing entry.

**Why the probe lives in `statics/` and not in a `.stub.ts`.** `tsconfig.build.json` excludes
`.stub.ts` from `dist`, and this broker's output is read from `dist`. A stub would vanish exactly
where it is needed.

**Tests, as behaviour:**

- `VALID: {} => returns one entry per recipe, with the exact names` —
  `toStrictEqual(['guild-mid-execution','quest-advances-one-step','session-with-nested-chain'])`
  over the mapped names.
- `VALID: {} => guild-mid-execution's entry is the complete expected object` — `toStrictEqual`
  covering `description`, `inputKeys: []`, `runs: {serverless: true}`, and `makes` as the complete
  array. `runs` being `serverless` is the ALL-not-ANY rule (`624`) asserted against a plan every one
  of whose ingredients does declare a `write` route.
- `VALID: {} => session-with-nested-chain's inputKeys is ['guildPath']` — and NOT `['guildId']`;
  chunk 7's own divergence, pinned here so the listing tells the truth about this repo rather than
  about the specification's example (§6 F3).
- `VALID: {} => an ingredient a filter reaches reports count 'varies'` — asserted on
  `guild-mid-execution`, whose own `filter` names `operation`.
- `INVALID: {a probe that no longer parses its recipe's inputs} => throws naming the recipe and the
  failing key` — driven by a probe deliberately broken in the test, so the guard is proven able to go
  red rather than assumed to.

---

### B2 — `recipesSeedRunBroker`, the seed entry the tool calls

| | |
|---|---|
| Files | `packages/siegelense-recipes/src/brokers/recipes-seed/run/{…-broker.ts, .proxy.ts, .integration.test.ts}`, `packages/siegelense-recipes/test/harnesses/instance-stub/instance-stub.harness.ts` |
| Folder type | `brokers/` |

This broker's own test suffix is `.integration.test.ts`, not `.test.ts`: its job — a real recipe seeded
against a real target, an env var restored, a route's own real failure — is provable only against a
real target, matching the three sibling recipe brokers in this package. `recipes-seed-run-broker.proxy.ts`
exists only to satisfy `enforce-proxy-child-creation` and says so in its own header: there is no I/O
boundary this broker's own tests stage, because `enforce-project-structure` refuses a
`.integration.test.ts` importing any `.proxy.ts` at all. `instanceStubHarness` is what a `baseUrl` case
needs instead — a real, listening loopback HTTP server standing in for the live instance a `baseUrl`
target points at, so the `api` route's own real `fetch` call has something real to hit.

```ts
recipesSeedRunBroker({ recipeName, params, home, baseUrl }) => Promise<Record<string, unknown>>
```

Everything repo-specific happens here, because everything repo-specific is unknown to the tool:

1. **Resolve the recipe by name.** Unknown → throw, naming the names that exist.
2. **Validate `params` through that recipe's own `inputs` schema.** *"One declaration, three
   readers: the `inputs` line `recipes {}` prints, the in-process type the builder receives, and the
   schema a `seed` step's `params` are validated against before seeding"* (`589`). A recipe
   declaring no inputs takes no `params`, and `params` supplied anyway is a refusal, not an
   ignore. The error names the bad input and lists what the recipe takes (`2057`).
3. **Build the target.** `{ home, claudeHome: home, baseUrl? }`. `claudeHome` equals `home` because
   a lane's api process is spawned with both `DUNGEONMASTER_HOME: '{home}'` and `HOME: '{home}'`
   (`lane-boot-broker`'s spec env), so a transcript written under `home` is the one that lane's
   server reads. No `request` function: with a `baseUrl` and no `request`,
   `dmHttpRequestAdapter` falls through to the global `fetch` against that base URL
   (`dm-http-request-adapter.ts:41-56`), which is the right branch for a live lane.
4. **Point `process.env.DUNGEONMASTER_HOME` at `home` for the duration, and restore it in a
   `finally`.** This is not tidiness. `guildWriteRouteBroker` and `operationWriteRouteBroker` route
   through `StartOrchestrator`, whose brokers *"resolve their home via the GLOBAL
   `process.env.DUNGEONMASTER_HOME`, never via the `target` object a route was handed"*
   (`packages/siegelense-recipes/CLAUDE.md`), and the driver process inherits the **caller's** env
   (`instance-start-broker.ts:155-173`). Without this, a seed writes a guild into whatever
   `~/.dungeonmaster` the operator's shell had while the quest FILES land under the lane's home, and
   the next route cannot find the quest it needs. `fileTargetHarness` exists for exactly this reason.
5. **Run.** `dmRegistryBroker.run(plan, target)` — `run` off the SAME binding `registry()` populated,
   never a fresh `recipesHydrationCreateBroker()` call.

**Tests, as behaviour:**

- `VALID: {recipeName: 'guild-mid-execution', home} => the returned record map holds the saved row
  names` — `toStrictEqual` on the complete key set, and the guild row's own `id` and `urlSlug`
  asserted as values. Proves the plan RAN and produced records, not that a function was handed over.
- `VALID: {recipeName, home} => DUNGEONMASTER_HOME is that home while the routes run, and its
  previous value afterwards` — asserted by reading the env var from inside a staged route and
  comparing the after-value to the before-value. The env restore is the assertion, not a comment.
- `ERROR: {a route throws} => DUNGEONMASTER_HOME is still restored` — the `finally`, proven.
- `INVALID: {recipeName: 'no-such-recipe'} => throws listing the recipes that exist`, asserted on the
  complete message.
- `INVALID: {params on a recipe declaring none} => throws naming the recipe and the keys supplied`.
- `INVALID: {params missing a declared key} => throws naming the missing key and listing the inputs}`.
- `VALID: {recipeName: 'quest-advances-one-step', baseUrl} => the target carries it through to the
  quest ingredient's api route, which wins over write` — proven with no mocking, since
  `.integration.test.ts` may import no `.proxy.ts` and this broker's own carries none to stage:
  `instanceStubHarness` boots a real loopback HTTP server, the seed run posts a real request to it,
  and the assertion covers both the real request the server received (method, path, and a body
  holding only `guildId`/`title`/`userRequest` — never the `status`/`operations` the recipe's own
  `setRaw` set, which only the `write` route would have honored) and the returned quest, which is
  the stub server's own response verbatim, not what a `write`-route run would have produced.

---

### B3 — `index.ts`, the conformance test, and the CLAUDE.md entries

| | |
|---|---|
| Files | `packages/siegelense-recipes/index.ts` (edit), `packages/siegelense-recipes/src/siegelense-recipes-exports.integration.test.ts` (new), `packages/siegelense-recipes/CLAUDE.md` (edit) |

`index.ts` keeps `recipesManifest` and adds `export *` lines for the two brokers, so the module
carries exactly the three names `recipesConventionStatics` declares. No aliasing in the barrel: a
renamed export is the one place this repo's naming rule stops being checkable.

The conformance test is a loose `.integration.test.ts` under `src/`, following the sanctioned
precedent chunk 7 already set with `siegelense-recipes-not-shipped.integration.test.ts` — a root-level
test beside `index.ts` is invisible to ward, which `index.ts`'s own header records as measured.

**Tests, as behaviour:**

- `VALID: {} => the module exports exactly the three names the convention declares` —
  `toStrictEqual` of the sorted export names against
  `Object.values(recipesConventionStatics.exports).sort()`. This is the whole point: the wire
  surface is proven against the one source both sides read, so a rename on either side goes red here
  and not in a manual round.
- `VALID: {} => recipesManifest's names and descriptions match what recipesListingBuildBroker returns` —
  asserted as complete arrays. The two exports must not disagree about which recipes exist.

CLAUDE.md gains two headings: **the three exports chunk 8 reads and why they are three, not one**,
and **the listing probe, and what breaks if one drifts**. Its existing *"Build before a listing is
honest"* heading already carries the build rule and needs no change.

---

### C1 — the five refusals

| | |
|---|---|
| Files | `src/errors/{recipes-package-missing, recipes-build-missing, recipe-unknown, recipe-params-refused, recipes-listing-export-invalid}/` — each `-error.ts` plus `-error.test.ts` |
| Folder type | `errors/` |

Each carries the context a reader needs at the moment it fires: the path searched; the build command;
the recipe names that do exist; the recipe, the offending key and the keys it accepts; the entry path,
the export name, and what was found in place of a function.

**Tests, as behaviour:** one per class asserting the complete constructed object (`name`, `message`
and every context property) with `toStrictEqual`, and the message asserted against an anchored
regex, not a substring.

---

### C2 — `recipesLocateBroker`

| | |
|---|---|
| Files | `src/brokers/recipes/locate/{…-broker.ts, .proxy.ts, .test.ts}` |
| Folder type | `brokers/` |

Resolves the repo root through `cwdResolveBroker`, joins the convention's path segments, and tells
the three states of §1 apart with `fsExistsSyncAdapter`. Returns the absolute entry path, or throws
the state's own refusal.

**Tests, as behaviour:**

- `VALID: {package present, dist entry present} => returns <repoRoot>/packages/siegelense-recipes/dist/index.js` — the exact string.
- `ERROR: {package directory absent} => throws RecipesPackageMissingError naming the path searched`.
- `ERROR: {package present, dist entry absent} => throws RecipesBuildMissingError naming the build
  command` — asserted on the complete message including
  `npm run build --workspace=@dungeonmaster/siegelense-recipes`. This is the state the specification
  does not name, and the message is the whole value of separating it.

---

### C3 — `recipesReadBroker`

| | |
|---|---|
| Files | `src/brokers/recipes/read/{…-broker.ts, .proxy.ts, .test.ts}` |
| Folder type | `brokers/` |

Calls `recipesLocateBroker`, imports the entry through `runtimeDynamicImportAdapter`, reads the
listing export, calls it, and parses the result with `recipesListingContract`.

**No caching.** Node's own module cache makes a repeated `import()` of the same path free, and a
cache inside this broker would be a second lifetime for a session to reason about.

**Tests, as behaviour** (staging the module through `runtimeDynamicImportAdapterProxy`):

- `VALID: {a module exporting a listing of two recipes} => returns both entries complete` —
  `toStrictEqual` over the full array.
- `EMPTY: {a module whose listing returns []} => returns []` — the "no recipes yet" state, distinct
  from every error above, asserted as a value rather than as an absence.
- `ERROR: {the module carries no listing export} => throws naming the export the convention requires`.
- `ERROR: {the listing export is not a function} => throws naming what it found` — the commonest
  shape a half-migrated consumer package will be in.
- `INVALID: {an entry missing runs} => throws with the contract's own message` — proves the parse is
  real and not a cast.

---

### C4 — the answer, the args, and the `--human` render

| | |
|---|---|
| Files | `src/contracts/recipes-answer/{…}`, `src/contracts/recipes-args/{…}`, `src/transformers/recipes-args-parse/{…}`, `src/transformers/recipes-answer-render/{…}` |
| Folder types | `contracts/`, `transformers/` |

`recipes` takes no instance — *"what states can be created. No instance needed"* (`2008`) — so its
argv accepts `--json` and `--human` and refuses everything else by name, matching how every other
args-parse transformer in this package already refuses.

The render produces exactly the block the specification prints (`2010-2023`): name, the description
sentence indented under it, then `inputs:`, `runs:`, `makes:`.

**Tests, as behaviour:**

- `VALID: {[]} => returns the default args` — complete object.
- `INVALID: {['--instance','x']} => throws naming --instance and listing the accepted flags` — a
  caller reaching for an instance has misread what this call is, and the message says so.
- `VALID: {a paramless serverless entry} => renders 'inputs:  none' and 'runs:    serverless'` —
  asserted on the complete rendered string with an anchored regex, so the alignment the specification
  shows is itself under test.
- `VALID: {an entry needing a server} => renders 'runs:    needs a server: guild'` — *"the line that
  stops a wasted run"* (`634`).
- `VALID: {an entry whose makes holds a varies count} => renders 'operation (varies)'`.
- `EMPTY: {[]} => renders 'no recipes declared yet'` — not an empty string, which reads as a broken
  call.

---

### C5 — `SiegelenseRecipesResponder`

| | |
|---|---|
| Files | `src/responders/siegelense/recipes/{…-responder.ts, .proxy.ts, .test.ts}` |
| Folder type | `responders/` |

Calls `recipesReadBroker`, writes the JSON answer to stdout, or the rendered block when `--human`.
The responder holds no try/catch of its own: each of C1's four classes propagates uncaught, and the
CLI entry point's single top-level `.catch()` is the error boundary — it turns the uncaught throw
into a written message and a non-zero exit, never a stack trace, the same design
`SiegelenseResultsResponder`'s header states for `RunIdRequiredError`.

**Tests, as behaviour:**

- `VALID: {a listing of three recipes} => writes one JSON document holding every entry complete` —
  asserted by parsing what `process.stdout.write` was called with and comparing the whole document
  with `toStrictEqual`.
- `VALID: {--human} => writes the rendered block` — asserted on the exact text.
- `ERROR: {the package is missing} => the refusal reaches the caller intact` — asserted with
  `rejects.toStrictEqual` against the thrown error, because the CLI entry point's top-level `.catch()`
  is what renders it, not the responder.

---

### C6 — route it, help it, prove it

| | |
|---|---|
| Files | `src/flows/siegelense/siegelense-flow.ts` (edit), `src/statics/siegelense-help/siegelense-help-statics.ts` (edit), and the flow's existing integration test |

- `CALL_ROUTES` gains a `recipes` entry, parsing its own argv and calling its responder — the
  ordinary pattern the flow's header describes, not `run`'s deliberate exception.
- `siegelenseHelpStatics.calls.recipes` gains an entry declaring `--json` and `--human`. That entry's
  `--human` flag is what admits `recipes` to `HUMAN_RENDERER_CALLS`, which the flow already derives
  from the help statics rather than from a second hardcoded list.
- `index.notBuiltYet` loses `recipes`.
- `index.headline` stops counting built calls in prose. It currently reads *"Seven of thirteen calls
  are built"* and is wrong the moment this chunk lands. Derive the sentence from
  `Object.keys(calls).length` and `siegelenseCallStatics.calls.names.length` at render time, in
  `siegelenseHelpRenderTransformer`, where both lists are already in hand.

**Tests, as behaviour:**

- `VALID: {['recipes']} => routes to SiegelenseRecipesResponder and writes the listing JSON` —
  asserted on the written document, not on the routing.
- `VALID: {['recipes','--help']} => writes the recipes page whose first line is the summary` — exact
  first line.
- `VALID: {['--help']} => the index lists recipes under CALLS and not under NOT BUILT YET` — both
  halves in one assertion over the rendered text, because moving a name and forgetting to remove it
  from the other list is the exact mistake this catches.
- `VALID: {['--help']} => the headline names the built count the route table actually holds` —
  derived, so adding `docs` later cannot make it lie.

---

### D1 — `seed` joins the step vocabulary

| | |
|---|---|
| Files | `src/statics/step/step-statics.ts` (edit), `src/contracts/step/step-contract.ts` (edit) |
| Folder types | `statics/`, `contracts/` |

`seed` joins `verbs.all` and **none** of `acting`, `targeting` or `browser`. It changes no page, so
it captures nothing; it resolves no selector, so the ambiguity rule does not reach it; it needs no
browser, so it is the first verb a browserless lane can run. `stepVerbContract` derives its enum
from `verbs.all`, so that list is the only edit the verb name needs.

The `stepContract` member:

```ts
z.object({
  step:   z.literal('seed'),
  recipe: recipeNameContract,
  params: z.record(recipeInputKeyContract, z.unknown()).nullable().default(null),
  as:     stepOutputNameContract.nullable().default(null),
  node:   nodeLabelContract.nullable().default(null),
  expect: stepExpectationContract.default(stepStatics.defaults.expect),
}).strict()
```

`params` is its own object and never flattened onto the step: *"A recipe input named `as`, `step` or
`recipe` would shadow the step's own keys, and the collision is silent"* (`882-883`).

`as` sits on this member only, not on every step. Nothing else in this chunk produces a structured
output to name; widening it is a later decision, recorded in §6 F13.

**Tests, as behaviour:**

- `VALID: {step:'seed', recipe:'guild-mid-execution'} => parses with params null, as null, expect 'ok'` — complete object.
- `VALID: {step:'seed', recipe, params:{guildPath:'/x'}, as:'g'} => parses keeping both`.
- `INVALID: {step:'seed', recipe, target:'#x'} => throws` — `.strict()` proven, so a field belonging
  to another verb cannot arrive silently stripped.
- `VALID: {} => stepStatics.verbs.browser does not hold 'seed'` — asserted as the complete browser
  list, because the consequence of getting this wrong is `seed` becoming unusable on the one lane
  type it is most useful on.

---

### D2 — `stepSeedBroker`

| | |
|---|---|
| Files | `src/brokers/step/seed/{…-broker.ts, .proxy.ts, .test.ts}` |
| Folder type | `brokers/` |

Takes `{ lane, step }`. Reads the listing (C3) to refuse what it can see BEFORE importing anything
that writes; imports the seed export; calls it with the lane's `homePath` and `baseUrl`; returns both
the record map and its JSON rendering.

**What siegelense refuses, and what it does not.** *"the tool builds a schema per recipe from the
ones it enumerated and validates BEFORE seeding anything, with an error naming the bad input and
listing what that recipe takes"* (`2056-2057`). Siegelense cannot hold those schemas — §6 F5 says
why — so the refusal splits:

| Refused by | What |
|---|---|
| `stepSeedBroker`, off the listing alone | an unknown `recipe` name; `params` on a recipe whose `inputKeys` is empty; missing `params` on one whose `inputKeys` is not; a `params` KEY the listing does not name |
| `recipesSeedRunBroker` (B2), through the recipe's own schema | every VALUE |

Both land before the first write, because a plan is data and the builder runs before the runner
does. The half siegelense keeps is the commonest bad input — a misspelled key — and it can name it
and list what the recipe takes.

**Tests, as behaviour:**

- `VALID: {a seed step naming a paramless recipe} => the seed entry is called with the lane's home
  and base URL, and the record map comes back` — assert the ARGUMENTS the entry received (the exact
  home path, the exact base URL) and the returned map's complete keys. Not that a function was
  passed.
- `VALID: {a browserless lane} => the seed still runs` — the point of the verb not being a browser
  verb, driven rather than asserted structurally.
- `INVALID: {recipe:'nope'} => throws RecipeUnknownError listing the names the listing holds`, on the
  complete message.
- `INVALID: {params on a paramless recipe} => throws before the seed entry is imported` — asserted by
  the import adapter having been called zero times **paired with** the thrown message, so "before"
  is a measured fact.
- `INVALID: {params carrying a key the listing does not name} => throws naming that key and listing inputKeys`.
- `INVALID: {a recipe declaring an input key, params omitting it} => throws RecipeParamsRefusedError
  naming the missing key, before the seed entry is imported` — the same paired assertion as the
  paramless case: the seed entry's mock is never called, so "before" is measured rather than
  inferred from the throw alone. Without this check the missing key falls through to the recipe's
  own zod schema, which answers `Required` and names neither the key nor the recipe.

---

### D3 — the dispatcher stops assuming every verb is a browser verb

| | |
|---|---|
| Files | `src/brokers/step/dispatch/run-verb-layer-broker.ts` (edit), `src/brokers/step/dispatch/step-dispatch-broker.ts` (edit) |
| Folder type | `brokers/` |

`runVerbLayerBroker` takes `{ lane, step, index, shotPath }` rather than `{ session, … }`, handles
`seed` first, and narrows `lane.browser` itself for the six browser verbs — which the parent's guard
has already proven non-null. `stepDispatchBroker` loses its second `session === null` throw, which
exists today only because every verb happened to be a browser verb, and keeps its single
measure-and-stamp path untouched.

The layer's return widens from `ContentText` to `{ reading: ContentText; output: Record<string, unknown> | null }`.
The six browser verbs return `output: null`. `seed` returns both, so Group E has a value to store
without re-parsing text.

**Why widen the return rather than branch in the dispatcher.** A second branch in
`stepDispatchBroker` would mean a third copy of the shot/measure/stamp block, which is already
duplicated once across the success and `expect: 'error'` paths. One extra field on the layer's return
keeps that block singular.

**Tests, as behaviour:**

- `VALID: {a seed step on a browserless lane} => returns a StepReading with ok true and the seeded
  record map as its reading` — the complete reading, parsed back from the JSON.
- `VALID: {a seed step} => shot, pixelChange, blank and blankColour are all null` — a seed captures
  nothing, and asserting the nulls is what stops a later refactor quietly adding a capture.
- `VALID: {a click step} => unchanged` — one existing browser-verb case re-asserted after the
  restructure, so the widening is proven not to have moved anything.
- `VALID: {a seed step with expect:'error' that fails} => ok true` — the inversion still happens once,
  in the dispatcher.
- `VALID: {a seed step with expect:'error' that SUCCEEDS} => ok false` — *"A step carrying
  `expect: 'error'` that SUCCEEDS is itself a finding"* (`2124-2126`).

---

### D4 — the help page and the package CLAUDE.md

| | |
|---|---|
| Files | `src/statics/siegelense-help/siegelense-help-statics.ts` (edit), `packages/siegelense/CLAUDE.md` (edit) |

`run`'s help entry gains `seed` in its step vocabulary, with the `recipe`/`params`/`as` shape and the
sentence that matters: `seed` is a step, not a prologue, and it goes wherever the order needs it
(`2133`).

`packages/siegelense/CLAUDE.md` gains one entry, in the form Part 6's table prescribes:

> **A `seed` runs in the DRIVER process, which inherits YOUR env, not the lane's** — so the seed
> entry sets `DUNGEONMASTER_HOME` to the lane's home for its own duration. Without it a guild
> registers into whatever home your shell had while the quest files land under the lane's.

That package's existing *"A recipe touches state, never a screen"* heading duplicates the entry
Part 6 assigns to `hydration` (`1987`), and it names a recipe where the rule is about an ingredient.
Fix the wording while this file is open.

---

### E1 — the reference grammar

| | |
|---|---|
| Files | `src/contracts/step-ref/{…-contract.ts, …-contract.test.ts, step-ref.stub.ts}`, `src/transformers/step-ref-resolve/{…-transformer.ts, …-transformer.test.ts}` |
| Folder types | `contracts/`, `transformers/` |

> *"So a batch reads **`{<step>.<row>.<field>}`** — three segments, always"* · *"**A two-segment
> reference like `{g.guildId}` is always wrong** and the tool should refuse it, naming the rows that
> step actually saved. It is the single easiest mistake to make against this surface, because it
> reads fine."* — `siegelense-recipes.md:2102-2112`

**Tests, as behaviour:**

- `VALID: {'{g.guild.id}'} => parses into step 'g', row 'guild', field 'id'` — the complete object.
- `INVALID: {'{g.guildId}'} => throws naming the two-segment form and the three-segment form it
  should have been`. This is the one the specification singles out, and it gets the message the
  specification asks for.
- `VALID: {outputs holding g.guild.id, ref '{g.guild.id}'} => resolves to that id`.
- `INVALID: {a ref naming a step no earlier step named with as:} => throws listing the step names
  that were named`.
- `INVALID: {a ref naming a row that step did not save} => throws listing the rows that step DID
  save` — *"naming the rows that step actually saved"* (`2111`), asserted as the complete list.
- `INVALID: {a ref naming a field the row does not carry} => throws listing the row's fields`.

---

### E2 — `goto.path` admits a reference

| | |
|---|---|
| Files | `src/contracts/step/step-contract.ts` (edit) |

`goto`'s `path` becomes `urlPathContract.or(stepRefContract)`, because `{s.nested.url}` does not start
with `/` and `urlPathContract` requires one (`url-path-contract.ts:15`). The substituted value is
re-parsed through `urlPathContract` at run time (E3), so the brand still holds everywhere it matters.

**Only `goto.path` and `seed.params` admit a reference in this chunk**, and that narrowing is
deliberate: an `eval` step's `source` is JavaScript, and a three-segment brace pattern is reachable
in real JavaScript source. Widening the grammar to other fields is a decision to make on evidence,
not a gap to fill by symmetry. Recorded in §6 F13.

**Tests, as behaviour:**

- `VALID: {step:'goto', path:'/guilds'} => parses as before`.
- `VALID: {step:'goto', path:'{s.nested.url}'} => parses, keeping the reference intact`.
- `INVALID: {step:'goto', path:'guilds'} => still throws` — a bare relative path is neither a path
  nor a reference, and admitting references must not widen the contract into accepting it.

---

### E3 — the run holds each step's output and substitutes into the next

| | |
|---|---|
| Files | `src/brokers/run/execute/run-execute-broker.ts` (edit) |
| Folder type | `brokers/` |

The run keeps a map from a step's `as` name to that step's `output`. Before each step dispatches,
every reference in its `seed.params` and its `goto.path` is resolved against the map and the result
re-parsed through the field's own contract. A reference in step 1 is a refusal, because nothing has
been named yet — and the message says so rather than reporting a missing key.

Following `runExecuteBroker`'s existing shape, the map lives in a holder whose field mutates rather
than a reassigned `let`, for the same `require-atomic-updates` reason its flush cursor already does.

**Tests, as behaviour:**

- `VALID: {seed as 'g', then goto '/{g.guild.urlSlug}'} => the goto step navigates to the slug the
  seed actually minted` — asserted on the path the goto broker received. This is the whole feature,
  and it is asserted as the value that arrived, not as a substitution having occurred.
- `VALID: {seed as 'g', then seed with params {guildPath:'{g.guild.path}'}} => the second seed entry
  receives the first seed's real path` — the composition case (`2146`).
- `VALID: {two seeds, both with as:} => the second reference resolves against the second step's own
  output, not the first's`.
- `INVALID: {a reference in step 1} => the batch stops at step 1 with a message naming that nothing
  has been named yet`.
- `VALID: {a step whose fields carry no reference} => the step is dispatched with its fields
  unchanged` — asserted by comparing the dispatched step with the parsed step, `toStrictEqual`, so
  substitution cannot quietly rewrite something it was not asked to.

---

## 4. The requirements each item satisfies, quoted

Every quote is verbatim from `scrolls/seigelense/siegelense-recipes.md` at the line given, read on
2026-09-16. A builder checks their work against these; a reviewer checks the work against these and
not against this plan's prose.

| Line | Requirement, verbatim | Satisfied by |
|---|---|---|
| 1626-1627 | *"**`siegelense` must list every recipe's name, description and inputs, and must not import `hydration-recipes`** — an import would weld one repo's states into the published tool."* | §1, A1, C2, C3 |
| 1629-1631 | *"**The mechanism already exists in this repo.** The CLI discovers each package's install script by globbing `packages/*/dist/startup/start-install.js` and dynamically importing it at run time. Recipe discovery is the same move, one path over"* | §1, C2, C3 |
| 1633-1636 | *"1. glob `packages/hydration-recipes/dist/index.js` 2. dynamically import it 3. read the manifest it exports — every recipe's `name`, `description`, input contract, and the routes its ingredients declare"* | A1, B1, B3, C2, C3 |
| 1638-1640 | *"**It reads COMPILED output, which means the recipes package must be built before a listing is honest.** That is the same rule the install scripts already live under, and it belongs in the package's own `CLAUDE.md`"* | C2 (the second state), B3 (the CLAUDE.md entry chunk 7 already wrote) |
| 1642-1645 | *"**An absent directory and an empty one must not report the same thing.** An empty `hydration-recipes` returns an empty list, meaning *no recipes yet*. A missing one is an installation problem and says so."* | C1, C2, C3's `EMPTY` case, C4's `no recipes declared yet` |
| 349 | *"`@dungeonmaster/siegelense` \| the tool — instances, batches, browser driving, the `seed` step \| yes \| neither of the others"* | §1's rejected row, A3 |
| 358-360 | *"**`siegelense` never imports `hydration-recipes`.** It finds recipes by walking `packages/hydration-recipes/` at run time, which is the same convention it already enumerates."* | §1 |
| 588 | *"`description` \| yes \| **what `recipes {}` prints.** One line, saying what EXISTS after this recipe runs"* | B1, C4 |
| 589 | *"`inputs` \| no \| a zod schema describing what this recipe needs from an earlier step. One declaration, three readers: the `inputs` line `recipes {}` prints, the in-process type the builder receives, and the schema a `seed` step's `params` are validated against before seeding"* | B1 (`inputKeys`), B2 (the parse), D2 (the structural refusal) |
| 621-623 | the line-source table — *"the name \| the recipe's `name`"* · *"the sentence under it \| the recipe's `description`"* · *"`inputs` \| the recipe's input contract — static data, so the listing never runs anything"* | B1, C4 |
| 624 | *"`runs` \| `serverless`, or `needs a server: <ingredient>`. **An ALL over the plan's ingredients, never a union** — a union answers which routes appear anywhere, which is a different and more optimistic question"* | A2, B1's `runs` assertion |
| 625 | *"`makes` \| each ingredient's `description`, counted off the plan. `varies` wherever a `filter` or a transition decides the count"* | B1 — with the divergence in §6 F1 |
| 627-632 | *"**A transition's minted rows are invisible to `makes`, not merely their count.** … **The INGREDIENT cannot be known either**, wherever nothing else in the plan names it."* | B1's `varies` case; nothing here tries to recover an ingredient a plan never names |
| 634-635 | *"**`runs` on that listing is the line that stops a wasted run.** A Jest integration test reads `needs a server: guild` and stops, instead of finding out partway through with half a plan on disk."* | C4's render assertion |
| 882-883 | *"**Inputs go in their own `params` object, never flattened onto the step.** A recipe input named `as`, `step` or `recipe` would shadow the step's own keys, and the collision is silent."* | D1 |
| 2004-2006 | *"There is no registration and no prefix on a CLI: the name typed after `dungeonmaster siegelense` IS the call. **Steps are not calls**"* | C6 (a call), D1 (a step) |
| 2008 | *"**`recipes`** — what states can be created. No instance needed."* | C4's args refusal, C5 |
| 2010-2023 | the printed listing block | C4 |
| 2047 | *"**`seed`** — runs a recipe's plan against this instance and returns the ids it made."* | D1, D2, B2 |
| 2054-2058 | *"**`params` is typed by the `recipe` value.** … **Over the CLI it arrives as JSON … and no compile-time check is available** — so the tool builds a schema per recipe from the ones it enumerated and validates BEFORE seeding anything, with an error naming the bad input and listing what that recipe takes. A recipe declaring no inputs takes no `params`."* | D2 + B2 — split, with the divergence in §6 F5 |
| 2090-2091 | *"**`as` names a STEP's output; `{name.field}` reads it back.** A seed mints runtime ids that no file contains, so later steps must be able to reference them without a round trip to the model."* | D1 (`as`), E1, E3 |
| 2102-2112 | *"So a batch reads **`{<step>.<row>.<field>}`** — three segments, always"* · *"**A two-segment reference like `{g.guildId}` is always wrong** and the tool should refuse it, naming the rows that step actually saved."* | E1 |
| 2124-2126 | *"**A step carrying `expect: 'error'` that SUCCEEDS is itself a finding** — the attack landed and nothing refused it — and it stops the batch exactly as an unexpected failure would."* | D3 |
| 2133 | *"**`seed` is a STEP, not a prologue.** It goes wherever the order needs it, as many times as the walk needs"* | D1 (a member of the step union, with no ordering rule anywhere), D4 |
| 2152-2155 | *"The second recipe takes `params: { guildId: '{g.guild.id}' }`, because it crosses a STEP boundary"* | E3's composition test |
| 1745 | *"3 \| one manual siegelense round \| a live instance, driven by hand \| the **`seed` step, `recipes {}`, and the params validation** — the tool half, which neither suite touches"* | §5 — this chunk's whole manual surface |
| 1752-1755 | *"**Step 3 is not optional and cannot be folded into step 2.** … A green suite says nothing about whether `recipes {}` lists anything or whether a `seed` step resolves a recipe at all."* | §5 |
| 1660-1662 | *"recipe discovery and the listing \| `brokers/` \| `siegelense`"* · *"the `seed` step and its params validation \| `brokers/` \| `siegelense`"* · *"scaffolding … — **`siegelense` — ALREADY BUILT**"* | C2, C3, D2 — and §0: the scaffold responder is already named and already correct |

---

## 5. Driving it by hand

Chunk 11 is a manual round against this work. `scrolls/seigelense/manual-verification-runbook.md`
holds the housekeeping that stops a clean run from reading as a failure — **read it first**, and in
particular: `dungeonmaster` on your PATH runs the MAIN checkout, not this worktree.

### Before anything

```bash
npm run build --workspace=@dungeonmaster/shared
npm run build --workspace=@dungeonmaster/hydration
npm run build --workspace=@dungeonmaster/siegelense-recipes
npm run build --workspace=@dungeonmaster/siegelense
npm run build --workspace=@dungeonmaster/cli
```

Only the coordinator builds. The recipes build is not optional and not a formality: the listing reads
`dist/index.js`, and an unbuilt package is the second of §1's three states.

### 1. The listing, with no instance running

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense recipes --human
```

Expect one block per recipe this repo declares, each with its description, `inputs`, `runs` and
`makes` — for example:

```
guild-mid-execution
    one guild holding three quests, the first running with its riftcarver item dropped
    inputs:  none
    runs:    serverless
    makes:   guild ×1, quest ×3, operation (varies)
```

`session-with-nested-chain`'s `inputs` line reads `guildPath`, not `guildId` — that is this repo's
own divergence (§6 F3), not a defect.

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense recipes
```

The same content as one JSON document.

### 2. The three states, each proven distinct

```bash
mv packages/siegelense-recipes/dist /tmp/dm-recipes-dist-parked
node packages/cli/dist/bin/dungeonmaster.js siegelense recipes
# expect: the BUILD message, naming `npm run build --workspace=@dungeonmaster/siegelense-recipes`
mv /tmp/dm-recipes-dist-parked packages/siegelense-recipes/dist
```

The absent-package state is reachable the same way by parking the whole package directory. **Do not
skip this one** — a tool that answers "you have written no recipes" when the real answer is "you
have not built" is the exact ambiguity §1 exists to remove, and only a hand-run sees which message
actually printed.

### 3. Refusals, before any instance exists

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense recipes --instance inst_1
# expect: --instance refused by name, listing the flags recipes accepts

node packages/cli/dist/bin/dungeonmaster.js siegelense recipes --help
# expect: the recipes page — summary, USAGE, FLAGS, OUTPUT, EXAMPLE

node packages/cli/dist/bin/dungeonmaster.js siegelense --help
# expect: recipes under CALLS, absent from NOT BUILT YET, and the headline's built count matching
```

### 4. A seed against a live instance

```bash
rm -rf /tmp/dm-siege-sockets

CLAUDE_CLI_PATH=packages/web/test/harnesses/claude-mock/bin/claude \
WARD_CLI_PATH=packages/orchestrator/test-fixtures/fake-ward-bin/dungeonmaster-ward \
node packages/cli/dist/bin/dungeonmaster.js siegelense start --spec dungeonmaster-web
# note the instanceId from the manifest
```

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense run \
  --instance <id> \
  --steps '[{"step":"seed","recipe":"guild-mid-execution","as":"g"}]'
# expect: status done, stepsRun 1
```

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense results \
  --instance <id> --run run_1 --kind steps
# expect: the seed step's reading, holding the guild and the three quest records it made
```

**Then look at the browser.** The repo's own verification standard applies: the UI is the verdict.
Navigate to the seeded guild and confirm it renders with three quests. A `status: done` that leaves a
blank panel is a failed round.

### 5. Params, both ways

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense run --instance <id> \
  --steps '[{"step":"seed","recipe":"session-with-nested-chain"}]'
# expect: refused — params missing, listing guildPath

node packages/cli/dist/bin/dungeonmaster.js siegelense run --instance <id> \
  --steps '[{"step":"seed","recipe":"guild-mid-execution","params":{"x":1}}]'
# expect: refused — this recipe takes no params

node packages/cli/dist/bin/dungeonmaster.js siegelense run --instance <id> \
  --steps '[{"step":"seed","recipe":"session-with-nested-chain","params":{"guildPath":"<a path from step 4>"}}]'
# expect: status done, and a session record back through results
```

### 6. Composition, if Group E landed

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense run --instance <id> --steps '[
  {"step":"seed","recipe":"guild-mid-execution","as":"g"},
  {"step":"goto","path":"/{g.guild.urlSlug}"},
  {"step":"seed","recipe":"session-with-nested-chain","params":{"guildPath":"{g.guild.path}"},"as":"s"}
]'
```

And the refusal the specification singles out:

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense run --instance <id> --steps '[
  {"step":"seed","recipe":"guild-mid-execution","as":"g"},
  {"step":"goto","path":"/{g.urlSlug}"}
]'
# expect: refused, naming the two-segment form and listing the rows step g saved
```

### 7. Tear down

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense kill --instance <id>
ps -eo pid,etime,cmd | grep "bin/server-entry" | grep -v grep
```

Paste the command and its real stdout. A manual pass that summarises is worth nothing.

---

## 6. Findings — what the specification asks for that this chunk cannot build as written

**None of these is a scope cut.** Each is a place the document says something this repo's code
cannot do, or does differently, and each belongs back in
`scrolls/seigelense/siegelense-recipes.md` beside the line it answers.

### F1 — `makes` prints ingredient NAMES, not descriptions

`625` says *"`makes` \| each ingredient's `description`, counted off the plan"*. Its own worked
example prints `makes:   guild ×1, quest ×3, operation (varies)` (`610`) — names. So does
`planMakesTransformer`, which returns `{ ingredient, count }` keyed by `IngredientName`. The
descriptions are one-line sentences; three of them on a `makes:` line would make it unreadable. The
listing prints names. **Goes back into the document at line 625.**

### F2 — `inputs: guildId: GuildId` cannot print the brand, because zod does not store it

`614`, and Part 6's copy at `2020`, show `inputs:  guildId: GuildId`. Zod's `.brand<'GuildId'>()` is a **type-level phantom**: it
stores nothing at run time, and a schema loaded through a dynamic import carries no trace of the
name. Printing it would mean a second, hand-maintained string beside the schema — which is exactly
what *"it reads them from the declarations rather than from prose anyone maintains separately"*
(`601-602`) exists to prevent. The listing prints key names in declaration order:
`inputs:  guildPath`. **Goes back into the document at lines 614 and 2020.**

### F3 — this repo's `session-with-nested-chain` takes `guildPath`, so the specification's own listing example is wrong for this repo

Chunk 7 recorded it: *"THIS repo's session ingredient does not link that way … the field `.under()`
must supply is `cwd`, not `guildId`, and the value it needs is the guild's own `path`"*
(`session-with-nested-chain-recipe-broker.ts:8-12`). The listing prints what the recipe declares, so
it prints `guildPath`. Nothing here changes the recipe to match the example. **Already a chunk 7
finding; this chunk is where it becomes visible to a person, so the document's Part 6 example needs
the same note.**

### F4 — `runs` and `makes` need a plan, and a plan for an input-taking recipe needs input VALUES

The specification never says where those values come from, because it never notices they are needed:
`623` says *"the listing never runs anything"*, which is true of the RUNNER and false of the
BUILDER. Two of this repo's three recipes parse their inputs inside the builder. So a **listing
probe** per input-taking recipe is a new convention this chunk introduces (B1), and it is a cost
every consumer's recipes package inherits.

The alternative considered and rejected: print `runs` and `makes` only for paramless recipes. That
guts *"the line that stops a wasted run"* (`634`) for exactly the recipes that compose, which are
the ones a caller is most likely to get wrong. **Goes back into the document under "The listing
`recipes {}` prints".**

### F5 — siegelense cannot "build a schema per recipe", so params validation is split

`2056` says *"the tool builds a schema per recipe from the ones it enumerated and validates BEFORE
seeding anything"*. The tool may import neither `@dungeonmaster/hydration` nor the recipes package
(`349`), so it holds no zod schema of its own for a recipe's inputs. Handing a live schema across a
dynamic-import boundary is not a fix either: an `instanceof z.ZodType` check fails whenever the two
packages resolve different zod copies, which npm permits and a consumer's tree makes likely.

So D2 refuses what the listing lets it see — an unknown recipe, `params` on a paramless recipe,
missing `params`, an unknown params key — and B2 refuses every VALUE through the recipe's own schema.
Both land before the first write. The property `2056` actually cares about holds; the mechanism it
names does not. **Goes back into the document at line 2056.**

### F6 — a seed runs in the DRIVER process, which inherits the operator's environment

`instance-start-broker.ts:155-173` spawns the driver with `env: inheritedEnv` — a snapshot of the
caller's `process.env`. Only the spawned **api** process gets `DUNGEONMASTER_HOME: '{home}'`. So a
seed executing in the driver writes through `StartOrchestrator` into whatever `~/.dungeonmaster` the
operator's shell had, while this package's own direct file writes land under `target.home`. B2 sets
and restores the variable for the seed's duration. **The specification says nothing about this, and
nothing in it could have — it is a fact about how `start` spawns a driver.**

### F7 — the target is repo-specific, so the boundary cannot pass one

`dmTargetContract` carries `home`, `claudeHome`, an optional `baseUrl` and an optional `request`
function. `claudeHome` exists *"because nothing sets `HOME` for a Jest run"*
(`dm-target-contract.ts:6-8`) and `request` is the in-process Hono seam. Neither is a concept
siegelense has. The boundary therefore passes `home` and `baseUrl`, and the repo builds its own
target — which is also what makes the same seed entry work unchanged in a consumer repo whose target
is a database connection string.

### F8 — the seed's example return carries a `url` field nothing in this repo has

`2051` shows `→ { nested: { sessionId: 'sess-nested', url: '/siege-1/session/sess-nested' } }`.
`sessionRecordContract` carries no `url`. A plan's output is *"that row's WHOLE record"* (`2093`),
and a record holds what the route produced, not a route a UI happens to serve it at. A batch reaches
a page by composing the path itself — `/{g.guild.urlSlug}`, as the worked batch at `2142` already
does. **Goes back into the document at line 2051.**

### F9 — where a seed's ids surface for a caller not using `as:`

`2047` says `seed` *"returns the ids it made"*, and `packages/siegelense/CLAUDE.md` says
*"**`run` returns a status; `results` returns payloads**"*. Both are true and they are not in conflict, but the
document never says how they fit: **within a batch** `as:` and `{step.row.field}` carry the ids
(`2090`); **across the CLI boundary** they come back through
`siegelense results --kind steps`, off the run's transcript. Verified reachable:
`resultRowProjectTransformer` passes a row through unprojected when no `fields` are named, so a seed
step's whole reading survives. **Worth a sentence in Part 6 beside the `seed` block.**

### F10 — the help index counts built calls in prose, and this chunk makes it wrong

`siegelenseHelpStatics.index.headline` reads *"Seven of thirteen calls are built."* That is a tally
of something that grows, typed by hand. C6 derives it from the two lists already in hand at render
time.

### F11 — without Group E, a recipe taking an input from an earlier seed cannot be seeded in one batch

`session-with-nested-chain` needs a `guildPath` that only exists once a guild has been seeded. With
Group E, `{g.guild.path}` supplies it. Without it, a caller runs two `run` calls and pastes the path
between them — slower, and it costs the live-update case the specification is explicit about:
*"a walk that always seeds up front and then navigates never exercises the live-update path at all"*
(`2158-2159`). If E is deferred, chunk 11 must be told this, not left to discover it.

### F12 — the first seed against a fresh lane may hit the `config.json` gap, and that is a known shape

`fileTargetHarness`'s own header records it: *"Without the seeded `config.json`,
`guildConfigReadBroker`'s ENOENT fallback never fires — the orchestrator's own `fsReadFileAdapter`
throws a differently-shaped error first — so `guildAddBroker` fails outright on the very first
guild."* Whether a freshly booted lane's api server writes a `config.json` before a seed reaches it
is **unmeasured**. If the first hand-driven seed against a fresh lane fails there, it is this
finding, not a new defect — and the fix belongs in `@dungeonmaster/orchestrator`'s ENOENT handling,
not in a seed.

### F13 — `as` and the reference grammar are narrower than they could be, on purpose

`as` sits on the `seed` member only, because nothing else in this chunk produces a structured output
to name. References resolve in `seed.params` and `goto.path` only, because an `eval` step's `source`
is JavaScript and a three-segment brace pattern is reachable in real JavaScript. Both are decisions
to revisit on evidence — an `eval` step that wants to name its own result is the obvious next case —
and neither is a gap to close by symmetry.

---

## 7. What building found

**Empty until someone builds it.** Every group above was designed from files on disk, and five
agents across chunks 1–7 have each found a plan wrong about something. Record it here as it happens,
in the form the earlier chunks used: what was designed, what was true, and which decision moved.

| Item | What this plan says | What is true | What changed |
|---|---|---|---|
| | | | |

---

## 8. What a build agent reports back rather than working around

- **A probe input that cannot be made to parse.** It means the recipe's `inputs` schema demands
  something no fixed literal can satisfy, which is a finding about the recipe, not about the probe.
- **`recipeManifestContract.parse` turning out to preserve callability.** If it does, B1 gets
  simpler and this plan was wrong; say so rather than keeping the probe for tidiness.
- **A `runs` line that reads `serverless` for a plan that then demands a server.** That is the
  ALL-versus-union rule failing, and it is the single most expensive thing on this listing to get
  wrong.
- **A seed that lands rows in two different homes.** F6's mechanism, not a flake. Report the two
  paths.
- **Anything that makes siegelense want to import `@dungeonmaster/hydration`.** The fence at `349`
  is load-bearing; if it genuinely cannot hold, that is a decision for the document, not a local
  convenience.
