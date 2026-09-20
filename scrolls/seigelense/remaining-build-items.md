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
| **The prompts**           | 1, 21             | the biggest gap. No siege prompt knows the tool exists                                                                   |
| **Spec-side work**        | 17                | quest-record fields, the checklist, one role that does not exist, and operational flows moving off siege                 |
| **The human-check route** | 2                 | a whole settlement route, nothing built                                                                                  |
| **The oddities file**     | 3                 | durable driving knowledge, nothing built                                                                                 |
| **The recipe framework**  | 4, 5, 7, 8, 12    | two missing verbs, a route nobody has run, three values the app randomises on screen, defects in this repo's own recipes |
| **The migration**         | 6                 | about two-thirds done, with a measurable running mark                                                                    |
| **The tool**              | 9, 13, 14, 15, 16 | the element delta, settle-based stepping, retention                                                                      |
| **Structural**            | 18                | deleting the old lane driver, and why its ordering matters                                                               |
| **Housekeeping**          | 10, 11, 19, 20    | rename leftovers, a misleading lint rule, config holes, stale docs                                                       |
| **Product defects**       | 22                | two live bugs the trial measured, both with a named mechanism                                                            |
| **Do not rebuild**        | 23                | things recorded as missing that are in fact done                                                                         |

## What order to do this in

**Item 18 first, with item 1.** Everything else is additive to the files item 18 moves, so doing it
late means doing those items twice — and the prompts in item 1 currently drive the mechanism item 18
replaces. Cut them over together.

**Then items 13 and 14**, the element delta and settle-based stepping. They are the two functional gaps
the rest of the tool leans on: the element delta because four separate mechanisms are incomplete
without it, and settle because a clock-based step makes the same batch produce different findings on
different days.

**Item 2 is a vertical slice** — a contract field, a denominator rule, a filter, a shared prompt block,
a citation kind and a web panel. Do it in one pass or not at all; half of it leaves an unclosable unit
visible to an agent that will invent a verdict for it.

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
That is the single biggest gap in this document.

---

## 1. The prompt layer does not know siegelense exists

**This is the headline finding.** Four siege prompts exist in `packages/orchestrator/src/statics/`:

| Prompt                            | What it is             |
|-----------------------------------|------------------------|
| `siegemaster-prompt-statics.ts`   | the operator           |
| `siegemaster-verifier-statics.ts` | the happy-path walker  |
| `siegemaster-stress-statics.ts`   | the adversarial walker |
| `siegemaster-reviewer-statics.ts` | grades repairs         |

A search across every orchestrator prompt for the words `siegelense`, `recipe` and `instance`
returns nothing. All four prompts are built around an older, separate mechanism called a **lane** — a
file-command-driven trio of headless Chromium, an API server and Vite, living in
`packages/web/test/siege-driver/`. None of them can call the tool that was built, and **item 18
deletes that directory**, which is why these two items cut over together.

So every item below is a prompt that must be written or rewritten.

### 1a. The GUIDE-WRITER provisions the recipes, and it does not exist in this shape

Phase zero of a pass. The operator dispatches ONE role, and that role writes the guide AND provisions
every recipe the walks will need. This is the session the tool's `docs { for: 'planning' }` scope
already addresses as "the planner".

**Why the operator cannot do it itself:** the operator's tool block forbids it from driving anything —
no browser, no `curl`, no CLI. Proving a recipe means running it against a live instance and reading
the state back. So the work has to be dispatched.

**Why it is ONE role and not two.** The guide's `SEEDING` heading and the recipe set answer the same
question: how a walk reaches the state each path starts from. Split them, and one session writes the
heading while another owns the thing it cites — which is a drift with nothing watching it. What has to
go is the guide-writer's mandate as it stands today: "change no file but the guide, run no test, start
no server" forbids exactly the work that proves a recipe.

**Its deliverable is a COMPLETE recipe set for its whole domain, proven by running it.** Every path
through every flow its operator owns gets a SETUP — the runnable batch that carries a fresh instance
to that path's entry state — every setup names only recipes that exist, and every one of those recipes
is run during this pass. A path left without a proven setup is a path no walk may be sent down, so a
gap here does not degrade the pass — it removes coverage from it.

What the guide-writer does, walk by walk:

1. Read the checklist's `## WALK PATHS` — every route through the flow.
2. For each path, work out the state that makes it reachable.
3. Match those states against existing recipes.
4. **Make every recipe the set is missing.** Two routes, and step 3's answer picks between them:
   where existing ingredients compose to the state, the guide-writer writes the recipe itself in a
   few lines; where the state needs an entity nothing declares yet, it launches ONE **`guide-recipe-writer`** per
   missing recipe (1b below). Neither route is optional, and "no recipe
   covers this path" is not an outcome this role may return.
5. **Run every recipe the set uses — the ones it wrote and the ones it found alike — as the SEQUENCE
   the setup submits**, against a throwaway instance, and confirm it lands where it claims. Not
   each recipe alone; the sequence, end to end.
6. Write the path's setup into the guide, keyed to the path.

**Step 5 is the one that cannot be skipped.** An unproven recipe does not fail loudly, it manufactures
false defects. A recipe that claims two rows and seeds one leaves the verifier looking at a one-row
list. The verifier reports a defect correctly. A fixer is briefed against a symptom that does not
exist and hunts in working code. A whole round is spent and nothing in the record says the seed was
the problem.

The quieter version is worse. A recipe seeding *one* of something an assertion must tell apart makes
"the right one" and "the first one" the same value, so an off-by-index bug passes and the clean result
means nothing.

**It runs every recipe it uses, not only the ones it wrote.** An ingredient's `write` route mimics a
shape production owns and can drift from it silently. Nothing about that drift touches the feature
under test, so nothing else catches it.

**What it produces — one setup per path, runnable, already run once:**

