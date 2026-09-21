# Siegelense — what is left to build

**This is the whole remaining list, and it is replacing the design scrolls rather than summarising
them.** It was assembled by reading all four in `scrolls/seigelense/` one at a time and checking every
claim against the code. Only things that are NOT built are recorded here. Where a scroll says
something is missing and it has since been built, that is noted so nobody builds it twice.

**Item 20 deletes all four**, so treat this file as the only record. Anything in them that is not in
here goes with them.

**"The design" below means the intent recorded in THIS file**, not a document to go and open. The
phrase is kept where it reads naturally — "the design wants both halves", "the design refused that
shape" — because what follows it is a requirement either way, and rewording twenty of them would risk
changing what they ask for.

| Being deleted                     | Lines |
|-----------------------------------|-------|
| `siegelense-recipe-roles.md`      | 422   |
| `siegelense-recipes.md`           | 2300  |
| `siegelense-tooling.md`           | 3145  |
| `siege-verification-remainder.md` | 1570  |

**Do not trust the `> **Status:**` lines inside those scrolls** for as long as they are still on disk.
They stop at a build chunk the work went well past, and every one of them understates what exists.

## What is in here

| Part                      | Items             | What it covers                                                                                                           |
|---------------------------|-------------------|--------------------------------------------------------------------------------------------------------------------------|
| **Moved out**             | 1, 2, 21, most of 17 | every prompt and orchestration change. They are the plan's §9 and §10 now; each item here is a pointer                 |
| **Spec-side work**        | 17e               | two surfaces folded into generic entries                                                                                 |
| **The oddities file**     | 3                 | durable driving knowledge, nothing built                                                                                 |
| **The recipe framework**  | 4, 5, 7, 8, 12    | two missing verbs, a route nobody has run, three values the app randomises on screen, defects in this repo's own recipes |
| **The migration**         | 6                 | about two-thirds done, with a measurable running mark                                                                    |
| **The tool**              | 9, 13, 14, 15, 16 | the element delta, settle-based stepping, retention                                                                      |
| **Structural**            | 18                | deleting the old lane driver, and why its ordering matters                                                               |
| **Housekeeping**          | 10, 11, 19, 20    | rename leftovers, a misleading lint rule, config holes, stale docs                                                       |
| **Product defects**       | 22                | two live bugs the trial measured, both with a named mechanism                                                            |
| **Do not rebuild**        | 23                | things recorded as missing that are in fact done                                                                         |

**The prompt and orchestration work lives in `scrolls/orchestrator-step-engine-plan.md`**, which
rewrites every one of these prompts as a step in a routed graph. Every `plan §…` below points there.
This file is the siegelense TOOL's remaining work. The item numbers below keep their gaps
deliberately: a dozen items cite each other by number, and renumbering would break every one of those
pointers silently.

## What order to do this in

**Item 18 first, with the plan's step 6.** Everything else here is additive to the files item 18
moves, so doing it late means doing those items twice — and every siege prompt today drives the
mechanism item 18 replaces. Cut them over together.

**Then items 13 and 14**, the element delta and settle-based stepping. They are the two functional gaps
the rest of the tool leans on: the element delta because four separate mechanisms are incomplete
without it, and settle because a clock-based step makes the same batch produce different findings on
different days.

**Items 6 and 7 are independent** and can run beside anything.

**Items 22a and 22b are small and shippable today.** Both have a named mechanism and neither depends on
any of the above.

---

## What we are building, and why

**Siegemaster is the role that verifies a finished flow by driving the real app.** It is meant to be
independent: it checks that the product does what the spec claims, without reading the source that
implements it. Today it cannot do that well, because it has nothing to look at. It drives a browser
through raw selectors it has to guess, and when a guess is wrong it burns a whole round.

Three pieces close that gap.

1. **`siegelense`** — a command-line tool that runs the app as an addressable *instance* and hands a
   walker a *listing* of what is on screen: every element, numbered, in the app's own words. The
   walker points at a row number instead of writing a selector.
2. **The recipe book** (`hydration` and `hydration-recipes`) — a way to create the state a walk needs.
   A *recipe* returns a *plan*, which is plain data, so the same plan can seed a browser walk, an e2e
   spec, or an integration test.
3. **The role prompts** — the rules that tell siegemaster and its sub-agents how to use the first two.

**The tool and the recipe book are largely built. The role prompts are not wired to either of them.**
That third piece is the orchestrator plan's, §9. **The first two are what this file tracks**, and the
rest of it is their remaining work.

---

## 1. The prompt layer — MOVED

**Every prompt rule that was here now lives in the orchestrator plan, §9** — the whole siege role
rulebook, the recipe-provisioning role, `siegemaster-reader`, the fixer rules, the `docs` scopes and
the registration points. It moved because the plan is what rewrites these prompts, and a rule split
across two documents is a rule one of them drifts from.

**What the plan cannot know, and this file keeps:** the prompts and
`packages/web/test/siege-driver/` cut over together. Item 18 deletes that directory, and every siege
prompt today drives the lane it removes.

---

## 2. The `verifyByHuman` settlement route — MOVED

**The whole vertical slice is now the orchestrator plan, §10** — the contract flag, the in-scope
filter, the shared prompt block, the citation kind and the panel a person ticks. It moved because the
denominator half is one more value in the scoping data that plan re-keys, and because two of its three
readers (`get-qa-checklist`, the three sign-off tracks) do not survive that plan at all.

**Item 15a below depends on it**, and that dependency now crosses documents: the video-citation kind
is §10g there, and a screencast a human-check unit names rots on the two-day retention window without
it.

---

## 3. The oddities file — nothing built

**The problem.** Some things about driving an app are true forever and discoverable only by driving
it:

> for THIS button, clicking the label does nothing — click the wrapper
> this panel takes about 2s to mount; asserting before it does reads as a missing element
> this control needs scrolling into view before a click lands
> `PIXEL_BTN` appears twice on this screen; the one you want is under `GUILD_SESSION_LIST`

Unit tests already have a home for exactly this — the proxy. `home-content-widget.proxy.tsx` encodes
"the session-list add button needs `within(GUILD_SESSION_LIST)`" so no test rediscovers it.

**A walk has no such home, and the place it currently lands is wiped.** The guide's `TRAPS` heading is
written per quest, by a sub-agent, into `.quest-plans/` — and `.quest-plans/` is gone when the quest
ends. Every oddity is rediscovered by the next quest, at the cost the prompt already names: a wrong
command costs a whole round.

**What to build:** a committed file of app oddities that every walk reads and every walk can append
to.

| Property                                                                                 | Why                                                                                                                                                                        |
|------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| durable and committed, not `.quest-plans/`                                               | surviving the quest that found it is the whole point                                                                                                                       |
| keyed by testId or route, not by quest                                                   | the reader is a walk on some future flow                                                                                                                                   |
| one line per oddity, with what it cost                                                   | "click the wrapper, not the label" plus the symptom you get when you get it wrong                                                                                          |
| a round that hits a NEW oddity appends to it                                             | knowledge compounds instead of being rediscovered — this is the difference between it and the guide                                                                        |
| a round that finds an entry WRONG reports it                                             | an oddity nobody corrects is worse than none, because every walk after it trusts it                                                                                        |
| each entry says whether it is a genuine platform quirk or something that should be fixed | "click the wrapper" usually means the hit area is wrong, which is a real defect for a real user with a real mouse. The second kind gets an observable rather than an entry |

Pieces needed: the file itself, its entry contract, the read path, the append path, and pointing the
guide's `TRAPS` heading at it — which is the plan's §9b. Its home is `.dungeonmaster-assets/`, which does not exist in the checkout yet — **19a creates it**, by
moving the `.siegelense` link under it. Two occupants, and they need opposite
git treatment: the link is ignored, this file is committed. 19a has the trap that follows from that.

---

## 4. Values that change on their own, and the three that break a walk

### What to build

|        | Build this                                                                                                                                                      | Effort                       |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------|
| **4a** | Let a caller supply the guild id to `guildAddBroker` instead of it generating one                                                                               | one parameter                |
| **4b** | Let a caller supply the work-item id, through a new field on `QuestBlueprint`                                                                                   | one field, threaded          |
| **4c** | Let a caller supply `createdAt` and `updatedAt` to `questHydrateBroker`                                                                                         | one field, threaded          |
| **4d** | Write a two-route comparison test for every ingredient declaring both routes. One exists; it covers `guild`                                                     | one test per ingredient      |
| **4e** | Make something read `copies:`, find the app code it names, and compare the ingredient against it. Today nothing does                                            | a real mechanism             |
| **4f** | Make the recipe-provisioning session seed each recipe twice and compare the two screens. This is the only one of the six that finds the problem in a repo nobody here has seen | a step in 1a, waiting on 13a |

**4a, 4b and 4c are this repo's own bugs and fix only this repo. 4f is the one that ships.** The rest
of this section is why.

### The problem

**This system finds bugs by taking the same reading twice and looking at what changed.** A walker
clicks something and compares the screen against the screen before the click. An antagonist attacks an
instance and compares its health reading against the reading taken before the attack. That comparison
is how almost everything here reports a finding.

