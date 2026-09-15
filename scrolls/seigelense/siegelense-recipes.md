# Siegelense recipes

> One of three documents split out of `../siege-verification-tooling.md`. Its siblings are
> `siegelense-tooling.md` and `siege-verification-remainder.md`.
> This one holds the recipe book: what a recipe is, what holds one, how one is written, constrained,
> tested, where one lives, and how one is used at call time.

---

## Part 1 — The capabilities, and the problem each one solves

### The test lives in ONE shared place, and ChaosWhisperer reads it too

**The author needs this table at SPEC time, not the walker at walk time.** If ChaosWhisperer writes
"the transition should be smooth" with no flag, three tracks each pay to discover it cannot be automated — and each
either signs `unconfirmable` or invents a verdict. The user sees neither.

So ChaosWhisperer must be able to mark an observable human-check while authoring it, exactly as it already marks one
`verifyByReading`. That is the same capability, one route over.

**Two patterns this repo already runs make it cheap:**

| Pattern                          | What it gives                                                                                                                                                                                                                                                                                  |
|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `signoffTrackEligibilityStatics` | already THE shared definition of which units each denominator covers — "the same statics every denominator reader shares, so the ledger cannot mint an item whose work list computes as zero". The human-check route belongs in it, so dropping those units happens once rather than per track |
| `standardsReviewConcernsStatics` | already a shared prompt BLOCK interpolated into three reviewer prompts rather than copied. The decision table above goes the same way — into ChaosWhisperer's prompt AND siegemaster's, from one source                                                                                        |

**One statics, three readers: the author, the denominators, and the walker.** The author flags at spec time; the
denominators drop the unit so no track carries something it can never close; the walker gathers the evidence and routes
it to the list.

**And the shared-block rule applies with force.** The orchestrator's own prompt-editing rules say a shared block "is a
contract on every prompt that interpolates it" — an edit is unfinished until every prompt reading it still agrees. A
table that drifts between the author's copy and the walker's copy produces the worst case available: a criterion
ChaosWhisperer flagged as human-only that siegemaster believes is testable, so neither settles it and neither reports it
missing.

**The flag is `verifyByHuman: true`**, sitting beside `verifyByReading: true` on
`flowObservableContract` and reading the same way — one field, one settlement route, named for who settles it.

**Who may SET it is ChaosWhisperer and BugHunt, matching `verifyByReading`.** A mid-quest role marking its own hard
units human-check is a cheaper escape than marking them unconfirmable, and the existing rule already closes that door
for the read-check. Siegemaster may still ADD an observable it discovered — it holds that authority today — but not the
flag; if it believes a unit needs a person, that is a `questNotes` open-question and a human rules on it.

**Once the quest reaches `in_progress`, a `verifyByHuman` observable is FILTERED OUT of every work item's view.**
Codeweaver, flowrider and siegemaster must not see it at all — not in `get-quest`, not in `get-qa-checklist`, not in a
brief.

That is stronger than dropping it from a denominator, and the reason is what an agent does with a unit it can see but
cannot close. It does not skip it. It reaches for the nearest thing it CAN measure — a proxy assertion, a
change-detector, a `toSettle` naming an action nobody will take — and now the quest carries a test that pins the wrong
thing plus a session that spent a pass on it. An observable nothing downstream can act on is context that can only
mislead, so it does not travel.

It reappears in exactly one place: the list handed to the person at the end.

### The fixer writes the e2e, and the PRELUDE is what makes that possible

**A siege fixer reads code and writes tests — e2e tests, for the defects a walk found.** That is its job and it is the
only role here that writes product code as well.

**The hard part of writing that e2e was always the setup**, and the recipe book solves it by accident:
the prelude names recipes, and **a recipe is a plain function an e2e can call directly.**
`subagentDurationHarness` is pure `fs`; the HTTP-fidelity ones are a `fetch`. So the state a walk ran against and the
state its regression test runs against come from the SAME recipe, called two different ways.

That is worth naming because the alternative is what happens today: the fixer re-derives the setup in the e2e's own
idiom, gets it subtly different, and the test passes against a state the walk never saw.

| The walk used                               | The e2e uses                                     | Result                                   |
|---------------------------------------------|--------------------------------------------------|------------------------------------------|
| `seed guild-with-three-quests` in a prelude | the same recipe, called in-process from the spec | one seeding vocabulary, no re-derivation |

**The `RED FIRST` discipline is unchanged and now cheaper to satisfy.** A fixer must watch its test fail against
unchanged source for the right reason. Handed the prelude and the walk's `SAW:` value, it has the assertion and the
setup; what it has to supply is the fix.

---

## Part 2 — Restructuring the pass

### Phase zero: a PLANNER provisions the recipes — not the operator

**The operator cannot do this work, by its own rules.** Siegemaster's tool block says it drives nothing: no browser, no
`curl`, no CLI run. Proving a recipe means RUNNING it against a live instance and reading the state back. So
provisioning is dispatched, exactly as the guide already is.

**It is a distinct sub-agent from the guide-writer**, because the mandates conflict. The guide-writer is told "DO NOT
change any file but the guide · run no test · start no server" — and that constraint is load-bearing, not incidental. A
planner must write files and start an instance. Widening the guide-writer to cover both is how a bounded job stops being
bounded.

**What the planner does, WALK BY WALK:**

1. Read the checklist's `## WALK PATHS` — every route through the flow.
2. For each path, work out the state it needs to be reachable at all.
3. Match those states against existing recipes. Write a recipe for each gap.
4. **RUN the whole prelude for that path and confirm it lands where it claims.** Not each recipe alone — the SEQUENCE,
   end to end, against a throwaway instance.
5. Record the path's entry, keyed to the path.

**It validates EVERY recipe it plans to use, not only the ones it wrote.** An existing recipe is not trusted on the
grounds that it worked last quarter. Recipes are `fidelity: direct` more often than not, which means they mimic a shape
production owns and can drift from it silently — and nothing about that drift touches the feature under test, so nothing
else would have caught it. The recipe is simply out of date, and the first thing to notice is a walk that cannot start.

**Testing the SEQUENCE is what testing each recipe alone does not give you.** Three recipes that each pass in isolation
can still fail composed: one leaves state the next does not expect, an id from the first is not what the second wants,
the order matters and nobody wrote that down. The thing that has to be true is "this path is reachable", not "these
recipes run".

**And a stale recipe is nastier than a missing one, in the way this doc keeps running into.** A missing recipe fails
loudly at plan time. A stale one succeeds partially, the walk starts against a state nobody intended, and what it
reports is a defect that does not exist — a fixer briefed against a symptom, hunting in working code.

**Its cost grows with path count, and not linearly.** Ten paths means ten preludes run once each, but the planner's own
`start` calls queue behind whatever else holds the pool, so the wall-clock is longer than ten boots and shorter than ten
serial walks. Against a 20-second boot it is minutes either way — and it buys not losing a whole ROUND to a seed nobody
checked.