```
PATH 3   entry → guild selected → quest open → row expanded → chain rendered
  SETUP                                      ← reaching the path's entry state
    seed  guild-mid-execution                              as: g
    seed  quest-mid-execution  guild:{g.guild.id}          as: q
    goto  /{g.guild.urlSlug}/quest/{q.quest.id}
    click [data-testid="EXECUTION_ROW_0"]                  ← no recipe covers this; it is a step
  MID-WALK                                   ← seeds that fire PARTWAY, not at the start
    at node  chain-rendered:
      seed  subagent-chain-arrives  quest:{q.questId}
  VERIFIED  run_7 · 2026-09-14 · setup reached the entry, every plan's output asserted
```

Three properties that shape has to hold:

- **The setup is a runnable batch, not prose.** It is submitted to a walk, not described and
  re-derived.
- **It mixes recipes and driving steps.** A row that must be expanded before the thing under test
  exists is not seeding, and no recipe should pretend it is.
- **Mid-walk seeds are keyed to the node they fire at**, not appended to the end. A mid-walk seed
  recorded as part of the setup silently turns a live-update test into a fresh-render test.

**`VERIFIED` names the run that proved it** — the id of a run where it worked, and a date. A setup
with no `VERIFIED` line is a path no walk may be sent down.

**Its outputs split:**

| Output              | Where it lives             | Why                                                                 |
|---------------------|----------------------------|---------------------------------------------------------------------|
| the per-path setups | `.quest-plans/`, per quest | they describe this flow's routes and mean nothing to the next quest |
| any recipe it wrote | the committed recipe book  | a state worth creating once is worth creating again                 |

### 1b. The guide-writer's one sub-agent, which does not exist

The guide-writer reads almost no implementation itself. It has a whole flow's worth of paths to get
through, and reading the quest contract and the work-item shape to write one recipe would spend the
context the remaining paths need. So it launches a **`guide-recipe-writer`**.

**One `guide-recipe-writer` per recipe.** Three recipes missing is three launches, not one agent
handed three jobs. An agent given a batch optimises for getting through the batch, and the thing it
drops first is the colocated test — which is the only evidence the recipe works.

**That agent owns its recipe end to end, including the diagnosis when it fails.** It writes the recipe,
and when the guide-writer's step-5 run does not land, the SAME agent works out why and repairs it. A
failing recipe is never passed to a second agent: the one that wrote it is already holding the
production writer it read, the `routes` it declared and the `copies:` it filled, and a fresh agent
pays to re-read all of it before it can say anything. A recipe that already existed and failed gets a
`guide-recipe-writer` of its own on the same terms.

| The recipe is                                   | What the guide-writer supplies                                                                                           | What comes back                                                                                                  |
|-------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| **missing**                                     | the state in the flow's own words, the package likely owning it, the recipes already nearby                              | whether existing ingredients compose to it; otherwise a new ingredient, its test, its `routes` and its `copies:` |
| **failing** — it ran in step 5 and did not land | the recipe, the plan it produced, the failing ingredient's `routes` and `copies:`, and the readings from the failing run | what changed, the fix, and whether the break is really a finding about the app                                   |

Rules the prompt has to carry:

- **A `guide-recipe-writer`'s first question is whether existing recipes already compose to the
  state.** A new recipe where two compose makes the book worse while looking productive.
- **The `guide-recipe-writer` fills `copies:`**, because it has just read the production writer. Left
  for later it is a guess, and a wrong `copies:` pointer makes the drift test assert against the wrong
  thing — worse than no pointer, because it passes.
- **A `guide-recipe-writer` is briefed in the flow's words, never from an implementation detail.**
  Handed the code to start from, it writes a recipe for whatever the code happens to do. The
  guide-writer decides what state every walk starts from, so it has to stay answerable to the spec.
- **The diagnosis brief carries the readings from the run that failed.** Otherwise it is "this is
  broken, go look" rather than a diagnosis starting from a measured symptom.
- **A break that turns out to be production changing shape is a finding about the app**, not a recipe
  patch. It becomes an observable.
- **Writing a recipe is not worth a launch; writing an ingredient is.** A recipe is composition and
  the guide-writer writes one itself in a few lines. An ingredient means reading the production
  writer, declaring `links`, `routes` and `copies:`, and proving it with a colocated test.
- **Two at a time.** One agent per recipe makes disjointness structural — no two of them ever hold the
  same file — so the cap is no longer about collisions. What it bounds is how many returns the
  guide-writer has to read and re-prove in one go, which is the same reason siegemaster's own prompt
  already caps two fixers. Depth stops here: a `guide-recipe-writer` launches nothing.
- **Every return ends with the GUIDE-WRITER re-running the setup.** A sub-agent's claim that its
  recipe works is not evidence, and that is as true of a repair as of a first draft.

A `guide-recipe-writer` diagnosing its own recipe is bounded by the route that failed:

| Route that failed | The diagnosis is                                                                         |
|-------------------|------------------------------------------------------------------------------------------|
| `write`           | find the `copies:` target and diff what it writes now against what the ingredient writes |
| `api`             | the real code path changed — a route, a payload contract, a status. Read the handler     |
| `recording`       | the recording is of a version that no longer exists. Re-capture, do not patch            |

**That third row is not performable today, and 5c is where that gets settled.** Nothing on a
`recording` route records which version it was captured against, so "of a version that no longer
exists" is a conclusion with nothing behind it. Write this row into the prompt only once 5c has given
a recording something to check.

A two-route ingredient narrows it further before anyone reads anything: run both routes and compare.
Agreeing routes mean the drift is not here; disagreeing ones name the field that moved.

### 1c. The guide's three headings still derive what something durable now answers

All three headings exist and all three are the old design.

| Heading    | What it says today                                                                                                        | What it must become                                              |
|------------|---------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `SEEDING`  | "how to create the data each path needs, as commands or requests that actually work" — the writer derives it              | cite the path→recipe mapping this same role just proved in 1a    |
| `CONTROLS` | "the test id or selector for every control the paths touch"                                                               | cite the **key** — the text tree of the screen the tool produces |
| `TRAPS`    | "what has bitten here before — timing, a fixture that lies, a control that needs scrolling into view" — derived per quest | point at the committed oddities file (item 3 below)              |