**So a value that changes by itself produces a difference nobody caused.** The session reads the
difference, cannot tell it from a real one, and writes down a defect. That is the most expensive wrong
answer this design can produce, because it arrives looking like evidence: a fixer is briefed on it and
spends a round hunting through code that was never broken.

**The everyday example is a random id.** Seed the same data twice and the app mints two different
uuids. If a uuid ends up somewhere a person can see it — a row, the address bar, a page title — then
the two screens differ on every single run, for no reason at all.

### What already stops this

| Piece                                                                                                         | Where                                                                                                      |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| A lint rule banning `Date.now()`, `Math.random()` and `crypto.randomUUID()` inside ingredient files           | `eslint-plugin/…/rule-ban-nondeterminism-in-ingredients-broker.ts`                                         |
| `fixedQuestId`, which lets a caller hand `questHydrateBroker` the quest id instead of letting it generate one | `quest-hydrate-broker.ts:53`                                                                               |
| `copies:` on an ingredient, required whenever that ingredient writes files directly                           | `ingredient-config-contract.ts:83`, enforced by a `superRefine` at line 86                                 |
| One set of instructions that can be run two different ways — against files, or against the live API           | `hydration-plan-contract.ts:14`, proven by `packages/web/src/flows/home/guild-two-route-comparison.e2e.ts` |

### Why no lint rule can find these

Two reasons. The second is the one that matters outside this repo.

**The value is generated too far away to see.** A recipe does not write rows itself. It calls the
app's own code to write them, which is the whole point — a recipe that wrote its own rows would be
building a world the app never builds. So a recipe can obey that lint rule perfectly and still produce
a different uuid on every run, because the uuid is generated by app code several packages away. A lint
rule watching the recipe folder cannot see that far.

**And the nouns are this repo's alone.** `dungeonmaster` ships as an npm package. A consumer's repo
has no guild, no quest and no work item, so a rule naming `guild-add-broker.ts` is dead weight there.
The PROBLEM travels even though the names do not: every repo has its own values that the app generates
and then shows to a person. **So anything that catches this has to work without knowing what the
domain is.**

Two pieces already meet that bar, and it is worth seeing why. The rule in the box below never mentions
a guild. The existing lint rule does not either — `isIngredientDeclarationFileGuard` keys on the
file-name convention and on the literal name of the declaration function, and its own statics say the
bare form is "kept for a consumer repo not bound by this architecture". What is missing is the check
that finds the offending values, and that is 4f.

**The rule that does hold is about what reaches the screen, not about who calls what:**

> **Every value a person can see must be handed in, not generated.** A uuid nothing displays may be
> random. A uuid that shows up in a row, a URL or a title may not.

That splits every generated value into three cases:

| The app generates a value, and…                                                                  | What to do about it                                                                                                                        |
|--------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| …it already lets a caller supply one instead — the way `questHydrateBroker` takes `fixedQuestId` | Hand one in. A recipe knows which row it is building, so it can supply `quest-1`, `quest-2` and so on                                      |
| …nothing displays it                                                                             | Leave it alone. A value nobody can see cannot make two screens differ                                                                      |
| …it displays it, and takes no supplied value                                                     | **That is a bug in the app.** It gets its own observable, and until somebody fixes it, no screen showing that value can ever compare clean |

### Three values sitting in that third case, in THIS repo

All three are measured and confirmed, and all three need the app changed to accept a supplied value.
They are findings from reading this checkout by hand, so fixing them fixes this repo and nothing else.
The consumer's equivalent is 4f.

| Item                                       | Where the app generates it                                                                                                                | Where a person sees it                                                                                                                   |
|--------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| **4a.** The guild id                       | `guild-add-broker.ts:35` — `const id = crypto.randomUUID();`, and the function takes only `({ name, path })`                              | the address bar (`/${guildId}/quest/...`) and the `GUILD_ITEM_${guild.id}` test id                                                       |
| **4b.** The work-item id                   | `quest-hydrate-broker.ts:131` — `id: questWorkItemIdContract.parse(crypto.randomUUID())`, and `QuestBlueprint` has no field to supply one | the raw uuid is shown as a dependency label whenever the id is missing from the label map — `execution-work-item-row-layer-widget.ts:96` |
| **4c.** The created and updated timestamps | `quest-hydrate-broker.ts:88` — `new Date().toISOString()`, used for both `createdAt` and `updatedAt`                                      | the elapsed-time figures in the quest chat, which tick                                                                                   |

**4c is the worst of the three.** The flow this whole system was built to check is almost entirely
durations. A figure like `4m` only comes out the same twice because both ends of the subtraction were
fixed values. Leave the timestamps as they are and every run shows a different duration, which reads
as a rendering bug.

### Two gaps in how ingredients are checked

First, some vocabulary these two items need. **An ingredient can create its state two ways**, and the
design calls each one a route. The `write` route writes the files directly. The `api` route calls the
app's own HTTP endpoints. Both are supposed to end up with the same world, and the `write` route is
the risky half: it is an imitation of something the app does, so it can quietly stop matching. That is
what `copies:` is for — it names the piece of app code the `write` route is imitating, so anyone
diagnosing a failure knows where to look.

**4d. Only one test compares an ingredient's two routes against each other.**
`guild-two-route-comparison.e2e.ts` is the only one in the repo. Every ingredient that declares both
routes needs one, because that comparison is the only thing that catches the `write` route drifting
away from what the app really does.

**4e. Nothing follows `copies:` automatically.** It is stored, and a human is the only thing that ever
reads it. Nothing takes the name, finds the app code it points at, and compares the ingredient against
it. Colocated tests like `guild-ingredient-broker.test.ts:20` check that the string says what it
should and stop there — they never run the two and compare. So `copies:` is worth exactly as much as
somebody remembering to read it mid-diagnosis.

### 4f. The check that works in a repo nobody here has seen

**4a, 4b and 4c were found by reading this repo's code, and that method does not ship.** A consumer
repo has its own values that the app generates and displays, under names nobody here can guess. No
lint rule can be written against nouns it has never seen, and nobody is going to hand-read a stranger's
codebase looking for them.

**Seeding the same thing twice and comparing finds every one of them, in any repo, knowing nothing
about the domain.** Seed one recipe into two fresh instances, read both screens, and compare. Every
value a recipe supplied is identical by construction, so **whatever differs is a value the app
generated and then displayed** — the third case in the table above, named, without any rule ever
mentioning a guild. The comparison does not need to know what it is looking at. That is the whole
reason it travels.

**Where it goes: `recipe-maker`'s step 5** — the plan's §9b. That step already runs every setup once against a
throwaway instance. Running it twice and comparing is the same work plus one comparison, and it is the
only moment in a pass that already holds both a proven setup and an instance to run it in.

Two things it depends on, both already listed here:

| Needs                                  | Why                                                                                                    |
|----------------------------------------|--------------------------------------------------------------------------------------------------------|
| the element delta on `look` — **13a**  | so the comparison says WHICH element differs. A percentage alone names nothing a person can go and fix |
| `compare`'s `elements` field — **13b** | the same dependency, one level up; it is what carries the answer back                                  |

**Both outcomes are worth having.** No differences means this repo's screens genuinely reproduce, which
is the thing every other comparison in this design quietly assumes. Differences means a list of
observables to file — the third-case rule applied by measurement instead of by reading, which is the
only form of it a consumer ever gets.

---

## 5. Two verbs the chain is missing, and one route nobody has ever run

The recipe framework in `@dungeonmaster/hydration` is built and holds up. Its pre-flight refusals, its
error classes, its type-fixture suite and its typed plan output all work. Two verbs are missing — 5a
and 5b — and 5c is a route that is fully wired and has never executed.

**5a. A recipe cannot call another recipe.** There is `add` and there is `filter`, and no `include`.
The reserved verbs are exactly `set`, `setRaw`, `remove`, `saveRecordAs` — nothing composes two plans.
Without it, recipes duplicate each other's openings within a week of two people writing them. What is
wanted: `include(otherRecipe({ … }))`, splicing the other plan's ops in, with its saved names
namespaced so two recipes saving `guild` do not collide.

**5b. No chainable reaches a row that already exists.** The verbs are `add` (mints new rows), `filter`
(matches rows the target already holds within this plan's scope), `fromSaved` (names a row
`saveRecordAs` saved earlier in this plan) and `under` (supplies a link for a row being created). None
reaches a row a caller already holds an id for — including an id the live application minted rather
than this recipe.

Real callers need exactly that: appending a line to a session a dispatched agent is already driving,
or rewinding a quest's status by reading, modifying and rewriting a file the real server wrote.
`packages/hydration-recipes/CLAUDE.md:250` already names the missing verb: `attach({ id })` on a
collection.

**5c. The `recording` route is a copy of `write` wearing a different name.** It is fully wired and
nothing has ever run through it — no ingredient in `hydration-recipes` declares one, and no type
fixture does either. **This is a decision to make now, not a discovery to leave for whoever ships the
first one.** Below is what the code does today and what a recording actually has to do.

**What it does today.** Every row here was read out of the source, not inferred:

| Today                                                                                                                                                         | Where                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| The enum accepts it                                                                                                                                           | `hydration-route-contract.ts:15` — `z.enum(['api', 'write', 'recording'])` |
| It takes a function with the SAME signature as `api` and `write` — `({ target, fields }) => unknown`                                                          | `hydration-routes-contract.ts:69`, typed at lines 21-24                    |
| A `recording`-only ingredient is legal: it satisfies the at-least-one-route rule and has its own branch in `RoutesFor`                                        | `hydration-routes-contract.ts:74` and `:100`                               |
| It needs no `copies:`. `CopiesFor` demands one only where `write` exists, on the grounds that a recording has "nothing to imitate"                            | `hydration-routes-contract.ts:109`                                         |
| It is chosen LAST — `api` (with a base URL), then `write`, then `recording`, then nothing                                                                     | `route-select-transformer.ts`, the third branch                            |
| It does NOT count as running without a server. The test is `routeSelectTransformer(…) !== 'write'`, so a `recording`-only ingredient reports `needs a server` | `plan-runs-transformer.ts`, and its own JSDoc records this as a known gap  |
| The runner calls it exactly like the other two — `config.routes[route]`, then `routeFn?.({ target, fields })`                                                 | `op-create-apply-layer-broker.ts:64` and `:72`                             |
| A failure is reported as `HydrationRouteFailedError`, naming a URL, a status and a response body                                                              | `op-create-apply-layer-broker.ts:83-92`                                    |

**So today `recording` is `write`'s twin, picked last and refused the serverless label.** Nothing in
the framework treats it as a different kind of thing.

**What a recording actually is.** A recording is a captured artifact replayed later — bytes taken off
a real system at some past moment. It is not code that builds state. Four consequences follow, and
none of them is built:

| Needs to do                                                   | Why it is not optional                                                                                                                                                                                                                                                                                                           |
|---------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Say what it was captured from, and when**                   | This package's own diagnosis table says a broken recording means "the recording is of a version that no longer exists. Re-capture, do not patch." No field records which version, so that diagnosis is one nobody can carry out. `write` has `copies:` for exactly this, and `recording` is exempt with nothing put in its place |
| **Have a capture path**                                       | Nothing in the repo records a recording. Replay is a function anyone can write; capture does not exist, so the first author invents it and the second invents it differently                                                                                                                                                     |
| **Answer the serverless question as a replay, not as a call** | Reading stored bytes needs no server, yet a `recording`-only ingredient reports `needs a server`. Harmless while nothing declares one. The day something does, an integration test with no base URL is refused a plan it could have run                                                                                          |
| **Fail by naming the recording, not a URL**                   | A replay has no URL, no status and no response body, so all three come back `null` and the message says nothing usable. What a reader needs is the recording's own path and its capture date                                                                                                                                     |

**The decision, either way, is this pass's:**

- **Build it** — one real state in this repo written as a `recording` ingredient, plus the four rows
  above. That ingredient is what proves the route, the same way `guild-two-route-comparison.e2e.ts`
  proves the two-target plan.
- **Or delete it** — out of `hydrationRouteContract`, out of `hydrationRoutesContract`, out of
  `RoutesFor`'s third branch, and out of the route-select and failure-classification branches. The
  diagnosis table in `packages/hydration/CLAUDE.md` loses its third row with it.

**Leaving it declared and unproven is the one option that costs something.** It reads to every author
as a supported route, so somebody eventually declares one, and what they get is a `write` route that
is picked last, is told it needs a server, and reports its failures with three empty fields.

---

## 6. The migration is about two-thirds done

**Why the migration matters.** It is the validation, not cleanup afterwards. A synthetic round
exercises what somebody thought to write. Two hundred real tests exercise what the app actually needs,
and a conversion that cannot reproduce a real test's setup has found a hole no invented example would
have. The rule that makes it a proof: **a converted test keeps its assertions exactly, and only its
setup changes.** If a converted test needs a different assertion to pass, the ingredient is wrong, not
the test.

**The running mark.** `python3 scrolls/tools/seed-census.py --methods` reports, per harness method,
whether its body reaches `dmRegistryBroker` and whether it still calls a filesystem function or an
HTTP verb directly. Run it — do not trust a number typed into a document.

As of this sweep it prints **`STILL WRITES DIRECTLY (30):`** — thirty harness methods not yet routed
through the framework.

| Harness              | State                                                                                                                |
|----------------------|----------------------------------------------------------------------------------------------------------------------|
| `guildHarness`       | done — its seeding method routes through the framework                                                               |
| `questHarness`       | partial — `createQuest` converted; seven other methods still write raw; `patchQuestStatus` still calls HTTP directly |
| `sessionHarness`     | mostly unconverted — about eighteen methods still write JSONL directly                                               |
| `navigationHarness`  | correctly untouched — it drives, it does not seed                                                                    |
| `environmentHarness` | correctly untouched — configuration, not state                                                                       |

**6a. Finish the remaining thirty methods.** The conversion is finished when that last column holds
nothing beyond the methods deliberately kept raw: a row reached by a bare id from outside the plan, an
assertion, or a domain no ingredient covers.

**6b. Remove the silent fallback in `writeQuestFile`.** `packages/web/test/harnesses/quest/quest.harness.ts:499`
tries the framework and catches any failure into a raw `fs` write:

```
await dmRegistryBroker.run(plan, dmTarget.writeTarget());
} catch {
  await writeRawQuestFile(rawQuest);
}
```

This is worse than not converting the method. A framework failure produces a green test through the
old path, so the conversion proves nothing and nothing reports that it fell back. Either the framework
handles the case or the method stays openly raw.

**6c. Domains no ingredient covers.** Several conversion targets seed state no ingredient can make,
and they need either an ingredient or an explicit ruling that they stay raw:

- real git worktree and branch state — a `git init`, a `worktree add`, real commits
- mock subprocess response queues behind the dispatch harness, which arm future answers rather than
  making a row
- a rate-limit harness writing files with no guild, quest or session shape at all
- an MCP protocol driver that persists no row at all, so no route has anything to produce

**6d. The orchestrator descope is accepted and should stay documented.** `packages/hydration-recipes`
depends on `@dungeonmaster/orchestrator` (`package.json:60`), so `orchestrator` cannot depend back —
that is a real module-evaluation cycle under Jest's `--conditions=source`, not a hypothetical. Every
orchestrator-owned integration target is out of scope for conversion as a result. **Duplicating
ingredients into `orchestrator` to dodge the cycle is rejected** — that is the exact duplication the
recipes package exists to end.

---

## 7. Defects in this repo's own recipes and ingredients

Five ingredients exist: `guild`, `quest`, `operation`, `session`, `subagent`. Their routes and
`copies:` values all match what `packages/hydration-recipes/CLAUDE.md` documents.

**7a. The quest ingredient declares both routes and has no two-route comparison.** Only `guild` has
one, and it lives at `packages/web/src/flows/home/guild-two-route-comparison.e2e.ts`. The quest
ingredient is the one that matters most — it is the `write` route the design keeps warning can drift
from `questPersistBroker` — and nothing compares it to its `api` route.

**7b. `quest-completed` makes a state that contradicts its own description.** The description reads
"one guild holding one completed quest with all workflow operations finished". The recipe calls
`.set({ role: … })` on each of its two operations and never touches `status`, and the operation
ingredient's own default is `status: 'pending'`. So the two operations are pending, not finished. A
session choosing this recipe from the listing gets a state the words promised it would not.

**7c. `guild-mid-execution` makes two byte-identical rows.** It seeds three quests, overrides only
`q[0]`, and leaves quests 2 and 3 at the same `setRaw({ status: 'created' })` with no title or
operation difference. **That breaks "two of anything an assertion must tell apart" in the one recipe
whose name promises a mid-execution guild.** An assertion meant to pick the second row cannot tell it
from the third, so an off-by-index bug passes.

Its description has the matching hole: it names what the first quest is and never says what makes the
second differ from the third. **7g is the general rule this recipe breaks**, and the enum row there is
why it broke: all three quests share one `status`, so the difference had to come from a title or an
operation, and none was written.

**7d. `session-with-nested-chain`'s description never states the depth.** The depth is 2, held in
`session-with-nested-chain-statics.ts:9`. A session reading the listing cannot tell a shallow chain
from a deep one, which is the one fact that would let it choose.

**7e. A ninth recipe is orphaned.** `recipesSessionWithNestedSubagentBroker` exists as an executable
broker and is imported by nothing in `recipes-catalog-broker.ts`, whose live catalog holds eight
entries. Either wire it in or delete it — a recipe the listing cannot show is a recipe nobody can
call.

**7f. Read every description against the bar, not just these three.** A vague description degrades the
listing and nothing reports it. The bar: it says what EXISTS afterwards, including the counts that
tell rows apart.

**7g. Give every string field its own value, the way the stub book already does.** `QuestStub` sets
`id: 'add-auth'`, `folder: '001-add-auth'`, `title: 'Add Authentication'` and
`userRequest: 'Add authentication to the application'` — four string props, four distinct values, not
one of them `test`. An ingredient's `defaults` should hold to the same rule, on two axes:

| Axis          | The rule                                                          | What it catches                                                                                                                                                                                                         |
|---------------|-------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| across FIELDS | no two string fields on one row carry the same value              | an assertion that reads the wrong field and passes anyway, because both fields say the same thing. On a walk it is worse — the walker reads the screen, and two elements showing one string cannot be told apart at all |
| across ROWS   | `defaults(i)` varies every string field by the index it is handed | an off-by-index bug. **7c is this rule failing in a live recipe**, and item 12's Round A already asks the question from the other side                                                                                  |