**Step 5 is the one that cannot be skipped, because an unproven recipe does not fail loudly — it manufactures false
defects.** A recipe that claims two rows and seeds one leaves the verifier looking at a one-row list. The verifier does
its job correctly and reports a defect. A fixer is briefed against a symptom that does not exist and goes hunting in
working code. A whole round is spent, and nothing in the record says the seed was the problem.

The quieter version is worse. A recipe seeding ONE of something an assertion must tell apart makes
"the right one" and "the first one" the same value — so an off-by-index bug passes, the walk comes back clean, and the
clean result means nothing. That is the guide's own **"TWO of anything an assertion must tell apart"** rule failing one
level below where it is written down.

**What it produces — a PRELUDE per path, runnable, and already run once:**

```
PATH 3   entry → guild selected → quest open → row expanded → chain rendered
  PRELUDE                                    ← reaching the path's entry state
    seed  guild-with-three-quests                          as: g
    seed  quest-mid-execution  guild:{g.guildId}           as: q
    goto  /{g.guildSlug}/quest/{q.questId}
    click [data-testid="EXECUTION_ROW_0"]                  ← no recipe covers this; it is a step
  MID-WALK                                   ← seeds that fire PARTWAY, not at the start
    at node  chain-rendered:
      seed  subagent-chain-arrives  quest:{q.questId}
  VERIFIED  run_7 · 2026-09-14 · prelude reached the entry, all produces: asserted
```

Three things that shape earns:

- **The prelude is a runnable batch, not prose.** It is handed to a walk and submitted, rather than described and
  re-derived. Anything the guide would have spelled out under `SEEDING` is here as steps.
- **It mixes recipes and driving steps, because reaching a state does both.** A row that must be expanded before the
  thing under test exists is not seeding and no recipe should pretend it is.
- **Mid-walk seeds are keyed to the NODE they fire at**, not appended to the end. That is the live-update shape — seed
  with the page open, watch the screen react — and a mid-walk seed recorded as part of the prelude would silently become
  a fresh-render test instead.

**`VERIFIED` names the run that proved it.** Not a claim that it should work: the id of a run where it did, on a date. A
prelude with no `VERIFIED` line is a path no walk may be sent down.

**And its outputs split along the same line as everything else here:**

| Output                  | Where it lives             | Why                                                                               |
|-------------------------|----------------------------|-----------------------------------------------------------------------------------|
| the per-path preludes   | `.quest-plans/`, per quest | they are about THIS flow's routes and are meaningless to the next quest           |
| **any recipe it wrote** | the committed recipe book  | a state worth creating once is worth creating again. This is the compounding half |

**The operator's job shrinks to what an operator does:** dispatch the planner, read what came back, and refuse to
dispatch a walk down a path whose recipe is missing or unproven. It never runs one.

**The guide-writer then runs after, and its `SEEDING` heading cites the mapping** rather than deriving commands — the
same transformation `CONTROLS` undergoes when the key arrives, and `TRAPS` when the oddities file does.

**Nothing is trusted on age.** An existing recipe gets run exactly as a new one does, because the failure this catches
is a recipe that rotted while nobody was using it. A round that STILL finds one wrong reports it, the same way it
reports a wrong guide heading — but that is the second line of defence, not the first.

### The planner reads almost no implementation — sub-agents do, for BOTH jobs

**Two jobs, one dispatch shape.** A recipe is either missing or broken, and in both cases the work is reading production
code to find out what a state really requires. The planner does neither.

| Job                                    | Input the planner supplies                                                                                 | What comes back                                                                                                     |
|----------------------------------------|------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| **research** — the state has no recipe | the state in the FLOW's own words, the package likely owning it, the recipes already nearby                | whether existing recipes already compose to it; otherwise a new recipe, its test, its `fidelity` and its `mirrors:` |
| **diagnose** — a recipe ran and failed | the recipe, its `produces:` claim, its `fidelity` and `mirrors`, **and the readings from the failing run** | what changed, the fix, and whether the break is really a finding about the app                                      |

**"Does something existing already compose to this?" is the FIRST question, not the last.** The composition rule says
the catalogue gets deeper rather than wider, and a researcher that writes a new recipe where two existing ones compose
has made the book worse while appearing productive.

**The researcher is who fills `mirrors:` correctly**, because it has just read the production writer. Left for later it
becomes a guess, and a wrong mirror pointer makes the drift test assert against the wrong thing — which is worse than
having no pointer, since it passes.

**Why the planner must not just do this itself:** it has N paths to get through. Reading the quest contract, the
work-item shape and the valid statuses to write one recipe would spend the context the remaining paths need. Same lever
every operator in this system pulls, one level down.

**There is a second reason, and it is the trial's result arriving at a different door.** Arm B read implementation and
absorbed the answers before it drove anything. A planner that reads deeply is not signing units, but it IS deciding what
state every walk starts from — and a planner steeped in what the code does will tend to set up the state the code
produces rather than the state the flow claims. Keeping it at arm's length keeps the setup answerable to the spec.

**Both jobs end the same way: the PLANNER re-runs the prelude.** A sub-agent's claim that its recipe works is not
evidence, and a research job is no different from a repair in that respect.

**Two at a time over disjoint recipes.** That mirrors a rule that already exists in siegemaster's own prompt — *"Cap two
fixers, and only over a DISJOINT file set"* — and it is stated here rather than cited loosely, because that rule lives
in the orchestrator's prompt statics and not in this document. And **depth stops** — the planner is already one level
below the operator, so neither job dispatches anything.

### What each job is bounded by

**A DIAGNOSIS is bounded, not exploratory, and `fidelity` is what bounds it:**

| The recipe declares | The diagnosis is                                                                                                                                           |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `direct`            | find the production writer whose shape it copies, and diff what that writes NOW against what the recipe writes. The recipe is a copy that stopped matching |
| `production`        | the real code path it calls changed — a route, a payload contract, a status. Read the handler                                                              |
| `captured`          | the recording is of a version that no longer exists. Re-capture, do not patch                                                                              |

**So a `direct` recipe must name what it mirrors.** Without it, every diagnosis opens with a hunt for the counterpart.
The companion plan's own example is exactly this: a web harness "hand-appends the
`event-outbox.jsonl` line that `questPersistBroker` writes in production" — so that recipe's entry reads
`mirrors: questPersistBroker`, and a diagnosing agent starts there instead of guessing.

**The brief carries what only the planner has:** the recipe as it stands, its `produces:` claim, its
`fidelity` and `mirrors`, and **the actual failure — the readings from the run that just failed**. That last part is the
difference between "this recipe is broken, go look" and a diagnosis that starts from a measured symptom.

**A RESEARCH job is bounded by the flow, not by the code.** Its input is the state in the flow's own words — "a quest
mid-execution with one running work item" — and its job is to find what that requires. Handed an implementation detail
to start from instead, it writes a recipe for whatever the code happens to do, which is the thing arm B proved is worth
avoiding.