All three exist because a walk needs something it has to work out. All three stop being work once
something durable answers.

### 1d. Operator rules — none present, two actively contradicted

| Rule                                                                                                        | State today                                                                                                                                                                        |
|-------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Call `cleanup` at the START of the pass and again at the END                                                | not present; no cleanup concept in the prompt                                                                                                                                      |
| Open by fetching `docs { for: 'operating' }` rather than carrying the tool's rules in the prompt            | not present. 1g has the whole family and the measurement                                                                                                                           |
| Run the pass in TWO PHASES — every happy walk, then a STAMP, then every adversarial walk, never interleaved | **contradicted.** `siegemaster-prompt-statics.ts:340` dispatches the verifier and stress tester together: "Both go out in ONE message, one `Agent` call each — that is the round." |
| No phase advances while any instance is in an unknown state                                                 | not present; no instance state machine, only lanes                                                                                                                                 |
| After an instance death the OPERATOR owns cleanup: `status`, reap orphans, re-read `capacity`, re-dispatch  | **contradicted.** `siegemaster-prompt-statics.ts:150` gives recovery to the minion: "the minion that started it starts a fresh one under a new name, never you"                    |
| Refuse to dispatch a walk down a path whose recipe is missing or unproven                                   | not present; no recipe concept in the prompt                                                                                                                                       |

The reasons, in short: two bookends of `cleanup` make the first `capacity` reading honest and catch
what this pass leaked, without a daemon watching continuously. Fetching `docs` gives one source for
the tool's rules and a scope that cannot accidentally teach the operator to drive. The two-phase split
makes a clean baseline structural rather than a special case. Advancing while instances are unknown
hands the antagonists a machine already under pressure — and pressure is the first thing they measure.
The operator is the only session that knows which instances are legitimately alive, so it is the only
one with standing to kill anything.

### 1e. Fixer rules — two built, two missing, one contradicted

| Rule                                                                                | State today                                                                                                                           |
|-------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `RED FIRST` — watch a real test fail against unchanged source, for the right reason | **built**, verbatim at `siegemaster-prompt-statics.ts:667`                                                                            |
| Cap two fixers, only over a disjoint file set                                       | **built**, verbatim at `siegemaster-prompt-statics.ts:374`                                                                            |
| A fixer touches no instance it did not start                                        | **built** under the old vocabulary — the fixer starts zero lanes, period                                                              |
| A fixer RE-RUNS THE SETUP on a fresh instance                                       | **contradicted.** `siegemaster-prompt-statics.ts:674` forbids it from touching any lane "not start, not stop, not restart, not drive" |
| A fixer writes the e2e using the same recipes the setup named                       | missing; no recipe concept                                                                                                            |

The last one is the point of the whole recipe book for a fixer. **The hard part of writing a
regression e2e was always the setup.** A recipe returns a plan, an ingredient's `write` route is pure
`fs` and its `api` route is a `fetch`, so the state a walk ran against and the state its regression
test runs against come from the same plan handed two different targets. The alternative is what
happens today: the fixer re-derives the setup in the e2e's own idiom, gets it subtly different, and
the test passes against a state the walk never saw.

The plumbing for this is already built (see item 4). Only the instruction is missing.

**One dependency this rule has on the tool:** `results` must still answer for a killed instance,
flagged as gone, and reading it must start nothing. The walker's instance is gone by the time a fixer
reads its record. Without that, a fixer holding a run id finds it resolves to nothing, and the handoff
depends on the walker having hand-copied every reading.

### 1f. New prompts have to be registered

`agent-prompt-classification-statics.ts:36` holds the exhaustive roster of served prompt names. It
lists eleven. `guide-recipe-writer` has to be added there, or `get-agent-prompt` cannot serve it. It
also needs a row in `agentPromptClassificationStatics.minionNames` and one in
`agentNameToPromptTransformer` — sonnet, like every minion.

**The guide-writer itself has to become a served prompt, and that is a change.** It is inline prose
today inside `siegemaster-prompt-statics.ts`, briefing a generic
`Agent(subagent_type: "general-purpose")`. A generic brief cannot carry what 1a and 1b now put on this
role — the recipe set, the run discipline, and a named sub-agent of its own — so it needs the same
three registration points. The "fixer" stays inline prose; nothing here changes it.

### 1g. The tool serves a doc per role, and no prompt fetches one

**Seven scopes ship.** `siegelense-call-statics.ts:36` pins them, and `docs-statics.ts` gives each its
own audience line and its own subject. **Not one orchestrator prompt fetches any of them.** Measured:
the word `docs` appears in zero of the 55 statics files under `packages/orchestrator/src/statics/`.

**Every prompt in the siegemaster family opens by fetching its own scope** rather than carrying the
tool's rules inline. That buys one source for how the tool behaves, and a vocabulary bounded by the
role: the operating scope carries no browser verb at all, which is what stops the session that
dispatches from starting to drive.

| Prompt                                    | Fetches                     | That scope's audience, in its own words                                                                |
|-------------------------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------|
| `siegemaster` — the operator              | `docs { for: 'operating' }` | "the session that opens and closes a pool of instances and assigns tasks to other agents"              |
| the guide-writer (1a)                     | `docs { for: 'planning' }`  | "the session that writes the test sequence and proves that the application reaches its starting state" |
| `siegemaster-verifier` — the happy walker | `docs { for: 'walking' }`   | "the session driving a browser against one instance and recording what it reads"                       |
| `siegemaster-stress` — the antagonist     | `docs { for: 'attacking' }` | "the session running attacks against one instance and measuring what breaks"                           |
| the fixer (1e)                            | `docs { for: 'fixing' }`    | "the session that arrives after the walk is over and the instance is gone"                             |

**The fixer is the one row that is not a served prompt**, and 1f keeps it that way. Its fetch is
carried in the operator's brief instead — one line telling a generic sub-agent to open
`docs { for: 'fixing' }` before it touches anything. The scope still has exactly one reader; what
differs is where the instruction lives.

