# Siegelense recipes — the ROLE rules

> Split out of `siegelense-recipes.md`, which is the BUILD specification. Nothing here is code in that
> feature. Every rule below binds a SESSION at run time — siegemaster, its dispatched planner, that
> planner's sub-agents, or a fixer — and lands as prompt text in `@dungeonmaster/orchestrator`'s
> statics.
>
> **Do not read this while building the packages.** It is the pass that comes after they exist.

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
the prelude names recipes, and **a recipe returns a PLAN an e2e can run directly.** An ingredient's `write` route is pure
`fs`; its `api` route is a `fetch`. So the state a walk ran against and the state its regression test runs against
come from the SAME plan, handed two different targets.

That is worth naming because the alternative is what happens today: the fixer re-derives the setup in the e2e's own
idiom, gets it subtly different, and the test passes against a state the walk never saw.

| The walk used                               | The e2e uses                                     | Result                                   |
|---------------------------------------------|--------------------------------------------------|------------------------------------------|
| `seed guild-mid-execution` in a prelude | the same plan, run in-process from the spec | one seeding vocabulary, no re-derivation |

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
grounds that it worked last quarter. Ingredients carry a `write` route more often than not, which means they mimic a shape
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
    seed  guild-mid-execution                              as: g
    seed  quest-mid-execution  guild:{g.guild.id}         as: q
    goto  /{g.guild.urlSlug}/quest/{q.quest.id}
    click [data-testid="EXECUTION_ROW_0"]                  ← no recipe covers this; it is a step
  MID-WALK                                   ← seeds that fire PARTWAY, not at the start
    at node  chain-rendered:
      seed  subagent-chain-arrives  quest:{q.questId}
  VERIFIED  run_7 · 2026-09-14 · prelude reached the entry, every plan's output asserted
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
| **research** — the state has no recipe | the state in the FLOW's own words, the package likely owning it, the recipes already nearby                | whether existing ingredients already compose to it; otherwise a new ingredient, its test, its `routes` and its `copies:` |
| **diagnose** — a recipe ran and failed | the recipe, the plan it produced, the failing ingredient's `routes` and `copies:`, **and the readings from the failing run** | what changed, the fix, and whether the break is really a finding about the app                                      |

**"Does something existing already compose to this?" is the FIRST question, not the last.** The composition rule says
the catalogue gets deeper rather than wider, and a researcher that writes a new recipe where two existing ones compose
has made the book worse while appearing productive.

**Writing a RECIPE and writing an INGREDIENT are different jobs, and only the second is worth a dispatch.** A recipe is
composition — existing ingredients, a count, a transition, a filter — and the planner writes one itself in a few lines
without reading any production code. An ingredient is the expensive half: it means reading the production writer to
learn what the row really needs, declaring its `links`, its `routes` and what a `write` route `copies:`, and proving it
with a colocated test.

| The gap is | Who does it |
|---|---|
| a state that existing ingredients compose to | the PLANNER, in the recipe itself |
| a state needing an entity nothing declares yet | a dispatched RESEARCHER, which writes the ingredient and its test |

**Dispatching for a recipe is the waste this split removes.** It costs a whole sub-agent to compose three calls the
planner was already holding the pieces for.

**The researcher is who fills `copies:` correctly**, because it has just read the production writer. Left for later it
becomes a guess, and a wrong `copies:` pointer makes the drift test assert against the wrong thing — which is worse
than having no pointer, since it passes.

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

**A DIAGNOSIS is bounded, not exploratory, and the failing ROUTE is what bounds it:**

| The route that failed | The diagnosis is |
|---|---|
| `write` | find the `copies:` target and diff what it writes NOW against what the ingredient writes. The ingredient is a copy that stopped matching |
| `api` | the real code path it calls changed — a route, a payload contract, a status. Read the handler |
| `recording` | the recording is of a version that no longer exists. Re-capture, do not patch |