**Sometimes the break is the correct alarm.** Three recipes failing at once because production changed what it writes is
either an intentional migration nobody told the recipe book about, or an unintentional one nobody noticed. The diagnosis
says which, and the second case is a finding about the app rather than about the recipe — it goes to the quest as an
observable, not into a recipe patch.

**This is strictly a pre-phase.** If every happy walk dispatches at once, every recipe those walks need is written,
proven and mapped before the first one goes out.

---

## Part 3 — Decisions already taken

Two halves. **3A is what the TOOL implements** — it binds whoever builds it, and stays grouped by subject. **3B is what
each ROLE is bound by** — it binds a session at run time, and is grouped by who. A builder reads 3A; a prompt author
reads 3B.

**The vocabulary these rows use is defined in `siegelense-tooling.md` Part 2**, under "Perception: three artifacts" —
**the shot** (a clean PNG, the only one that is evidence), **the map** (the same frame with numbered boxes on it), **the
key** (the text tree). Elsewhere: an **instance** is one running stack, a **run** is one submitted batch, a **recipe**
creates state, a **prelude** is the batch that reaches a path's entry, and the `video` STEP records a screencast —
distinct from a **round record**, which is the file a walk writes.

---

### 3A — What the tool implements

#### Recipes: what one is and what holds it

| Decision                                                                                                                                          | Because                                                                                                                                                                                                                                                       |
|---------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A recipe touches STATE, never a screen — held by a local lint rule, not by prose                                                                  | a recipe carrying a DOM handle is a design error, not a stale value: it means the recipe is doing a walk's job. `@dungeonmaster/local-eslint`'s `no-hardcoded-package-names` is the template — and its own blind spot is the caution to copy with it          |
| The tool is `siegelense`: `packages/siegelense/`, `dungeonmaster siegelense`, MCP tools `siegelense-*`, recipes at `packages/siegelense-recipes/` | the recipe path must be a CONVENTION because the tool enumerates them before anything is seeded. A config key is one more thing to set, get wrong and diverge on; a bare `recipes` could collide with a repo's own package, and the tool's own name cannot    |
| `packages/siegelense-recipes/` exists in EVERY repo siegelense is installed in, scaffolded by `dungeonmaster init`                                | a convention nothing creates is a convention half the repos will not have. Each package's `StartInstall` already writes what its own package needs; this is the same move                                                                                     |
| An EMPTY recipes package is a real answer where a MISSING one is not                                                                              | an empty folder says "no recipes yet"; an absent folder can only say "something is wrong", and the tool cannot tell "you have written none" from "you have not installed this". The `count: 0` ambiguity, one layer up again                                  |
| Recipes are a PACKAGE, not `.dungeonmaster-assets/`, because they are code that must be graded                                                    | being a workspace package is what gets them a ward run, and the ward run is the entire reason a recipe's test fires on the commit that breaks it. A dot-folder gets no ward, no tsconfig, no lint                                                             |
| Non-code artifacts DO go in `.dungeonmaster-assets/` — the oddities file and `captured` fixtures                                                  | the split is "does this need to compile and be graded". Prose an agent appends to does not                                                                                                                                                                    |
| `../../packages` assumes a MONOREPO — a known limit, not a settled answer                                                                         | a consumer with a flat `src/` has nowhere to put it. The package NAME is the convention; its LOCATION follows the repo's workspace layout, which dungeonmaster already detects. Staying in `../../packages` for now because the flat case has no consumer yet |
| A recipe is LISTABLE without being RUN — `produces:`, `fidelity` and `mirrors:` are static data                                                   | the listing is called before anything is seeded. One that had to execute every recipe to describe them would seed a machine just to answer a question                                                                                                         |
| It is a real workspace package, made with `dungeonmaster create-package`                                                                          | that is what gives it a ward run, which is what makes the colocated recipe tests fire on the commit that breaks them                                                                                                                                          |
| Every recipe carries a colocated integration test asserting its `produces:`                                                                       | it moves staleness from "discovered months later by whichever planner needed it" to "fails on the commit that caused it, next to the diff". The companion plan argued the same thing from the other side                                                      |
| The test owns CORRECTNESS; the planner's prelude owns FITNESS for a path                                                                          | a recipe can be perfectly correct and be the wrong recipe for path 3. And three recipes that each pass alone still fail composed. No test can know either                                                                                                     |
| A `direct` recipe's test asserts against its `mirrors:` output, not a hardcoded snapshot                                                          | a snapshot pins it to a shape somebody typed; a mirror test pins it to what production emits and fails when they diverge — which is the entire risk `direct` exists to declare                                                                                |
| Production-fidelity recipes share ONE instance for the whole suite                                                                                | one 20-second boot per recipe is a suite nobody runs. `direct` recipes need no instance at all                                                                                                                                                                |
| A recipe whose claim is about what a URL RENDERS needs a browser to assert it — the most expensive of three test costs                            | files assert with a temp dir, a route asserts with a shared server, a rendering asserts with a full instance. Narrow a claim to the cheapest tier that is still honest                                                                                        |
| A browser-asserted recipe test is DELIBERATE, because the prelude's `VERIFIED` run already covers rendering                                       | the prelude is proven by running; a recipe test that re-proves the same rendering pays twice for one fact                                                                                                                                                     |
| Recipes take their dependencies EXPLICITLY — `quest-mid-execution guild:{g.guildId}`                                                              | a recipe that silently requires a prior one is the ordering-folklore that kills a step catalogue. A parameter is the fix, and this is the guard against becoming Cucumber-with-extra-steps                                                                    |
| `fidelity` bounds the diagnosis, and a `direct` recipe must declare `mirrors:`                                                                    | the counterpart it copied is where the answer is. Without the pointer every diagnosis opens with a hunt for it                                                                                                                                                |
| A recipe never calls `Date.now()`, `Math.random()` or `randomUUID()` for anything that reaches a screen                                           | three of the four content-determinism rows reduce to this one rule, and a `fidelity: direct` recipe writing a live clock is the exact drift the marker exists to warn about                                                                                   |
| `seed` is a STEP, placed anywhere in a batch, not a prologue                                                                                      | seeding with a page already open is the only way to exercise a live-update path. A walk that always seeds up front then navigates only ever measures a fresh render                                                                                           |
| A durable, committed ODDITIES file holds driving knowledge; a round that finds a new one appends                                                  | proxies already do this for unit tests. The guide's `TRAPS` heading is the per-quest version and `.quest-plans/` is wiped, so every oddity is rediscovered at "a wrong command costs a whole round"                                                           |
| An oddity that is really an app defect gets an OBSERVABLE, not an entry                                                                           | "click the wrapper, not the label" usually means the hit area is wrong, which is a real defect for a real user. A file that only grows is a list of accepted defects                                                                                          |

---

### 3B — What each role is bound by

#### The OPERATOR — siegemaster itself

*Dispatches, reads what comes back, decides. Drives nothing.*