**Three kinds of field cannot follow it, and each needs its own answer:**

| Field                                    | Why the rule cannot apply                                                             | What to do instead                                                                                                                                                                                                                                           |
|------------------------------------------|---------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **an enum** — `status`, `role`           | it may hold only its own values, so it can be unique neither per field nor per row    | Spread rows across the enum wherever the state allows it. Where two rows genuinely must share a value, the difference has to come from a DIFFERENT field, and the recipe's description has to name which one. That second half is exactly what 7c is missing |
| **a uuid**                               | the contract refuses `quest-2` — `questWorkItemIdContract.parse(…)` takes a real uuid | Derive one from the index instead of generating one. It stays unique per row, stays reproducible, and still parses. `crypto.randomUUID()` is the failure section 4 is about                                                                                  |
| **a value the state would not hold yet** | filling it in builds a world the app never builds                                     | Leave it unset. A quest at `created` has no completion time, and inventing one is the same defect as 8b, where the guild `write` route makes a directory neither the `api` route nor production ever makes                                                   |

**Both axes are checkable without knowing the domain**, which matters for the reason 4f gives — these
recipes live in repos whose nouns nobody here can guess. Two rules, in the same place as the existing
`ban-nondeterminism-in-ingredients`, which already keys on file shape rather than on a name:

| Check                                                     | Catches                                                                               |
|-----------------------------------------------------------|---------------------------------------------------------------------------------------|
| no two string literals in one `defaults` return are equal | the field axis, without ever knowing what a title is                                  |
| a `defaults` that takes an index must reference it        | the row axis. A `defaults` ignoring its index cannot vary by row, which is 7c's shape |

**Where the rule itself goes:** `packages/hydration/CLAUDE.md`, beside "Determinism is structural, not
a rule to remember". It is one subject from two sides. Determinism says the same plan run twice
produces the same bytes; this says two things inside one plan produce different ones.

---

## 8. Two route defects — these are observables against the app, not framework rules

**8a. A recipe using both the guild and quest write routes spans two unrelated stores.**

| Route                   | Resolves its storage from                                                                                  |
|-------------------------|------------------------------------------------------------------------------------------------------------|
| `guildWriteRouteBroker` | calls `guildAddBroker`, which reads the global `process.env.DUNGEONMASTER_HOME` — `guild-add-broker.ts:33` |
| `questWriteRouteBroker` | the `target` it was handed — `quest-write-route-broker.ts:52`, `${target.home}/…`                          |

Nothing in the pre-flight or the runner checks the two agree. **The failure is inconsistent, which is
what makes it dangerous.** A caller that never sets the env var to match `target.home` gets a loud
error in one shape and a silently empty result in the other — and a silently empty result is exactly
what manufactures a false defect report against working code.

The general rule this implies belongs in `packages/hydration/CLAUDE.md`, under its existing "A route
lives on the INGREDIENT; the target picks which one runs": **a route that reaches code resolving its
own storage location escapes the target, and the isolation this design promises holds only while every
route honours the target it is given.**

**8b. The guild write route creates a directory neither `api` nor production ever creates.**
`guild-write-route-broker.ts:33` calls `fsMkdirAdapter` on the guild's own `path` before calling
`guildAddBroker`. `guildAddBroker` never does that — its one mkdir at `guild-add-broker.ts:41` makes
the quests directory under `guildsPath/<id>`, a different path entirely. A guild registered through
`POST /api/guilds` gets no directory at its own `path` at all.

So a test seeded through `write` runs against a world neither `api` nor production could produce. **The
two-route comparison must not assert that directory's existence as something both routes guarantee.**
Whether the mkdir belongs in the route at all is a decision nobody has made — make it.

---

## 9. Tool-side gaps in the recipe surface

The `recipes` listing, the `seed` step, the thirteen calls, the three-segment interpolation refusal and
the `expect: 'error'` handling are all built and correct.

**9a. A failed mid-batch seed does not mark the instance unusable.** The design requires both halves:
the batch halts, **and** the instance is marked unusable so the walk does not continue against it. Only
the halt is built. `instance-state-contract.ts:18` pins a closed enum of
`['alive', 'killed', 'dead', 'pruned', 'unknown']` with no `unusable` value, and nothing writes an
instance-state change when a seed fails.

Why the second half matters: a partially seeded live instance is exactly the state that manufactures
false defects. There is nothing throwaway about an instance a walk is already using and nothing to roll
back to. Re-running a failed seed is not safe either — some ops landed and some did not, so a second
run stacks new rows on the first attempt's — and the tool correctly offers no retry.

**9b. `RecipePackageMissingError` is dead code.** The singular-named class at
`packages/siegelense/src/errors/recipe-package-missing/` is thrown nowhere and referenced only by its
own test. The live path uses `RecipesPackageMissingError` (absent package) and `RecipesBuildMissingError`
(present but unbuilt), which correctly distinguish the three states the design demands — absent, built
but empty, and never built. Delete the dead one.

**9c. The seventh `docs` scope is not a stray — it is the browserless one.**
`siegelense-call-statics.ts:36` pins
`['operating', 'planning', 'walking', 'attacking', 'fixing', 'driving', 'operational']`, and because
the design names six, `operational` reads as a duplicate of `operating`. It is not. `docs-statics.ts`
gives it its own audience — "a session verifying a flow that has no screen, where siege is the only
verification track there is" — and its own subject: the headless lane, reading server logs, and the
`request` / `file` / `until { file }` steps.

**Two of the seven scopes have lost their reader, and this one is the second.** Operational flows
leave siegemaster's track (the plan's §9h), so no siege step fetches `operational` any more, and its
audience line now describes a session nobody builds. `operating` lost its reader the same way — the
plan deletes the operator that scope addresses. Three live options, and one pass picks all three:

| Option                                       | What it means                                                                                                                                                                                                                                                                                          |
|----------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Delete `operational`**                     | the honest reading if nothing browserless is ever walked. It goes out of `siegelense-call-statics.ts:36` and out of `docs-statics.ts`, and the seven becomes six                                                                                                                                       |
| **Keep it for the whole-quest off-map item** | an all-operational quest falls back to ONE whole-quest off-map item. That item still attacks a running system through `request` and `file`, with no flow and no screen — which is what this scope describes. If that is where it lands, the audience line is rewritten to say so                        |
| **Decide `operating` alongside it**          | it addresses "the session that opens and closes a pool of instances and assigns tasks to other agents". Under the plan each walker starts its own instance and the router reads `capacity`, so nobody is that session — plan §9g                                                                       |

**The second is the likelier answer for `operational`**, because the browserless lane spec, the
`request` and `file` steps and the content-hash profile are all built and all still needed by that
item. **But the whole-quest off-map item is an OPEN question in the plan, not a settled one** — its
siege planner returns `empty` on an all-operational quest and mints no such item. Settle that first;
this follows from it.

---

## 10. Leftovers from the rename, and stale pointers

The package rename from `siegelense-recipes` to `hydration-recipes` is done in substance — the package
name, the root `dependencies` absence, the scaffolder's `RECIPES_PACKAGE_DIRNAME` and the pinning test
are all correct. These remain:

| Item                                                                             | Where                                                                                                                                                                                                                         |
|----------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **10a.** A stale workspace entry npm itself flags `extraneous`                   | `package-lock.json:9426` — `"packages/siegelense-recipes"`. Regenerate the lockfile; do not hand-edit                                                                                                                         |
| **10b.** The pinning test's own filename still carries the old name              | `packages/hydration-recipes/src/siegelense-recipes-not-shipped.integration.test.ts`                                                                                                                                           |
| **10c.** `hydration-recipes/CLAUDE.md:107` points at the wrong file for that pin | it names `src/statics/hydration-recipes/hydration-recipes-statics.test.ts`, which only asserts the statics object. The real pin is the integration test in 10b                                                                |
| **10d.** Stale example strings in guards and tests                               | `has-package-json-dependency-guard.ts:8` and its test use `'@dungeonmaster/siegelense-recipes'` as the example; `package-json-read-broker.test.ts:20` uses `/repo/packages/siegelense-recipes/package.json` as a fixture path |
| **10e.** Stale paths in the eslint plugin                                        | `ingredient-declaration-statics.ts:9`, `is-ingredient-declaration-file-guard.ts:15`, and the `ban-nondeterminism-in-ingredients` and `ban-dom-handles-in-ingredients` rule tests all use `siegelense-recipes` paths           |
| **10f.** A stale scratch doc                                                     | `tmp/siegelense-wiring/recipes.md` still describes the old package as current                                                                                                                                                 |

**Not a leftover:** `siegelense-recipes-responder.ts` is correctly named after the CLI verb
`dungeonmaster siegelense recipes`.

**But the JSDoc lines citing `scrolls/seigelense/siegelense-recipes.md` are no longer fine.** They
were right while the scroll existed, which it does today. **Item 20 deletes it**, and every one of
those citations goes with it — so do not treat them as settled and do not add more.