**So a `write` route must name what it copies.** Without it, every diagnosis opens with a hunt for the counterpart.
`siege-verification-remainder.md`'s own example is exactly this: a web harness "hand-appends the
`event-outbox.jsonl` line that `questPersistBroker` writes in production" — so that ingredient reads
`copies: 'questPersistBroker'`, and a diagnosing agent starts there instead of guessing.

**A two-route ingredient narrows it further before anyone reads anything.** Run both routes and compare: agreeing routes
mean the drift is not here, and disagreeing ones name the field that moved.

**The brief carries what only the planner has:** the ingredient as it stands, the plan it produced, its `routes` and
`copies:`, and **the actual failure — the readings from the run that just failed**. That last part is the
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
| The planner RUNS every recipe it plans to use — not only the ones it wrote — and asserts what each one claims before any round depends on it | an ingredient's `write` route mimics a shape production owns and drifts from it silently. The drift touches nothing about the feature under test, so nothing else catches it — the first symptom is a walk that cannot start |
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
| The researcher fills `copies:`, because it has just read the production writer | left for later it is a guess, and a wrong `copies:` pointer makes the drift test assert against the wrong thing — worse than no pointer, because it passes |
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

**An ingredient must not call `Date.now()`, `Math.random()`, or `crypto.randomUUID()` for anything that reaches a screen.**
The chain supplies the index an ingredient varies by, so that rule plus a lint rule over one folder closes everything the
INGREDIENT controls.

**It does not close everything, and the gap is not small.** Measured in this repo: `guild-add-broker.ts:35` is
`const id = crypto.randomUUID();`, and `quest-hydrate-broker.ts` mints a work-item id the same way at line 131 and stamps
`new Date().toISOString()` at line 88. **Both routes call production code, so an ingredient can obey the rule perfectly and
still emit different bytes on every run.** No lint rule over the recipes folder can reach a uuid minted three packages away.

**So the rule that actually holds is narrower, and it is about PAINTING, not about calling:**

> **Every value that reaches a screen must be SUPPLIED, not minted.** A uuid nothing renders may be random. A uuid that
> appears in a row, a URL or a title may not.

That turns determinism into a per-value question with three answers:

| The painted value | What the ingredient does |
|---|---|
| production accepts an override — `questHydrateBroker`'s `fixedQuestId` | supply it from the index |
| production mints it and nothing renders it | leave it alone |
| production mints it AND it paints, with no override | **this is a defect in the app, not in the ingredient** — it gets an observable, and until it is fixed no baseline over that screen can reach zero |

**The third row is the one to go looking for before trusting any baseline.** `quest-hydrate-broker.ts:131` is already an
instance: a work-item id with no override at all, rendered in the execution panel.

---

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

| Property | Why |
|---|---|
| **durable and committed**, not `.quest-plans/` | the whole point is surviving the quest that found it |
| keyed by testId or route, not by quest | the reader is a walk on some future flow, not this one |
| one line per oddity, with what it cost | "click the wrapper, not the label" plus the symptom it produces when you get it wrong |
| **a round that hits a NEW oddity appends to it** | knowledge compounds instead of being rediscovered. This is the difference between it and the guide |
| a round that finds an entry WRONG reports it, same as a wrong guide heading | an oddity nobody corrects is worse than none, because every walk after trusts it |

**The guide's `TRAPS` heading becomes a per-quest pointer at this file**, the same way `CONTROLS`
becomes the key and `SEEDING` becomes recipe names. All three headings exist because a walk needs something it has to
work out; all three stop being work once something durable answers.

**Much of what lands here should be read as a bug report about the app, not just a workaround.** "For this button, click
the wrapper" usually means the control's hit area is wrong, which is a real defect for a real user with a real mouse. An
oddity file that only ever grows is a list of accepted defects — so each entry carries whether it is a genuine quirk of
the platform or something that should be fixed, and the second kind gets an observable rather than an entry.