| Decision                                                                                                                                      | Because                                                                                                                                                                                                                          |
|-----------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A dispatched PLANNER provisions recipes — the operator never does                                                                             | the operator's own tool block forbids driving anything, and proving a recipe means running one. It is a separate sub-agent from the guide-writer, whose "change no file but the guide, start no server" mandate is load-bearing  |
| The operator's job is to dispatch the planner, read what came back, and refuse to send a walk down a path whose recipe is missing or unproven | that is what an operator does. It never runs one                                                                                                                                                                                 |
| After any instance death the operator OWNS cleanup: `status`, reap the orphans, re-read `capacity`, re-dispatch                               | it is the only session that knows which instances are legitimately alive, so it is the only one with the standing to kill anything                                                                                               |
| The operator calls `cleanup` at the START of its pass and again at the END                                                                    | start catches what a PREVIOUS pass left and makes the first `capacity` reading honest; end catches what THIS pass leaked. Two bookends, not supervision — continuous watching is a daemon, and this design has refused one twice |
| The operator opens by fetching `docs { for: 'operating' }` rather than carrying the tool's rules in its prompt                                | one source for `cleanup`, `capacity` and `status`, and a scope that cannot accidentally teach it to drive                                                                                                                        |
| NO phase advances while any instance is in an unknown state                                                                                   | stamping the happy phase and launching the antagonists while orphans hold ports and memory hands the attackers a machine already under pressure — and the first thing they measure is that pressure                              |
| The pass runs in TWO PHASES — every happy walk first, then a STAMP once they are all clean, then every adversarial walk. Never interleaved    | the STAMP is the boundary between the phases, not a phase of its own. This makes a clean baseline structural rather than a special case                                                                                          |

#### The PLANNER — dispatched, provisions the walk

*Maps every path to a prelude and proves each by running it. One level below the operator.*

| Decision                                                                                                                                       | Because                                                                                                                                                                                                                    |
|------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| The planner RUNS every recipe it plans to use — not only the ones it wrote — and asserts each `produces:` claim before any round depends on it | a `fidelity: direct` recipe mimics a shape production owns and drifts from it silently. The drift touches nothing about the feature under test, so nothing else catches it — the first symptom is a walk that cannot start |
| The planner DRIVES THE TOOL — it starts and stops instances to prove preludes — so every rule binding a walker binds it too                    | it is easy to read the planner as a paper exercise. It is not: it meets every crash, every capacity limit and every `kill` obligation a walker meets                                                                       |
| The planner's own starts QUEUE behind whatever else is running                                                                                 | proving ten preludes is ten instances over time, and if a phase is already using the pool it waits like anyone else. Its wall-clock is not linear in paths                                                                 |
| The planner tests the SEQUENCE per path, not each recipe alone                                                                                 | three recipes that each pass in isolation can fail composed: one leaves state the next does not expect, an id does not match, the order matters and nobody wrote it down. What must be true is "this path is reachable"    |
| A prelude is a RUNNABLE batch mixing recipes and driving steps, not prose                                                                      | reaching a state does both — a row that must be expanded first is not seeding, and no recipe should pretend it is                                                                                                          |
| Mid-walk seeds are recorded against the NODE they fire at                                                                                      | appended to the prelude instead, a live-update test silently becomes a fresh-render test                                                                                                                                   |
| Every prelude carries a `VERIFIED` line naming the run that proved it; a path without one is not walked                                        | not a claim that it should work — the id of a run where it did                                                                                                                                                             |
| The planner's outputs split: the path→recipe MAPPING is per-quest `.quest-plans/`, any RECIPE it wrote is committed                            | the mapping is about this flow's routes; a state worth creating once is worth creating again. The recipe is the compounding half                                                                                           |
| The planner dispatches for BOTH jobs — researching a missing recipe and diagnosing a broken one — and reads almost no implementation itself    | it has N paths to get through; reading the quest contract and work-item shape to write one recipe would spend the context the rest need                                                                                    |
| Both jobs end with the PLANNER re-running the prelude                                                                                          | a sub-agent's claim that its recipe works is not evidence, and a research job is no different from a repair in that respect                                                                                                |

#### The planner's SUB-AGENTS — researcher and diagnoser

*One reads code to write a missing recipe, the other to repair a broken one. The last level; they dispatch nothing.*

| Decision                                                                               | Because                                                                                                                                                                                            |
|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A researcher's FIRST question is whether existing recipes already compose to the state | the composition rule keeps the catalogue deep rather than wide, and a new recipe where two compose makes the book worse while looking productive                                                   |
| The researcher fills `mirrors:`, because it has just read the production writer        | left for later it is a guess, and a wrong mirror makes the drift test assert against the wrong thing — worse than no pointer, because it passes                                                    |
| A research job is briefed in the FLOW's words, never from an implementation detail     | handed the code to start from, it writes a recipe for whatever the code happens to do. That is arm B's failure arriving at a different door: the planner decides what state every walk starts from |
| The diagnosis brief carries the READINGS from the run that failed                      | otherwise it is "this is broken, go look" rather than a diagnosis starting from a measured symptom                                                                                                 |
| A break that turns out to be production changing shape is a finding about the APP      | three recipes failing at once is an intentional migration nobody told the recipe book about, or an unintentional one nobody noticed. That becomes an observable, not a recipe patch                |

#### The FIXER — a generic sub-agent the operator briefs

*Reads code, repairs the defect, and writes the e2e that keeps it fixed. The only role here that writes product code.*

| Decision                                                                                      | Because                                                                                                                                                                                                                     |
|-----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A fixer RE-RUNS THE PRELUDE on a fresh instance; it never resurrects the dead one             | "restart to check state" is a fresh instance plus a batch already proven to land where it claims. The walker's instance is gone by the time a fixer reads its record                                                        |
| `results` still answers for a KILLED instance, flagged as gone, and reading it STARTS NOTHING | the evidence lives in the instance's own directory and survives `kill`. Without this a fixer holding a run id finds it resolves to nothing, and the handoff depends on the walker having hand-copied every reading          |
| A fixer writes the e2e using **the same recipes the prelude named**                           | a recipe is a plain function a spec can call. The state the walk ran against and the state its regression test runs against then come from one source, instead of the fixer re-deriving setup that ends up subtly different |
| `RED FIRST` is unchanged: watch it fail against unchanged source, for the right reason        | handed the prelude and the walk's `SAW:` value, a fixer already has the setup and the assertion. What it must supply is the fix                                                                                             |
| A fixer touches no instance it did not start, and starts none to "look around"                | every instance is three processes against a measured pool, and a fixer exploring is a fourth nobody accounted for                                                                                                           |
| Fixers go out TWO AT A TIME, over a disjoint file set                                         | siegemaster's prompt already says "Cap two fixers, and only over a DISJOINT file set" — two processes appending to one file can silently drop an edit, with neither agent able to tell                                      |

---

## Part 4 — The determinism this system depends on

Most of this design works by **comparing two readings and calling the difference a finding**: the element delta on a
second `look`, `pixelChange` against the previous capture, a `health` reading against a baseline, a `reset` diff, `hold`
's frame comparison. Every one of those is only as good as the reproducibility underneath it.