**10g. Two stale comments describe delivered work as scheduled.** `hydration-plan-contract.ts:24` and
`hydration-run-result-contract.ts:7` both say threading saved names through the plan's output type is a
"scheduled pass". It is delivered — `SavedOf<Ops>` threads it and a type fixture proves it. Note that
the runtime zod contract genuinely is still `Record<SavedRecordName, unknown>`; only the compile-time
type is threaded. Fix the comments to say that.

---

## 11. A lint rule that waves through what it looks like it catches

`no-hardcoded-package-names` in `packages/local-eslint` only matches a role-bearing name when it
follows a workspace directory segment, so the bare `@scope/name` form passes. Measured:
`packages/web/test/siege-driver/siege-lane.ts:41` declares
`const SERVER_WORKSPACE = '@dungeonmaster/server';` and the line after it does the same for
`@dungeonmaster/web`. Both are hardcoded role-bearing names, the file is on no allowlist, and the rule
passes it clean.

**Item 18 deletes that file, and that does not fix this.** The blind spot is in the rule, not in the
file it failed to catch — so once `siege-lane.ts` is gone this item has no measured instance left and
still has the same defect. Do not read a clean run after item 18 as this being closed.

**A rule that looks like it covers something and does not is worse than no rule, because people stop
checking.** Either widen the rule or **say its scope in the rule's own message.** This matters beyond
this one rule: the design names `no-hardcoded-package-names` as the working template for the shape of
the ingredient lint rules, so the blind spot gets copied along with the shape unless it is fixed or
labelled.

---

## 12. The combinatorial rounds

**This is its own session, not a step inside a build chunk.** Every verb has a worked example and every
one compiles; that says nothing about what happens when they compose. The job is to find what the
design did not anticipate, and **to write each finding down rather than working around it** — in
`packages/hydration/CLAUDE.md` when it is a rule about the framework, in this file when it is work
still owed. A round that changes only the recipe to route around a finding has spent itself and
recorded nothing. A finding that is really a defect in the app gets an observable instead.

It opens from the tables below, not from a blank page. A session told "go try combinations" tries the
ones it thought of first, which are the ones already written down.

**Round A — one property at a time, asked as a live question against a running instance:**

- a `defaults` that returns the same value for every index — does anything notice, or does a walk
  quietly lose the ability to tell two rows apart? (7c says this is already happening in a real
  recipe, and 7g is the rule plus the two checks that would catch it.)
- a `record` missing a field the server really returns — where does that first hurt?
- a `to` list including a state the gates actually refuse — what does the caller see?
- a `copies` pointing at the wrong broker — does the two-route test still pass? It should, and that is
  the finding.

**Round B — nesting:**

- three levels (guild → quest → operation) is proven at type level. Four? Five? Where does the ancestor
  chain stop resolving, and does it fail loudly or silently?
- an `add` inside an `add` inside an `add`, each with its own `defaults` — do the indexes stay scoped
  to their own `add`?
- a `filter` inside a nested `add` — confirm the runner enforces the scope it was given. Do not
  re-open the question; it is decided.
- an ingredient linking to a parent two levels up, skipping one.

**Round C — composing the chainables, which is what the design cannot have anticipated.** Each has a
plausible reading that is wrong:

| Combination                                                                             | The question                                                                    |
|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| `filter` over rows a transition in the same plan just minted                            | does the filter see them, and is the ordering guaranteed?                       |
| `saveRecordAs` on a row a later `remove` deletes                                        | is the saved record stale, absent, or an error?                                 |
| `fromSaved` pointing into a filtered SET rather than one row                            | which row does it mean?                                                         |
| `set` with a transition, then another `set` with a different transition on the same row | two walks, or one?                                                              |
| `setRaw` on a transition field, then `set` on the same field                            | does the second walk from the raw value, and is that value even a legal `from`? |
| `remove` on a parent whose children exist                                               | are the children removed, orphaned, or does it fail?                            |
| two ingredients whose `links` name the same parent, under one `add`                     | ordering between them                                                           |
| `under()` with an id that does not exist                                                | a refused plan, or a foreign-key error from the database?                       |
| a transition whose gates mint rows another transition then removes                      | the count `makes:` reports                                                      |

**Round D — the sad paths, driven for real.** Stop the server mid-plan. Make the home read-only. Hand
`under()` a dead id. **Most of this is already done** — a genuinely refused socket, a real server
answering an error with a real body, a real denied write, a real race on one file, and a real gate
refusing a transition are all driven and asserted. One row cannot be driven in this repo at all: a
transaction rolling back needs a real database engine, a schema with a real constraint, and a
consumer's own wrapper around `run()`. Dungeonmaster's state is files, and nothing inside the framework
throws it by design.

**Three behaviours are documented and worth confirming a round actually observes**, because each is
silent when it goes wrong:

- an ingredient's `defaults` are applied AFTER `under()` and silently overwrite any field the two
  share, so the caller's own input is gone with nothing to say so
- a saved name is a key and the save is last-wins, silently — `all.saveRecordAs({ name })` on a
  broadcast handle saves once per row under one name and keeps only the last
- a top-level `filter` carries no scope and matches the WHOLE instance, so a plan holding two guilds
  loses a matching row from both

**One diagnostic gap to consider closing.** Two real refusals produce wording that teaches nothing. An
undeclared extra reads `TS2722: Cannot invoke an object which is possibly 'undefined'`, and an
impossible child accessor reads `TS2532: Object is possibly 'undefined'`. Neither names the verb, the
ingredient, or the rule being enforced — unlike `set({ nope: 1 })`, whose `TS2353` names the bad field
literally. Both fire correctly; a caller just cannot tell which call was wrong without opening the file
at the reported line.

---

## 13. The element delta, and the three things waiting on it

**The tool is very nearly complete.** All thirteen calls route as `dungeonmaster siegelense <name>`, all
23 step verbs ship, all 20 key-row flags compute, the four-rung reading ladder works, and the fixer's
read path answers off disk for a killed instance. What follows is what is genuinely left.

**13a. An acting step does not report an element delta.** `stepReadingContract` carries `shot`,
`pixelChange`, `blank` and `blankColour`, and no `elements` field. Nothing computes
`+7 under GUILD_ADD_MODAL, -0, moved 2`.

**This is the largest functional gap in the tool, because the design leans on the pixel/element PAIR
in several places.** One number alone is not interpretable:

| pixels | elements | Means                                                          |
|--------|----------|----------------------------------------------------------------|
| 40%    | `+0 -0`  | same structure, different content — a data change, a re-render |
| 5%     | `+7 -0`  | a small widget appeared                                        |
| 0%     | `+0 -0`  | **nothing happened at all**                                    |
| 0%     | `+3 -3`  | something swapped for something the same size — worth a look   |

Four things depend on it:

- **"Is this control dead?"** The design's answer is `pixelChange: 0%` beside `+0 -0 moved 0` and zero
  network exchanges — a control that did nothing, measured. That is also why the tool deliberately
  refuses to inspect event listeners on a key row. Without the element half the measurement is
  incomplete.
- **The live-update shape.** Two `look` calls either side of a seed, with an `until` between them, is
  the shape for any "the screen updates when the data does" unit. The element delta on that second
  `look` IS the answer, and `+0 -0` is the defect.
- **`compare`'s `elements` line** (13b below).
- **The seed-twice comparison** (4f). It is the one check for a randomised on-screen value that works
  in a repo whose domain nobody here knows, and a percentage answer names nothing a person can fix.

**The identity machinery is half there.** `key-read-layer-adapter.ts:322` already computes a row's
identity as `parentRef::testId`, and uses it for the `[n/m]` sibling marker and the duplicate-parent
line. Row order is stable by construction — a document-order DOM walk, never a position sort. What is
missing is comparing two readings with it.

**13b. `compare` has no `elements` field.** `compareAnswerContract` is `.strict()` and a test asserts
that adding `elements` throws. It waits on 13a.

**13c. The numbered map is deliberately deferred, not forgotten.** `key-listing-contract.ts:7` says so
in the code: "There is NO `map` key, and that is a decision rather than an omission." The one trial arm
that had a map rendered three and opened none. Leave it unless someone asks — and if it ships, `look`
takes `map: true` and the map badges only elements with visible content of their own, because a
container that paints nothing is nothing to point at.

**Not a gap:** `waitFor { ref }` was resolved by decision, with the reason in the code —
`run-verb-layer-broker.ts:156` explains that `ElementHandle.waitForElementState` has no
`attached`/`detached`, so `waitFor` takes a target and nulls the ref.

---

## 14. A step still ends on a clock, not on settle

**Not built at all.** `step-click-broker.ts:42` takes `timeoutMs ?? driverStatics.run.defaultStepTimeoutMs`
and passes it straight to Playwright's own `.click()`. There is no network, paint or DOM quiescence
detection anywhere in the dispatch path.

**Why a fixed timeout is wrong in both directions.** Too short and a step reports a timeout that is
really a slow render — a false defect, the most expensive kind. Too long and every step pays the worst
case. Neither number is knowable in advance, and asking a session to guess one per step is asking it to
encode a machine's speed into a walk.

**What to build — an acting step returns when the page settles, on three signals together:**

| Signal  | Quiet means                                   |
|---------|-----------------------------------------------|
| network | no in-flight request for a quiet window       |
| paint   | no pending animation frame, no pending layout |
| DOM     | no mutation for the same window               |