**Two scopes have no prompt, and for different reasons.** `driving` addresses "a session nobody
orchestrated — no quest dispatched you, and no dispatcher is watching". There is nothing to put it in,
because the session that needs it was dispatched by nobody and fetches it itself; item 21i says the
same thing from the other end. **`operational` is the other, and it is now a live question** — 17d
moves operational flows off siegemaster's track, so the role that would have fetched that scope is not
being built. 9c has what to do about it.

**Three prompts in the family fetch nothing, and each absence is load-bearing:**

| Prompt                          | Why no scope                                                                                                                                             |
|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `siegemaster-reviewer`          | it grades repairs by reading and re-drives nothing — a fresh verifier does that                                                                          |
| `siegemaster-reader` (17c, 21a) | it opens files. It calls no tool, starts no instance and holds no pool slot, so the driving vocabulary would only be a route to misuse                   |
| `guide-recipe-writer` (1b)      | it reads the production writer and writes an ingredient plus its colocated test. The guide-writer is the session that runs the setup against an instance |

**A prompt and its scope are one edit.** Adding a role means adding its scope, and a role fetching a
scope written for a different audience is worse than fetching none: it arrives holding verbs its
tool block forbids, and the first thing it does with them is the thing its own prompt refuses.

---

## 2. The `verifyByHuman` settlement route — nothing built

**The problem.** Some acceptance criteria cannot be automated at all — "the transition should be
smooth". If the author writes one with no flag, all three verification tracks each pay to discover it
cannot be automated, and each either signs it `unconfirmable` or invents a verdict. The user sees
neither.

**The fix is one flag, set at spec time by the author, read by three parties.** ChaosWhisperer marks
an observable human-check while authoring it, exactly as it already marks one `verifyByReading`. The
author flags it; the denominators drop the unit so no track carries something it can never close; the
walker gathers the evidence and routes it to a list for a person.

| Item                                                                                                                                                                   | State today                                                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| **2a.** `verifyByHuman: true` on `flowObservableContract`, beside the existing `verifyByReading`                                                                       | not built. `verifyByReading` exists at `flow-observable-contract.ts:76`; `verifyByHuman` appears nowhere in `packages/`       |
| **2b.** A human-check route in `signoffTrackEligibilityStatics`, so each track's denominator drops those units                                                         | not built. `verificationMethods` lists only `['test', 'reading']` (line 138) and `['test']` for flowrider and siegemaster     |
| **2c.** A shared prompt block holding the "can anything automate this?" decision table, interpolated into ChaosWhisperer's prompt AND siegemaster's from one source    | not built. The pattern to copy is `standardsReviewConcernsStatics`, which is already interpolated into three reviewer prompts |
| **2d.** Only ChaosWhisperer and BugHunt may set the flag                                                                                                               | not built — see the note below                                                                                                |
| **2e.** Once a quest reaches `in_progress`, filter `verifyByHuman` observables out of every work-item view: `get-quest`, `get-qa-checklist`, and the brief transformer | not built; no filter of any kind exists                                                                                       |
| **2f.** The end-of-quest list handed to the person, carrying the human-check observables and their evidence                                                            | not built — item 17f has the detail                                                                                           |
| **2g.** A citation kind holding a video a `verifyByHuman` item names, so it survives until the quest closes                                                            | not built — item 15a says why it cannot wait                                                                                  |

**On 2d — the existing rule for `verifyByReading` is prompt text only.** `packages/orchestrator/CLAUDE.md:851`
states "Only ChaosWhisperer and BugHunt can set this", and `dumpster-create-prompt-statics.ts:158`
instructs the ChaosWhisperer session. No guard and no contract refinement enforces it. Matching that
precedent means writing prompt text; enforcing it properly means a new mechanism. **Decide which, and
if it is the second, apply it to both flags.**

**Why 2e is stronger than just dropping the unit from a denominator.** An agent that can see a unit it
cannot close does not skip it. It reaches for the nearest thing it *can* measure — a proxy assertion,
a change-detector, a `toSettle` naming an action nobody will take — and now the quest carries a test
pinning the wrong thing plus a session that spent a pass on it. An observable nothing downstream can
act on is context that can only mislead, so it must not travel.

**The shared-block rule applies with force to 2c.** The orchestrator's own prompt-editing rules say a
shared block is a contract on every prompt that interpolates it. A table that drifts between the
author's copy and the walker's copy produces the worst case available: a criterion ChaosWhisperer
flagged as human-only that siegemaster believes is testable, so neither settles it and neither reports
it missing.

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

Pieces needed: the file itself, its entry contract, the read path, the append path, and the `TRAPS`
rewrite in 1c. Its home is `.dungeonmaster-assets/`, which does not exist in the checkout yet — **19a creates it**, by
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
| **4f** | Make the guide-writer seed each recipe twice and compare the two screens. This is the only one of the six that finds the problem in a repo nobody here has seen | a step in 1a, waiting on 13a |

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

**Where it goes: the guide-writer's step 5** (1a). That step already runs every setup once against a
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

**But 17d just took away its reader.** Operational flows leave siegemaster's track, so no siege role
fetches this scope any more, and its audience line now describes a session nobody builds. Two live
options, and this pass picks one:

| Option                                       | What it means                                                                                                                                                                                                                                                                                          |
|----------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Delete the scope**                         | the honest reading if nothing browserless is ever walked. It goes out of `siegelense-call-statics.ts:36` and out of `docs-statics.ts`, and the seven becomes six                                                                                                                                       |
| **Keep it for the whole-quest off-map item** | 17d's improvement is that an all-operational quest now takes ONE whole-quest off-map item. That item still attacks a running system through `request` and `file`, with no flow and no screen — which is what this scope describes. If that is where it lands, the audience line is rewritten to say so |