**Where a value varies for a reason nothing in the walk caused, the difference reads as a defect** — and that is the
most expensive false result there is, because it arrives looking like evidence. A fixer gets briefed, goes hunting in
working code, and nothing in the record says the tool was the problem.

### What the CONTENT must guarantee

| Must be deterministic                                              | Why                                                                                              | What it breaks as                                                          |
|--------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| **a recipe's output bytes, for the same inputs**                   | baselines are compared ACROSS instances, which is the whole promotion mechanism                  | a baseline that never matches, so every attack reports "something changed" |
| **timestamps a recipe writes**                                     | the trial's flow is entirely durations. `4m` only reproduces because BOTH ends were fixed values | a figure that drifts per run, read as a rendering bug                      |
| **ids that PAINT**                                                 | a runtime uuid on screen breaks byte-identity                                                    | `pixelChange` never reaches 0%, so the "nothing happened" signal is dead   |
| seeding the same recipes in the same order produces the same state | otherwise a batch is not re-runnable, and step 7's re-walk proves nothing                        | a fix that "worked" against a state the re-walk never reproduced           |

**Recipes must not call `Date.now()`, `Math.random()`, or `crypto.randomUUID()` for anything that reaches a screen.**
That is the single rule behind three of those four rows, and it is checkable — a
`fidelity: direct` recipe writing a live clock is the exact drift the marker exists to warn about.

---

## Part 5 — The recipe book

**Seeding is in scope for this work.** What is out of scope is the full ownership architecture the companion plan argues
for — seeders living beside the contracts they build, a scenario layer, a
`fidelity` contract. That is a bigger change and it is not a prerequisite.

What IS a prerequisite is that **a session can put the system into a known state without deriving how every single
time.**

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

### The raw material already exists

`../../packages/web/test/harnesses` holds 35 harnesses. Counted by what they actually need:

| Group                                                                    | How many | What it means                                                                                                                                                            |
|--------------------------------------------------------------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **already free** — take `guildPath` or nothing, write through `fs`       | 12       | callable from an instance today, unchanged. `session`, `subagent-duration`, `subagent-duration-triple-chain`, `claude-mock`, `ward-mock`, `environment`, `rate-limits`   |
| **HTTP-only** — take Playwright's `request` and use it as an HTTP client | 5        | `guild`, `quest`, `dispatch`, `dispatch-pause`, `warpgate`. `guildHarness` is literally `POST /api/guilds` — swapping `APIRequestContext` for `fetch` frees it in a line |
| **page-only** — need a live browser                                      | 10       | these DRIVE or INSPECT rather than seed, and mostly belong on that side                                                                                                  |
| **page + request**                                                       | 8        | composites that seed, navigate and measure together. The seed half is extractable; the drive half stays                                                                  |

So **roughly half the harness tree is a seeder or one transport swap away from being one.** The recipe book is largely
already written — it is locked behind a fixture type most of it never uses. The companion plan measured the same thing
from the other direction: `questHarness` takes Playwright's
`request` though seven of its nine functions never touch it.

### What a recipe is

Not an API. A named, runnable thing with four properties:

| Property                                  | Why                                                                                                                                                     |
|-------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| a **name**                                | so a brief can say `seed session-with-nested-subagent` instead of describing it                                                                         |
| a **`produces:` sentence**                | what state exists after it runs, in one line, so a session picks without reading the script                                                             |
| a **fidelity** marker                     | see below — this is the one that stops a fixture lying                                                                                                  |
| **`mirrors:` where fidelity is `direct`** | the production writer whose shape it copies. It is what makes a later diagnosis bounded instead of a hunt — see the planner's diagnosis route in Part 2 |
| **returns the ids**                       | guild id, slug, quest id, session ids, URLs. A walk cannot address what it cannot name                                                                  |

**Fidelity is three values, and it is not decoration:**

| Value        | Means                                                                                            | Risk it declares                                      |
|--------------|--------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| `production` | built by calling the real code path — `POST /api/guilds` and the server does what it really does | none; this is the honest one                          |
| `direct`     | written straight to disk in the shape production *would* have made                               | **it can drift from what production actually writes** |
| `captured`   | recorded from a real run and replayed                                                            | the only one that cannot lie about shape              |

`direct` is the one that needs the warning label, and the companion plan has the live example: a web harness
hand-appends the `event-outbox.jsonl` line that `questPersistBroker` writes in production, so the two can diverge
silently. A recipe that declares `direct` tells its reader what it is trusting.

**A fabricated fixture fools flowrider and siegemaster identically**, so nothing downstream catches it. That is why the
marker rides on the recipe rather than living in someone's head.

### What makes it a book rather than a pile

**Discovery, the same "ls before the query" pattern this doc uses twice already.** `get-project-map`
before `discover`; the page key before a selector; a recipe list before a seed. A session asks what recipes exist and
gets names plus `produces:` lines — it never greps a directory hoping.

**Composition, so the catalogue gets DEEPER rather than wider.** `guild` → `quest --guild X` →
`session-with-nested-subagent --guild X`. Recipes that compose stay navigable at fifty entries; recipes that each build
a whole world do not.

**One standing rule, lifted from the guide that already states it: TWO of anything an assertion must tell apart.** With
one row, "the right one" and "the first one" are the same value, so an off-by-index bug passes and a clean walk means
nothing.

### What this changes for siegemaster

The guide's `SEEDING` heading stops being derived prose and becomes recipe NAMES — the same transformation `CONTROLS`
undergoes when the page key arrives. Both headings exist because a walk needs something it currently has to work out;
both stop being work once the running system can answer.

**Who fills the gaps is a dispatched PLANNER, at phase zero** — see Part 2. Not the operator, which drives nothing by
its own rules and so cannot prove a recipe by running it. The planner reads every path, works out which states the flow
needs, writes what is missing, and RUNS each new one against its own `produces:` line before any round is allowed to
depend on it.

### Constraints a recipe must be held to MECHANICALLY, not by prose

**A recipe touches STATE, never a screen.** It writes files and calls APIs. It has no business holding a DOM handle —
not a ref, not a selector, not a position — and it asserts nothing about what renders. The moment a recipe knows about
the UI it has become a walk, and a walk that seeds is the thing the companion plan's rule 3 forbids: *"A harness drives
or inspects a surface and may not seed."*

**"Never write a ref into a durable thing" cannot be enforced in one place, because refs leak into two different kinds
of artifact.** Enforcement is layered, and only one of the layers actually protects you:

| Layer                                                                                                                 | What it stops                                                                                   | Reaches                                          |
|-----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|--------------------------------------------------|
| **runtime** — only the minting INSTANCE holds the handles, and it invalidates them on navigation, `reset` and restart | a ref resolving anywhere it should not. Outside its instance there is nothing to look one up in | everything, including artifacts nothing can lint |
| **types** — a durable step shape that structurally omits `ref`                                                        | a saved batch being written with one                                                            | anything typed                                   |
| **lint** — a local rule over recipe files                                                                             | a recipe mentioning a DOM handle at all                                                         | source only                                      |
| prose — the prompt                                                                                                    | the rest                                                                                        | nothing, reliably                                |