**14a. The detector must discount a repeating request pattern.** This app polls — the rate-limit
watcher reads on an interval, a dispatch heartbeat fires, a watcher reconciles every few seconds. A
naive network-idle wait hangs on every page that has one, which is most of them. A request to the same
path recurring at a regular interval stops counting toward busy after it has repeated.

**14b. The settle state is reported, because it is sometimes the finding.**

```
settled in 340ms
never settled — GET /api/rate-limits every 1000ms (discounted), DOM still mutating at 10s
```

The second line is a defect report. A page whose DOM never stops mutating is the stuck-loader class
arriving from a different direction, and it currently reads to a session as "the tool timed out".

**14c. A ceiling, not a timeout.** The step keeps an upper bound, because something must end. The
difference is what the bound means: a settle-based step that hits its ceiling reports *what was still
busy*, which is actionable. A clock-based step reports only that time passed.

**There is a determinism reason too, and it is the one that matters most.** Two runs of one batch must
produce the same readings on a loaded machine and an idle one. A clock-based step reads a half-painted
page under contention and a finished one otherwise — so the same batch produces different findings on
different days, with nothing saying why.

---

## 15. Retention — three gaps, one of them structural

Age-out works (7 days by default, 2 for video), video ages first in its own pass, tombstones are kept
with `prunedAtMs` and `prunedByRule`, every `results` answer carries `instanceState`, and `start`
refuses rather than pruning to make room. What is missing:

**15a. Two of the four citation kinds do not resolve.** `citationKindContract` holds three values:
`verified-prelude`, `open-issue`, `walked-note`.

| Citation                                 | State                                                                                                                                                                                                                        |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| a `VERIFIED` line naming a run           | resolves                                                                                                                                                                                                                     |
| an open quest's `WALKED` line            | resolves — the `walked` questNote kind is built (plan §9l makes its ids required)                                                                                                                                                                    |
| an open issue naming an instance and run | **a hardcoded permanent gap.** `citation-resolve-broker.ts:39` — "not checked: no issue record exists to check". It is declared in `unresolved[]` on every answer rather than silently skipped, which is the honest handling |
| a `verifyByHuman` item naming a video    | **the kind does not exist**, because `verifyByHuman` does not exist (plan §10)                                                                                                                                                 |

The fourth one matters more than it looks. **A `verifyByHuman` unit hands a person a `.webm` and a
question, and that list reaches them at quest END** — so a screencast deleted on the two-day video
window is a link that rots before the only reader it has. Whoever builds the plan's §10 has to add
this citation kind with it — it is §10g there.

**15b. Free disk is measured and never gates anything.** `capacity` and `status` both report
`freeDiskMB`, but `start` does not check it, and neither `snapshot-capture-broker.ts` nor
`step-video-broker.ts` checks before writing.

The design wants both halves and says why: a pre-flight check is necessary and not sufficient, because
the disk can fill from something this tool never started, between two steps. **A capture that
half-writes is worse than one that does not write, because a truncated PNG reads as a corrupt screen
rather than a missing file.**

**15c. Profile samples are read-modify-write, not append-only.** `profile-sample-record-broker.ts:87`
reads the existing record and overwrites the same path on every beat, with no lock anywhere on the
write or read path.

That is exactly the shape the design refused. Three processes sampling at once lose samples, and the
whole reason the design chose append-only was to avoid needing a lock for something written this often.
Steady and peak already compute on read, and every sample already carries its `poolSize` with
`capacity` selecting the matching group rather than averaging — so only the write path needs changing.

**15d. `assetsAged` reports no `videoFirst`.** Deliberately — the contract is `.strict()` and a test
rejects the field. Video *is* aged first, so this is a reporting gap rather than a behaviour one. Worth
one line if an operator needs to see it happened.

---

## 16. Four smaller tool gaps

**16a. One teardown assertion is still an empty placeholder.** Six of the seven exist and run against
real spawned drivers, including the two hardest — a SIGKILLed driver's orphans reaped by another
process's `cleanup`, and killing one of three parallel instances leaving the other two untouched.

Missing: **snapshots are gone after `kill`.** `driver-flow.integration.test.ts:178` is an empty
`describe` block reading "NOT APPLICABLE YET (chunk 2 has no snapshot mechanism to tear down)". The
snapshot mechanism now exists, so the placeholder can be filled. Fill it red-first like the others —
the break it must catch is skipping snapshot cleanup.

**16b. An OOM death does not correct the profile.** `capacity-suggest-transformer.ts` takes no OOM
input. The design's point: a death from memory pressure is evidence that this spec peaks higher than
the profile recorded, so the next `suggested` should reflect it rather than repeating the mistake.
Solo profiling is optimistic for a contended pool — page-cache pressure, fragmentation and CPU
contention raise a real peak in ways a solo run never shows — and an OOM death is what teaches it the
truth.

Nothing auto-restarts after an OOM death, which is correct. There is no guard against it because there
is no restart code to guard.

**16c. `dom` cannot inspect event listeners.** `domFieldContract` has no `listeners` value, so it
cannot even be requested, and there is no CDP code in `step-dom-broker.ts`.

Build it carefully or not at all. **React delegates to the root container**, so a per-element listener
check answers "none" for every button in this app — worse than no answer, because it reads as "nothing
on this page is wired up". The CDP route is accurate and hits the same wall from the other side: the
button truthfully has no listener. So it is a `dom` field for one named selector, at the right cost for
a rare question, and **nothing may ever infer a dead control from it.** The click is the test.

**16d. Server-side failure injection does not exist.** The lane injects a fake Claude CLI and a fake
ward binary and stops there. `docs-statics.ts:341` says so to its own readers: "Automated tools to
simulate server-side failures are NOT BUILT."

Hostile input is drivable through the page today — garbage through `type`, key spam through `key`, an
oversized payload through `paste`, rapid repeated `click`. What is not drivable is a 500, a hang, or a
dropped socket, **and that is most of what the `interruption`, `staleness` and `configuration` attack
families need.** The mechanism for injection exists; it covers two binaries.

---

## 17. Spec-side work the tool is waiting on

**17a–17d and 17f–17h MOVED to the orchestrator plan.** Each was a prompt or an orchestration
change rather than a tool gap:

| Was | Now |
|-----|-----|
| **17a.** a `walked` questNote must carry its instance and run id | plan §9l |
| **17b.** nothing prints the owning node id an antagonist needs | plan §8, the `get-quest-work` endpoint table. `get-qa-checklist` is deleted there, so the node id is served on every unit |
| **17c.** `siegemaster-reader` does not exist | plan §9c, and it is a step in that plan's siegemaster graph |
| **17d.** operational flows leave siegemaster's track; codeweaver's reviewer settles them | plan §9h, with the fan-out rule in §4 |
| **17f.** the `(human-check)` panel | plan §10h |
| **17g.** the declared-value enumeration has drifted between author and reviewer | plan §9i |
| **17h.** motion quality is asked for and no session can deliver it | plan §10, which is the route it gets cut to |

**One of them changed shape in the move, and it is worth knowing which.** 17d's best consequence —
that an all-operational quest falls back to ONE whole-quest off-map item, so `hostile-input` and
`perf` get settled once against the running system — is recorded in that plan as an OPEN question,
because its siege planner returns `empty` on such a quest instead. 9c below still turns on that
answer.

**17e. Two of the four surfaces it needs are folded into generic entries.**
`qaCheckSurfaceStatics` lists `process-state` and `environment` as named surfaces. It has no distinct
surface for a log tail beyond the instance's own two server logs — only a generic `log-output` — and
none for a named elapsed figure, which sits inside a generic `performance` entry.


---

## 18. Delete `packages/web/test/siege-driver/` and move every caller to siegelense

**The whole directory goes. Three files, 964 lines, and siegelense already replaces each of them:**

| Delete             | Lines | What replaced it                                                                           |
|--------------------|-------|--------------------------------------------------------------------------------------------|
| `siege-lane.ts`    | 370   | `laneSpecContract` plus `laneBootBroker`, `laneSpecStatics` and `playwrightSessionAdapter` |
| `siege-driver.ts`  | 191   | the driver responders and `driverStatics`                                                  |
| `siege-command.ts` | 403   | the step verbs, all 23 of which ship (item 13)                                             |

**The replacement is not a rename, it is the generalisation.** `siege-lane.ts` hardcodes what a lane
spec holds as data, and every hardcoding the design flagged is still in it:

| Hardcoded                                                       | Where                   |
|-----------------------------------------------------------------|-------------------------|
| `SERVER_WORKSPACE` and `WEB_WORKSPACE` as literal package names | `siege-lane.ts:41-42`   |
| exactly two processes against one port pair                     | `siege-lane.ts:76`      |
| this repo's own fake-CLI env block, inline                      | `siege-lane.ts:106-113` |
| `REPO_ROOT` resolved four directories up from the file          | `siege-lane.ts:46`      |

**Nothing imports it from outside its own directory** — only `siege-driver.ts` imports its two
siblings. **But a delete is not an import question, and the references are the work.** Measured across
the repo:

| Referrer                                                                         | What it does                                                                                                                                                                                                                                                                                                                         | What the delete needs                                                                                                                                                                                 |
|----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `siegemaster-verifier-statics.ts`, `siegemaster-stress-statics.ts`               | the two walker prompts drive the lane by name                                                                                                                                                                                                                                                                                        | rewritten by the plan's step 6 — which is why that step and this item cut over together                                                                                                              |
| six files in `packages/siegelense`                                               | cite the prototype as the measured shape they generalise from, **several by line number** — `playwright-session-adapter` ("lines 204-341"), `lane-boot-broker` ("lines 59–368"), `driver-idle-wait-layer-responder` ("lines 153-171"), `driver-statics` (five separate citations), plus `lane-spec-contract` and `lane-spec-statics` | see below — this is the one that needs a decision                                                                                                                                                     |
| `packages/orchestrator/CLAUDE.md`                                                | describes the lane's location in three places                                                                                                                                                                                                                                                                                        | rewrite to name the tool                                                                                                                                                                              |
| `playbook/smoketest-instances.md`, `playbook/smoketest-orchastrator.md`          | runbooks telling a person to run `npx tsx packages/web/test/siege-driver/siege-driver.ts p1`                                                                                                                                                                                                                                         | rewrite, or a human following them hits a missing file                                                                                                                                                |
| `is-locator-pick-scope-file-guard.ts` and `rule-ban-locator-pick-broker.test.ts` | use `siege-command.ts` as the example and fixture for a path OUTSIDE the rule's scope                                                                                                                                                                                                                                                | a string fixture, so no test breaks — but both name a file that will not exist. Pick another out-of-scope path                                                                                        |
| `packages/web/test/harnesses/global-setup.ts`                                    | a comment naming `siege-lane.ts` as one of the two things minting `dm-siege-<lane>-<pid>` under `os.tmpdir()`                                                                                                                                                                                                                        | **check the behaviour, not just the comment.** `driverStatics.homePrefix` is `'dm-siege-'` too, so whatever sweeps that prefix still has something to sweep — confirm that before editing the comment |

**The line-number citations are the decision this item has to make.** Six files in `packages/siegelense`
document themselves by pointing at the prototype they generalise from, and some cite exact line ranges.
Once the prototype is gone every one of those points at nothing. **This repo's own comment rule already
answers it**: history belongs in the plan document for the change, never in a code comment. So strip
the citation and keep the RULE it was justifying — "SIGTERM, then this long a wait, then SIGKILL" is
the durable half; "matches KILL_GRACE_MS in the measured prototype" is the half that rots.

**Order matters here.** Everything else in this document is additive to the files this item moves. **Doing this item
first means doing all of them twice; doing it last means the plan's prompt rewrite
is written against a mechanism about to be replaced.** Cut the prompts and the lane spec over together.

**This item gets no help from lint, and that is measured.** `siege-lane.ts` passes
`no-hardcoded-package-names` today while hardcoding two package names, for the reason in item 11.
Whoever does this work is finding those literals by reading, not by running a check.

---

## 19. Two configuration holes

**19a. The `.siegelense` link moves, and it is still not hidden from jest or typecheck.** Two pieces
here: a move, and an exclusion hole that exists either way.

**The move.** The symlink sits at the repo root as `.siegelense` today. It becomes **
`.dungeonmaster-assets/siegelense-assets`**.

**The literal lives in exactly one place, which makes this far smaller than it looks.**
`locationsStatics.repoRoot.siegelenseLink` is `'.siegelense'`, and a lint rule enforces that values
from that module are the only legal location-shape literals repo-wide. Nothing else in the source is
allowed to spell it.

**But it cannot be one value, and that is the trap.** `locations-statics.ts` states its own rule in
its header: a value "MUST be a complete filename or dirname, something you would see whole in a
directory listing." `.dungeonmaster-assets/siegelense-assets` is a path with a separator, so it takes **two** entries —
a `dungeonmasterAssets` dirname beside the existing `siegelenseLink`, composed by
the resolver broker the way every other nested path is. Putting the joined string in as one value
breaks the module's own contract on the first read.

**Four groups of caller move with it**, and only the first is source:

| Caller                                                                                                                                                                                         | Note                                                                                                                                                                  |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| the three install responders — `install-link-create-responder` creates the link, `install-ignore-write-responder` adds the ignore entry, `array-entry-anchor-insert-layer-responder` places it | the ignore-writer works by ANCHORING on the existing `worktrees` entry and matching its shape, so the candidate list grows a nested value it has never carried before |
| `locationsRepoLinkPathFindBroker` and `repoLocalPathContract`                                                                                                                                  | these produce the repo-local path every siegelense answer hands back, so the rename changes every path a session is told to `Read`                                    |
| `packages/siegelense/CLAUDE.md`                                                                                                                                                                | a whole section heading — "Every path handed back is repo-local, through `<repoRoot>/.siegelense`"                                                                    |
| a large body of test fixtures hardcoding `/repo/.siegelense/...` as stub values                                                                                                                | string stubs, so nothing breaks at runtime — they just all read wrong. `shot-path-find`, `run-paths-find` and `snapshot-paths-find` carry the most                    |

That also gives `.dungeonmaster-assets/` its first occupant. **Item 3's oddities file is the second**,
and the design already named that directory as its home — item 3 currently records it as not existing
in the checkout, which this closes.

**One trap in the move, and it is the kind that fails silently.** `.gitignore:90` ignores
`.siegelense` today, so the obvious rewrite is to ignore `.dungeonmaster-assets/`. That is wrong. **Item 3's oddities
file lives in that same directory and has to be COMMITTED** — surviving the quest
that found it is the entire point of the file. So the ignore names the `siegelense-assets` child and
never the parent. Get it backwards and the oddities file is silently never committed, which looks from
the outside exactly like nobody ever appending to it.

**The exclusion hole the move does not fix.** `eslint.config.js` excludes the link and `.gitignore`
hides it, but neither `jest.config.base.js` nor `tsconfig.json` does. **The cause is a filename
mismatch in the installer**: the responder that would add the jest entry looks for `jest.config.js` or
`jest.config.cjs`, and this repo uses `jest.config.base.js`, so the exclusion silently never lands.
Fixing the installer is the fix; adding the entry by hand leaves the next `dungeonmaster init` in a
consumer repo with the same hole.

Why any of it matters: the link points at a tree of thousands of PNGs, and an instance's assets are not
a file tree anything should grade.

**19b. The tooling smoketest route gate is built** — `tooling-flow.ts:21` gates
`POST /api/tooling/smoketest/run` behind `TOOLING_SMOKETEST_HTTP` at registration, modelled on
`E2E_SIGNAL_BACK_HTTP`, with an absence test asserting 404 when the flag is unset. **Nothing to do.**
Recorded here because the design lists it as an open independent finding.

---

## 20. Delete the four design scrolls, and strip every code reference to them

**The scrolls go. Nothing in them needs correcting first** — the stale parts were the reason this
document exists, and this document replaces them.

| Delete                                               |
|------------------------------------------------------|
| `scrolls/seigelense/siegelense-recipe-roles.md`      |
| `scrolls/seigelense/siegelense-recipes.md`           |
| `scrolls/seigelense/siegelense-tooling.md`           |
| `scrolls/seigelense/siege-verification-remainder.md` |

**The work is in the code, not the delete.** Shipped source cites these scrolls in JSDoc, and the
worst of it cites them BY LINE NUMBER — a pointer into a file that will not exist. Every one has to
come out. The shape to look for:

| Citation shape                                   | Example                                                                                                                                     |
|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| a line number into a scroll                      | `run-result-contract.ts` — "siegelense-tooling.md line 49", `lane-spec-contract.ts` — "line 1703", `step-reading-contract.ts` — "line 2554" |
| a bare `spec lines N, M` with the scroll implied | `instance-evidence-listing-contract.ts` — "(spec lines 1180, 1188)", `instance-status-contract.ts` — "(spec lines …)"                       |
| a named section of a scroll                      | `rule-ban-locator-pick-broker.ts` — "siegelense-tooling.md's 'Holding the no-pick rule mechanically'"                                       |
| a scroll named in a package's `CLAUDE.md`        | `packages/hydration/CLAUDE.md`, `packages/hydration-recipes/CLAUDE.md` — 10c already flags one of these                                     |

**Keep the rule, drop the citation** — the same answer item 18 needs for its prototype line numbers,
and for the same reason this repo's comment rule gives: what a value IS stays, where it was once
written down does not. "`run` returns a status, never a payload" is the durable half;
"siegelense-tooling.md line 49" is the half that is about to rot.

**One consequence to accept deliberately: this file becomes the only record.** Anything in those four
scrolls that is not in here is gone with them.

---

## 21. The role rulebook — MOVED

**All of it is now the orchestrator plan, §9** — the nine rules missing from the happy walker, the
nine missing from the antagonist, the five-step rule for an implementation-detail unit,
`siegemaster-reader`, the fixer rules, the operator rules that no longer have an operator, the spec
authors' two rules, and the note that `docs { for: 'driving' }` already serves the unowned session.

**Four of those rules were settled differently in the move, and this file records how**, because each
one changes what the siegelense tool is called by and when:

| The rule as written here | How the plan settled it |
|--------------------------|--------------------------|
| every happy walk, then a STAMP, then every adversarial walk, never interleaved | **kept, as a route.** `happyWalk` routes to `adversarial`, and a step's `done` fires only when every piece at it has drained. The STAMP is that route firing, and a plan batch mixing the two steps is refused |
| the antagonist's dispatch carries the happy walk's instance and run id as its baseline | **kept.** An `adversarial` piece names `baselineFor`, the router resolves it to that happy piece's work item, and serves both ids |
| a fixer re-runs the setup on a fresh instance | **decided against.** A fixer proves its work through ward; the RE-WALK is the live proof, and it runs on the walker the fixer's `done` returns to |
| `cleanup` at the start and end of a pass, and somebody owning instance hygiene after a death | **the orchestrator's, not a session's.** `sweepIn` and `sweepOut` are deterministic steps calling `cleanup`, and the ROUTER calls `start` and `kill` around every work item that needs an instance — it was already reading `capacity`, and a reader that does not also spend is a split the two halves drift across |

**One consequence lands on the tool rather than on a prompt.** `start` and `kill` now have exactly one
caller — the orchestrator — and the walking and attacking `docs` scopes must stop teaching either
verb. A walker holding them will use them the first time something looks wrong.

---

## 22. Two product defects the trial measured, both still live

These are not tooling gaps. They are bugs in the app, found by driving it, and **nothing has picked
either up because the quest they were found on was abandoned.** Both are still reproducible.

### 22a. A nested sub-agent's body renders twice

**The symptom.** On a session view showing a nested sub-agent chain, the inner sub-agent's body renders
twice: once correctly nested, and once orphaned at the chat panel's root indent, with no header and no
duration. No console warning fires. All three arms of the trial found it independently; one measured
both rects — `x=74,y=323` nested, `x=50,y=618` orphaned.

**It is not the fixture.** `subagent-duration.harness.ts:174` writes the inner body exactly once.

**The mechanism, found in the code.**
`packages/web/src/transformers/collect-subagent-chains/collect-subagent-chains-transformer.ts` has an
unguarded path:

- line 204 — `normalBuffer.push(entry);` buffers a non-Task entry that has not been consumed yet
- lines 208-211 — `const trailingSingles: SingleGroup[] = normalBuffer.map(...); groups.push(...trailingSingles);`
  flushes the buffer unconditionally, with no filter for entries that were consumed in the meantime

So an entry buffered before its owning Task line is reached gets absorbed into a chain's `innerGroups`
**and** flushed again as an orphan single. It fires exactly when a nested sub-agent's body entry sorts
ahead of the Task line that identifies its chain — an ordering tie the harness's fixed, identical
timestamps make possible.

This is the "orphan trailing singletons below the chain header" failure that
`packages/orchestrator/CLAUDE.md:132` already names by hand.

**No test covers the failing order, and one test documents dodging it.**
`subagent-duration-nested.e2e.ts:77` explains in its own words that it names agent ids so the outer's
file sorts alphabetically first — "the arrangement every OTHER passing chain fixture in this codebase
gets by staggering timestamps instead." **Every nested fixture in the repo avoids the order that
breaks.**

**It had already been seen once before the trial.** The abandoned quest
`1dac5395-c828-4472-868c-d4a3425e43a0` carries a siegemaster note from the day before: "the
orphaned-entry failure actually hit mid-walk when the seed's agentId ordering was wrong."

**To fix:** filter consumed entries out of `normalBuffer` before the trailing flush, and write the
regression test against the ordering every existing fixture avoids — body entry before Task line.

### 22b. The create-guild form's two inputs do not share a left edge

**The symptom.** `GUILD_NAME_INPUT` sits at x=510 and `GUILD_PATH_INPUT` at x=472 — same width, 37.9px
apart. The `Name` and `Path` labels carry the same offset, so the whole row shifts.

**The mechanism, found in the code.** `packages/web/src/widgets/guild-empty-state/guild-empty-state-widget.tsx:66-88`.
Both inputs are `w={260}`, but they sit in different boxes:

| Row  | Structure                                                                                |
|------|------------------------------------------------------------------------------------------|
| Name | a bare `TextInput`, a direct child of `<Stack align="center">`                           |
| Path | a `TextInput` wrapped in `<Group gap="xs" align="flex-end">` alongside the BROWSE button |

The outer `Stack` centres each child as a whole box. The Group is wider than the lone input — input plus
gap plus button — so centring it puts its input's left edge somewhere else.

**No test asserts the two inputs share a left edge.** The widget's last commit predates the finding by
about seven months.

**This defect is the reason the whole design exists.** No JSON reading raised it: `goto` returned 200,
both inputs read `visible: true` at the correct width, every value true and none of it about the
defect. A model spotted it from the picture, and a number confirmed it. **The eye flagged it, the
measurement settled it, and neither half works alone.**

---

## 23. Already built — do not build these

**Each of these was recorded as missing, and each one is done.** The claims came from the four scrolls
item 20 deletes, and they are kept here because the delete does not make them harmless — the same
belief reaches a session through a stale `CLAUDE.md`, a half-remembered conversation, or a `Status:`
line somebody copied out before the scrolls went. **This table is the part of those scrolls most worth
surviving them.**

| Recorded as missing                                                            | Reality                                                                                                                                                                                             |
|--------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| "Two lint rules Part 5 requires are UNBUILT, and no chunk owns either"         | both exist in `@dungeonmaster/eslint-plugin`, which ships: `ban-nondeterminism-in-ingredients` and `ban-dom-handles-in-ingredients`, both registered in the plugin's rule map                       |
| The no-pick lint rule is deferred                                              | `ban-locator-pick` exists in `local-eslint`, bans `.first()`/`.last()`, allows `.nth()` only with a caller-derived argument, and states its own scope in its own message                            |
| `hydration` needs a `ban-primitives` entry with a comment                      | `eslint.config.js:229` has it, with the comment                                                                                                                                                     |
| `copies:` has no valid target for a shape an external tool writes              | `copiesTargetContract` takes a bare identifier or an `external:` prefix and refuses any value containing a slash, at module load                                                                    |
| A typed plan output is "scheduled work, not delivered yet"                     | `SavedOf<Ops>` threads saved names through the chain, and a type fixture proves `PlanOutput` types each one to its own record contract. Only the runtime zod contract is still loose                |
| A plan cannot say it needs a server before it runs                             | `planPreflightBroker` is the first line of `planRunBroker` and throws `HydrationRouteUnavailableError` naming the ingredient, its routes and what the target lacks                                  |
| A top-level row with unsatisfied `links` compiles clean and nothing refuses it | the pre-flight throws `HydrationUnlinkedRowError`, and the message names the top-level case explicitly                                                                                              |
| Two ingredients may share a name and nothing catches it                        | `RegistryDuplicateNameError`, thrown by `registryCreateBroker`, naming both keys                                                                                                                    |
| Nothing exercises every chainable over the database-backed repo                | `positive/every-chainable-db.ts` does, graded to zero diagnostics                                                                                                                                   |
| No sad path is implemented or tested                                           | most are driven against real conditions, including a real gate refusing a transition — `quest-ingredient-broker.integration.test.ts:102` asserts the full `HydrationTransitionRefusedError` message |
| `packages/hydration-recipes` might be in the root `dependencies`               | it is absent, and `siegelense-recipes-not-shipped.integration.test.ts` pins the absence                                                                                                             |
| `POST /api/tooling/smoketest/run` registers unconditionally                    | `tooling-flow.ts:21` gates it behind `TOOLING_SMOKETEST_HTTP` at registration, with an absence test asserting 404                                                                                   |
| `registry-lock-acquire-broker.ts` reads every failed lock read as absence      | it checks `cause.code === 'ENOENT'` specifically and rethrows anything else, with a test proving no loop                                                                                            |
| A `walked` kind on `questNotes` with typed ids                                 | built — `questNoteKindContract` holds `walked`, and `questNoteContract` carries typed `instanceId` and `runId`. The plan's §9l is only about making them required                                       |
| Seven of thirteen calls are built; six refuse by name                          | all thirteen route as `dungeonmaster siegelense <name>`, and the MCP layer is deleted                                                                                                               |
| Twelve step verbs kept, eleven new ones pending                                | all 23 ship, including `look`, `seed`, `until`, `health`, `hold`, `video`, `snapshot`, `reset`, `before`, `request` and `resize`                                                                    |
| The key's flags are a design                                                   | all 20 are computed, including `not-tabbable` as an honestly-labelled proxy and `invisible opacity:0`                                                                                               |
| `waitFor { ref }` is missing                                                   | resolved by decision, with the reason in the code: `ElementHandle.waitForElementState` has no `attached`/`detached`, so `waitFor` takes a target and nulls the ref                                  |
| Each of the three packages needs a `CLAUDE.md`                                 | all three exist                                                                                                                                                                                     |
| Per-sample pool size, and grouping rather than averaging                       | `profileObservationContract` carries `poolSize`, and `capacitySampleSelectTransformer` picks the matching group                                                                                     |
| Tombstones, and `pruned` answering as pruned rather than empty                 | built, with a five-state `instanceState` on every `results` answer                                                                                                                                  |

**Two more worth knowing.** Six of the seven teardown assertions run green against real spawned
drivers, including the two hardest — a SIGKILLed driver's orphans reaped by another process, and
killing one of three parallel instances without touching the other two. And `docs { for: 'driving' }`
already carries every rule a session nobody dispatched needs.