**The second is the likelier answer**, because the browserless lane spec, the `request` and `file`
steps and the content-hash profile are all built and all still needed by that item. Decide it with
17d, not separately.

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
| an open quest's `WALKED` line            | resolves — the `walked` questNote kind is built (see 17a)                                                                                                                                                                    |
| an open issue naming an instance and run | **a hardcoded permanent gap.** `citation-resolve-broker.ts:39` — "not checked: no issue record exists to check". It is declared in `unresolved[]` on every answer rather than silently skipped, which is the honest handling |
| a `verifyByHuman` item naming a video    | **the kind does not exist**, because `verifyByHuman` does not exist (item 2)                                                                                                                                                 |

The fourth one matters more than it looks. **A `verifyByHuman` unit hands a person a `.webm` and a
question, and that list reaches them at quest END** — so a screencast deleted on the two-day video
window is a link that rots before the only reader it has. Whoever builds item 2 has to add this
citation kind with it.

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

**17a. The `walked` questNote kind is built; nothing requires it.** `questNoteKindContract` holds
`walked`, and `questNoteContract` carries typed `instanceId` and `runId` beside the prose — which is
what lets `prune` and `cleanup` resolve a `WALKED` citation mechanically instead of matching an id
buried in a sentence.

What is missing is the requirement. Both fields are `.nullish()`, no refinement forces a `walked` note
to carry them, and nothing on the quest record requires a walk to record one at all.

**Every path walked carries the instance and run that walked it, a CLEAN walk included**, because that
id is the proof the path was driven rather than claimed — the same thing a setup's `VERIFIED` line
does one level down. And it is the only handle anything has on that walk's evidence: the tool keeps the
run for its retention window and offers no way to find it without the id. Nothing browses.

**17b. `get-qa-checklist` still does not print the owning node id.**
`qa-checklist-to-text-transformer.ts:237` renders the unit row and interpolates no node. The verifier
prompt still states the gap in its own words at `siegemaster-verifier-statics.ts:408`: "Nothing tells
you which node an observable hangs on except the flow you read… your brief does not carry it and the
checklist does not print it."

Every sign-off pays that lookup. **It is now the value two mechanisms read**, not one: a step carries an
optional `node:` label (built), and an antagonist fetches the baseline of the node it is attacking.

**17c. `siegemaster-reader` does not exist.** A minion that opens the source files a walk must not,
returning values with `file:line` against each. **It removes the last reason a walker opens a source
file, which is the one thing the three-arm trial proved destroys the pass.**

The guide's `OFF-SCREEN` heading exists at `siegemaster-prompt-statics.ts:302` and still tells a
generic sub-agent what to go and find. With a reader it becomes that reader's answers instead.

Registration needed in three places, none of which has it: `agentPromptNameContract`,
`agentPromptClassificationStatics.minionNames`, and a row in `agentNameToPromptTransformer` — sonnet,
like every minion. It gets no `docs` scope, and that absence is the point: it calls no tool, starts no
instance and holds no pool slot, so handing it the vocabulary for driving a browser would be a mistake.

**17d. Operational flows leave siegemaster's track entirely, and codeweaver's reviewer settles them.**
No `siegemaster-operational` role is built — **and none should be.**

**An operational flow has nothing to walk, and the contract already says so.**
`flow-type-contract.ts:12-14`: "An operational flow is a one-time task sequence executed by the
engineer or Codeweaver to achieve a state change — refactor sweep, infrastructure setup, lint rule
registration. It is verified by Siegemaster checking the final state, not by walking paths." A
one-time sequence has no paths, and its final state is a fact about the source tree — this file is
gone, this import is there, this rule is registered.

**That is a READING, and this repo already has a track for readings.** `verifyByReading` marks exactly
this kind of criterion — "an import that must be there, a literal that must not be inlined, a symbol
that must be gone" — and it is already settled by codeweaver's reviewer opening the file, and already
drops out of flowrider's and siegemaster's denominators. The routing machinery is built and proven; an
operational flow's units go down the same road.

**Codeweaver is already on those flows, which is what makes this cheap.** Its ledger fans out by (package, flow) CELL
across BOTH flow types (`fanOutBy: 'implementation'`), and the flow-type contract
names Codeweaver as the thing that EXECUTES an operational sequence in the first place. Its reviewer
already opens every file the pass produced.

**What changes:**

| Change                                                                            | Where                                                                                   |
|-----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| Siegemaster's `flowTypes` drops to `['runtime']`, matching flowrider              | `signoffTrackEligibilityStatics.byTrack`                                                |
| An all-operational quest seeds no siegemaster per-flow item and no flowrider item | the ledger fan-out follows the same statics, so this needs no separate edit             |
| `codeweaverSignoff` becomes the settling verdict for an operational unit          | `signoffTrackEligibilityStatics`, plus the codeweaver and `codeweaver-reviewer` prompts |

**This makes the off-map story BETTER, which is worth seeing before anyone worries about it.**
Siegemaster is the only role carrying `off-map` in its `unitKinds`, and the rule is that with no
eligible flow at all it keeps ONE whole-quest item. Today an all-operational quest HAS eligible
siegemaster flows, so off-map gets spread across operational flow walks that cannot reach it. Restrict
siegemaster to runtime flows and that same quest now has no eligible flow, so it takes the whole-quest
item instead — and `hostile-input` and `perf` get settled once, properly, against the running system.

**The cost is INDEPENDENCE, not liveness.** There was never anything to drive, so nothing is lost
there. What is lost is the separation: the flow-type contract names Codeweaver as the thing that
EXECUTES an operational sequence, and this makes Codeweaver's own reviewer the thing that confirms it
landed. Siegemaster exists to check the product against the spec without reading the source that
implements it, and an operational unit no longer gets that second pair of eyes.

**Two things keep it honest, and both should be written down with the change:**

| Guard                                                                                                                                   | Why                                                                                                                                                                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| The reviewer states the final state it OBSERVED, path by path, not that the sequence "ran"                                              | a one-time sequence has no re-run to check. The only evidence is the tree afterwards, so the sign-off names what is on disk — `deleted X`, `Y imports Z at line N` — and a `confirmed` with no such line is the failure this invites |
| A unit whose final state the reviewer cannot see from the tree is `unconfirmable`, never confirmed on the sequence having been followed | "I did the steps" is the executor grading its own work, which is precisely what the lost independence would otherwise cost                                                                                                           |