**The runtime guard is the one that matters, and it is the reason the other layers can stay simple.**
Guides, round records and fixer briefs are markdown agents write DURING a pass into `.quest-plans/`, which no lint rule
will ever see. It does not need to. **A ref is resolvable only by the instance that minted it, so a ref that travels has
nowhere to land** — it fails loudly the moment somebody tries it, rather than quietly driving the wrong element. Make
the constraint self-enforcing at the point of USE and the point of writing stops mattering.

**The lint rule is worth having anyway, for recipes specifically**, because a recipe carrying a selector is a design
error rather than a stale value — it says the recipe is doing someone else's job. `@dungeonmaster/local-eslint` is the
home: repo-only, never shipped, and
`no-hardcoded-package-names` is the working template — a rule broker plus a statics file holding its watchlist and path
allowlists, registered in `../../eslint.config.js`.

**And that rule carries the caution to copy along with the shape.** Measured this session:
`siege-lane.ts` passes it while hardcoding `@dungeonmaster/server` and `@dungeonmaster/web`, because
`packageNameLiteralStatics` only matches a role-bearing name AFTER a workspace directory segment — so the `@scope/name`
form is waved through by design. **A rule that looks like it covers something and does not is worse than no rule**,
because people stop checking. Whatever this one's scope is, say it in the rule's own message.

The same mechanism carries the rest of the recipe contract, which is otherwise a convention nobody checks: a recipe
declares `produces:` and `fidelity`, and returns the ids it created. Those are contract-shaped, so a `satisfies` catches
a missing one at build time rather than at the moment a walk needs an id that was never returned.

### The oddities file — durable driving knowledge, the way proxies hold it for unit tests

**Problem.** Some things about driving an app are true forever and discoverable only by driving it:

> for THIS button, clicking the label does nothing — click the wrapper
> this panel takes ~2s to mount; asserting before it does reads as a missing element
> this control needs scrolling into view before a click lands
> `PIXEL_BTN` appears twice on this screen; the one you want is under `GUILD_SESSION_LIST`

**Unit tests already have a home for exactly this: the proxy.** `home-content-widget.proxy.tsx`
encodes "the session-list add button needs `within(GUILD_SESSION_LIST)`" so no test has to rediscover it. That knowledge
is written once and reused by everything.

**A walk has no such home, and the place it currently lands is wiped.** Siegemaster's guide has a
`TRAPS` heading — "what has bitten here before — timing, a fixture that lies, a control that needs scrolling into
view" — but a guide is written per quest, by a sub-agent, into `.quest-plans/`, and
`.quest-plans/` is gone when the quest ends. So every oddity is rediscovered by the next quest, at the cost the prompt
already names: "a wrong command costs a whole round."

**Solution — a committed file of app oddities that every walk reads and every walk can append to.**

| Property                                                                    | Why                                                                                                |
|-----------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| **durable and committed**, not `.quest-plans/`                              | the whole point is surviving the quest that found it                                               |
| keyed by testId or route, not by quest                                      | the reader is a walk on some future flow, not this one                                             |
| one line per oddity, with what it cost                                      | "click the wrapper, not the label" plus the symptom it produces when you get it wrong              |
| **a round that hits a NEW oddity appends to it**                            | knowledge compounds instead of being rediscovered. This is the difference between it and the guide |
| a round that finds an entry WRONG reports it, same as a wrong guide heading | an oddity nobody corrects is worse than none, because every walk after trusts it                   |

**The guide's `TRAPS` heading becomes a per-quest pointer at this file**, the same way `CONTROLS`
becomes the key and `SEEDING` becomes recipe names. All three headings exist because a walk needs something it has to
work out; all three stop being work once something durable answers.

**Much of what lands here should be read as a bug report about the app, not just a workaround.** "For this button, click
the wrapper" usually means the control's hit area is wrong, which is a real defect for a real user with a real mouse. An
oddity file that only ever grows is a list of accepted defects — so each entry carries whether it is a genuine quirk of
the platform or something that should be fixed, and the second kind gets an observable rather than an entry.

### Recipes carry integration tests, and that is a DIFFERENT guarantee from the planner's

**Every recipe has a colocated integration test that runs it and asserts its `produces:` claim.** The companion plan
already argued for this — "a colocated test that runs it and asserts the state it claims — 'the planner tests its own
tooling', made structural" — and the case is stronger from this side.

**It moves staleness detection from months late to the commit that caused it.** Without it, a recipe that rots is
discovered by whichever planner next happens to need it, with a broken recipe and no idea what broke it. With it, the
commit that changed `questPersistBroker` fails that recipe's test in the same ward run, next to the diff that did it.

**Three layers, and each catches something the others cannot:**

| Layer                         | Asks                                                                     | Runs                                    |
|-------------------------------|--------------------------------------------------------------------------|-----------------------------------------|
| the recipe's integration test | does this recipe still do what it CLAIMS?                                | every ward, on the commit that broke it |
| the planner's prelude run     | do these recipes COMPOSE, and does the sequence reach THIS path's entry? | plan time, per path                     |
| the walk itself               | is the state actually usable for what the path does?                     | round time                              |

**The middle layer does not become redundant, and this is the part worth being explicit about.** A recipe test proves
`produces: one guild holding three quests, one in_progress`. It cannot prove that is what PATH 3 needs — and a recipe
can be perfectly correct and simply be the wrong recipe for a path. Nor can it prove composition: three recipes that
each pass alone still fail in sequence when one leaves state the next does not expect.

So the split is **correctness versus fitness**. The test owns correctness and owns it continuously. The planner owns
fitness for a specific walk, which no test can know.

**For a `direct` recipe the test has a sharper form available, and should take it.** A recipe declaring
`mirrors: questPersistBroker` can assert its output against **what that broker actually writes**, rather than against a
hardcoded expectation. A snapshot test pins the recipe to a shape somebody typed; a mirror test pins it to the shape
production emits, and fails the moment the two diverge. Since "it is a copy that can drift silently" is the entire risk
`fidelity: direct` exists to declare, that is the test that matches the risk.

**Cost, or nobody will run it.** A `direct` recipe is pure `fs` and tests cleanly under
`installTestbedCreateBroker` with its own temp dir. A `production` recipe calls a real route and needs a server — at a
20-second instance boot, one test per recipe is 20s × N and the suite gets skipped. So the production-fidelity recipes
share ONE instance for the whole suite: boot once, run each, assert each, tear down. The `direct` ones need no instance
at all.

### The tool is `siegelense`, and its recipes live beside it

**Three fixed names, and they are conventions rather than configuration:**

| Thing              | Name                                                                                                                                                         |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| the tool's package | `packages/siegelense/`                                                                                                                                       |
| the command        | `dungeonmaster siegelense`                                                                                                                                   |
| its MCP tools      | `siegelense-start`, `siegelense-run`, `siegelense-results`, `siegelense-cleanup`, … — **thirteen of them, and `look` is NOT one**: it is a step inside `run` |
| **its recipes**    | **`packages/siegelense-recipes/`** — this exact path, in every repo it runs in                                                                               |

