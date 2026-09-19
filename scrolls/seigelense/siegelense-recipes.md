# Siegelense recipes

> One of three documents split out of `../siege-verification-tooling.md`. Its siblings are
> `siegelense-tooling.md` and `siege-verification-remainder.md`.
> This one holds the recipe book: what a recipe is, what holds one, how one is written, constrained,
> tested, where one lives, and how one is used at call time.

---

## The prompt that builds this

**Send this to a session once `siegelense` itself is finished.** It is the same flow the siegelense
build ran under, with the two clauses this feature needs that that one did not.

> Move to the worktree `recipes-doc` before you start and do all this work there. It is already
> carved; create no new one.
>
> Implement the recipe book in `scrolls/seigelense/siegelense-recipes.md` in every detail, so one
> manual test pass finds no holes the doc documents as requirements.
>
> Use sub agents for everything: planning, work, ward runs, verification. Only 3 in parallel. Opus
> plans, sonnet the rest. Commit as you like.
>
> The loop:
>
> - A sub agent plans features against the doc for a chunk — what to build, in what order. Parallelize
>   where it helps.
> - Sub agents build them, with unit and integration tests. No e2e needed.
> - Sub agents review the code against the plan for holes and blindspots.
> - A sub agent manually uses the tool against the doc's requirements.
> - A sub agent compares promised to delivered and marks each doc section delivered to the detail
>   specified — a running mark of covered vs not.
> - Start over.
>
> Repeat until the planner says nothing is left, then send sub agents to validate every doc requirement
> by manually running the tool.
>
> Before every commit, run `ward --uncommitted --committed` until green; save the full ward for when
> the feature is done. Agents run `ward -- -- {files}` on files they change — quick sanity, no
> collisions.
>
> **Three packages** under `packages/`, bound by our arch and testing standards, which every sub agent
> pulls: `@dungeonmaster/hydration` (the framework, ships), `packages/hydration-recipes` (this repo's
> own ingredients and recipes, must NOT ship), and the `@dungeonmaster/siegelense` changes that list
> and seed them. Part 5's "Where each part lands in this repo's architecture" is the map.
>
> The chainables get their own PLANNING SESSION. Part 5's "The combinatorial planning session" hands it
> two tables — what an ingredient must versus may have — and rounds A through D. Do not let a session
> invent that list; it will re-derive written-down cases and miss the rest. Round D is the sad paths,
> none implemented or tested today.
>
> The chainables need manual COMBINATORIAL exercise, not one example each. Every verb's example
> compiles; that is not knowing what composing them does. Drive whole rounds of combinations against a
> live instance and write down what breaks — a `filter` inside an `add` whose transition minted the
> rows it matches; a `saveRecordAs` on a row a later `remove` deletes; a `fromSaved` pointing at a row
> inside a `filter`; two ingredients whose `links` name the same parent; a transition that mints rows
> another transition removes. The doc could not anticipate these; the round that finds one writes it
> into the doc rather than working around it.
>
> Converting the existing suites is part of this work, and proves the design. Part 5's "The migration
> IS the validation" has the order; `python3 scrolls/tools/seed-census.py` produces the target file
> list and running mark. Its counts: 17 integration domain-seeders first (cheap environment), then 118
> e2e specs in small batches, suite green between them, then one manual siegelense round for the tool
> half neither suite crosses. A converted test keeps its assertions exactly — if it needs a different
> assertion to pass, the ingredient is wrong, not the test. A test that will not convert is a finding,
> written into the doc.
>
> Blockers: send sonnet agents to unblock.
>
> Siegelense is merged to master and this branch tracks it — no second branch to chase. "This
> branch tracks master" says when to merge, what the end rename touches, and the one coordination left:
> chunk 8 edits `packages/siegelense`, where manual-testing rounds still land fixes. Ask before
> starting it; merge either side.
>
> Master is not settled — a full `npm run ward` over the just-merged tree is still running in another
> session; its findings land as fixes. Start chunks 1-6 anyway; nothing on master can invalidate a new
> package. Merge master again once that run is green, and before any conversion batch — otherwise
> chunks 9 and 10 rewrite 900 call sites against a tree about to move.

**The chain's types compose inside `@dungeonmaster/hydration` itself, not in a separate prototype.**
`packages/hydration/test/type-fixtures/` is what proves it: a positive tree that compiles with zero
diagnostics, and a negative tree whose every fixture carries exactly one deliberate error — both
graded by a real TypeScript program in `typescriptProgramDiagnosticsAdapter`'s own tests.

**Part 5's "Known gaps" section is work, not commentary.** Each row is a decision nobody has made. A
planner reading this doc should schedule them rather than discovering them.

### What this doc asks for, and what it does not

**Everything left in this document is the build.** The rules that bind SESSIONS at run time —
siegemaster, its dispatched planner, that planner's sub-agents, a fixer — live in
`siegelense-recipe-roles.md`, because none of them is code in this feature and all of them land as
prompt text in `@dungeonmaster/orchestrator`'s statics.

**Do not read the roles document while building, and do not edit orchestrator prompt statics in this
work.** A prompt describing recipes before the packages exist describes something no session can call.

| Here | What it is |
|---|---|
| Part 3A | the decision index. **Where it differs from Part 5, Part 5 wins** |
| **Part 5** | **the recipe book — the specification you build from** |
| Part 6 | the `seed` step and what `recipes {}` prints are yours; the rest is siegelense's own, already built |

**The part numbers are inherited from the document this was split out of**, and other documents cite
them, so they are left alone rather than renumbered into a tidy 1-2-3. A prompt that describes recipes before the
packages exist is a prompt describing something no session can call.

### A suggested spine, for the first planner round

**Not a ruling — a starting order, so round one argues with something instead of inventing it.**

| # | Chunk | Why here |
|---|---|---|
| 1 | contracts: `IngredientConfig`, `Plan`, `Op`, the manifest, the errors | everything else names them, and nothing else can start |
| 2 | `createHydration`, `ingredient`, `registry` — declaration only, no running | the types are the risk; get them compiling against two real ingredients before anything executes |
| 3 | the chain builder: `add`, `set`, `setRaw`, `saveRecordAs`, `remove` producing ops | a plan you can print is the first thing worth looking at |
| 4 | the runner: depth-first walk, link resolution, routes, **and every pre-flight refusal** | the first chunk that touches disk |
| 5 | `transitions` and `reach` | needs the runner, and is where the real gates get walked |
| 6 | `filter`, and `fromSaved` | both need live state, so both need the runner working |
| 6b | **every row of the sad-path table**, as behaviour with its own tests | Round D DRIVES these; it does not implement them. Unassigned, they are eleven findings a round reports and nobody owns |
| 7 | `hydration-recipes`: the real ingredients, their tests, the two-route comparison | the first chunk that proves the framework on this repo's own state |
| 8 | siegelense: discovery, `recipes {}`, the `seed` step's `params` | the tool half, once there is something to list |
| 9 | convert the integration domain-seeders — `python3 scrolls/tools/seed-census.py` lists them | the cheap environment, where a runner defect costs seconds to find |
| 10 | convert the e2e specs, in small green-between batches, tracking `--progress` | the expensive environment, once the runner is proven |
| 11 | one manual siegelense round — `recipes {}`, a `seed` step, params validation | the tool half, which neither suite crosses |
| 12 | the combinatorial rounds and the sad paths | nothing to combine until 1-11 land |

**Chunk 2 before chunk 3 is the one ordering that matters: the types must compose before the runtime is
written.** A contract's own colocated test exercises its runtime zod parse and never its TypeScript
generic, so a contract whose value IS its generic ships green while broken. Measured directly: three
such breaks — `links` typed against the wrong spec, `copies` typed against the wrong output type, and
`transitions` missing `reach` entirely — each passed chunk 1's own tests and were caught only once a
fixture declared something real against them.

---

### This branch tracks master, and siegelense is already in it

**Siegelense was merged to master so the MCP could restart, and those sessions went back to manual
testing in their own worktree.** So this build has no second branch to chase: **merge `master`, and
nothing else.**

```bash
git merge master      # in this worktree, at the intervals below
```

| | |
|---|---|
| this branch | `recipes-doc`, off `master` |
| where siegelense lives | `master` — merged, including `packages/siegelense-recipes` |
| what still moves | `packages/siegelense`, as manual testing finds defects. Fixes, not construction |

**`packages/siegelense-recipes` is already here.** Seven files, an empty scaffold, arrived with the
merge. Nothing is blocked on reaching it any more.

#### What that leaves to schedule

**Chunks 1 through 7 are unblocked today.** The framework is a new package that touches nothing anyone
else is in, and chunk 7's recipes package is on disk.

**Chunk 8 is the only one that still wants coordination.** Siegelense is driven by hand, not built, and
a manual round that finds a defect lands a fix in `packages/siegelense`. Chunk 8 edits that same
package, so an edit collides only with a fix a round happens to land.

Chunk 8 waits on no milestone. **It wants a quick word before it starts** — ask whether a
manual round is mid-flight, and merge `master` immediately before and after it.

#### When to merge

| When | Why then |
|---|---|
| **once the pending full ward on master is green** | see below — master is not settled yet, and this is the merge that matters most |
| before chunk 7 | it is the merge that brought the recipes package; done already if the tree holds it |
| before and after chunk 8 | the one place both builds write the same package |
| before each migration batch in chunks 9 and 10 | those convert hundreds of real tests, and converting against a stale tree converts the wrong thing |
| before the rename | so it is done once |

**The collision surface is small and known**: root `package.json` `dependencies` and `eslint.config.js`,
where `hydration` needs its own `ban-primitives` entry. Everything else this branch writes is new files.
The merge that brought siegelense in landed clean, with no conflicts at all.

**MASTER IS NOT SETTLED YET.** Siegelense merged 19 commits' worth of work into it, and the session
that did so is running a **full `npm run ward`** over the merged tree. A full run after a merge that
size usually finds something, and whatever it finds lands as fix commits on master.

**So check master again before trusting it for anything expensive.** Concretely:

| Do this | Not this |
|---|---|
| start chunks 1-6 now — they are a new package and a later fix on master cannot invalidate them | hold the whole build waiting for a ward that may take a while |
| **merge master again once that ward is green**, and before any conversion batch | convert hundreds of real tests against a tree that is about to change under you |
| ask the siegelense session whether the full run has landed, rather than inferring it from the log | assume a quiet branch means a finished one |

**A conversion batch is the expensive thing to get wrong here.** Chunks 9 and 10 rewrite setup across
roughly 900 call sites; doing that against a tree that then takes a round of ward fixes means
re-resolving every one of them.

**Never merge on a red tree.** `npm run ward -- --committed --uncommitted` after each one, before new
work lands on top.

#### The rename is its own step, and it is bigger than the folder

**`siegelense-recipes` becomes `hydration-recipes` late, after the last merge that matters** — earlier
and it is re-done on every merge after.

The surface, measured on this tree:

| What | Detail |
|---|---|
| the package folder | `packages/siegelense-recipes/` → `packages/hydration-recipes/` |
| the nested statics folder and file | `src/statics/siegelense-recipes/siegelense-recipes-statics.ts` → `hydration-recipes/hydration-recipes-statics.ts`, and its `.test.ts` |
| the package name | `@dungeonmaster/siegelense-recipes` → `@dungeonmaster/hydration-recipes`, in its `package.json` |
| root `package.json` | **remove it from `dependencies` entirely** — that field is what ships, and this package must not |
| `package-lock.json` | regenerate; do not hand-edit |
| the scaffolder | `packages/siegelense/src/responders/install/recipes-scaffold/` — `RECIPES_PACKAGE_DIRNAME`, plus its proxy and test |
| the install flow | `packages/siegelense/src/flows/install/install-flow.ts` and its integration test |
| `start-install.integration.test.ts` | asserts the scaffolded path |
| `packages/local-eslint` | `locator-pick-statics.ts` and `is-locator-pick-scope-file-guard.ts` carry the path in an allowlist |
| `packages/orchestrator` | `prepare-quest-package-graph-layer-responder.test.ts` names it |
| the scrolls docs | this document and its siblings |

**The scaffolder already exists and already does the right thing.** `InstallRecipesScaffoldResponder`
creates the package when absent, leaves an existing one untouched, and its header already carries the
empty-versus-missing reasoning. **It needs the rename and nothing else** — do not write a second one.

### 3A — The decision index

#### Recipes: the three packages, the three tiers, and what holds them