**Also update the contract's own comment.** `flow-type-contract.ts:13-14` says an operational flow "is
verified by Siegemaster checking the final state". After this change it is not.

**17e. Two of the four surfaces it needs are folded into generic entries.**
`qaCheckSurfaceStatics` lists `process-state` and `environment` as named surfaces. It has no distinct
surface for a log tail beyond the instance's own two server logs — only a generic `log-output` — and
none for a named elapsed figure, which sits inside a generic `performance` entry.

**17f. The `(human-check)` panel does not exist**, and cannot until item 2 ships. It needs every
`verifyByHuman` unit with its `toSettle` instruction, its repo-local evidence links, an outstanding
count, and **a control that takes the person's verdict.** A list a person can read and cannot tick is a
list nobody works.

It is the only place such a unit reappears. Once the quest is `in_progress` they are filtered from
every work item's view, so with no panel the expectation is invisible everywhere.

**17g. The declared-value enumeration is duplicated and has already drifted.** Confirmed, and the drift
is the dangerous direction — **the author's list is narrower than the reviewer's**, and the author is
the only role that may set the flag:

| Copy                                                      | Says                                                                                                                             |
|-----------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `dumpster-create-prompt-statics.ts:163` (the author)      | "A font size, a colour token, a class name, a border, a padding, an animation duration, a typeface…"                             |
| `chaoswhisperer-gap-minion-statics.ts:191` (the reviewer) | "a font size, a colour **or colour token**, a class name, a typeface, a border, a padding **or margin**, an animation duration…" |

A raw colour and a margin are declared values the reviewer catches and the author never flags. Extract
one interpolated statics, add the siege consequence to its rationale, and give it to both.

**And `siegemaster-prompt-statics.ts` has no rule at all for an unflagged declared-value observable.**
The rule exists and the gap is on the walker — it meets one of these and has nothing telling it what to
do.

**17h. Motion quality is still asked for and no session can deliver it.**
`siegemaster-verifier-statics.ts:321` lists "a transition jumps or flickers" beside truncation and
overlap, which ARE measurable.

**A model cannot grade animation.** Four frames 1.5 seconds apart cannot distinguish a clean 300ms
transition from a janky one, frame drops are invisible at that sampling rate, a two-frame flicker falls
between samples, and `video` produces a file no model watches. Every comparison capture is frozen
(`animations: 'disabled'`, `caret: 'hide'`) precisely so `pixelChange` is not noise — so the tool
cannot see motion even in principle.

**A rule nobody can follow does not get ignored — it gets answered with an invented adjective**, which
is exactly what the prompt's own "search your own draft for 'confirmed', 'held', 'as expected'"
discipline exists to catch. Cut it, and route it to the human-check list instead.

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
| `siegemaster-verifier-statics.ts`, `siegemaster-stress-statics.ts`               | the two walker prompts drive the lane by name                                                                                                                                                                                                                                                                                        | rewritten in item 1 — which is why these two items cut over together                                                                                                                                  |
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
first means doing all of them twice; doing it last means the prompt rewrite in item 1
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

## 21. The rest of the role rulebook

Item 1 covers the operator, the guide-writer and the fixer. These are the roles it did not
reach. **All of it is prompt text, and none of it exists.**

**One role is entirely new** — `siegemaster-reader` in 21a — needing a prompt plus registration in
`agentPromptNameContract`, `agentPromptClassificationStatics.minionNames` and a row in
`agentNameToPromptTransformer`. 21b was a second one until 17d moved operational flows off this track
altogether; it is now the rules that moved with them.

### 21a. `siegemaster-reader` — opens the files so no walker has to

*Returns values. Drives nothing. Signs nothing. Dispatches nothing.*

**The problem it solves.** A walker may not open a source file — 21c makes that absolute, and the
trial measured why. But some units name a value only source holds: "the list caps at the configured
maximum", "the default timeout". **A walk told "read no source" facing one of those either breaks the
rule or stalls, and breaking it is what actually happens.**

**What it does, in one example:**

> Unit: *the quest list caps at the configured maximum.*
> The walker drives the app and counts 50 rows. Is 50 the right number? It lives in
> `questListStatics.ts:12`, which the walker may not open.
> The reader returns one line — `quest list cap  50  questListStatics.ts:12` — and the walker measures
> what it counted against it, having never read the list's implementation.

**It hands over the CONFIGURED VALUE, never what the screen should show.** "The cap is 50" is a
reading. "The list should show 50 rows" is the verdict, and handing a walker that just moves the
contamination one session upstream.

**When it runs — two cadences, and the second is why it is its own role:**

| When                                      | Why                                                                                                                                                                                    |
|-------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Once in phase zero, before the first walk | the operator dispatches it against everything the guide's `OFF-SCREEN` heading lists, and its answers go into every brief                                                              |
| On demand, mid-pass                       | a reading is one value for one unit, and a walk reaches that need at any point. The guide is written once per flow before any round, so a mid-walk value has nowhere else to come from |

| Rule                                                                                                | Why                                                                                                                                                                                                                    |
|-----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| It is the ONLY session on a siege pass that opens a source file                                     | a walker that opens one holds it for the rest of the walk. The trial measured what that produces: six correct verdicts reached with the expected values known in advance, and no independent look anywhere in the pass |
| Every value it returns carries `file:line`                                                          | a value with no provenance cannot be told from one a session remembered, and the walker citing it cannot check it without doing the reading this role exists to prevent                                                |
| **It returns a LOCATION or a CONFIGURATION — never an EXPECTED VALUE the unit should have carried** | handing that forward launders the contamination through one more session. The walk still measures the system against what the code intends, and now it is invisible, because it arrived as a fact in a brief           |
| A unit whose expected value exists only in source is a `questNotes` open question                   | that is a spec defect — the unit is under-specified                                                                                                                                                                    |
| It touches no instance and holds no pool slot                                                       | it reads files, so it runs beside anything, including a full pool of walks                                                                                                                                             |