```
packages/siegelense-recipes/
  src/
    guild-with-three-quests/
    quest-mid-execution/
    session-with-nested-subagent/
```

**`packages/siegelense-recipes/` EXISTS IN EVERY REPO siegelense is installed in.** Not "wherever a repo chooses to put
one" — that exact path, always, including a repo that has never written a recipe.

**`dungeonmaster init` scaffolds it**, which is what makes that a fact rather than an aspiration. Each package's
`StartInstall` already writes the config its own package needs; siegelense's creates the recipes package the same way. A
convention nothing creates is a convention half the repos will not have.

**And an EMPTY recipes package is a real answer where a missing one is not.** `siegelense-recipes {}`
against an empty folder returns an empty list, which says *no recipes yet*. Against a folder that does not exist it can
only say *something is wrong*, and the tool cannot tell "you have not written any"
from "you have not installed this" — the `count: 0` ambiguity this whole design keeps running into, one layer up again.

**The recipe path has to be a convention, because the tool ENUMERATES them.** `siegelense-recipes {}`
returns every name with its `produces:` and `fidelity`, before anything has been seeded. That only works if the location
is fixed — a config key is one more thing to set, get wrong, and diverge on between repos.

**Why not just `recipes`:** a repo may plausibly have a package by that name for its own reasons, and a convention that
collides is one that breaks on somebody's real code. The tool's own name makes that essentially impossible and says who
owns the folder.

**The existing prototype files keep their names.** `../../packages/web/test/siege-driver/siege-lane.ts` and its siblings
are what exists today; they are superseded rather than renamed, and `siege-verification-remainder.md` Part 10 lists them
as scratch. `siegemaster` is unchanged too — that is the ROLE, and the tool is not named after one role any more,
because the planner, the antagonist and the fixer all drive it.

**Each recipe must be LISTABLE without being RUN.** `produces:`, `fidelity` and `mirrors:` are static data the tool
reads — never something it learns by executing. A listing that had to run every recipe to describe them would seed a
machine just to answer a question.

**Both are real workspace packages**, made the way every other one here is — `dungeonmaster
create-package` — so each gets its own tsconfig pair, its own jest config and its own ward run. That last part is what
makes the colocated recipe tests fire: they get graded by the command that grades everything else, on the commit that
breaks them.

**In a consumer repo the folder is there and the contents are theirs.** The convention travels; the recipes do not.
Nobody else has guilds and quests, and nobody else should inherit ours.

**Why a package and not `.dungeonmaster-assets/`, which is where tooling artifacts otherwise go.**
Recipes are CODE — TypeScript importing the repo's own packages, with types and colocated integration tests. Being a
workspace package is what gets them a WARD RUN, and the ward run is the entire reason those tests fire on the commit
that breaks a recipe. A dot-folder gets no ward run, no tsconfig ownership and no lint; most tooling skips dot-folders
by default, so you would end up rebuilding package infrastructure by hand inside a directory designed to be ignored.
There is also a line worth keeping clean: `../../.dungeonmaster` and `../../.dungeonmaster-dev` hold RUNTIME DATA, and
source sitting beside runtime state blurs it.

**Non-code artifacts do go there**, and the split is "does this need to compile and be graded":

| Artifact                                | Home                                                                      |
|-----------------------------------------|---------------------------------------------------------------------------|
| recipes                                 | the workspace package — they compile and are graded                       |
| the ODDITIES file                       | `.dungeonmaster-assets/` — prose an agent appends to, nothing compiles it |
| `fidelity: captured` fixtures           | `.dungeonmaster-assets/` — recorded data                                  |
| profiles, the registry, instance assets | `<home>/siege/` — runtime, not in the repo at all                         |

**`../../packages` assumes a monorepo, and that is a known limit rather than a settled answer.** A consumer with a flat
`src/` has no `../../packages` to put this in, so "the same path in every repo" is already false for that class. The
resolution is that the package NAME is the convention and its LOCATION follows whatever workspace layout the repo has —
which dungeonmaster already detects through
`workspaceDiscoverBroker` and `get-project-map`. Staying in `../../packages` is the call for now because this repo is a
monorepo and the flat case has no consumer yet.

### Some recipes' claims can only be asserted in a BROWSER

**A recipe whose `produces:` is about a URL cannot be tested by reading a file.** Most recipes write state and their
test reads it back — `subagentDurationHarness` writes JSONL, the test asserts the JSONL. But a claim like *"a URL that
renders the nested chain"* is only true if something renders it, and that needs a page.

So recipe tests come in three costs, not two:

| The claim is about      | Test needs                                  | Cost                                          |
|-------------------------|---------------------------------------------|-----------------------------------------------|
| files on disk           | `installTestbedCreateBroker` and a temp dir | cheap, no instance                            |
| a real route's response | a server                                    | one shared instance for the whole suite       |
| **what a URL RENDERS**  | a server AND a browser                      | a full instance, and the slowest of the three |

**That third row is where a recipe starts overlapping a walk**, and the line stays where it was: the recipe creates the
state and hands back the URL; the PRELUDE does the `goto`. A recipe that navigates has taken a walk's job, and the rule
"a recipe touches state, never a screen" still holds — what the third row means is only that PROVING its claim needs a
screen, not that the recipe drives one.

**The practical effect is that a browser-asserted recipe test is expensive enough to be deliberate.**
Where a claim can be narrowed to "this file exists with this shape", narrow it — and let the prelude's own `VERIFIED`
run cover whether the URL then renders. The prelude is already proven by running, so a recipe test that re-proves the
rendering is paying twice for one fact.

### On the resemblance to Cucumber

**It is real and worth naming, because the thing it resembles has a well-known way of dying.** Named reusable setup
steps, a `produces:` sentence per step, a declarative sequence a session composes — that is Given/When/Then with the
serial numbers filed off.

**What was deliberately not taken:**

| Cucumber has                                                    | Here                                                                                                               |
|-----------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| a natural-language layer, steps matched by regex or expressions | no parsing. A prelude step is data with a name, and the name is a lookup, not a pattern                            |
| business-readable specs as the selling point                    | the reader is a MODEL. Readability matters for the same reason, but nobody is pitching this to a stakeholder       |
| a shared mutable `World` object                                 | recipes return typed ids, and later steps reference them by name — `{g.guildId}`, not a bag everything writes into |

**The failure mode to actually watch for is the one Cucumber suites die of: a catalogue of steps that composes correctly
only if you know unwritten ordering rules.** Someone writes `given a guild` and
`given a quest`, and six months later nobody can tell you whether the second assumes the first, because the knowledge
lives in whichever scenario happened to work.

**Three things here are the guard, and all three already exist for other reasons:**

- **A prelude is RUN, not assumed.** `VERIFIED` names the run that proved this sequence lands where it claims. An
  ordering rule nobody wrote down fails at plan time rather than surviving as folklore.