| Decision | Because |
|---|---|
| THREE packages: `@dungeonmaster/siegelense` (the tool), `@dungeonmaster/hydration` (the framework), `packages/hydration-recipes` (this repo's) | a recipe has to import things — a quest ingredient calls `questHydrateBroker`. Folding the framework into the tool makes every recipe file depend on a browser driver it never uses, and makes the tool's dependency graph answerable to whatever a repo's states happen to need |
| `siegelense` NEVER imports `hydration-recipes` — it walks the path at run time | an import welds this repo's guilds and quests into the published tool |
| `packages/hydration-recipes` must NOT sit in the root `package.json` `dependencies`, and a colocated test pins its absence | that field is what ships, and `dungeonmaster create-package` writes the entry automatically. Without the test the next scaffold run puts it back and nothing says so |
| `packages/hydration-recipes/` exists in EVERY repo siegelense is installed in, scaffolded by `dungeonmaster init` | a convention nothing creates is a convention half the repos will not have. Each package's `StartInstall` already writes what its own package needs; this is the same move |
| An EMPTY recipes package is a real answer where a MISSING one is not | an empty folder says "no recipes yet"; an absent folder can only say "something is wrong", and the tool cannot tell "you have written none" from "you have not installed this". The `count: 0` ambiguity, one layer up again |
| Recipes are a PACKAGE, not `.dungeonmaster-assets/`, because they are code that must be graded | being a workspace package is what gets them a ward run, and the ward run is the entire reason an ingredient's test fires on the commit that breaks it. A dot-folder gets no ward, no tsconfig, no lint |
| Non-code artifacts DO go in `.dungeonmaster-assets/` — the oddities file and `recording` fixtures | the split is "does this need to compile and be graded". Prose an agent appends to does not |
| `../../packages` assumes a MONOREPO — a known limit, not a settled answer | a consumer with a flat `src/` has nowhere to put it. The package NAME is the convention; its LOCATION follows the repo's workspace layout, which dungeonmaster already detects |
| THREE tiers — structural verbs in the framework, capability verbs an ingredient opts into, extras an ingredient owns | structure generalises and behaviour does not. A shared verb with a per-ingredient implementation is the middle case, and it is most of what a chain does |
| A capability verb is promoted on the SECOND ingredient that wants it, never the first | vocabulary invented for one user is the Cucumber failure arriving early: a catalogue of verbs nobody else fits into |
| `add(n, cb)` hands the callback HANDLES to the records it will make, and every other call is made on a handle | a flat chain leaves the affected level implicit. A handle names it, so no call has to be read against what came before it |
| A literal `n` types the handle list as a fixed-length tuple | `q[3]` after `add(3, …)` is a compile error rather than a run-time throw |
| Every verb but `add` takes an OBJECT | a scalar names no axis, so an ingredient growing a second lifecycle axis would need a second verb. Options accrue in the same place instead |
| `saveRecordAs({ name })` retrieves a created row afterwards, and saves the RECORD rather than an id — the batch step's own `as:` is a DIFFERENT thing | the ids come along inside the record, so a second verb for a subset of the same thing would only make callers learn which one carries the slug. And a name inside a recipe is not a name inside a batch |
| ONE verb sets state: `set()`, and the ingredient WALKS a field named under `transitions` | two verbs taking the same argument shape produce completely different states, and picking wrong fails silently. Seed data is about the END state, which is what one verb expresses |
| `setRaw()` writes a transition field WITHOUT walking, and its name is the warning | a deliberately inconsistent row is a real need for an attack walk and a rare one. Nobody reaches for it by accident |
| `transitions.to` may be NARROWER than the field's own type | `blocked` is a real quest status that nothing reaches by asking. Off the list, `set({ status: 'blocked' })` does not compile |
| `filter()` returns a set with NO index and NO `add`, and a zero match THROWS by default | how many rows a transition minted is a fact about the gates, not about the recipe. And a filter matching nothing means the row you meant to reach was never there |
| A link names its parent by NAME, never by reference | parent and child referencing each other is an inference cycle; TypeScript answers `TS7022` and every type downstream degrades to `any` |
| `all` is a second ARGUMENT to `add`'s builder, never a property beside the handles | `Tuple<T, N> & { all: T }` silently loses the out-of-bounds check — measured against four shapes |
| A child accessor appears on its IMMEDIATE parent only | requiring merely that every link be satisfiable puts `sessions` on `q[0]`, because a quest's ancestors include a guild |
| AN INGREDIENT declares the routes; a recipe does not | a recipe pinned to one route serves only the callers that offer it. On the ingredient the TARGET picks, which is what lets an integration test with no server into the catalogue at all |
| A `write` route must declare `copies:` | the counterpart it imitates is where a diagnosis starts. Without the pointer every one opens with a hunt |
| An ingredient declares `links`, and the RUNNER writes each ancestor's id into the named field | a child row needs a parent id that does not exist when the recipe is written. Declared once per ingredient, it is never passed by hand and never forgotten |
| A `links` entry no ancestor provides, and a `fromSaved` naming a record declared later, are refused BEFORE the first write | the plan's shape is known before anything runs, so both are caught where they cost nothing instead of becoming ordering folklore. **Nested, the type system catches the first; at TOP LEVEL it does not — the runner must** |
| A seed step's inputs go in a `params` OBJECT, typed by the `recipe` value | flattened, an input named `as`, `step` or `recipe` shadows the step's own keys, and the collision is silent |
| An ingredient's `fields` and `record` come from CONTRACTS, never a restated type | a retyped entity drifts silently, and the drift surfaces as a walk that cannot start |
| The CHAIN owns the index and hands it to `defaults(i)` | determinism stops being a rule each recipe remembers. The only way left to break it is reaching for a clock, which is one lint rule over one folder |
| An ingredient never calls `Date.now()`, `Math.random()` or `randomUUID()` for anything that reaches a screen | three of the four content-determinism rows reduce to this one rule, and a `write` route writing a live clock is the exact drift `copies:` exists to catch |
| A recipe returns a PLAN, and the plan is DATA | the listing prints it, so nothing can drift from a hand-written summary. And one plan runs three ways — a walk, an end-to-end spec, an integration test |
| Every ingredient carries a colocated integration test, and a two-route ingredient compares its OWN routes | it moves staleness from "discovered months later by whichever planner needed it" to "fails on the commit that caused it, next to the diff". A snapshot pins an ingredient to a shape somebody typed; a two-route comparison pins it to what production emits |
| The test owns CORRECTNESS; the planner's prelude owns FITNESS for a path | an ingredient can be perfectly correct and be the wrong ingredient for path 3. And three ingredients that each pass alone still fail composed. No test can know either |
| `api` routes share ONE instance for the whole suite | **not a 20-second boot** — a server built as an in-process application object has no port to open, so measure the real cost before designing around one that may not exist. The real reason to share is Jest's own file boundary: nothing crosses test files, so one `beforeAll` per file is the only reuse there is. `write` routes need no instance at all |
| An ingredient whose claim is about what a URL RENDERS needs a browser to assert it — the most expensive of three test costs | files assert with a temp dir, a route asserts with a shared server, a rendering asserts with a full instance. Narrow a claim to the cheapest tier that is still honest |
| A browser-asserted ingredient test is DELIBERATE, because the prelude's `VERIFIED` run already covers rendering | the prelude is proven by running; an ingredient test that re-proves the same rendering pays twice for one fact |
| An ingredient touches STATE, never a screen — held by a lint rule in `@dungeonmaster/eslint-plugin`, which SHIPS | the constraint binds every repo that writes an ingredient, so a `local-eslint` rule would hold it here and nowhere else. `no-hardcoded-package-names` stays the TEMPLATE for the shape, and its own blind spot is the caution to copy with it |
| The migration is IN SCOPE and is the validation, not cleanup | 118 e2e specs and 17 integration tests seed domain state, and a conversion that cannot reproduce a real test's setup has found a hole no invented example would have |
| A converted test keeps its assertions EXACTLY; only its setup changes | the assertions are the control — written against what the app really does, by somebody not thinking about this framework. Loosening one to land a conversion hides the finding it just produced |
| Integration converts BEFORE e2e | files-only runs in seconds, so every runner, link, default and transition defect surfaces where a cycle is cheap |
| `seed` is a STEP, placed anywhere in a batch, not a prologue | seeding with a page already open is the only way to exercise a live-update path. A walk that always seeds up front then navigates only ever measures a fresh render |
| A durable, committed ODDITIES file holds driving knowledge; a round that finds a new one appends | proxies already do this for unit tests. The guide's `TRAPS` heading is the per-quest version and `.quest-plans/` is wiped, so every oddity is rediscovered at "a wrong command costs a whole round" |
| An oddity that is really an app defect gets an OBSERVABLE, not an entry | "click the wrapper, not the label" usually means the hit area is wrong, which is a real defect for a real user. A file that only grows is a list of accepted defects |

---

## Part 5 — The recipe book

**Seeding is in scope for this work.** What is out of scope is the full ownership architecture its sibling
document `siege-verification-remainder.md` argues for — seeders living beside the contracts they build, and a scenario layer. That is a bigger change and it is not a
prerequisite.

What IS a prerequisite is that **a session can put the system into a known state without deriving how every single
time**, and that the SAME known state is reachable from a browser walk, from an end-to-end spec and from an integration
test.

### Four words this document uses, and two rules that outlive the split

**The vocabulary, because nothing below defines it and the role document lives in
`siegelense-recipe-roles.md`, not here:**

| Word | Means |
|---|---|
| an **instance** | one running stack — an API server, a web server and a browser |
| a **run** | one submitted batch of steps |
| a **recipe** | a named thing that creates state, and the subject of this document |
| a **prelude** | the batch that reaches a walk path's entry state. **Markdown in `.quest-plans/`, not a type to implement** |

**Two rules come from how these get USED, and a builder that loses them simplifies the mechanism away:**

**A recipe returns a PLAN a spec can run directly, in process, with no CLI boundary anywhere.** That is
why `run(plan, target)` is a public export of `@dungeonmaster/hydration` and why `hydration-recipes`
must be importable from a spec tree. A framework reachable only through a `seed` step would satisfy
every other line of this document and be useless to the 118 specs in step 2 of the migration.

**One row makes "the right one" and "the first one" the same value.** An off-by-index bug then passes,
the walk comes back clean, and the clean result means nothing. That is the mechanism behind the
two-of-anything rule, and it is why `defaults(index)` is not a convenience: without it every row in an
`add(3, …)` is identical and the count buys nothing.

### The problem

A fresh instance has an empty home. Nothing is reachable until something seeds it. So every walk begins with seeding,
and today every walk works out how from scratch: siegemaster's step-3 guide has a `SEEDING` heading that a sub-agent
fills by reading code —

> **SEEDING** how to create the data each path needs, as commands or requests that actually work.
> TWO of anything an assertion must tell apart.

That is re-derived per quest, by a different agent, every time. It is the same repeated-derivation cost the page key
removes for selectors, and it fails the same way: a wrong command costs a whole round, and the prompt already carries "a
round that finds the guide wrong reports it."

The trial hit this directly. Walking one flow needed a guild plus three session transcripts, so it took a throwaway
script — handed identically to all three arms so seeding stayed a constant rather than a variable. That worked for one
flow and does not generalise by itself.

**And the derivation happens in four separate vocabularies, none of which can call another:**

| Who seeds | With what | Reaches |
|---|---|---|
| a Playwright end-to-end spec | `packages/web/test/harnesses/` | a server and a browser |
| a Jest integration test | hand-rolled `fs` writes under `installTestbedCreateBroker` | files only |
| an orchestration smoketest | `questHydrateBroker` against `smoketestBlueprintsStatics` | files only |
| a siege walk | a throwaway script | a server and a browser |

Four spellings of "make me a guild with some quests", each maintained separately, each going stale on its own schedule.
The recipe book is one spelling that all four call.

### Three packages, and what may cross between them

**The tool ships. The framework ships. The recipes never do.**

| Package | Holds | Published | May import |
|---|---|---|---|
| `@dungeonmaster/siegelense` | the tool — instances, batches, browser driving, the `seed` step | yes | neither of the others |
| `@dungeonmaster/hydration` | the framework — ingredients, chains, plans, the runner, the types | yes | nothing repo-specific |
| `packages/hydration-recipes` | THIS repo's ingredients and recipes | **no** | `@dungeonmaster/hydration`, plus orchestrator, shared, server — whatever a state needs. **Not `web`**: it has no `main` and no `exports` and builds through `vite build`, so an import of it resolves to nothing at run time |

**The framework is a separate package from the tool because a recipe has to import things.** A quest ingredient calls
`questHydrateBroker`; a session ingredient writes the JSONL shape the orchestrator reads. Putting the recipe types inside
`siegelense` would make every recipe file depend on a browser driver it never uses, and would make the tool's own
dependency graph answerable to whatever a repo's states happen to need.

**`siegelense` never imports `hydration-recipes`.** It finds recipes by walking `packages/hydration-recipes/` at run
time, which is the same convention it already enumerates. An import would weld this repo's guilds and quests into the
published tool.

**`packages/hydration-recipes` must not appear in the root `package.json` `dependencies`.** That field is what ships —
`packages/CLAUDE.md` states it — so an entry there installs this repo's recipes into every consumer, alongside the empty
one `dungeonmaster init` scaffolds for them. `dungeonmaster create-package` adds that entry automatically, so the
package needs a colocated test pinning its absence; otherwise the next scaffold run puts it back and nothing says so.

**In a consumer repo the folder is there and the contents are theirs.** The convention travels, the framework travels,
and the recipes do not. Nobody else has guilds and quests, and nobody else should inherit ours.

### Three tiers, and only the middle one is written per entity

| Tier | Written | Examples |
|---|---|---|
| **structural** | once, in the framework, available on every ingredient | `add`, `filter`, `set`, `remove`, `saveRecordAs` |
| **capability** | the verb once in the framework; an ingredient OPTS IN and gets it typed to its own values | a `transitions` field, reached through `set({ status: … })` |
| **extra** | by the ingredient, for itself | `withNestedChain({ depth: 2 })` |

**A capability is a verb more than one ingredient would want, where only the mechanics differ.** Walking a quest to
`in_progress` runs gates that mean nothing to a session, but both have a lifecycle, so the WALK is shared and its
implementation is not. An ingredient that declares no lifecycle has no `.to()` on its chain at all, and that is a compile
error at the call site rather than a throw at run time.

**Promote a verb to a capability on the SECOND ingredient that wants it, never the first.** Inventing shared vocabulary for
one user is how a catalogue grows verbs nobody else fits into — which is the Cucumber failure this design spends most of
its rules avoiding.

**An extra is a verb only one ingredient could ever have.** Structure generalises; behaviour does not.

### Every property on an ingredient, and what goes in it

**This is the reference a builder works from.** Every property is listed, whether it is required, what it
is for, and what a real value looks like.

| Property | Required | What it does |
|---|---|---|
| `name` | yes | the ingredient's identity. What a child's `links` points at, and what the runner reports in an error |
| `description` | yes | one line, present tense, naming the ROW this makes. **`recipes {}` prints it**, so a session picks without reading the code |
| `fields` | yes | the contract for what a caller may `set`. `set()` takes a `Partial` of it |
| `record` | yes | the contract for the row AFTER creation, server-assigned fields included. What `saveRecordAs` exposes |
| `routes` | yes | at least one of `api`, `write`, `recording` — how the row gets MADE. Optionally `query`, `update` and `remove` — how the chain reaches a row that already exists. A chain call whose verb the ingredient does not declare a route for is refused before the first write |
| `links` | no | this row's foreign keys, as `{ of: '<parent name>', as: '<field on this row>', from: '<field on the parent, defaults to id>' }` |
| `transitions` | no | the one field whose value is reached by WALKING rather than writing |
| `defaults` | no | `(index) => fields` — per-row values derived from the index, never from a clock |
| `copies` | only with a `write` route | the production code whose output that route imitates |
| `extras` | no | verbs only this ingredient could have, each declared as `{ args, apply }` — the args contract and the body the runner calls |

**`name` and `description`** — the two a listing reads:

```ts
name: 'quest',
description: 'one quest under a guild, at whatever status you set it to',
```

Write the description for the session choosing between recipes, not for the person who wrote the
ingredient. It says what EXISTS afterwards, not what the code does.

**`fields` and `record` are two different contracts, and collapsing them is a mistake.** `fields` is
what a caller may supply; `record` is what came back. A guild's id and `urlSlug` are on the record and
not on the fields, because the server mints them — and that difference is exactly what makes
`saveRecordAs` worth having.

```ts
fields: questFieldsContract,     // title, userRequest, status, guildId
record: questRecordContract,     // id, title, status, guildId, createdAt
```

Both come from contracts, never a restated type. An ingredient that retypes its entity drifts from it
silently, and the drift surfaces as a walk that cannot start.

**`routes`** — one function per way of making the row. Each takes the repo's own target:

```ts
routes: {
  api: ({ target, fields }) => httpPost({ target, path: '/api/quests', fields }),
  write: ({ target, fields }) => hydrate({ target, fields }),
},
```

**`links`** — the foreign keys, named by parent NAME:

```ts
links: [
  { of: 'quest', as: 'questId' },                        // `questId` on THIS row points at a quest's `id`
  { of: 'guild', as: 'guildId' },                         // and `guildId` at that quest's guild's `id`
  { of: 'session', as: 'sessionId', from: 'sessionId' },  // the session record's own id field is `sessionId`, not `id`
],
```

`of` is the parent's `name`. `as` is the field on THIS row carrying the parent's id. `from` names the
field on the PARENT record that id comes from, and defaults to `'id'`. **`from` is what makes the
mechanism work for a parent whose own id field is not called `id`** — the session record above has no
`id` at all. The runner fills each one; nothing passes them by hand. Order does not matter.

**`transitions`** — the field that is walked rather than written:

```ts
transitions: {
  field: 'status',
  to: ['created', 'approved', 'in_progress', 'complete'],
  reach: ({ from, to, target, record }) => walkQuestStatus({ from, to, target, record }),
},
```

| Key | What it is |
|---|---|
| `field` | the one field on `fields` this governs |
| `to` | the end states a caller may ASK for. May be NARROWER than the field's own type |
| `reach` | what runs to get from the current value to the asked-for one. Receives the `record` being walked — without it, `add(3, …)` gives `reach` no way to know which of the three rows to walk |

**`to` being narrower is the point.** `blocked` is a real `QuestStatus` that nothing reaches by asking,
so it is off the list and `set({ status: 'blocked' })` does not compile. Leave a value off whenever
reaching it means something other than a caller asking.

**Asking for a value off that list is refused in the PRE-FLIGHT, before anything runs, and that is a
different failure from a gate refusing one that IS on the list.** Both halves of the pre-flight check
are static — the value a `set` asks for, and the states the ingredient declares — so nothing needs to
run before refusing it. A gate refusing needs a live row, and only fires once `reach` is actually
walking it; that is the mid-run failure the sad-path table names under *"`reach` throws"*. One is a
plan that could never have worked; the other is a live row the gates would not move.

**`defaults`** — per-row values from the index:

```ts
defaults: (index) => ({ title: `Quest ${index + 1}` }),
```

**The index is 0-based and scoped to ITS OWN `add`.** Two separate `add(2, …)` calls both see indexes 0
and 1. It is the chain's only source of per-row variation, and it is why nothing in an ingredient needs
a clock or a random value.

**An ingredient declaring no `defaults` at all, and one whose `defaults` ignores its own `index`,
produce the identical op tree: every row in that `add` carries the same `fields`.** Nothing in the
chain, the pre-flight or the runner tells either shape apart from a correctly varying one — the "two of
anything" rule breaks with no error and no warning, for as long as an ingredient's `defaults` stays
absent or constant.

**A reference disambiguates between calls, or two rows would share one identity.** The index above is
scoped to its own `add` on purpose — `defaults(index)` needs a row's position to reset per call, not
climb forever. But a row's REFERENCE cannot reuse that same bare index: two sibling `add(2, …)` calls
on one collection, or the same top-level ingredient added twice, would then mint the identical ref for
different rows, and a later op targeting one silently lands on the other. So a reference folds in a
SECOND number alongside the index — which `add` call, in the order those calls ran on that one
collection — deterministic because it is scoped to one collection instance, reset to zero the moment a
fresh collection exists, and never a counter that survives between separate builds of the same recipe.

**`copies`** — required wherever a `write` route exists:

```ts
copies: 'questPersistBroker',
```

The production code whose output that route imitates. It is where a diagnosis starts, and where the
two-route comparison test points.

**Nothing programmatic reads this value.** `ingredientConfigContract`'s `superRefine` checks only that
`copies` is PRESENT when a `write` route exists; no pre-flight step and no op the runner executes
inspects what it names. A wrong pointer is caught by nothing the framework runs — only by a human who
reads the ingredient file and checks the name against the code it claims to imitate.

**`copies:` names either an in-repo pointer or an external one, and the two forms are distinguished by
an explicit prefix.** A bare identifier names production code in this repo — `guildAddBroker`. An
`external:` prefix names a producer outside the repo — `external:claude-cli`, for a shape only an
external tool writes. A Claude session transcript is the case: the Claude CLI writes it, not anything
in this repo — every in-repo path that touches the shape READS it, and the only in-repo artifact that
emits it is a test fixture. **Neither form may contain a `/`.** A slash means somebody has written a
file path, and a path into a test folder is exactly the wrong pointer this property exists to prevent.
`copiesTargetContract` in `packages/hydration` refuses anything else, at module load:

> `copies: may not contain '/'. Use a bare identifier naming in-repo production code (e.g. 'guildAddBroker'), or 'external:<name>' naming a producer outside the repo (e.g. 'external:claude-cli').`

**The session and sub-agent ingredients are declared, each naming `external:claude-cli`.** Every route
broker behind them exists and is tested — the query route, the remove route, the write route's own
file-writing logic — and the declaration completes the set. Those two ingredients back a large share
of the conversion's call sites.

**A two-route comparison needs both an `api` route and a `write` route, so an ingredient with only a
`write` route has no second route to compare against.** The danger Table 1 names — *"a wrong pointer
makes the two-route test assert against the wrong thing, and it PASSES"* — cannot arise for it: the
guarantee is not weakened, because in this case there was never a comparison to weaken. `copies:` is
then the note a human reads when a write route's output looks wrong. For a shape an external tool
writes, the truthful note names that tool. A pointer into a hand-written test fixture would teach
nothing — the fixture is written from the same understanding as the write route, and the two agreeing
proves only that one person guessed consistently twice. An ingredient mimicking an external producer
gets no two-route comparison, and nothing here claims otherwise.

**A route sometimes cannot call the very code `copies:` names, even from inside the same repo.** A
package's own `exports` map decides what crosses into another package, and a production broker with no
export entry is invisible to a route that would otherwise call it directly. The route then imitates
that code instead of calling it, which is exactly the drift `copies:` exists to name — `copies:` stays
honest about WHAT is imitated even on the call that cannot reach it.

**`extras`** — verbs only this ingredient could have:

```ts
extras: {
  withNestedChain: {
    args: nestedChainArgsContract,   // { depth: number }
    apply: ({ target, record, args }) => nestChain({ target, record, args }),
  },
  advanceOneStep: { args: advanceArgsContract, apply: ({ target, record, args }) => advance({ target, record, args }) },
},
```

**An extra is ONE object, `{ args, apply }`, never a bare contract.** `args` types what the caller
passes; `apply` is the body the runner calls to do it. A contract with no `apply` types a verb with
nothing to run, so the two are declared together or not at all.

Each becomes a method on that ingredient's rows and on nothing else, taking one object typed by its
`args` contract. **Reach for an extra only when no second ingredient would ever want the verb** — the
moment a second one would, it belongs in the framework as a capability instead.

A whole ingredient, every property in use:

```ts
export const questIngredient = ingredient({
  name: 'quest',
  description: 'one quest under a guild, at whatever status you set it to',
  fields: questFieldsContract,
  record: questRecordContract,
  links: [{ of: 'guild', as: 'guildId' }],
  defaults: (index) => ({ title: `Quest ${index + 1}` }),
  transitions: {
    field: 'status',
    to: ['created', 'approved', 'in_progress', 'complete'],
    reach: ({ from, to, target, record }) => walkQuestStatus({ from, to, target, record }),
  },
  routes: {
    api: ({ target, fields }) => httpPost({ target, path: '/api/quests', fields }),
    write: ({ target, fields }) => hydrate({ target, fields }),
  },
  copies: 'questPersistBroker',
  extras: {
    advanceOneStep: { args: advanceArgsContract, apply: ({ target, record, args }) => advance({ target, record, args }) },
  },
});
```

### What a recipe declares

```ts
export const guildMidExecution = recipe(
  {
    name: 'guild-mid-execution',
    description: 'one guild holding three quests, the first running with its riftcarver item dropped',
  },
  () => [ … ],
);
```

| Property | Required | What it does |
|---|---|---|
| `name` | yes | what a `seed` step names, and the key of its entry in the generated input union |
| `description` | yes | **what `recipes {}` prints.** One line, saying what EXISTS after this recipe runs |
| `inputs` | no | a zod schema describing what this recipe needs from an earlier step. One declaration, three readers: the `inputs` line `recipes {}` prints, the in-process type the builder receives, and the schema a `seed` step's `params` are validated against before seeding |
| the builder | yes | takes the recipe's typed inputs, if any, and returns the ops |

**A recipe's description is the one a session reads when choosing**, so it describes the END STATE and
the counts that matter:

- ✅ `one guild holding three quests, the first running with its riftcarver item dropped`
- ❌ `seeds a guild and some quests` — a session cannot tell whether it can distinguish two rows
- ❌ `calls questHydrateBroker three times` — that is how, not what

**Read against this repo's own three recipes, two fail this bar.** `quest-advances-one-step`'s
description — the first item complete and the second running — passes: it names exactly what tells
the two rows apart, and the ledger the recipe writes matches those two words precisely.
`guild-mid-execution`'s description says the first quest is running with its riftcarver item dropped
and stops there — it never says what makes the second row different from the third, even though the
recipe saves both under distinct names, so a session reading only the words has no way to choose
between them, the exact failure the ❌ example above names. `session-with-nested-chain`'s description
says the session holds a nested sub-agent chain and never says how deep, so the one fact that would let
a session tell a shallow chain from a deep one is missing from the words a session actually reads.

### The listing `recipes {}` prints

Descriptions are what make the listing usable, so it reads them from the declarations rather than from
prose anyone maintains separately:

```
recipes {}
→ guild-mid-execution
    one guild holding three quests, the first running with its riftcarver item dropped
    inputs:  none
    runs:    serverless
    makes:   guild ×1, quest ×3, operation (varies)

  session-with-nested-chain
    one session under an existing guild, holding a nested sub-agent chain
    inputs:  guildPath
    runs:    serverless
    makes:   session ×1
```

**`inputs` prints KEY names, never the branded type.** Zod's `.brand<'GuildId'>()` is a type-level phantom — it
stores nothing at run time, so a schema loaded off a dynamic import carries no trace of the name a brand gave it at
compile time. Printing one would need a second, hand-maintained string beside the schema, which is exactly what
reading these lines off the declarations, rather than from prose anyone maintains separately, exists to prevent.
**And this repo's `session-with-nested-chain` declares `guildPath`, not `guildId`** — the field its `under()` call
needs is the guild's own `path`, not its id — so the listing above prints what THIS repo's recipe actually
declares.

| Line | Comes from |
|---|---|
| the name | the recipe's `name` |
| the sentence under it | the recipe's `description` |
| `inputs` | the recipe's input contract — static data, so PRINTING the `inputs` line runs nothing. `runs` and `makes`, below, are a different question: both are read off a PLAN, and a plan is what the next paragraph explains |
| `runs` | `serverless`, or `needs a server: <ingredient>`. **An ALL over the plan's ingredients, never a union** — a union answers which routes appear anywhere, which is a different and more optimistic question |
| `makes` | each ingredient's NAME, counted off the plan — not its `description`: the worked example above prints `guild ×1, quest ×3`, and three one-line `description` sentences concatenated on this line would be unreadable. `varies` wherever a `filter` or a transition decides the count |

**`serverless` renders bare; `needs a server: <ingredient>` renders with its reason.** A serverless
answer tells the caller to go ahead — there is nothing to warn about and nothing to explain, so a
trailing clause is noise on the line a reader skims past. A needs-a-server answer stops the caller,
and that is the moment an explanation earns its width: the reader's next question is which
ingredient, and why, and the answer decides whether they start a server or pick a different recipe.

**A plan only exists once the recipe's builder has run, and a recipe declaring `inputs` cannot run its builder
without input VALUES.** Two of this repo's three recipes parse their inputs inside the builder —
`session-with-nested-chain` parses its `guildPath` at build time — so calling the builder with nothing throws, and
`runs`/`makes` would have nothing to read. **So the recipes package declares a LISTING PROBE per input-taking
recipe** — a fixed, plausible stand-in value, parsed through that recipe's own `inputs` schema before the builder
runs, used only to build the plan `runs` and `makes` are read off. The probe never reaches disk, a socket or a
screen: *"The chain builds; it does not execute"* still holds — a probe only ever builds. The alternative — printing
`runs` and `makes` only for paramless recipes — was rejected: it guts *"the line that stops a wasted run"* for
exactly the recipes that compose onto an earlier step, which are the ones most likely to declare inputs and the ones
a caller is most likely to get wrong.

**A transition's minted rows are invisible to `makes`, not merely their count.** `reach` is an opaque
function, and nothing in a plan ties a transition to the child ingredient it mints. The worked example
above prints `operation (varies)` only because its own `filter` names `operation`; the same transition
with no filter naming that ingredient does not appear in `makes` at all — not even as `varies`. So the
limit is not that the count cannot be known at build time. **The INGREDIENT cannot be known either,
wherever nothing else in the plan names it.**

**`runs` on that listing is the line that stops a wasted run.** A Jest integration test reads
`needs a server: guild` and stops, instead of finding out partway through with half a plan on disk.

### Linking a child to its parent

**A child row needs its parent's id, and the parent does not exist when the recipe is written.** So
the ingredient declares the link and the RUNNER supplies the value.

**A link names its parent by NAME, never by reference.** That is not a style choice — it was measured.
An ingredient holding a reference to its parent while the parent holds one to its children is an
inference cycle, and TypeScript answers it with `TS7022: implicitly has type 'any' because it does not
have a type annotation and is referenced directly or indirectly in its own initializer`. Every type
downstream then degrades to `any` and the whole chain stops checking anything. Names point one way —
child to parent, the direction a foreign key already points — so there is no cycle to have.

**The registry inverts them.** Its KEY is the accessor name a chain uses:

```ts
export const dm = registry({
  guilds: guildIngredient,
  quests: questIngredient,
  operations: operationIngredient,
  sessions: sessionIngredient,
});
```

`links` names, for each ancestor a row must point at, the FIELD on that row carrying the ancestor's
id. The runner walks the plan tree depth-first, so every ancestor exists before the child pointing at
it, reads that ancestor's id off the field its link's `from` names (`'id'` unless the link says
otherwise), and writes it into the named field before calling the route. **Neither the recipe author
nor the route implementation passes one by hand.**

**An explicit field beats an ancestor-derived link, and the link is skipped rather than overwritten.**
When a row's own `fields` already carries the value a link would write, the runner leaves that field
alone — it fills in only what the row does not already have. This is what makes `under()`'s
caller-supplied id outrank an ancestor's: `under()` writes into `fields` at build time, before the
runner ever resolves a single link.

**A child accessor appears on exactly one host: its immediate parent.** Two conditions decide it, and
both are checked by the type system rather than reported as an error:

1. the host is named in that child's `links`, and
2. every one of that child's links is satisfied by something already in the ancestor chain.

So `operations` — which links to both `quest` and `guild` — appears on `q[0]` and NOT on `g[0]`, because
a guild alone cannot supply a `questId`. And `sessions`, which links only to `guild`, appears on `g[0]`
and NOT on `q[0]`, even though a quest's ancestor chain does contain a guild. **Condition 2 alone gives
you the second case wrong**, which is measured: dropping it makes `q[0].sessions` compile.

**Siblings share it.** `quests.add(3, …)` under one guild writes the same `guildId` into all three.

**A link to something that is NOT an ancestor is a cross-link, and the tree cannot express one.** Name
the record and point at it:

```ts
dm.guilds.add(1, (g) => [
  g[0].sessions.add(1, (s) => [s[0].saveRecordAs({ name: 'origin' })]),
  g[0].quests.add(1, (q) => [
    q[0].set({ userRequest: fromSaved({ name: 'origin', field: 'sessionId' }) as never }),
  ]),
]);
```

**A forward reference is caught by the PRE-FLIGHT, not while the chain builds.** Records are created
in declaration order, so a `fromSaved` naming something declared later cannot resolve. The chain
builds one op at a time and has not seen the whole plan when that `fromSaved` is written, so it cannot
be the thing that catches this — the pre-flight can, because it walks the finished op tree before
anything runs. Nothing is lost: the refusal still lands before the first write, which is the property
that matters, and the ordering still cannot become folklore somebody learns from a failure.

**A parent the recipe did NOT create comes from a recipe input**, not from an ancestor —
`dm.sessions.under({ guildId })`, where `guildId` is declared on the recipe.

**The mechanism covers a foreign key on the CHILD's own fields, and nothing narrower.** A work item's
foreign key is a PREFIXED STRING inside an ARRAY — `relatedDataItems: ['operations/<id>']` — and no
`links` entry can write into an array slot, because `as` names one field on the child, not a position
inside a collection. `fromSaved` does not rescue it either: it resolves at the top level of a field's
value, not inside an array element. **So an entity whose foreign key takes that shape cannot be an
ingredient**, and its rows stay a field on their parent instead, written by that parent's own `set()`.

**Building this repo's own ingredients confirms it, rather than leaving it a hypothetical.** A quest's
work items are exactly this shape — each one's `relatedDataItems` is a prefixed string inside an array
— and `workItem` has no ingredient as a result: its rows stay a field on `quest`'s own `fields`,
written by `quest`'s `set()`.

### The chain: every call names what it affects

**`add` takes a count and a builder. The builder receives a TUPLE of handles, and `all` as a second
argument.** That is what removes the ambiguity a flat chain has — there is no implicit "current level",
because every call is made on something somebody was handed.

```ts
export const guildMidExecution = recipe(
  { name: 'guild-mid-execution', description: 'one guild holding three quests, the first running with its riftcarver item dropped' },
  () => [
  dm.guilds.add(1, (g) => [
    g[0].set({ name: 'Siege' }),

    g[0].quests.add(3, (q, all) => [
      all.set({ userRequest: 'seeded' }),
      q[0].set({ status: 'in_progress', title: 'The running one' }),
      q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove(),
      q[1].set({ title: 'The second one' }),
      q[2].saveRecordAs({ name: 'third' }),
    ]),
  ]),
]);
```

**`all` is a second ARGUMENT, not a property on the handle list, and that is forced.** A literal count
types the handles as a fixed-length tuple, so `q[3]` after `add(3, …)` is a compile error — but
**`Tuple<T, N> & { all: T }` silently loses that check.** Measured across four shapes: the plain
intersection and a mapped-then-intersected version both let `q[3]` through, while a pure tuple and a
`{ rows, all }` wrapper both catch it. A second argument keeps the tuple pure and costs nothing.

**The builder hands you HANDLES, not records.** Nothing has been created when it runs, so `q[0]` is a
reference to the first quest this `add` will make. Reading `q[0].id` inside the builder is not possible
and must not be made possible: ids resolve at run time and travel through `saveRecordAs`.

### One verb sets state, and the INGREDIENT decides whether that means a walk

**There is no separate transition verb.** `set` is the only way to put a value on a row, and the
ingredient routes it:

| What you set | What happens |
|---|---|
| a plain field | the value is written |
| a field named under `transitions` | the ingredient WALKS the row there, through the real gates |

```ts
q[0].set({ status: 'in_progress', title: 'The running one' })
```

One call, one plain field, one transition. The caller says what it wants to be true; the ingredient
owns how.

**What decides between the two rows of that table is whether the ingredient declares `transitions` for
the field being set — nothing at the call site does.** `set({ status })` walks only when `status` is
the field named in that ingredient's own `transitions.field`. An ingredient that declares no
`transitions` at all routes every `set` straight through, on every field, with no gate consulted — and
the written op carries no `transition` key at all, the identical shape `setRaw` produces. **A caller
cannot tell which happened from the call site, and cannot tell which happened from the result either**,
since a plain write and a `set` that silently found no `transitions` to route through look the same from
outside.

**Splitting them was tried on paper and is worse.** Two verbs taking the same argument shape produce
completely different states — a written field with no ledger, versus a walked row carrying everything
the gates made — and picking wrong fails silently, with a walk measuring an empty screen and reporting
a defect in working code. Typing around that trap is strictly more machinery than not having it.
**Seed data is about the end state**, which is exactly what one verb expresses.

**`setRaw` is the escape hatch, and its name is the warning.** A deliberately inconsistent row — a
status the gates would never have produced, for an adversarial walk that wants to see how the UI
handles one — is a real need and a rare one. `setRaw({ status: 'in_progress' })` writes the field and
walks nothing. Nobody reaches for it by accident.

**A transition is not free, and the doc should say so where somebody will read it.** `set({ status:
'in_progress' })` on a quest seeds a relay, which mints operation items and work items. That is usually
what you want. When it is not, `filter` and `remove` take the extras back out.

**Setting a transition through a BROADCAST handle multiplies that cost by the row count.** The chain's
own worked example broadcasts a plain field this way — `all.set({ userRequest: 'seeded' })` — and that
call is cheap, because a plain field is simply written. `all.set({ status: 'in_progress' })` on a
transition field looks identical at the call site and is not: it is one full gate walk PER ROW, so
`all.set` on `add(10, …)` is ten real walks, each seeding whatever the gates seed. Nothing about the
two calls' shape says which cost a reader is paying.

### Every verb but `add` takes an object

```ts
q[0].set({ status: 'in_progress' })
s.all.withNestedChain({ depth: 2 })
q[2].saveRecordAs({ name: 'third' })
```

A scalar names no axis, so an ingredient growing a second transition field would need a second verb;
an object extends. Options accrue in the same place instead.

**`add(3, cb)` keeps the bare count**, because the count is the only thing `add` could ever mean and
`add({ count: 3 }, cb)` reads worse for nothing. Anything `add` grows later takes a third argument.

### `filter` selects rows that only exist at RUN time

**`add` knows its count at build time; `filter` cannot.** Transitioning a quest to `in_progress` mints
operation items, and how many is a fact about the gates, not about the recipe. So `filter` returns a
set with **no index access and no `add`** — the type says the count is unknown:

```ts
q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove()
```

| Part | Does |
|---|---|
| `where` | a match object, typed to that ingredient's fields. Data, never a closure — a predicate cannot cross the wire |
| `expect` | `'one'` · `'some'` (the default) · `'any'` |
| what you may then call | `set`, `setRaw`, `saveRecordAs`, `remove`, and that ingredient's extras |

**A filter's placeholder reference stays distinguishable from a real row's, because it uses a
disambiguator no real row can produce.** An `add`-created row's reference carries a pair of numbers —
which call minted it, and its index within that call. A `filter` has neither: it knows its ancestor
path and its ingredient, never a call count or a row count, since how many rows it matches is a
run-time fact the gates decide. So its placeholder's slot is a fixed WORD instead of a number pair,
and two separate `filter` calls sharing an ingredient and a scope derive the identical placeholder on
purpose — they describe the same live query, not two different ones. That word can never equal a real
row's number pair, which is what keeps an added row and a same-scope filter's placeholder apart even
when nothing else about them differs.

**`expect` reuses the tool's own no-pick rule.** `siegelense` already refuses an ambiguous DOM target
and throws naming the candidates, and refuses a zero match naming near misses. A filter is the same
question one layer down, so it answers the same way: **`expect: 'some'` is the default and a zero match
THROWS**, because a filter matching nothing almost always means the row you meant to reach was never
there — and silently doing nothing is how that becomes a defect report against working code.

**A `filter` inside a nested `add` is scoped to its immediate host, never the whole instance.**
`q[0].operations.filter({ where: { role: 'riftcarver' } })` matches only operations under `q[0]`. The
`filter` op carries `scope`, the host's row reference, and the runner matches only rows whose ancestor
chain contains it. The alternative — matching every row of that ingredient anywhere in the instance —
makes a recipe holding two guilds delete rows belonging to a parent it did not create, which is worse
than the ambiguity it would replace.

**A top-level `filter` — called directly on `dm.<ingredient>`, with no ancestor `add` around it —
carries no `scope` and matches the WHOLE INSTANCE.** `dm.operations.filter({ where: { role:
'riftcarver' } }).remove()` removes every matching row of that ingredient in the whole plan, across
every guild it holds, not only the first. The scope a `filter` carries is its host's row reference, and
a top-level call has no host — there is nothing to narrow it to, so it stays instance-wide. A plan
holding two guilds, each with its own riftcarver operation, loses BOTH to a single top-level filter of
this shape.

### A recipe takes typed inputs, so it can stack on what an EARLIER STEP made

**Parenting inside one recipe is structural, and parenting across two seed steps is a parameter.**
Those are different problems and they get different answers.

Inside a recipe, `g[0].quests` says what these quests hang off, and nothing needs passing. But a batch
that seeds a guild, drives the page, and then seeds a session under that same guild has crossed a step
boundary — the guild's id did not exist when either recipe was written. So a recipe declares what it
needs:

```ts
export const sessionWithNestedChain = recipe(
  {
    name: 'session-with-nested-chain',
    description: 'one session under an existing guild, holding a nested sub-agent chain',
    inputs: z.object({ guildPath: guildPathContract }),
  },
  ({ guildPath }) => [
    // the session ingredient links to its guild via `cwd`, not `guildId` — see "This repo's
    // `session-with-nested-chain` declares `guildPath`" above
    dm.sessions.under({ cwd: guildPath }).add(1, (s) => [
      s[0].withNestedChain({ depth: 2 }),
      s[0].saveRecordAs({ name: 'nested' }),
    ]),
  ],
);
```

**A recipe declares its inputs as a zod schema, under `inputs`.** One declaration serves three
readers: `recipes {}` prints the line off it, the builder's parameter type infers from it with
`z.infer`, and a `seed` step's `params` are parsed through the same schema before anything is seeded.
A recipe with no `inputs` takes no `params`.

and the batch supplies it from an earlier step's output:

```jsonc
{ step: 'seed', recipe: 'session-with-nested-chain', params: { guildPath: '{g.guild.path}' }, as: 's' }
```

**Inputs go in their own `params` object, never flattened onto the step.** A recipe input named `as`,
`step` or `recipe` would shadow the step's own keys, and the collision is silent.

**A recipe that silently requires a prior seed step is the ordering folklore that kills a step
catalogue.** A declared input is the fix, and it keeps the listing honest: `recipes {}` prints what each
one needs before anything has been seeded, because the input type is static data like everything else
on a plan.

### Every chainable, with an example

**Every snippet below is copied out of
`packages/hydration/test/type-fixtures/positive/every-chainable.ts`.** A real TypeScript program
compiles it: `typescriptProgramDiagnosticsAdapter`'s "the positive fixture tree" test asserts the file
produces zero diagnostics. None of them is an example nobody ran.

**Every field value is branded, parsed off the ingredient's own `fields` contract** —
`questFieldsContract.shape.title.parse('The running one')`, never a bare string. A plain literal does
not compile against a real ingredient.

```ts
const dm = registry({ guilds: guildIngredient, quests: questIngredient, sessions: sessionIngredient });
```

**`add(n, build)`** — creates n rows. The builder receives a TUPLE of handles and `all` as a second
argument.

```ts
dm.guilds.add(1, (g) => [
  g[0].quests.add(2, (q, all) => [
    all.set({
      userRequest: fromSavedRefTransformer({
        name: SavedRecordNameStub({ value: 'origin' }),
        field: FieldNameStub({ value: 'sessionId' }),
      }),
    }),
    q[0].set({ status: 'underway', title: questFieldsContract.shape.title.parse('The running one') }),
  ]),
]);
```

**`set({ … })`** — writes a plain field. A field named under `transitions` is WALKED instead, through
the real gates.

```ts
g[0].set({ name: guildFieldsContract.shape.name.parse('Siege') }),
q[0].set({ status: 'underway', title: questFieldsContract.shape.title.parse('The running one') }),  // status is walked
```

**`setRaw({ … })`** — writes the field and walks nothing. For a row the gates would never have
produced, which an attack walk sometimes wants.

```ts
q[1].setRaw({ status: 'finished' }),
```

A transition `set()` following a `setRaw()` passes the raw value to `reach` as `from`. If the raw value cannot reach `to` under the ingredient's transition graph, `reach` refuses and the runner raises `HydrationTransitionRefusedError`. The framework does not check `from` against `transitions.to` (which lists only target states); path feasibility belongs to `reach`.

**`filter({ where, expect })`** — selects rows that exist at RUN time. No index, no `add`. `expect`
defaults to `'some'`; the contract also accepts `'one'` and `'any'`.

```ts
g[0].quests.filter({ where: { status: 'queued' } }).remove(),
```

**`remove()`** — deletes a row, or every row a filter matched.

```ts
q[1].remove(),
g[0].quests.filter({ where: { status: 'queued' } }).remove(),
```

**`saveRecordAs({ name })`** — that row's WHOLE record joins the plan's output, server-assigned fields
included.

```ts
g[0].saveRecordAs({ name: 'guild' }),
s[0].saveRecordAs({ name: 'origin' }),
```

**`fromSaved`, as `fromSavedRefTransformer({ name, field })`** — a cross-link to a row the tree cannot
reach. A plain field's type is `F[K] | SavedRef`, so this compiles with no cast — see *"What the type
suite proves, and what it changed"* below for the ruling that closed that gap.

```ts
g[0].sessions.add(1, (s) => [s[0].saveRecordAs({ name: 'origin' })]),
g[0].quests.add(2, (q, all) => [
  all.set({
    userRequest: fromSavedRefTransformer({
      name: SavedRecordNameStub({ value: 'origin' }),
      field: FieldNameStub({ value: 'sessionId' }),
    }),
  }),
]),
```

**`under({ … })`** — supplies a link from a recipe INPUT rather than from an ancestor. The fixture
stands a literal in for that input, since nothing in it runs inside an actual `recipe()` call:

```ts
dm.quests.under({ guildId: questFieldsContract.shape.guildId.parse('guild-1') }).add(1, () => []);
```

A real recipe reads `guildId` off its own typed `inputs` in exactly this spot instead of a literal —
`recipe`'s `build` argument is `(input) => readonly Op[]`, where `input` is inferred from `inputs`.

**An ingredient's `defaults` are applied AFTER `under()`, and silently overwrite whatever field the two
share.** `under({ guildId })` puts `guildId` into the row's fields first; `defaults(index)` is spread on
top of it. So a `defaults` that also names `guildId` wins, and the caller's own input is gone with
nothing to say so. Give `under()` and `defaults` different fields, or the value the caller supplied is
not the value the row gets.

**An ingredient's own EXTRA** — whatever that ingredient declared, and nothing else has it.

```ts
g[0].sessions.add(1, (s) => [
  s[0].withNestedChain({ depth: nestedChainArgsContract.shape.depth.parse(2) }),
]),
```

**`saveRecordAs` saves the RECORD, not an id.** The record is the row as it exists after creation, so
the ids come along inside it. One mechanism rather than two: a `saveIdsAs` next to it would be a second
name for a subset of the same thing, and callers would have to learn which one carries the slug.

**The record `saveRecordAs` saves is a snapshot taken at the moment the row is CREATED, not a live view
of it.** Nothing later updates it: a sibling ingredient appending to the same underlying file, or a
later `set` on the same row, changes what is on disk without changing what the plan already saved. The
two diverge from that point on, and nothing about the call site says so.

**The ruling: a snapshot, and this document says so here, for two reasons.** It is what a plan can
honestly promise without re-reading every saved row at the end — which would demand a query route on
every ingredient that saves — and a snapshot is predictable, where a live view only raises the same
question again: as of when?

**The consequence for a recipe author: read a value written after a row was saved back from the target,
never off the plan's output.** A real recipe already does exactly this, for exactly this reason —
`quest-advances-one-step`'s own integration test reads its quest's operation ledger off the real file on
disk rather than off the saved record, because the ledger keeps changing after the row that holds it was
saved.

**A saved name is a KEY, and the save behind it is last-wins, silently.** Two different rows can land
under one name — `all.saveRecordAs({ name })` on a broadcast handle saves once per row under that same
name, and two rows named alike by hand do the same thing. Nothing refuses either at build time or in
the pre-flight: the plan's output holds exactly one entry per name, and it is whichever row saved LAST.
Treat a name as a label for the one row you chose to keep, never as a bucket a set of rows can share.

**No chainable reaches a row that already exists.** `add` mints new rows; `filter` matches rows this
ingredient's target already holds; `fromSaved` names a row `saveRecordAs` saved earlier IN THIS PLAN;
`under` supplies a link for a row being CREATED, from a recipe input. None of the eight reaches a row
a caller already holds an id for — including an id the live application minted, not this recipe. Real
callers need exactly that: appending a line to a session a dispatched agent is already driving, or
rewinding a quest's status by reading, modifying and rewriting a file the real server wrote. See
`scrolls/seigelense/plans/recipes-seeding-survey.md` finding 2 for the call sites. This is a hole in
the chain, not something solved elsewhere in this document.

Everything together, exactly as `every-chainable.ts` builds it:

```ts
export const everyChainable = dm.guilds.add(1, (g) => [
  g[0].set({ name: guildFieldsContract.shape.name.parse('Siege') }),
  g[0].saveRecordAs({ name: 'guild' }),

  g[0].sessions.add(1, (s) => [
    s[0].saveRecordAs({ name: 'origin' }),
    s[0].withNestedChain({ depth: nestedChainArgsContract.shape.depth.parse(2) }),
  ]),

  g[0].quests.add(2, (q, all) => [
    all.set({
      userRequest: fromSavedRefTransformer({
        name: SavedRecordNameStub({ value: 'origin' }),
        field: FieldNameStub({ value: 'sessionId' }),
      }),
    }),
    q[0].set({
      status: 'underway',
      title: questFieldsContract.shape.title.parse('The running one'),
    }),
    q[1].setRaw({ status: 'finished' }),
    q[1].remove(),
  ]),

  g[0].quests.filter({ where: { status: 'queued' } }).remove(),
]);
```

**A production recipe wraps exactly this builder.** `recipe({ name: 'guild-mid-execution',
description: '…' }, () => [ …the array above… ])` — `recipe`'s own second argument takes this same
`(input) => readonly Op[]` shape, so nothing about the chain changes inside a real recipe; only the
name, the description and the wrapper are added.

### A plan is data, and one plan runs three ways

**The chain builds; it does not execute.** Callbacks run at BUILD time, so a recipe call materialises the whole plan as
data before anything touches disk or opens a socket.

```ts
const plan = guildMidExecution();      // data — printable, listable, never touches anything
await run(plan, { home, baseUrl });    // a siege walk, or an end-to-end spec
await run(plan, { home });             // a Jest integration test — write routes only
```

| Caller | Hands the runner | Gets |
|---|---|---|
| a siege walk | the instance's throwaway home and the lane's base URL | every route |
| an end-to-end spec | the spec's home and Playwright's `baseURL` | every route |
| an integration test | `installTestbedCreateBroker`'s temp dir, no base URL | write routes only |

**A caller with no base URL can only run ingredients that declare a write route, and the types say so.** That is what lets
integration tests into the catalogue at all, and it is why the route lives on the INGREDIENT rather than on the recipe — a
recipe forced to pick one route can serve only the callers that offer it.

**A plan being data is also what removes the hand-written summary sentence.** The listing prints the plan. There is
nothing for a description to drift from, because the thing described and the thing run are one object.

### Determinism is structural, not a rule to remember

Most of this design works by comparing two readings and calling the difference a finding, so a value that varies for a
reason nothing in the walk caused reads as a defect. `siegelense-recipe-roles.md` Part 4 has the full
table of what must be reproducible and what each one breaks as.

**The chain owns the index and hands it to `defaults(i)`.** An ingredient never sees a clock and never sees a random value, so
the same plan run twice produces the same bytes — which is what keeps a baseline comparable across instances and keeps
`pixelChange` able to reach zero.

**An ingredient must not call `Date.now()`, `Math.random()` or `crypto.randomUUID()` for anything that reaches a screen.**
With the index supplied, the only way to break determinism is to reach for one of those, so the enforcement is one lint
rule over one folder rather than a convention repeated in every recipe.

### Routes: how an ingredient makes its state

**A route says how the state gets made, and each carries a different risk:**

| Route | Means | Risk |
|---|---|---|
| `api` | calls the real code path — `POST /api/guilds`, and the server does what it really does | none; this is the honest one |
| `write` | writes storage directly, in the shape the app WOULD have made | **it can drift from what the app actually writes** |
| `recording` | replays something captured from a real run | the only one that cannot lie about shape |

**A `write` route must declare `copies:`** — the production code whose output it imitates. Without the pointer, every
diagnosis of a broken ingredient opens with a hunt for the counterpart. The live example: a web harness hand-appends the
`event-outbox.jsonl` line that `questPersistBroker` writes in production, so that ingredient reads
`copies: 'questPersistBroker'` and a diagnosing agent starts there instead of guessing.

**An ingredient may declare BOTH `api` and `write`, and most should.** The target picks; the caller does not.

**Four chain verbs reach a row that already exists, and the table above names only how a row gets
MADE.** `q[1].remove()` and `filter(…).remove()` need a DELETE; `filter({ where, expect })` needs a
QUERY — *"the query fails mid-plan"* is already a sad-path row below, so the framework certainly
queries; `filter(…).set({ text: 'noop' })` needs an UPDATE on a row the create route did not just
make, and so does a `set` that cannot be folded into the create call.

**The resolution: `routes` gains three optional entries — `query`, `update` and `remove`.** A plan
calling a verb whose ingredient does not declare the matching route is refused in the PRE-FLIGHT,
naming the ingredient and the verb, and a dedicated error class carries that refusal.

**Two alternatives lose.** Re-calling the create route with the merged fields is honest for a `write`
route and wrong for an `api` one, where a second `POST` makes a second row instead of updating the
first one. Refusing `remove`, `filter` and a non-foldable `set` outright would delete a worked example
this document already shows, under *"Every chainable, with an example"*.

**Two existing seeders already disagree about a `write` route's side effects, and the ingredient must
pick one.** `scrolls/seigelense/plans/recipes-seeding-survey.md` finding 8 has a Playwright-side quest
seeder that appends the `event-outbox.jsonl` line the way `questPersistBroker` does in production, and
a Jest-side one that writes the quest file and appends nothing. A quest ingredient has ONE `write`
route, so it commits to one of the two — and the choice is exactly the drift `copies:` exists to name:
whichever behavior the ingredient does NOT choose becomes the counterpart a diagnosing agent needs to
know it diverges from.

#### An ingredient for a FILE, and an ingredient for a DATABASE ROW

**The framework names neither files nor SQL, and a repo instantiates it once with its own TARGET
type.** Dungeonmaster keeps its state as JSON in a home directory; most repos installing this keep rows
in a database. `packages/hydration/test/type-fixtures/dm-target.ts` is the file-backed repo and
`sql-target.ts` is the database-backed one, and the chain over them is identical.

```ts
// a FILE-backed repo: its target is a home directory
export interface DmTarget { home: HomeDirectory; baseUrl?: Url }
const { ingredient, registry, recipe, run } = hydrationCreateBroker<DmTarget>();

// a DATABASE-backed repo: its target is a transaction
export interface SqlTarget { tx: { query: (sql: SqlQuery, params: readonly unknown[]) => Promise<SqlQueryResult> }; baseUrl?: Url }
const { ingredient, registry, recipe, run } = hydrationCreateBroker<SqlTarget>();
```

**A transaction as the target is what gives a database repo the rollback a throwaway home gives this
one.** A plan that dies halfway leaves nothing behind either way.

**A quest — state that lives in a file:**

```ts
export const questIngredient = ingredient({
  name: 'quest',
  description: 'one quest under a guild, at whatever status you set it to',
  fields: questFields,
  record: questRecordContract,
  links: [{ of: 'guild', as: 'guildId' }],
  transitions: {
    field: 'status',
    to: ['queued', 'accepted', 'underway', 'finished'],       // 'stalled' is deliberately absent
    reach: ({ from, to, target, record }) => walkQuestStatus({ from, to, target, record }),
  },
  routes: {
    // through the app: gates run, the relay seeds, work items appear
    api: async ({ target, fields }) => httpPost({ target, path: '/api/quests', fields }),
    // the same end state, written into the home directory with no server involved
    write: async ({ target, fields }) => hydrate({ target, fields }),
  },
  copies: 'questPersistBroker',
});
```

**A post — a row with a foreign key:**

```ts
export const postIngredient = ingredient({
  name: 'post',
  description: 'one post owned by a user, at whatever status you set it to',
  fields: postFields,
  record: postRecordContract,
  // `links` IS the foreign key: `authorId` is the column, `user` is the referenced row
  links: [{ of: 'user', as: 'authorId' }],
  transitions: {
    field: 'status',
    to: ['draft', 'scheduled', 'published'],                  // 'takendown' needs a moderator, not a seed
    reach: ({ from, to, target, record }) => walkPostStatus({ from, to, target, record }),
  },
  routes: {
    // through the app: validation, a slug, a search-index write, an audit row
    api: async ({ target, fields }) => httpPost({ target, path: '/api/posts', fields }),
    // a straight INSERT: none of that happens. This is the trade `write` exists to name
    write: async ({ target, fields }) => insert({ target, table: 'posts', fields }),
  },
  copies: 'PostService.create',
});
```

| | the file repo | the database repo |
|---|---|---|
| target | a home directory | a transaction |
| `write` does | writes JSON through the hydrator | one `INSERT` |
| `api` does | `POST /api/quests` | `POST /api/posts` |
| `links` means | a field on the written JSON | a FOREIGN KEY column |
| what `write` skips | the gates, the relay seed, the work items | validation, the slug, the search index, the audit row |
| rollback | throw the home away | roll the transaction back |

**`links` and a foreign key are the same idea, which is why one mechanism covers both.** A comment
carries two of them — the post it hangs on and the user who wrote it — so its accessor appears under a
post and NOT under a user, because a user alone cannot supply a `postId`. That is enforced by the
types, and a negative case proves it.

```ts
blog.users.add(2, (u, all) => [
  all.set({ displayName: 'seeded' }),
  u[0].posts.add(3, (p, everyPost) => [
    everyPost.set({ body: 'lorem' }),
    p[0].set({ status: 'published' }),          // walked
    p[1].setRaw({ status: 'takendown' }),       // written, no walk
    p[0].comments.add(1, (cm) => [cm[0].set({ body: 'first' })]),
  ]),
]);
```

#### An ingredient with only one route, and what it costs

**In THIS repo every entity has a write route, and that was checked rather than assumed.**
`guildAddBroker` mints the id with `crypto.randomUUID()` and the slug with `nameToUrlSlugTransformer`,
and it touches no server — so the guild ingredient declares `write` with
`copies: 'guildAddBroker'` exactly as the quest declares it with `copies: 'questPersistBroker'`. **Do
not write an api-only guild ingredient.** The integration half of the migration needs guilds, and an
api-only one would shut it out of the cheap environment for no reason.

**But the one-route case is real in general, and the framework must handle it**, because a consumer
repo will have an entity only its server can mint — anything whose id comes from a database sequence or
an external service.

**A plan runs without a server only if EVERY ingredient in it declares a `write` route.** That is an
ALL, not an ANY, and the distinction is the whole point: a plan whose ingredients each declare both
routes runs serverless, and one containing a single api-only ingredient does not, however many of the
others are writable.

**So the `routes:` line in a listing reports what the plan REQUIRES, not the union of what its
ingredients offer.** A union answers "which routes appear anywhere", which is a different question and
always a more optimistic one. The honest line is one of two values:

| The listing prints | Means |
|---|---|
| `runs serverless` | every ingredient in this plan has a `write` route |
| `needs a server: <ingredient>` | at least one does not, and this is which |

**The runner refuses that mismatch before it seeds anything**, naming the ingredient and the missing
route — not partway through with half a plan on disk.

**A diagnosis is bounded by which route failed:**

| Failed route | The diagnosis is |
|---|---|
| `api` | the real code path changed — a route, a payload contract, a status. Read the handler |
| `write` | find the `copies:` target and diff what it writes NOW against what the ingredient writes. It is a copy that stopped matching |
| `recording` | the recording is of a version that no longer exists. Re-capture, do not patch |

### Every ingredient carries a test, and a two-route ingredient tests its routes against each other

**Every ingredient has a colocated integration test that runs it and asserts what it made.** Without one, an ingredient that rots
is discovered by whichever planner next happens to need it, with a broken ingredient and no idea what broke it. With one, the
commit that changed `questPersistBroker` fails that ingredient's test in the same ward run, next to the diff that did it.

**An ingredient declaring both routes runs both and compares them.** That is the sharpest form the test can take, and it is
available for free: the `write` route's whole declared risk is drifting from what the app really writes, and the `api`
route IS what the app really writes. A snapshot pins the ingredient to a shape somebody typed; a two-route comparison pins it
to what production emits and fails the moment they diverge.

**Three layers, and each catches something the others cannot:**

| Layer | Asks | Runs |
|---|---|---|
| the ingredient's integration test | does this ingredient still do what it claims? | every ward, on the commit that broke it |
| the planner's prelude run | do these recipes COMPOSE, and does the sequence reach THIS path's entry? | plan time, per path |
| the walk itself | is the state actually usable for what the path does? | round time |

**The middle layer does not become redundant.** An ingredient test proves the ingredient is correct. It cannot prove that is what
PATH 3 needs — an ingredient can be perfectly correct and simply be the wrong ingredient for a path — and it cannot prove
composition, because three ingredients that each pass alone still fail in sequence when one leaves state the next does not
expect. **The split is correctness versus fitness.** The test owns correctness and owns it continuously. The planner
owns fitness for a specific walk, which no test can know.

**Cost, or nobody will run it.** A `write` route is pure `fs` and tests cleanly under `installTestbedCreateBroker` with
its own temp dir. **An `api` route's real cost is not a slow boot** — a server built as an in-process application
object, with no port and no socket, boots in milliseconds. The cost that is real is Jest's own boundary: there is no
setup shared across test files, each file gets its own worker and module registry, and a booted app can only be
reused within one file's own `beforeAll`. So the `api` routes still share ONE instance for the whole suite, but the
reason is Jest's file boundary, not an instance-boot cost that N separate boots would make slow. The `write` routes
need no instance at all.

### What the type suite proves, and what it changed

**The types were the risk in this design, so they were built and compiled before the doc described
them.** `packages/hydration/test/type-fixtures/` is where that proof lives now: a `positive/` tree that
compiles with zero diagnostics, and `declaration/` and `call-site/` trees where every fixture carries
exactly one deliberate error. Each is graded by a real `ts.createProgram` run inside
`typescriptProgramDiagnosticsAdapter`, and the grading test asserts the EXACT diagnostic — file, line,
code and message — so a rule that quietly stopped working does not pass quietly: the expected diagnostic
vanishes and the assertion fails.

**It covers TWO repos, not one — but only one is proven through every chainable.** `dm-target.ts` is a
file-backed repo (dungeonmaster's own guilds, quests, operations and sessions); `sql-target.ts` is a
database-backed one (users, posts and comments behind foreign keys). `positive/every-chainable.ts`
exercises every chainable over the FILE-backed repo only, and the doc's examples above are copied out
of it. **Nothing positively exercises every chainable over the database-backed repo the same way** —
`sql-target.ts`'s ingredients are used only by the negative fixtures that need its particular shape
(a grandchild with two links, `u[0].comments`). This is open work, not a decision; see the gaps below.

**Each rule is proven by a negative fixture whose exact diagnostic is pinned**, which is mutation-tested
by construction rather than by a one-time pass someone has to remember to re-run: widen the rule and the
pinned diagnostic disappears, so the very next ward run fails the assertion in that fixture's name.

| Break | Caught by |
|---|---|
| widen `transitions.to` so `blocked` becomes reachable | the unreachable-transition case |
| make `Tuple` always degrade to an array | the out-of-bounds case |
| drop the child accessor's IMMEDIATE-PARENT condition | `q[0].sessions` |
| drop the child accessor's ALL-LINKS-SATISFIED condition | `u[0].comments` on the database repo |
| drop `Matched`'s restriction so a filtered set gains `add` | the filter-has-no-add case |

**What the compiler enforces**, each proven by a case that fails without it:

| Rule | Proven by |
|---|---|
| `q[3]` after `add(3, …)` | out-of-bounds index |
| an unknown field in `set` | `set({ nope: 1 })` |
| a status outside `transitions.to` | `set({ status: 'blocked' })` |
| a value that is not a status at all | `set({ status: 'nonsense' })` |
| an extra the ingredient never declared | `withNestedChain` on a quest |
| a wrongly typed argument to an extra | `withNestedChain({ depth: 'two' })` |
| a child accessor on the wrong host | `q[0].sessions` |
| indexing a filtered set | `filter(…)[0]` |
| `add` on a filtered set | `filter(…).add(…)` |
| a bad `expect` value | `expect: 'exactly-two'` |
| an unknown field in `where` | `filter({ where: { nope: 1 } })` |
| a recipe input of the wrong type | a bare string where a branded `GuildId` is wanted |
| a recipe called with no input when it needs one | `sessionWithNestedChain()` |
| a seed step missing its `params` | over the in-process union |
| a seed step with the wrong `params` shape | over the in-process union |
| `params` on a recipe that takes none | over the in-process union |
| a seed step naming an unknown recipe | over the in-process union |

**Two rows above are real refusals whose wording teaches nothing.** An undeclared `extra`
(`withNestedChain` on a quest) and a child accessor that cannot exist at that position — skipping its
immediate host, or a leaf ingredient reaching for a level it has no children at — are both enforced by
the type system alone, and both fire correctly. What a caller actually sees is TypeScript's own
diagnostic, and it names the symptom rather than the rule: the undeclared extra reads `TS2722: Cannot
invoke an object which is possibly 'undefined'`, and the impossible accessor reads `TS2532: Object is
possibly 'undefined'` — neither names the verb, the ingredient, or which rule is being enforced, unlike
`set({ nope: 1 })`'s `TS2353`, which names the bad field literally. A caller reading either message in
isolation has no way to tell which call was wrong without opening the file at the reported line.

**Four things the design got wrong on paper and the compiler caught:**

| What broke | What it forced |
|---|---|
| parent and child each referencing the other | `TS7022` — an inference cycle, and every type downstream degrades to `any`. Links name the parent by NAME, and a registry inverts them |
| `all` as a property beside the handles | `Tuple<T, N> & { all: T }` silently loses the out-of-bounds check. `all` became `add`'s second builder argument |
| a child accessor requiring only that its links be satisfiable | that puts `sessions` on `q[0]`, since a quest's ancestors include a guild. The host must also be named in the child's own links |
| `Target` typed as `{ home, baseUrl }` inside the framework | that is dungeonmaster's shape sitting in a package that SHIPS. A repo now instantiates the framework once — `hydrationCreateBroker<SqlTarget>()` — and the framework names neither files nor SQL |

**A second probe found a whole axis the first one missed.** The chain's negatives guard the CALL SITE.
Nothing guarded the DECLARATION — an ingredient written wrong, before any recipe touches it. Ten
malformed declarations were written and **all ten compiled clean**:

| # | The malformed declaration | Caught now? |
|---|---|---|
| 1 | `transitions.field` naming no field | yes |
| 2 | `transitions.to` holding a value that field cannot take | yes |
| 3 | a `write` route with no `copies:` | yes |
| 4 | no routes at all | yes |
| 5 | an extra named `set` | yes |
| 6 | an extra named `remove` | yes |
| 7 | `defaults` returning a field that does not exist | yes |
| 8 | `links.as` naming no field | yes |
| 9 | `links.of` naming an unregistered ingredient | yes, at `registry()` |
| 10 | two ingredients sharing a `name` | **no — runtime check** |

**Nine of the ten are now compile errors**, one fixture per row under
`packages/hydration/test/type-fixtures/declaration/`, each pinned to its exact diagnostic. The tenth —
two ingredients sharing a name inside one registry — is not expressible in the type system and is a
runtime check instead: `registryCreateBroker` throws `RegistryDuplicateNameError`, naming both keys,
right beside the `RegistryDanglingLinkError` that catches row 9's dangling `links.of` the same way.

**One smaller finding: the `const` modifier on `add`'s count is unnecessary.** A type parameter
constrained `extends number` already infers the literal from a numeric-literal argument — measured by
dropping it and watching the suite stay green. It is harmless to keep and misleading to cite as the
reason the tuple works.

### The sad paths, which no type catches

**Two different classes of wrong, and only one of them is a type error.** A malformed declaration and a
bad call site fail at compile time, and the type-fixture suite covers both. Everything below fails
while the plan is RUNNING, against a real server and a real disk, and no amount of typing touches any
of it.

**Every one of these must fail LOUDLY and name what it was doing.** A seed that fails quietly is the
worst outcome this design has: the walk starts against a state nobody intended, reports a defect that
does not exist, and a fixer goes hunting in working code.

| What fails | Where | What must happen |
|---|---|---|
| the connection is refused | an `api` route | halt before the next op. Name the ingredient, the route and the URL |
| the server answers 4xx or 5xx | an `api` route | halt, **and carry the response body verbatim** — that body is usually the real diagnosis |
| the server answers 2xx with a shape `record` rejects | an `api` route | halt and name the field. A silently wrong record poisons every `fromSaved` and every link after it |
| the route answers with a shape `record` rejects | a `write` route | halt and name the field, exactly as an `api` route's bad shape does — a `write` route's bad record poisons every saved record and every link the same way |
| the write fails — `EACCES`, `ENOSPC`, a read-only mount | a `write` route | halt. Name the path, not just the errno |
| the parent directory does not exist | a `write` route | **create it.** A missing parent is the siegelense socket bug one layer over: binding under an absent directory failed as `EACCES`, not `ENOENT`, and three sessions read it as permissions |
| `reach` throws — the gates refused the transition | a transition | halt. Name `from`, `to`, and what the gate said. "Cannot go to in_progress from created" is a real answer; a stack trace is not |
| the query fails mid-plan | `filter` | halt, and say so DISTINCTLY from "matched zero rows". One is the app being unreachable, the other is the row not being there |
| the transaction rolls back | a database repo | the whole plan is undone. Report which op triggered it. **Nothing inside the framework throws this** — the framework names neither files nor SQL and does not own the transaction. The target IS the transaction, so the repo's own wrapper around `run()` throws it |
| two ops race the same file | a file repo | this repo already has the case: `guildHarness` deletes sequentially because "concurrent DELETEs corrupt config.json (race on read-modify-write)". **The runner is serial, and that is a requirement, not an implementation detail** |
| the recipes package was never built | discovery | say exactly that. **Never report an empty list** — a session cannot tell "you have written none" from "you have not built it" |
| a recipe's params fail validation | the `seed` step | refuse before seeding anything. Name the bad input and list what that recipe takes |

**Diagnosing what a route threw asks what the thrown value LOOKS like, never what it is an instance
of.** An error minted by the runtime's own machinery — a refused connection, a filesystem errno — is
not reliably recognised by `instanceof` across a test boundary, because each test file gets its own
copy of the built-in constructors. Every classification above reads shape off the caught value instead
— a `code`, a `path`, a `status` — which is what makes it work whether the error crossed a real socket,
a real filesystem call, or a test file that built one by hand.

**A half-run plan is the case that needs a decision, not an apology.** Where the plan runs against
something throwaway — a fresh instance's home, a database transaction — the answer is easy: discard it,
nothing is left behind. The framework implements no undo and must not, because half-undoing is worse
than a dirty tree nobody trusted.

**But `seed` is a STEP, and a mid-batch seed runs against a LIVE instance the walk is already using.**
There is nothing throwaway about that instance and nothing to roll back to. So:

> **A mid-batch seed that fails HALTS the batch and marks the instance unusable.** The walk does not
> continue. A partially seeded live instance is exactly the state that manufactures false defects, and
> letting the remaining steps run against it turns one failure into a round's worth of wrong findings.

**Re-running a failed seed is not safe and the tool should not offer it.** Some ops landed and some did
not; a second run stacks new rows on top of the first attempt's. Start a fresh instance instead.

### Two kinds of probe, and neither substitutes for the other

| Probe | Catches | Runs | Lives in |
|---|---|---|---|
| the type suite | a malformed declaration, a bad call site | every ward, in milliseconds | `packages/hydration/test/type-fixtures/`, graded by the packages' own tests |
| a sad-path run | a refused connection, a failed write, a gate that says no | only against a real server and a real disk | integration tests, and the combinatorial rounds |

**A green type suite says nothing about any row in the table above**, and it is worth writing that down
because the type work is visible and thorough and reads like coverage. It is coverage of one axis.

### The combinatorial planning session, and what it works from

**This is its own session, not a step inside a build chunk.** Every verb has a worked example and every
one compiles; that says nothing about what happens when they compose. The session's job is to find what
this document did not anticipate, and to write each finding back INTO this document rather than working
around it.

**It opens from the two tables below, not from a blank page.** A session told "go try combinations"
tries the ones it thought of first, which are the ones already written down.

#### Table 1 — what an ingredient MUST have, and what it MAY have

| Property | Must / may | If it is absent | If it is wrong |
|---|---|---|---|
| `name` | must | the config does not compile | a duplicate name across one registry is **caught by nothing today** — a runtime check at `registry()` |
| `description` | must | does not compile | a vague one degrades the listing and nothing reports it. **A round should read every description and ask whether a session could choose from it alone** |
| `fields` | must | does not compile | a contract narrower than the real entity makes a legal `set` impossible; wider makes an illegal one compile, and the extra field travels — a `write` route receives it in full and, wherever nothing rejects it, persists it, while the framework's own `record`-parsed result projects the extra away, so the value that comes back hides that it ever arrived |
| `record` | must | does not compile | a record that omits a field the server really returns is stripped at create with no error — the create route's own parse against the narrowed contract silently drops any key it does not carry — and a later `fromSaved` naming that field is refused at pre-flight, before anything is on disk: `HydrationSavedFieldMissingError` names the saved record, the missing field, and every field its record does declare |
| `routes` | must, at least one | does not compile | an `api`-only ingredient is unreachable from an integration test, and nothing says so until the run |
| `links` | may | the row has no parent and appears at the top level | a wrong `as` does not compile; a wrong `of` fails at `registry()` |
| `transitions` | may | the field is written, never walked | a `to` list missing a state makes that state unreachable by any caller; a `to` list too wide lets a caller ask for something the gates refuse, and that surfaces as a `reach` throw |
| `defaults` | may | every row gets identical fields — **the "two of anything" rule silently breaks** | a default that varies by anything but the index breaks byte-identity across instances |
| `copies` | must, with a `write` route | does not compile | `copiesTargetContract` refuses a value containing `/` at module load; a wrong pointer makes the two-route test assert against the wrong thing, and it PASSES |
| `extras` | may | the ingredient has only the built-in verbs | a name shadowing a built-in does not compile |

#### Table 2 — the rounds, and the question each one asks

**Round A — one property at a time: what if this does not work as intended?**

Take each row of Table 1 and ask it as a live question against a running instance, not as a thought
experiment. The ones most likely to pay:

- a `defaults` that returns the same value for every index — does anything notice, or does a walk just
  quietly lose the ability to tell two rows apart?
- a `record` missing a field the server really returns — where does that first hurt?
- a `to` list including a state the gates actually refuse — what does the caller see?
- a `copies` pointing at the wrong broker — does the two-route test still pass? (it should, which is
  the finding)

**Round B — nesting: what happens if there is a nest here?**

- three levels (guild → quest → operation) is proven at type level. **Four? Five?** Where does the
  ancestor chain stop resolving, and does it fail loudly or silently?
- an `add` inside an `add` inside an `add`, each with its own `defaults` — do the indexes stay scoped
  to their own `add`, as documented?
- a `filter` inside a nested `add` — decided: it sees only rows under its immediate host, never every
  row of that ingredient in the instance (see *"`filter` selects rows that only exist at RUN time"*). A
  round should confirm the runner actually enforces the scope it was given, not re-open the question
- an ingredient linking to a parent two levels up, skipping one

**Round C — composing the chainables, which is what the doc cannot have anticipated**

Each of these is a pair or a triple, and each has a plausible reading that is wrong:

| Combination | The question |
|---|---|
| `filter` over rows a `transition` in the same plan just minted | does the filter see them, and is the ordering guaranteed? |
| `saveRecordAs` on a row a later `remove` deletes | is the saved record stale, absent, or an error? |
| `fromSaved` pointing into a filtered SET rather than one row | which row does it mean? |
| `set` with a transition, then another `set` with a different transition on the same row | two walks, or one? |
| `setRaw` on a transition field, then `set` on the same field | does the second walk from the raw value, and is that value even a legal `from`? |
| `remove` on a parent whose children exist | are the children removed, orphaned, or does it fail? |
| two ingredients whose `links` name the same parent, under one `add` | ordering between them |
| `under()` with an id that does not exist | a refused plan, or a foreign-key error from the database |
| a transition whose gates mint rows another transition then removes | the count `makes:` reports |

**Round D — the sad paths from the table above, driven for real.** Stop the server mid-plan. Make the
home read-only. Hand `under()` a dead id. Each one is a row that must fail loudly and name what it was
doing, and the round checks that it does.

**What a round produces.** A finding goes back into this document as a rule, next to the verb it
concerns. A finding that is really a defect in the app gets an observable instead. **A round that
changes only the recipe to route around a finding has spent itself and recorded nothing.**

### Known gaps, named rather than discovered later

**These are open. None of them blocks building the framework, and each costs more the later it is
found.**

| Gap | What it needs |
|---|---|
| **A plan containing an `api`-only ingredient cannot say so before it runs.** Every real target (`DmTarget`, `SqlTarget`) leaves `baseUrl` optional and stops there | the plan should carry the routes it requires, so a targetless run is refused at the call rather than partway through, with half a plan on disk |
| ~~`fromSaved` is not typed against the field it lands in~~ **CLOSED** | `Settable<I>` types a plain field as `F[K] \| SavedRef`, so `fromSavedRefTransformer`'s result compiles straight into `set` with no cast. Only a TRANSITION field still refuses one — it narrows to the ingredient's own `to` union instead, which a cross-link cannot satisfy by construction |
| **A typed plan output is scheduled work, not delivered yet.** *"A plan is data, and one plan runs three ways"* requires the plan's output to carry `guild` and `target`, each typed to its own record contract, and today's plan returns an untyped record the caller casts | threading the saved names through every op producer's return type, so `saveRecordAs({ name })` types the plan's output as the chain builds. The requirement stands; only the delivery is pending |
| **A recipe cannot call another recipe.** There is `add` and there is `filter`, and no `include` | recipes will duplicate each other's openings within a week of two people writing them. `include(otherRecipe({ … }))` splicing the other plan's ops in, with its saved names namespaced |
| ~~**The CLI wire has no compile-time check at all**~~ **CLOSED** | siegelense cannot hold that schema itself — it may import neither `hydration` nor the recipes package — so the wire validation splits: siegelense refuses what the listing already tells it (an unknown recipe name, `params` on a paramless recipe, a missing or unknown-key `params`), and the recipe's own `inputs` schema, run in the recipes package's own process, refuses every value. Both land before the first write. See "Steps that are new" › `seed`, in Part 6 |
| **`recording` is declared and unexercised** | no ingredient in either real target set uses it, so nothing about it has been proven. **The `runs` line's write-only rule stands regardless**: the check asks only whether a `write` route is absent, so it reports `needs a server: <ingredient>` for ANY ingredient lacking one — not only a `recording`-only ingredient, but equally one declaring both `api` and `recording`. This is the cost of the rule, not a bug in it — named here for whoever first ships a `recording`-only ingredient |
| ~~**`copies:` has no valid target for a shape only an external tool writes**~~ **CLOSED** | a bare identifier names in-repo production code; an `external:` prefix names a producer outside the repo — `external:claude-cli` for the Claude CLI, the only writer of a Claude session transcript. `copiesTargetContract` in `packages/hydration` enforces the split, refusing anything containing `/`. The session and sub-agent ingredients are declared, both naming `external:claude-cli`. A two-route comparison needs an `api` route alongside the `write` route, so an ingredient with only the latter is never compared either way — the guarantee stands because there is no comparison to weaken |
| **Two lint rules Part 5 requires — an ingredient holds no DOM handle, and an ingredient calls no clock or random source — are UNBUILT, and no chunk owns either** | `no-hardcoded-package-names` in `local-eslint` is the template to copy, and its own blind spot is the caution to copy with it. Meanwhile neither constraint is enforced by anything: with the chain supplying the index, reaching for a clock is the only way left to break determinism |
| ~~Two ingredients may share a `name` inside one registry, and nothing catches it~~ **CLOSED** | not expressible in the type system, so `registryCreateBroker` checks it at runtime instead: `RegistryDuplicateNameError` throws naming both registry keys |
| ~~A `filter` inside a nested `add` has undefined scope~~ **CLOSED** | it is scoped to its immediate host. The `filter` op carries `scope`, the host's row reference, and the runner matches only rows whose ancestor chain contains it. The alternative — instance-wide — lets a recipe holding two guilds delete rows belonging to a parent it did not create |
| ~~No sad path is implemented or tested~~ **MOSTLY CLOSED** | most rows of the table above are now driven against real conditions: a genuinely refused socket, a real server answering an error with a real body, a real denied write, a real race on one file. **Two rows cannot be driven in this repo, and both reasons are structural, not neglect.** A gate refusing a transition is ingredient-specific business logic the framework owns no gates for by design, so only the recipes package can drive it for real. A transaction rolling back needs a real database engine, a schema with a real constraint, and a consumer's own wrapper that begins a transaction, catches the rejection, rolls back and throws — dungeonmaster's own state is files, so none of that has an honest home here, and nothing inside the framework throws it, deliberately |
| **A row added at TOP LEVEL whose `links` nothing supplies compiles clean** | `Entry<R>` (`{ [K in keyof R]: Collection<R, R[K]> }`) hands out a collection for every registered ingredient with an empty ancestor list, so `dm.quests.add(1, …)` at top level typechecks with no guild anywhere. The RUNNER must refuse it before the first write |
| **Production code mints uuids and timestamps that reach the screen** | `guild-add-broker.ts:35` and `quest-hydrate-broker.ts:88,131`. No lint rule over the recipes folder can reach them. Each painted value needs an override in production, or it is an observable against the app |
| ~~Nothing creates the recipes package in a consumer repo~~ **CLOSED** | `InstallRecipesScaffoldResponder` on the `siegelense` branch already does it, tested. It needs the rename, not a rewrite |
| **`ban-primitives` is off only for `**/@types/**`** | the framework's generic machinery needs `N extends number` and `of: string`, which that rule refuses everywhere else. `@dungeonmaster/hydration` needs its own entry in `eslint.config.js`, and the entry needs a comment saying why, or somebody deletes it |
| **A recipe composing two of this repo's own routes can span two different stores.** `guildWriteRouteBroker` registers a guild through `@dungeonmaster/orchestrator`'s `StartOrchestrator`, whose own brokers resolve their home off the GLOBAL `process.env.DUNGEONMASTER_HOME` rather than the `target` the route was handed, while `questWriteRouteBroker` writes its file straight to `target.home`. A recipe combining both kinds reads and writes two unrelated stores, and nothing in the pre-flight or the runner checks they agree | **This is an observable against this repo, not a framework rule** — the routes, not the design, disagree. The failure is inconsistent, which is what makes it dangerous: a caller that never sets the env var to match `target.home` gets a loud error in one shape and a silently empty result in the other, and a silently empty result is exactly what manufactures a false defect report against working code. The general rule it implies belongs beside *"Routes: how an ingredient makes its state"*: a route that reaches code resolving its own storage location escapes the target, and the isolation this design promises holds only while every route honours the target it is given |
| **The guild `write` route makes the guild's own directory before the guild is registered; the guild's own create path never does.** `guild-write-route-broker.ts:33` — `await fsMkdirAdapter({ filepath: filePathContract.parse(path) });` — runs before the call to `guildAddBroker`. `guildAddBroker` itself (`packages/orchestrator/src/brokers/guild/add/guild-add-broker.ts`) never mkdirs the guild's own `path`; its one `fsMkdirAdapter` call (line 41) makes the QUESTS directory under `guildsPath/<id>`, a different path entirely — a guild registered through `POST /api/guilds` is never given a directory at its own `path` at all | A test seeded through the `write` route can run against a guild whose own directory exists only because the seeder made it — a world neither `api` nor production could ever produce, since neither one creates that directory. A test seeded through `api`, and a real guild in production, get no such directory from the create call and must already have one. **The two-route comparison must not assert the directory's existence as a property both routes guarantee** — only `write` does. Whether the mkdir belongs in the route at all is a decision this document does not make |
| **A package the recipes depend on cannot have its own tests converted by importing them.** `siegelense-recipes` depending on `orchestrator` shuts every orchestrator-owned integration target out of this migration — see *"The migration IS the validation"* | not solved, descoped. Every repo installing this framework will have some package in this position, whichever one its own recipes call into. **Duplicating ingredients into the dependent package to dodge the cycle is rejected outright** — that is the exact duplication the recipes package exists to end |

### Mechanics the framework has to implement

**These are the answers a builder would otherwise invent, each differently.** They are decisions, not
discoveries, so they are written down rather than left to whoever gets there first.

**A plan is a TREE of ops, and the runner walks it depth-first in declaration order.**

| Op | Holds |
|---|---|
| `create` | the ingredient, the resolved fields, the index, the ancestor chain |
| `set` | the row it targets and the values, split into written fields and a transition |
| `remove` | the row it targets |
| `saveRecord` | the row it targets and the name |
| `filter` | the ingredient, the `where`, the `expect`, and the ops to apply to what it matched |
| `extra` | the row it targets, the verb name, and its args |

**An `extra` needs its own op kind, because it is a verb like any other.** *"Each becomes a method on
that ingredient's rows and on nothing else, taking one object typed by its contract"* — the same
requirement `set` and `remove` meet with an op of their own. `{ ref, verb, args }` is the smallest
shape that keeps a plan printable and keeps the runner's dispatch a single switch over `op`.

**Depth-first in declaration order is what makes the ancestor chain and `fromSaved` work at all**, and
it is the only ordering guarantee. Two sibling `add` calls run in the order they are written.

**The plan never crosses the CLI wire.** A `seed` step names a recipe and its params; siegelense builds
and runs the plan in its own process. So the plan's shape is an internal contract, and only the recipe
NAME, its params and its returned records are wire-shaped.

**`filter` reads live state, not the plan.** It queries whatever exists at that moment — rows an earlier
op created, rows a transition minted, rows that were already there. That is what makes it the answer to
"drop the riftcarver item the transition just seeded", and it is why the count cannot be known at build
time.

**A failed plan leaves nothing behind.** The mechanism is the repo's own: a file-backed repo runs
against a throwaway home the caller discards, and a database-backed repo runs inside the transaction on
its target. **The framework does not implement undo**, and must not — half-undoing is worse than a
dirty tree nobody trusted.

**The runner's refusals split into two groups, and conflating them is a bug.** A plan's SHAPE is known
before anything runs; a plan's RESULTS are not.

**Before the first write** — computed off the plan alone:

| Check | Message names |
|---|---|
| an ingredient needs a route this target cannot serve | the ingredient, the routes it has, and what the target lacks |
| a `fromSaved` names a record no op in this plan saves, or one declared LATER | the name, and the names that are saved |
| a row whose `links` no ancestor supplies — including one added at TOP LEVEL | the ingredient and the link it cannot fill |
| a chain call needs `query`, `update` or `remove` and the ingredient declares no matching route | the ingredient and the verb it cannot serve |
| a `set` asks for a transition value the ingredient's `to` never declared | the ingredient, the field, the value asked for, and the values the ingredient does declare |

**Mid-run** — they depend on what the app actually did, so no pre-flight can reach them:

| Check | Message names |
|---|---|
| a `filter` matched fewer rows than `expect` allows | the ingredient, the `where`, and what WAS there |
| a route threw | see the sad-path table above |

**A mid-run refusal leaves whatever already landed.** That is why a mid-batch failure halts the batch
and marks the instance unusable rather than pretending the plan can be unwound.

**Every error is an `errors/` class carrying the ingredient and the recipe name**, because a failure
inside a five-ingredient plan is unreadable without both.

### How siegelense finds recipes without importing them

**`siegelense` must list every recipe's name, description and inputs, and must not import
`hydration-recipes`** — an import would weld one repo's states into the published tool.

**The mechanism already exists in this repo.** The CLI discovers each package's install script by
globbing `packages/*/dist/startup/start-install.js` and dynamically importing it at run time. Recipe
discovery is the same move, one path over:

1. glob `packages/hydration-recipes/dist/index.js`
2. dynamically import it
3. read the manifest it exports — every recipe's `name`, `description`, input contract, and the routes
   its ingredients declare

**It reads COMPILED output, which means the recipes package must be built before a listing is honest.**
That is the same rule the install scripts already live under, and it belongs in the package's own
`CLAUDE.md` where a session editing a recipe will read it.

**An absent directory and an empty one must not report the same thing.** An empty `hydration-recipes`
returns an empty list, meaning *no recipes yet*. A missing one is an installation problem and says so.
That is the `count: 0` ambiguity this design keeps running into, and the listing is where it bites a
session hardest.

### Where each part lands in this repo's architecture

**A starting map, not a ruling.** The planner may move things; what it should not do is invent the
whole layout from nothing.

| Part | Folder type | Package |
|---|---|---|
| `IngredientConfig`, `Plan`, `Op`, `Target`, the recipe manifest | `contracts/` | `hydration` |
| the chain builder — `add`, `set`, `filter`, and the rest returning ops | `transformers/` | `hydration` |
| `createHydration`, `ingredient`, `registry`, `recipe` | `brokers/` | `hydration` |
| the runner that walks a plan against a target | `brokers/` | `hydration` |
| route helpers — an HTTP post, a file write | `adapters/` | `hydration` |
| the refusal errors | `errors/` | `hydration` |
| recipe discovery and the listing | `brokers/` | `siegelense` |
| the `seed` step and its params validation | `brokers/` | `siegelense` |
| scaffolding `packages/hydration-recipes/` in a consumer repo | `responders/install/recipes-scaffold/` | **`siegelense` — ALREADY BUILT** on that branch as `InstallRecipesScaffoldResponder`. Rename it; do not write a second one |
| each ingredient and each recipe | one folder each | `hydration-recipes` |

**The framework's generic type machinery needs `N extends number` and `of: string`, which
`ban-primitives` refuses.** That rule is off only for `**/@types/**`, so `hydration` needs its own entry
in `eslint.config.js` — with a comment saying why, or somebody deletes it.

### The migration IS the validation, not cleanup afterwards

**Converting the existing suites is how this design gets proven, and it is in scope for this work.** A
synthetic round exercises what somebody thought to write. Two hundred real tests exercise what the app
actually needs, across the three environments this design claims to serve — and a conversion that
cannot reproduce a test's setup has found a hole no invented example would have.

**Measured on this branch, 2026-09-16, by the script below — re-run it rather than trusting these:**

| | Files | Seed domain state | What they use |
|---|---|---|---|
| `*.e2e.ts` | 122, all in `web` | **118** | Playwright harnesses, every one |
| `*.integration.test.ts` | 129, across 14 packages | **17**, of which **16** seed domain state (one is a test OF the hydrator and is excluded below) | `installTestbedCreateBroker`; **most of the 16 are later descoped by the dependency cycle below — only 1 converts** |

**The other 104 integration tests are not conversion targets.** They take a temp directory from
`installTestbedCreateBroker` and never build a guild or a quest. Leave them alone; a migration that
touches them is spending itself on files that have no seeding to replace.

**Every figure above is produced by a script, not quoted from a session.** Run it:

```bash
python3 scrolls/tools/seed-census.py              # the census, plus the target FILE LIST
python3 scrolls/tools/seed-census.py --progress   # harness-identifier occurrences — see below
python3 scrolls/tools/seed-census.py --methods    # the running mark: per-method call sites, routing, direct writes
python3 scrolls/tools/seed-census.py --json       # the census, machine-readable
```

It prints every conversion target by path, separates the excluded test-of-a-`copies:`-target from the
rest, and counts the call sites each seeding harness still holds. **A figure nobody can re-derive is a
figure that rots**, which is why the counts in this section are a command rather than a number
somebody typed.

**`--progress` counts harness IDENTIFIERS, not seeding calls, so it cannot be the running mark.** An
import line, a `guildHarness({...})` construction and a lifecycle hook all match it, and the seeding
call usually does not — the common two-line form `const guilds = guildHarness({...});` then
`await guilds.createGuild({...});` counts the construction and is blind to the call beneath it. The
conversion this document specifies keeps every harness's name and call signature and replaces only a
method's body, so this count cannot fall as the conversion proceeds — not "will not reach zero," will
not move at all.

**`python3 scrolls/tools/seed-census.py --methods` is the running mark instead.** For every method on
the three seeding harnesses it reports the method's call sites, whether its body reaches
`dmRegistryBroker`, and whether it still calls a filesystem function or an HTTP verb directly. The
conversion is finished when that last column holds nothing beyond the methods
`scrolls/seigelense/plans/recipes-chunk-09-10-migration.md` names to stay raw — a row reached by a
bare id from outside the plan, an assertion, or a domain no ingredient covers.

**Three harnesses are almost the whole job.** Counted by call site across the e2e specs:

| Harness | Call sites | Becomes |
|---|---|---|
| `guildHarness` | 510 | the `guild` ingredient |
| `questHarness` | 259 | the `quest` ingredient |
| `sessionHarness` | 147 | the `session` ingredient |
| `navigationHarness` | 268 | **stays** — it drives, it does not seed |
| `environmentHarness` | 236 | **stays** — configuration, not state |

So the conversion is three ingredients against roughly 900 call sites, not thirty-five separate
rewrites. The rest of the harness tree keeps doing what it already does.

**Some conversion targets seed state no ingredient above covers, and at least one seeds no persisted
row at all.** `scrolls/seigelense/plans/recipes-seeding-survey.md` findings 4, 5, 6 and 9 name real git
worktree and branch state (a `git init`, a `worktree add`, real commits) behind several integration
targets; mock subprocess response queues behind the dispatch harness, which arms future answers rather
than making a row; a rate-limit harness writing files with no guild, quest or session shape at all; and
an MCP protocol driver that persists no row whatsoever, so no `write` or `api` route has anything to
produce. None of these has an ingredient today. **A test that cannot be converted is a finding, and it
gets written into this document** — these are that finding, named here so the conversion chunks do not
discover them one file at a time.

#### The order, and why each step proves something the last one could not

| Step | Scope | Environment | What it proves |
|---|---|---|---|
| 1 | the 16 non-excluded integration domain-seeders — in practice, the 1 outside `orchestrator` | files only, no server | the **`write` routes**, and that a plan runs with no `baseUrl` at all |
| 2 | the 118 e2e specs | a real server and a real browser | the **`api` routes**, and that one plan serves a caller with both |
| 3 | one manual siegelense round | a live instance, driven by hand | the **`seed` step, `recipes {}`, and the params validation** — the tool half, which neither suite touches |

**Integration first, even though it is the smaller half.** It is the cheap environment — no server, no
browser, seconds per run — so every defect in the runner, the links, the defaults and the transitions
surfaces there, where a cycle costs seconds instead of minutes. Converting 118 browser specs against an
unproven runner is how you spend a day watching Playwright find the same bug repeatedly.

**Step 3 is not optional and cannot be folded into step 2.** The e2e suite calls recipes as functions,
in process. Siegelense calls them by NAME over a step, with params validated at a boundary neither
suite crosses. A green suite says nothing about whether `recipes {}` lists anything or whether a
`seed` step resolves a recipe at all.

#### The rule that makes the conversion a proof

> **A converted test keeps its assertions, exactly.** Only its setup changes.

**If a converted test needs a different assertion to pass, the ingredient is wrong — not the test.**
That is the whole value of converting real tests rather than writing new ones: the assertions were
written against what the app really does, by somebody who was not thinking about this framework. They
are the control. Loosening one to make a conversion land destroys the only independent check in the
exercise and hides the finding it just produced.

**A test that cannot be converted is a finding, and it gets written into this document** — under the
verb or the property it defeated. It is not a test to leave behind quietly.

**One of the seventeen is a test OF a broker the quest ingredient calls directly, and it is NOT a
conversion target.** `quest-hydrate-broker.integration.test.ts` exercises `questHydrateBroker`
directly. **The quest ingredient's `write` route is `questPersistBroker`, not `questHydrateBroker`** —
`questBlueprintContract` carries no `workItems` key and no `status` key at all, so `questHydrateBroker`
cannot accept what the 259 `writeQuestFile` call sites supply and cannot be the `write` route. What the
quest ingredient calls `questHydrateBroker` FOR is its `reach`: it is the only in-process path that
seeds the relay when a caller asks for `in_progress` on a `write` target. That is what excludes this
test, not a resemblance between its name and a route — converting it would make it assert the hydrator
through the hydrator, a test that cannot fail for the reason it was written.

> **An integration test whose SUBJECT is production code an ingredient calls directly — its `write`
> route, its `reach`, an extra — keeps its own setup.** It is the thing the ingredient is measured
> against, so it cannot be measured through it.

**Four other tests MENTION `questHydrateBroker` and are ordinary targets.** They use it as setup, not
as subject — `questModifyBroker`, `questPauseBroker`, `preStampInProgressLayerBroker` and
`smoketestClearPriorQuestsBroker` — and replacing that setup with the quest ingredient is the whole
point. **Mentioning the broker is not the test; `describe()` naming it is.** So step 1 has sixteen
targets, not seventeen and not twelve.

**Sixteen is where the exclusion rule stops, not where the conversion count stops.** The dependency
cycle below descopes most of those sixteen outright — see "A package the recipes depend on is out of
reach for this conversion." Only the one target outside `orchestrator` converts.

The same rule applies in a consumer repo wherever a `copies:` target has its own test.

**Convert in small batches and keep the suite green between them.** 118 specs converted in one pass and
then run is a red suite with no way to tell which conversion caused which failure.

#### A package the recipes depend on is out of reach for this conversion

**A repo cannot convert a test inside a package its own recipes depend on.** `packages/siegelense-recipes`
depends on `@dungeonmaster/orchestrator`, because several of its routes call through orchestrator rather
than imitating it. So `orchestrator` cannot depend back on `siegelense-recipes` — that would be a real
dependency cycle, not a hypothetical one: under Jest's own `--conditions=source` resolution the cycle
breaks at module-evaluation time, not merely at install time. Every repo installing this framework will
have some package in that position, whichever one its own recipes call into.

**What that costs here:** most of the cheap half of this migration — the chunk 9 integration conversions
— sits inside `orchestrator` itself, and every one of those targets is descoped for exactly this reason.
Only the one integration target inside `server` converts, because `server` sits outside the cycle. The
chunk 10 browser specs are unaffected — none of them is a file inside `orchestrator` — and they are the
larger half of this migration.

**The trade behind the cycle is genuine, and every repo choosing between the two pays one side of it:**

| A route that | Gains | Costs |
|---|---|---|
| CALLS the production code | it cannot drift — it is the real thing | its package becomes a dependency, and every test inside that package is shut out of the conversion |
| IMITATES the production code | no dependency, so nothing is shut out | it can drift, which is the whole reason `copies:` exists |

**The ruling: the orchestrator-owned targets are descoped from this conversion, and the limit is
documented rather than worked around.** Duplicating ingredients into `orchestrator` to dodge the cycle
is explicitly rejected — that is the exact duplication `siegelense-recipes` exists to end.

### An ingredient touches STATE, never a screen

**An ingredient writes files and calls APIs. It has no business holding a DOM handle** — not a ref, not a selector, not a
position — and it asserts nothing about what renders. The moment an ingredient knows about the UI it has become a walk, and a
walk that seeds is what the rule above forbids.

**"Never write a ref into a durable thing" cannot be enforced in one place, because refs leak into two different kinds
of artifact.** Enforcement is layered, and only one layer actually protects you:

| Layer | What it stops | Reaches |
|---|---|---|
| **runtime** — only the minting INSTANCE holds the handles, and it invalidates them on navigation, `reset` and restart | a ref resolving anywhere it should not | everything, including artifacts nothing can lint |
| **types** — a durable step shape that structurally omits `ref` | a saved batch being written with one | anything typed |
| **lint** — a rule over ingredient files | an ingredient mentioning a DOM handle at all | source only |
| prose — the prompt | the rest | nothing, reliably |

**The runtime guard is the one that matters, and it is why the other layers can stay simple.** Guides, round records and
fixer briefs are markdown agents write DURING a pass into `.quest-plans/`, which no lint rule will ever see. It does not
need to. **A ref resolves only in the instance that minted it, so a ref that travels has nowhere to land** — it fails
loudly the moment somebody tries it, rather than quietly driving the wrong element.

**The lint rule is worth having anyway, for ingredients specifically**, because an ingredient carrying a selector is a design error
rather than a stale value — it says the ingredient is doing someone else's job.

**That rule belongs in `@dungeonmaster/eslint-plugin`, which ships, NOT in `@dungeonmaster/local-eslint`, which does
not.** The constraint binds every repo that writes an ingredient, so a repo-only rule would hold it here and nowhere else.
`no-hardcoded-package-names` in `local-eslint` stays the working TEMPLATE for the shape — a rule broker plus a statics
file holding its watchlist and path allowlists — but the home is the published plugin.

**And that template carries a caution to copy along with the shape.** `siege-lane.ts` passes
`no-hardcoded-package-names` while hardcoding `@dungeonmaster/server` and `@dungeonmaster/web`, because
`packageNameLiteralStatics` only matches a role-bearing name AFTER a workspace directory segment — so the `@scope/name`
form is waved through by design. **A rule that looks like it covers something and does not is worse than no rule**,
because people stop checking. Whatever this one's scope is, say it in the rule's own message.

**Neither this rule nor the determinism rule beside it exists today, and no chunk owns either — see
Known gaps.** Until one ships, an ingredient carrying a DOM handle is caught by nothing but review, and
with the chain supplying the index, reaching for a clock or a random source is the only way left to
break determinism, and nothing stops it either. **One caution to carry into whichever chunk ships
them, learned the hard way: an eslint config entry naming a rule that does not exist is a FATAL config
error, not a harmless no-op — it takes down linting for every file in the package it targets.** The
config entry lands WITH the rule, never before it.

### Some claims can only be asserted in a BROWSER

**An ingredient whose claim is about a URL cannot be tested by reading a file.** Most ingredients write state and their test reads
it back — the sub-agent-duration ingredient writes JSONL, the test asserts the JSONL. But a claim like *"a URL that renders
the nested chain"* is only true if something renders it, and that needs a page.

So ingredient tests come in three costs, not two:

| The claim is about | Test needs | Cost |
|---|---|---|
| files on disk | `installTestbedCreateBroker` and a temp dir | cheap, no instance |
| a real route's response | a server | one shared instance for the whole suite |
| **what a URL RENDERS** | a server AND a browser | a full instance, and the slowest of the three |

**That third row is where an ingredient starts overlapping a walk**, and the line stays where it was: the ingredient creates the
state and hands back the ids; the PRELUDE does the `goto`. An ingredient that navigates has taken a walk's job, and "an ingredient
touches state, never a screen" still holds — what the third row means is only that PROVING its claim needs a screen, not
that the ingredient drives one.

**The practical effect is that a browser-asserted ingredient test is expensive enough to be deliberate.** Where a claim can be
narrowed to "this file exists with this shape", narrow it — and let the prelude's own `VERIFIED` run cover whether the
URL then renders. The prelude is already proven by running, so an ingredient test that re-proves the rendering is paying twice
for one fact.

### What this is, in industry terms

**This is a test-data FACTORY library.** That is the closest established match and the one with the most road-tested
ideas. The word "hydration" means something else in the industry — turning server-rendered HTML into a live client-side
app — so it is not the term to search under.

| Established term | What it means |
|---|---|
| **fixture** | a fixed static blob loaded before a test — Rails fixtures, Django `loaddata` |
| **factory** | a function building an entity from defaults you override — FactoryBot, factory_boy, Fishery |
| **object mother** | a named canned scenario — `aCustomerWithNoOrders()` |
| **test data builder** | fluent chaining — `aUser().withOrders(3).build()` |
| **seed** | populating a database for dev or test — `rails db:seed`, Prisma seed |

**Four ideas taken, all from the factory family:**

| Idea | What it gives | Where it lands here |
|---|---|---|
| **sequence** | per-item values derived from the index rather than a clock or a random source | `defaults(i)`, and the chain owning `i` |
| **trait** | a named modifier you combine, instead of a new factory per combination | capability verbs and extras, typed per ingredient |
| **lint** | a command that runs every factory and fails on any that cannot build | the colocated ingredient test, run by ward |
| **explicit dependencies** | a factory states what it needs rather than assuming a prior call | `links` on the ingredient, and structural nesting in the chain |

**Four ideas deliberately refused:**

| Idea | Why not |
|---|---|
| **Faker and random data** | standard practice, and actively wrong here — baselines compare bytes across instances, so one random id kills the "nothing happened" signal |
| **fluent builders as the top-level form** | a prelude is JSON a tool submits, not a method chain a person types. The chain builds the JSON; it is not the interface a walk sees |
| **static fixtures** | they go stale silently, which is exactly the risk the `write` route exists to label |
| **object mother's method-per-scenario** | `guild-with-three-quests`, `guild-with-one-quest`, `guild-with-three-quests-one-in-progress` — a catalogue that grows wide instead of deep |

**On the resemblance to Cucumber.** It is real and worth naming, because the thing it resembles has a well-known way of
dying. What was deliberately not taken:

| Cucumber has | Here |
|---|---|
| a natural-language layer, steps matched by regex or expressions | no parsing. A plan is data with typed names |
| business-readable specs as the selling point | the reader is a MODEL. Readability matters for the same reason, but nobody is pitching this to a stakeholder |
| a shared mutable `World` object | handles are scoped to the `add` that minted them, and records travel through `saveRecordAs` |

**The failure mode to watch for is the one Cucumber suites die of: a catalogue of steps that composes correctly only if
you know unwritten ordering rules.** Three things here are the guard:

- **A prelude is RUN, not assumed.** `VERIFIED` names the run that proved this sequence lands where it claims. An
  ordering rule nobody wrote down fails at plan time rather than surviving as folklore.
- **Parenting is structural.** `g[0].quests.add(3, …)` says what these quests hang off. An ingredient that silently required a
  prior call is the ambiguity, and nesting is the fix.
- **The plan is data the tool reads, not prose in a feature file.** It cannot drift from the code the way a Gherkin
  sentence drifts from its step definition, because the listing and the runner read the same object.

### Guidance for other repos

**The framework ships; the recipes do not.** Another repo's states are its own — nobody else has guilds and quests.
What travels is `@dungeonmaster/hydration`, an empty `packages/hydration-recipes/` that `dungeonmaster init` scaffolds,
and these rules:

- an ingredient is declared once per entity, and its `fields` and `record` come from that repo's own contracts
- an ingredient declares its routes, and a `write` route declares what it `copies:`
- counts are `add(n)`, never a name
- the chain owns the index, so nothing an ingredient writes varies between runs
- two of anything an assertion must tell apart

That is a framework plus a convention, not a package abstraction — deliberately short of the ownership architecture the
`siege-verification-remainder.md` wants, and enough to stop every walk, every spec and every integration test re-deriving its own setup.

---

## Part 6 — The surface, consolidated

`siegelense-tooling.md` Parts 1 and 2 say WHY each of these exists. This is the lookup table. Status is against what
sits in
`../../packages/web/test/siege-driver` today.

### Each package needs a `../../CLAUDE.md`, and these are the entries

`../../packages/orchestrator/CLAUDE.md` and `../../packages/web/CLAUDE.md` are the pattern — package invariants with the
measurement behind each one. **The entries below are the rules above this line, compressed into the form a session
editing the package will actually read**, plus the two that live nowhere else.

**They split across the three packages, and the split is who breaks if the rule is broken:**

| Package | Gets the entries about |
|---|---|
| `siegelense` | driving — commands, readings, refs, the key, `run` versus `results`, killing a lane, `dev:no-watch` |
| `hydration` | the chain and the ingredient — handles, the object rule, one `set` verb, `filter`, routes, `copies:`, determinism, a plan being data |
| `hydration-recipes` | this repo's own states — which ingredients exist, what each `copies:`, and the root-`dependencies` rule that keeps the package unpublished |

| Entry                                                                                                 | Why it earns a line                                                                                                                                                                                    |
|-------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Never `.first()` / `.last()` in a command. Ambiguity THROWS, and the error carries the candidates** | the obvious line to write is the wrong one, and the lint rule's message should point here                                                                                                              |
| **Never `querySelector` in eval source — `querySelectorAll` and count**                               | singular silently returns match one; lint cannot see inside the template literal                                                                                                                       |
| **A command returns a READING, never a verdict on a unit**                                            | the founding rule from `siege-command.ts`'s own header. Comparing two measured values is a reading; deciding a unit passes is not                                                                      |
| **The key reads OWN text nodes, never `textContent`**                                                 | recursive text pulled an entire Mantine stylesheet into one reading. This is the single measured reason the old `dom` verb was unusable                                                                |
| **A ref resolves only in its minting instance and page state**                                        | four boundaries look passable and none are; see the ref rule below                                                                                                                                     |
| **An ingredient touches state, never a screen**                                                             | an ingredient holding a DOM handle is doing a walk's job. The lint rule holding it lives in `@dungeonmaster/eslint-plugin`, which ships, because the constraint binds every repo that writes an ingredient         |
| **ONE verb sets state, and `setRaw` is the odd one**                                                  | two verbs taking the same argument shape produce completely different states, and the wrong one fails silently                                                                                        |
| **`all` is an ARGUMENT to `add`'s builder, never a property**                                         | `Tuple<T, N> & { all: T }` silently loses the out-of-bounds check                                                                                                                                      |
| **A link names its parent by NAME**                                                                   | a reference in both directions is an inference cycle, and every type downstream degrades to `any`                                                                                                     |
| **A route lives on the INGREDIENT; the target picks which one runs**                                       | a recipe pinned to one route serves only the callers that offer it, which is what shuts integration tests out of the catalogue                                                                         |
| **`hydration-recipes` is not in the root `package.json` `dependencies`**                             | that field is what ships, and `create-package` writes the entry automatically. A test pins the absence or the next scaffold run puts it back                                                          |
| **`run` returns a status; `results` returns payloads**                                                | collapsing them walks back into the 50,000-char ceiling the service exists to route around                                                                                                             |
| **Kill the process GROUP, not the child — and skip the signal for one that already exited**           | `npm run` is a wrapper; the listener is a grandchild via `sh -c`. And signalling a dead child logs `kill ESRCH` on every clean teardown, which reads as a failure in the one log a later session opens |
| **`kill` removes the throwaway home and never the evidence directory**                                | logs, captures and the transcript are evidence and outlive the instance                                                                                                                                |
| **`dev:no-watch`, never `dev`, for the lane's API server**                                            | `--conditions=source` puts every `packages/*/src` file in the watcher's graph; one save anywhere restarts the server and Vite's `/api` proxy answers with a bare 500 for ~1.5s                         |

---

### The calls this document uses

**Every call below is one of the thirteen names `siegelense-call-statics.ts` pins** — `start`, `run`, `results`,
`kill`, `capacity`, `profile`, `status`, `cleanup`, `prune`, `compare`, `snapshots`, `recipes`, `docs`. There is no
registration and no prefix on a CLI: the name typed after `dungeonmaster siegelense` IS the call. **Steps are not
calls**: `look`, `click`, `health` and the rest are values inside `run`'s `steps` array, which is the whole point of
the bounded-tool-surface decision in `siegelense-tooling.md` Part 1.

**`recipes`** — what states can be created. No instance needed.

```
recipes {}
→ guild-mid-execution
    one guild holding three quests, the first running with its riftcarver item dropped
    inputs:  none
    runs:    serverless
    makes:   guild ×1, quest ×3, operation (varies)

  session-with-nested-chain
    one session under an existing guild, holding a nested sub-agent chain
    inputs:  guildPath
    runs:    serverless
    makes:   session ×1
```

Part 5's "The listing `recipes {}` prints" says where each line comes from — including why `inputs` reads
`guildPath` rather than a branded type name, and why an input-taking recipe like this one needs a listing probe
before `runs` and `makes` can print at all. **`runs` is the line that stops a wasted run:** a caller with no server
reads `needs a server: <ingredient>` and stops there.

**`docs`** — the tool's own instructions. **This is how a session learns to use it, not the prompt.**

```
docs {}                      → the whole surface
docs { for: 'operating' }    → cleanup, capacity, status, reaping rules, reading a minion's return
docs { for: 'planning' }     → recipes, preludes, profiles, capacity, proving a prelude
docs { for: 'walking' }      → goto/click/look/until, the reading rules, and the LADDER:
                               key first, `dom` last and narrow
docs { for: 'attacking' }    → health, reset levels, expect:'error', baselines
docs { for: 'fixing' }       → reading a finished run without starting anything, re-running a prelude,
                               and calling a recipe from an e2e
docs { for: 'driving' }      → the same surface for a session no quest dispatched: capacity, start, run,
                               the reading steps, kill, and where its own evidence went
```

---

### Steps that are new

**`seed`** — runs a recipe's plan against this instance and returns the ids it made.

```
{ step: 'seed', recipe: 'session-with-nested-chain', params: { guildPath: '{g.guild.path}' }, as: 'seeded' }
→ { nested: { sessionId: 'sess-nested', cwd: '/siege-1/guild-1', filePath: '/siege-1/guild-1/.claude/projects/seed-session.jsonl', lineCount: 1 } }
```

**The return is that row's WHOLE record, and no more.** This repo's `sessionRecordContract` carries no `url` — a
route hands back what it produced (`sessionId`, `cwd`, `filePath`, `lineCount`), not a page a UI happens to serve it
at. A batch that wants a page composes the path itself from what the record DOES carry, the way "Interleaving
recipes and steps" below does with `/{g.guild.urlSlug}`.

**`params` is typed by the `recipe` value.** In-process that is a discriminated union over the enumerated recipe names,
so a wrong key is a compile error. **Over the CLI it arrives as JSON — typed inline or read from a `--steps-file` —
and no compile-time check is available.**

**Validation still happens BEFORE anything is written; siegelense just cannot be the one holding a schema to do all
of it.** It may import neither `hydration` nor the recipes package — the three-package table holds it to *"neither
of the others"* — so it holds no live zod schema for a recipe's inputs. Handing one across the dynamic-import
boundary would not substitute for one either: an `instanceof z.ZodType` check fails whenever the two sides resolve
different copies of zod, which npm permits and a consumer's own tree makes likely. So the check splits in two, and
both land before the first write:

| Refused by | Off what |
|---|---|
| siegelense, before it imports anything that writes | an unknown `recipe` name; `params` supplied to a recipe whose `inputs` the listing shows as empty; missing `params` on one whose `inputs` is not; a `params` KEY the listing does not name |
| the recipe's own `inputs` schema, in the recipes package's process | every VALUE |

The error still names the bad input and lists what that recipe takes. A recipe declaring no inputs takes no
`params`.

**A `seed` step runs in the CLI's own driver process, which inherits the OPERATOR's environment, not the lane's.**
Only the lane's spawned API process is handed `DUNGEONMASTER_HOME` pointed at that lane's throwaway home; the driver
itself is spawned with a snapshot of the caller's own `process.env`. Several of this repo's write routes resolve
their home off that GLOBAL variable rather than off the target they were handed — the same escape the known-gaps
table already names for a recipe spanning two routes — so a `seed` step that did nothing about it would register a
guild into whatever `~/.dungeonmaster` the operator's shell had, while the quest FILES that same plan writes land
under the lane's home, and the next route then cannot find what the seed just made. **The `seed` step sets
`DUNGEONMASTER_HOME` to the lane's home for its own duration and restores it in a `finally`, whatever the plan
does.** *"A route that reaches code resolving its own storage location escapes the target"* — here it is the one
place in this design that runs outside the lane it is seeding.

**In-process, a recipe is just a function, and that surface needs none of this.**

```ts
const ids = await run(sessionWithNestedChain({ guildPath }), target);
// ids.sessions.nested — the value is in hand, no interpolation involved
```

A batch step cannot hold a value between steps, which is the whole reason `as:` and `{step.row.field}` exist. One recipe,
two calling conventions, and the in-process one is the simpler of the two.

---

### A worked batch

This is the call a session actually makes. One `run`, six steps, one turn.

```jsonc
run {
  instance: 'inst_7f3a',
  stopOn: 'error',              // 'error' | 'never' — stop at the first failure, or push through
  steps: [
    { step: 'seed',  recipe: 'guild-mid-execution', as: 'g' },
    { step: 'seed',  recipe: 'session-with-nested-chain', params: { guildPath: '{g.guild.path}' }, as: 'seeded' },
    { step: 'goto',  path: '/{g.guild.urlSlug}/session/{seeded.nested.sessionId}' },
    { step: 'until', visible: '[data-testid="SUBAGENT_CHAIN"]', timeoutMs: 20000 },
    { step: 'look',  within: 'SUBAGENT_CHAIN' },
    { step: 'dom',   target: '[data-testid="subagent-chain-duration"]' },
  ],
}
```

**`as` names a STEP's output; `{name.field}` reads it back.** A seed mints runtime ids that no file contains, so later
steps must be able to reference them without a round trip to the model.

**A plan's output is FLAT, and there is exactly one shape.** Every `saveRecordAs({ name })` puts that row's WHOLE
record on the output under that name. Nothing else appears there — not the registry accessors, not a row nobody saved.

```
recipe:  g[0].saveRecordAs({ name: 'guild' })  ·  s[0].saveRecordAs({ name: 'nested' })
output:  { guild: GuildRecord, nested: SessionRecord }
```

**`as:` and `saveRecordAs` are different levels, and neither is a spelling of the other.** `as:` names what one STEP in a
batch returned; `saveRecordAs` names one ROW inside a recipe. So a batch reads **`{<step>.<row>.<field>}`** — three
segments, always:

| Written | Reads as |
|---|---|
| `{g.guild.id}` | step `g`, row `guild`, field `id` |
| `{g.guild.urlSlug}` | the slug off that same record |
| `{s.nested.sessionId}` | step `s`, row `nested`, field `sessionId` |

**A two-segment reference like `{g.guildId}` is always wrong** and the tool should refuse it, naming the rows that step
actually saved. It is the single easiest mistake to make against this surface, because it reads fine.

**`stopOn` and the step that is SUPPOSED to fail.** `stopOn: 'error'` is the default and the right one for a walk: seven
steps after a broken step three are wasted work. But an adversarial step wants failure — sending a hostile payload and
getting a 400 IS the pass — and halting the batch there would make every attack a one-step batch.

So a step declares its own expectation, rather than the batch loosening for all of them:

```jsonc
{ step: 'request', method: 'POST', path: '/api/guilds', body: { name: null }, expect: 'error' }
```

`expect: 'error'` means a failure here is the outcome under test: the batch records it and carries on. **A step carrying
`expect: 'error'` that SUCCEEDS is itself a finding** — the attack landed and nothing refused it — and it stops the
batch exactly as an unexpected failure would.

`stopOn: 'never'` stays available for a sweep that wants every step attempted whatever happens, and is the wrong default
for anything measuring a path.

### Interleaving recipes and steps

**`seed` is a STEP, not a prologue.** It goes wherever the order needs it, as many times as the walk needs:

```jsonc
run {
  instance: 'inst_7f3a',
  stopOn: 'error',
  steps: [
    { step: 'seed',  recipe: 'guild-mid-execution', as: 'g' },

    { step: 'goto',  path: '/{g.guild.urlSlug}' },
    { step: 'look' },                       // mints the refs the next line uses
    { step: 'click', ref: 18 },             // live-session shortcut; would be a selector if this batch were saved

    { step: 'seed',  recipe: 'session-with-nested-chain', params: { guildPath: '{g.guild.path}' }, as: 's' },
    { step: 'goto',  path: '/{g.guild.urlSlug}/session/{s.nested.sessionId}' },
  ],
}
```

The second recipe takes `params: { guildPath: '{g.guild.path}' }`, because it crosses a STEP boundary — see "A recipe takes typed
inputs" in Part 5. That is the composition rule doing its job: a recipe stacks
onto what an earlier one made rather than building a whole world of its own, which is what keeps the catalogue deep
instead of wide.

**Seeding while a page is OPEN is not a convenience — it is the only way to test a whole class of behaviour.** This app
pushes `quest-modified` over a websocket, so a walk that always seeds up front and then navigates never exercises the
live-update path at all; it only ever measures a fresh render. Seeding mid-batch with the page already loaded is how you
ask whether the screen reacts:

```jsonc
steps: [
  { step: 'goto',  path: '/{g.guild.urlSlug}' },
  { step: 'look' },                                            // what is on screen now
  { step: 'seed',  recipe: 'quest-advances-one-step', params: { guildId: '{g.guild.id}' } },
  { step: 'until', predicate: 'document.querySelectorAll("[data-testid^=QUEST_ITEM_]").length === 4' },
  { step: 'look' },                                            // and what changed
]
```

Two `look` calls either side of a seed, with an `until` between them, is the shape for any
"the screen updates when the data does" unit. The element delta on that second `look` IS the answer — and `+0 -0` is the
defect, reported rather than inferred.

**A seed that changes state under a page NOT driven by a socket needs a reload**, or the walk measures a stale render
and reports a defect that only exists in the browser's memory. Which of the two a surface is belongs in the guide, not
in a session's guess.