What it hands back replaces the `OFF-SCREEN` heading's instructions with its answers:

```
OFF-SCREEN
  quest list cap          50      questListStatics.ts:12
  default guild slug      siege-1 guild-create-broker.ts:88
  outbox path             .dungeonmaster/event-outbox.jsonl   quest-persist-broker.ts:41
```

### 21b. The codeweaver reviewer takes the operational units

**There is no operational siege role, and 17d is the decision.** Operational flows leave siegemaster's
track; `codeweaver-reviewer` settles their units, on the cells codeweaver already owns there. What
follows is the rules that move with them.

*One role is new here, not two: only `siegemaster-reader` in 21a.*

| Rule                                                                                                   | Why                                                                                                                                                                                                     |
|--------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| An operational unit is settled by `codeweaverSignoff`, and no siege verdict is expected on it          | a unit no track can close is one an agent invents a verdict for — the same reason `verifyByHuman` is filtered out of every work-item view                                                               |
| A runtime flow's non-browser units stay with the BROWSER walker                                        | reaching a log line that only exists after four clicks needs the path driven. That is one more step in a batch already there, against a whole second walk. This does NOT move to codeweaver             |
| **The evidence is the TREE — a path that is gone, an import that is there, a rule that is registered** | an operational flow is a one-time sequence, so there is no run to observe and no picture to take. Its final state is a filesystem fact, and that fact is the whole verdict                              |
| The repo's "the browser UI is the verdict" rule is untouched                                           | that rule governs a flow that HAS a UI. An operational flow has none, and its verdict is the state the sequence left behind                                                                             |
| **The sign-off names the state it read, path by path — never that the sequence was followed**          | "I did the steps" is the executor grading its own work, and Codeweaver is the executor. `deleted X` and `Y imports Z at line N` are checkable by the next reader; "the refactor sweep completed" is not |

**That last row is what the change costs, and 17d says why.** Nothing is lost in liveness, because
there was never anything to drive. What is lost is independence — the same session's chain now both
runs the sequence and confirms it — and a sign-off that names the state on disk is what keeps that
survivable.

### 21c. The happy walker's prompt is missing nine rules

`siegemaster-verifier-statics.ts` exists. These rules are not in it:

| Rule                                                                                                           | Why                                                                                                                                                                                                             |
|----------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **A walker opens NO source file, for any reason.** What only source can answer arrives as a value in its brief | see the contradiction below                                                                                                                                                                                     |
| **Selectors come from the running page, not from test files**                                                  | the trial's arm B read the e2e specs and learned the answers before driving. That removes the reason siegemaster runs at all                                                                                    |
| **The KEY is the default reading. `dom` is the escape hatch: last, expensive, narrow target**                  | the one measured cost in this design — `dom` on `body *` returned 58 nodes whose first entry carried an entire stylesheet. The prompt carries that one line; `docs { for: 'walking' }` carries the whole ladder |
| **An observable naming a className or any implementation detail is settled on what a PERSON would see**        | see 21d below                                                                                                                                                                                                   |
| **Every PATH walked is recorded with its instance id and run id — a CLEAN walk included**                      | see 17a. The clean walk is the one an issue-only rule leaves unevidenced                                                                                                                                        |
| A walk that sees its instance stop checks `status` BEFORE writing anything down                                | a dead driver leaves a blank screen, and "the page went blank" is exactly what a walker is trained to report. A fixer briefed against it hunts a rendering bug that never existed                               |
| A slow `start` is a QUEUE, not a hang — never a `wall`                                                         | the tool admits one boot at a time, so the third walk in a pool waits out two. `queuedMs` says so, and a session reporting a wall over it halts a quest for nothing                                             |
| A dead instance is `rework` with the `status` output — never self-healed, never `wall`                         | `wall` means no session of any role could pass. A crash is not that. A minion self-healing is a session acting on a third of the picture                                                                        |
| A DRIVER death is never a finding about the app; an API-SERVER death may be                                    | a leak or an unbounded allocation that kills the server is a real defect, recorded WITH the server log as well as bubbled up                                                                                    |

**The two prompts contradict each other today, and the walker's own copy wins.**

| Prompt                                                   | Says                                                                                                                                                                                                                                                   |
|----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `siegemaster-verifier-statics.ts:222` — the walker's own | "**Read the implementation only for a value a unit names indirectly** — 'the configured cap', 'the default timeout' — where the number lives in the code and the unit does not spell it out. Use `discover` to find the symbol and `Read` to open it." |
| `siegemaster-prompt-statics.ts:226` — the operator's     | an observable marked `(read-check)` "is settled by opening a source file, **which no round can do**"                                                                                                                                                   |

The operator believes no round opens source. The walker is told how to. **The walker's copy is the one
the walking session reads**, so source gets opened.

This is what the reader role in 21a exists to close, and the two have to land together. **A walk told
"read no source" with a unit that needs a file opened either breaks the rule or stalls, and the first
is what actually happens.**

### 21d. The five-step rule for an implementation-detail observable

**Siegemaster has no rule for an UNFLAGGED one, and that is where the false pass lives.** Its prompt
handles the flagged case correctly at `siegemaster-prompt-statics.ts:226` and says nothing about a
className observable that reached its list. **Signing one on the class alone is the cheapest false pass
in this system** — the class is present, the stylesheet rule was deleted, the row is not red, the unit
reads `confirmed`, and nothing in the record says the screen was never looked at.

Give the walker these five steps, in order:

1. **Ask what a person would SEE if it were true.** "The failed row is red", "the active tab is
   underlined". That sentence is the real observable and it is the one to settle.
2. **Measure that, RELATIONALLY.** The failed row's computed background differs from a non-failed
   row's. That needs the seed to produce **two of the thing the assertion must tell apart**, which the
   recipe book already requires for its own reasons.
3. **Read the class too, through `dom`** — `fields: ['className']`, narrow target. It corroborates; it
   does not settle.