- **Recipes take their dependencies explicitly.** `quest-mid-execution guild:{g.guildId}` says what it needs. A recipe
  that silently requires a prior one is the ambiguity, and a parameter is the fix.
- **`produces:` is data the tool reads, not prose in a feature file.** It cannot drift from the code the way a Gherkin
  sentence drifts from its step definition, because the listing and the runner read the same declaration.

### Guidance for other repos

**The convention ships; the recipes do not.** Another repo's states are its own — nobody else has guilds and quests.
What travels is:

- recipes are discoverable by name, not by grepping a test tree
- each declares `produces:` and `fidelity`
- each returns the ids a walk needs to address what it made
- they compose rather than duplicate
- two of anything an assertion must distinguish

That is a convention plus a listing mechanism, not a package abstraction — which is deliberately short of the ownership
architecture the companion plan wants, and enough to stop every walk re-deriving its own setup.

---

## Part 6 — The surface, consolidated

`siegelense-tooling.md` Parts 1 and 2 say WHY each of these exists. This is the lookup table. Status is against what
sits in
`../../packages/web/test/siege-driver` today.

### The package needs a `../../CLAUDE.md`, and these are the entries

`../../packages/orchestrator/CLAUDE.md` and `../../packages/web/CLAUDE.md` are the pattern — package invariants with the
measurement behind each one. This package needs the same. **The entries below are the rules above this line, compressed
into the form a session editing the package will actually read**, plus the two that live nowhere else:

| Entry                                                                                                 | Why it earns a line                                                                                                                                                                                    |
|-------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Never `.first()` / `.last()` in a command. Ambiguity THROWS, and the error carries the candidates** | the obvious line to write is the wrong one, and the lint rule's message should point here                                                                                                              |
| **Never `querySelector` in eval source — `querySelectorAll` and count**                               | singular silently returns match one; lint cannot see inside the template literal                                                                                                                       |
| **A command returns a READING, never a verdict on a unit**                                            | the founding rule from `siege-command.ts`'s own header. Comparing two measured values is a reading; deciding a unit passes is not                                                                      |
| **The key reads OWN text nodes, never `textContent`**                                                 | recursive text pulled an entire Mantine stylesheet into one reading. This is the single measured reason the old `dom` verb was unusable                                                                |
| **A ref resolves only in its minting instance and page state**                                        | four boundaries look passable and none are; see the ref rule below                                                                                                                                     |
| **A recipe touches state, never a screen**                                                            | a recipe holding a DOM handle is doing a walk's job                                                                                                                                                    |
| **`run` returns a status; `results` returns payloads**                                                | collapsing them walks back into the 50,000-char ceiling the service exists to route around                                                                                                             |
| **Kill the process GROUP, not the child — and skip the signal for one that already exited**           | `npm run` is a wrapper; the listener is a grandchild via `sh -c`. And signalling a dead child logs `kill ESRCH` on every clean teardown, which reads as a failure in the one log a later session opens |
| **`kill` removes the throwaway home and never the evidence directory**                                | logs, captures and the transcript are evidence and outlive the instance                                                                                                                                |
| **`dev:no-watch`, never `dev`, for the lane's API server**                                            | `--conditions=source` puts every `packages/*/src` file in the watcher's graph; one save anywhere restarts the server and Vite's `/api` proxy answers with a bare 500 for ~1.5s                         |

---

### The calls this document uses

**Every tool below is registered as `siegelense-<name>`** — `siegelense-start`, `siegelense-run`, and so on. The
examples drop the prefix for readability; there is no bare `start` tool. **Steps are not tools**: `look`, `click`,
`health` and the rest are values inside `run`'s `steps` array, which is the whole point of the bounded-tool-surface
decision in `siegelense-tooling.md` Part 1.

**`recipes`** — what states can be created. No instance needed.

```
recipes {}
→ session-with-nested-subagent   produces: one session transcript holding an outer sub-agent
                                 chain with one chain nested inside it, both finished
                                 fidelity: direct
  guild-with-three-quests        produces: one guild holding three quests, one in_progress
                                 fidelity: production
```

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

**`seed`** — runs a recipe against this instance and returns the ids it made.

```
{ step: 'seed', recipe: 'session-with-nested-subagent', as: 'seeded' }
→ { guildSlug: 'siege-1', sessions: { nested: '/siege-1/session/sess-nested' } }
```

---

### A worked batch

This is the call a session actually makes. One `run`, five steps, one turn.

```jsonc
run {
  instance: 'inst_7f3a',
  stopOn: 'error',              // 'error' | 'never' — stop at the first failure, or push through
  steps: [
    { step: 'seed',  recipe: 'session-with-nested-subagent', as: 'seeded' },
    { step: 'goto',  path: '{seeded.sessions.nested}' },
    { step: 'until', visible: '[data-testid="SUBAGENT_CHAIN"]', timeoutMs: 20000 },
    { step: 'look',  within: 'SUBAGENT_CHAIN' },
    { step: 'dom',   target: '[data-testid="subagent-chain-duration"]' },
  ],
}
```

**`as` names a step's output; `{name.field}` reads it back.** A seed mints runtime ids that no file contains, so later
steps must be able to reference them without a round trip to the model.

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
    { step: 'seed',  recipe: 'guild-with-three-quests', as: 'g' },

    { step: 'goto',  path: '/{g.guildSlug}' },
    { step: 'look' },                       // mints the refs the next line uses
    { step: 'click', ref: 18 },             // live-session shortcut; would be a selector if this batch were saved

    { step: 'seed',  recipe: 'session-with-nested-subagent', guild: '{g.guildId}', as: 's' },
    { step: 'goto',  path: '{s.sessions.nested}' },
  ],
}
```

The second recipe takes `guild: '{g.guildId}'`. That is the composition rule from Part 5 doing its job: a recipe stacks
onto what an earlier one made rather than building a whole world of its own, which is what keeps the catalogue deep
instead of wide.

**Seeding while a page is OPEN is not a convenience — it is the only way to test a whole class of behaviour.** This app
pushes `quest-modified` over a websocket, so a walk that always seeds up front and then navigates never exercises the
live-update path at all; it only ever measures a fresh render. Seeding mid-batch with the page already loaded is how you
ask whether the screen reacts:

```jsonc
steps: [
  { step: 'goto',  path: '/{g.guildSlug}/quest/{g.questId}' },
  { step: 'look' },                                            // what is on screen now
  { step: 'seed',  recipe: 'quest-advances-one-step', quest: '{g.questId}' },
  { step: 'until', predicate: 'document.querySelectorAll("[data-testid=EXECUTION_ROW]").length === 4' },
  { step: 'look' },                                            // and what changed
]
```

Two `look` calls either side of a seed, with an `until` between them, is the shape for any
"the screen updates when the data does" unit. The element delta on that second `look` IS the answer — and `+0 -0` is the
defect, reported rather than inferred.

**A seed that changes state under a page NOT driven by a socket needs a reload**, or the walk measures a stale render
and reports a defect that only exists in the browser's memory. Which of the two a surface is belongs in the guide, not
in a session's guess.