4. **Record both.** A class present with the paint wrong is a finding, and a stronger one than either
   half alone.
5. **Where no painted consequence can be named at all**, the unit is a read-check that reached the
   wrong track. That is a `questNotes` open question — siegemaster may ADD an observable and may not
   reflag one.

### 21e. The antagonist's prompt is missing nine rules

`siegemaster-stress-statics.ts` exists. **One principle generates almost all of these: the verifier
measures against the UNIT, the antagonist measures against a BASELINE.** A verifier asks whether the
screen shows the value its unit names, so its comparison is to a sentence in the spec. An antagonist
claims an ABSENCE — I attacked this and it did not fall over — and an absence is only evidence against
a known-good reading taken before the attack.

| Rule                                                                                                            | Why                                                                                                                                                                                                                           |
|-----------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **It compares against a BASELINE, never the unit, and `health` is its fixed-shape reading**                     | `health` is its counterpart to the key: one shape, so two readings can be held against each other                                                                                                                             |
| **Its dispatch CARRIES the baseline** — the happy walk's instance id and run id for the path it is attacking    | "inherits a verified-clean baseline" was a property with no mechanism. The operator holds both ids after the stamp, and handing them over is one line in a brief                                                              |
| It READS that baseline with `results`, which starts nothing — and looks for NO baseline it was not handed       | reading a finished run needs no instance, so "touch none you did not start" does not forbid it. What it forbids is finding "some earlier walk of something similar", which is how a tainted baseline gets in                  |
| **On a SAD path the baseline is the ERROR rendered correctly, usually a toast**                                 | comparing a failure branch against a happy screen reports the toast as damage. The inverse is worse: the app swallows the error, nothing paints, `pixelChange` reads `0%`, and "nothing changed" is written down as *it held* |
| A transient baseline — a toast, a flash message — is a PRESENCE question, never a pixel diff                    | it auto-dismisses, so a frame comparison against it reports a difference that is only timing. "Was the toast there, with that text" is a `look` at the key                                                                    |
| **Three key columns are ITS columns**: `maxlength`/`pattern` in `attrs`, `live`/`alert`, and `invalid`          | the declared cap is what it measures against, the live region is where a proper refusal LANDS, and `invalid` is the app stating its own verdict on the input — read, never assumed                                            |
| Each attack declares the reset level it needs                                                                   | `instance` destroys any uptime, monotonic or append-only measurement, so it cannot share a batch with a unit measuring one                                                                                                    |
| **Every attack is recorded with the instance id and run id that ran it, held or not**                           | an absence with nothing behind it is the least checkable claim in this system                                                                                                                                                 |
| It is the role most likely to have CAUSED an instance death, which is exactly why it must not judge that itself | it corrupts and exhausts on purpose, so an OOM it triggered is a plausible finding rather than background noise                                                                                                               |

### 21f. The antagonist has no way to run on an operational flow

**17d settles this, and the answer is that it never has to.** The antagonist is a browser role — its
whole vocabulary is `paste`, `key` and `click`, and the three key columns 21e makes its own (`maxlength`/`pattern`,
`live`/`alert`, `invalid`) are all properties of a rendered control. With
siegemaster restricted to runtime flows, an operational flow is never handed to it at all.

**Off-map coverage is not what pays for that.** The seven families are properties of the BUILT SYSTEM
rather than of any drawn flow, and siegemaster keeps ONE whole-quest item whenever it has no eligible
flow. An all-operational quest now hits that case exactly, so `hostile-input` and `perf` are settled
once on the whole-quest item — which is a better home than spreading them across screenless flow
walks, and is the improvement 17d records.

**One rule the antagonist's prompt still needs:** handed an operational flow anyway, it answers
`rework` naming the mis-route, and never improvises. It always has `request` and `file`, so it can
always do SOMETHING — and that something is an attack nobody scoped, signed against a family the
whole-quest item was going to settle properly.

### 21g. Two operator rules item 1 did not carry

| Rule                                                                                                               | Why                                                                                                                                                                                                                             |
|--------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **A crashed minion is answered by a FRESH walk on a fresh instance — never by reading the dead run to salvage it** | a verdict assembled out of half a run plus a second run is not a walk. `status` says why it died, which decides the pool size; an issue the walk had already written down keeps its own evidence and goes to a fixer regardless |
| **A `siegemaster-reader` runs before the first walk, and its values go into every brief**                          | it is what lets the walker rule in 21c be absolute. A walk told "read no source" with a unit that needs a file opened either breaks the rule or stalls, and the first is what actually happens                                  |

### 21h. The spec authors — ChaosWhisperer and BugHunt

Most of this is item 2. Two rules it did not carry:

| Rule                                                                                                                        | Why                                                                                                                                                                                |
|-----------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **An observable naming an IMPLEMENTATION — a className, a hook, a prop — is a READ-CHECK, authored with `verifyByReading`** | a class name is the mechanism behind something a person sees, never the thing itself, and it can move to an inline style or a generated hash without the outcome changing          |
| **Phrase the observable as what a PERSON would see** — "the failed row is red", not "the row has `.failed`"                 | an observable written in the implementation's words hands a walk the mechanism instead of the outcome, which does to it automatically what reading source did to the trial's arm B |
| The human-check category stays NARROW: motion quality and taste, nothing else                                               | contrast, alignment and clipping are computable, and a model can judge an error message's clarity. A long list is a list nobody works                                              |

### 21i. Not a gap — the unowned session is already served

A session nobody dispatched — a developer's own, or one told to drive the app — needs its own rules:
`capacity` before starting, `start` queues, `kill` is mandatory because nothing else will do it, its
instance is filed under `unowned/` with no quest reference protecting its evidence, and `start` hands
back the id and the evidence directory because nothing lists and nothing searches.

**`docs { for: 'driving' }` is built and carries this.** No prompt work needed.

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
| A `walked` kind on `questNotes` with typed ids                                 | built — `questNoteKindContract` holds `walked`, and `questNoteContract` carries typed `instanceId` and `runId`. Item 17a is only about making them required                                         |
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
