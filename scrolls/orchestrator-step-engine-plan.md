# Move orchestration branching out of code and into config

## Context

The orchestrator dispatches ONE session per unit of work for each of the three role families —
`codeweaver`, `flowrider`, `siegemaster`. That session is an "operator": it reads code, briefs generic
sub-agents, summons one reviewer, and loops on the reviewer's verdict until it passes. None of that
inner activity is a ledger item, a work item, or anything the orchestrator can see. It is a black box
that eventually signals `done`.

That makes iterating on an orchestration flow expensive. Turning siegemaster's
`planner → worker → reviewer` into `planner → recipe → worker → reviewer` means rewriting a 46 KB
prompt, because the loop lives inside the prompt rather than in the orchestrator.

**The goal: the orchestrator runs the loop.** Each step is its own dispatched session with its own
prompt. The orchestrator decides what runs next from recorded state, off a table. Swapping a prompt in
or out becomes a config edit.

**And the loop runs on UNITS, not on step verdicts.** That is the load-bearing decision. A unit is an
observable, a terminal node, a labelled edge or an off-map probe family — §1 says why the wider word
is needed. Every work item except a planner's is assigned units; a step cannot signal until each one
is marked; an `unmet` unit mints a fresh session scoped to exactly those units. The back-and-forth
between worker and reviewer falls out of that, with no per-family wiring.

Several defects found while mapping the current system get fixed in the same pass.

---

## What stays exactly as it is

Worth stating, because it bounds the change.

- **The orchestrator still splits a quest into scopes** — codeweaver fans out per (package, flow)
  cell, flowrider and siegemaster per flow. That RULE is what is untouched.
  `relayTailFanOutTransformer` itself changes twice: it assigns a seam unit to the later cell (§8),
  and it runs when a family is routed to rather than once at Start (§3). The *ordering* of families
  changes shape (an ordered array becomes a routed graph, §3) but the fan-out behind each one does
  not.
- **The families stay**, and stay enumerable. They are the stable layer. What changes is what happens
  *inside* one family's scope.
- **`quest.workItems[]` stays in `quest.json`.** It is read in 77 source files and written through 17
  call sites that each depend on one atomic rename being the commit point. Only the planner's
  *forecast* goes to a sibling file — §2 draws that line.
- **Config lives in code.** No per-repo override in this pass.

---

## 1. The unit gate — the mechanism everything else hangs off

**Every work item except a planner's carries assigned UNITS. A step cannot signal until every one of
them is marked.** That is a hard gate in the orchestrator, refused at the tool boundary, not a line in
a prompt.

**"Unit", not "observable", throughout.** A unit is what the checklist enumerates — an observable,
a terminal node, a labelled edge, or an off-map probe family. Terminals sign on the node and branches
on the edge, so a record keyed by observable would lose two whole kinds silently.

Three marks, and they replace the two-verdict sign-off model:

| Mark | Means | What the orchestrator does |
|---|---|---|
| `met` | proved, with evidence | nothing — settled |
| `cant-meet` | genuinely unsettleable at this layer, with what would settle it | nothing — settled as unsettleable |
| `unmet` | not done | mint a fresh session scoped to exactly these units |

**`unmet` is the whole loop.** A worker running low on context marks its remainder `unmet` and signals;
the orchestrator mints part two, carrying only those units. A reviewer that rejects three units marks
those three `unmet`; the orchestrator mints a worker carrying only those three. Same mechanism,
opposite directions, no special case for either.

This replaces three separate things: the operator's internal `rework` loop, `duplicate-on-partial` with
the whole `pt N` chain, and the three fixed sign-off tracks. It covers most of what
`reset-flow-signoffs` did too — see §8 for the one part it does not.

**A step's outcome is DERIVED from its marks, not declared.** The agent does not get to claim `done`
while leaving work on the floor:

```
any assigned unit marked `unmet`       → outcome is `unmet`
every one marked `met` or `cant-meet`  → outcome is `done`
no units assigned                      → the step declares its own word
an environment wall, at any point      → outcome is `wall`
```

That is what "deterministic gate" means here. `done` is a fact about the record, not a claim. The
"no units assigned" line covers a planner, a `repair` and `warpgate` alike — see §8.

**Units are first class, so this is orchestrator code either way.** There is no version of this that
lives purely in config — assignment, the gate, the state roll-up and the re-scoping are all real logic. The
config decides *which step* an `unmet` goes back to; the orchestrator decides *that it goes back*.

**One narrow exception to "a planner gets no units".** A siege planner that has fewer rounds than
off-map families must record the families it is not covering — today it signs them `unconfirmable`
itself (`siegemaster-prompt-statics.ts:328`), and `hostile-input` and `perf` are the quest's only
security and performance coverage anywhere (`:588`), so silently dropping them is the worst outcome.
**A planner may write `cant-meet`, and only `cant-meet`, and only for a unit it is simultaneously
declining to put on any piece.** That does not break "never mark a unit you did not settle" — the
planner genuinely settled the question *no session this pass will reach this*, which is exactly what
`cant-meet` plus a `toSettle` records.

**Those marks need a work item to live on, or the state rule below cannot see them.** They are
written in the plan's `plannerMarks` block (§4), and **the router copies them onto the planner's own
work item as its observation set when it accepts the plan** — which makes the planner the most recent
work item assigned those units. Leave them in the plan file only and every off-map family the planner
declined reads as unmarked forever, which blocks the in-scope gate at the reviewer.

### Where the marks live — one complete set per work item

**A work item holds its OWN observation set: one entry per unit it was assigned, with the reasoning.**

```
workItem.observations[] — { unitId, mark, evidence, toSettle?, at }
```

Not a shared log that sessions append to. **Each session gets a fresh set.** A work item is assigned
five units, it marks all five (that is the gate), and those five marks are that work item's record —
complete, self-contained, and nobody else's.

**A re-mint is a fresh set of the same units.** Work item 1 marks three `met` and two `unmet`. The
router mints work item 2 carrying those two, and work item 2 marks them from scratch. It does not
amend work item 1; work item 1 is a true record of what that session found.

| Question | Answer |
|---|---|
| What is a unit's current state? | the mark on the **most recent work item that was assigned it** |
| What happened to it? | walk the work items in order — that is the churn |
| Does anything overwrite? | no. A session writes its own set as it settles each unit, and that set freezes when the step signals. No other work item's set is ever touched |

**That churn is the thing worth seeing.** Codeweaver marks `obs-3` unmet, a second codeweaver marks it
met, its reviewer marks it unmet again, a third gets it met. Four work items, four complete records,
and the sequence is legible without reconstructing anything.

Retired: `codeweaverSignoff`, `flowriderSignoff`, `siegemasterSignoff`, `signoffTrackContract`,
`signoffDenominatorTrackContract`, and `quest-reset-flow-signoffs-broker` with its MCP tool. The
scoping half of `signoffTrackEligibilityStatics` survives, re-keyed onto the step — see §8.

**This is what makes the per-unit reset lever unnecessary.** Flowrider's rework rule is the sharpest
constraint on any verdict store: *"Any unit it named that you already signed: overwrite that sign-off
from the new `PROVED` line, or clear it with `flowriderSignoff: null`. A `confirmed` your reviewer just
rejected is the one thing that must not survive the loop"* (`flowrider-prompt-statics.ts:409`). With
three shared, overwritable fields that needs an explicit null-out, written correctly, every time. With
a set per work item there is nothing to clear: the reviewer's own record says `unmet`, its work item is
the most recent one assigned that unit, so that IS the state. The rejected `met` stays readable on the
work item that made it, which is where it belongs.

---

## 2. Two files, two different things — "work item" was doing two jobs

| | **PIECE** | **WORK ITEM** |
|---|---|---|
| Lives in | `<questFolder>/planned-work/<operationItemId>.json` | `quest.json` → `quest.workItems[]` |
| Is | the planner's forecast — what it intends | the record — a session that ran |
| Written by | one planner, once, then amended | the orchestrator, as the router decides — singly or as a batch |
| Count | all of them, up front | only what has been reached |

```
<questFolder>/
  quest.json                              ← workItems[]: the sessions that RAN
  planned-work/<operationItemId>.json     ← pieces[]: the sessions the planner INTENDED
  ward-results/<id>.json
  riftcarver-results/<id>.log
```

They are deliberately not 1:1. A piece whose units come back `unmet` produces a second work item.
A piece the run never reaches produces none. The gap between the two files is the useful thing to look
at when a quest goes wrong.

**Why the split.** `quest.workItems` has 77 readers and 17 writers that each depend on one atomic
rename — moving it is expensive and buys nothing. Plan prose is what would bloat `quest.json` without
limit, and only the router and the planner read it.

---

## 3. The two graphs

There are two, and they use the same grammar. The first says which families run in what order. The
second says what happens inside one family. Read together they are the whole run.

### 3a. The family graph — which family runs next

`packages/shared/src/statics/quest-flow/quest-flow-statics.ts`, replacing
`questTypeRegistryStatics`' ordered arrays:

```ts
export const questFlowStatics = {
  feature: {
    intakeSlashCommandFileName: 'dumpster-create.md',
    initialWorkItemRole: 'chaoswhisperer',
    entry: 'riftcarver',
    families: {
      riftcarver:  { routes: { done: 'codeweaver',  wall: '@blocked' } },
      codeweaver:  { fanOutBy: 'implementation', locked: false,
                     routes: { done: 'flowrider',   empty: 'flowrider',   wall: '@blocked' } },
      flowrider:   { fanOutBy: 'flow',
                     routes: { done: 'siegemaster', empty: 'siegemaster', wall: '@blocked' } },
      siegemaster: { fanOutBy: 'flow',
                     routes: { done: 'wardFull',    empty: 'wardFull',    wall: '@blocked' } },
      wardFull:    { routes: { done: '@complete',   wall: '@blocked' } },
      // No inbound route, and exempt from the reachability check below.
      // Appended at merge time by OrchestrationMergeResponder, on a quest that
      // already reached @complete or blocked.
      warpgate:    { appendedAtMerge: true, routes: { done: '@complete', wall: '@blocked' } },
    },
  },
  'bug-hunt': { /* identical families; only the intake differs */ },
}
```

A family's `done` fires when **every** one of its fanned-out scopes is complete. Codeweaver with nine
cells routes to flowrider once, on the ninth.

**The family graph declares no cycle, and this pass builds none.** The grammar can express one — a
`siegemaster` route back to `codeweaver` is a config edit, not a code change — and being able to
express it is the point of the shape. Nothing triggers it yet: a scope only ever ends at `@done` or
`@blocked`, so no family can currently produce an outcome a back-edge would fire on. Building that
trigger is a separate pass. Until then the family graph is acyclic and needs no family-level
`maxVisits`; the step graphs below have the cycles.

`empty` is a real case rather than symmetry: flowrider only covers flows with a UI, so a quest with none
seeds no flowrider scope at all. That happens today too, buried in the fan-out. Declared, it reads as a
decision.

### 3b. The step graph — what happens inside one family

`packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts`.

**Every step declares a `role`, and the role is what makes the loop generic:**

| `role` | Gets units? | Which ones | Outcome comes from | On `unmet` |
|---|---|---|---|---|
| `planner` | **no** | none. It may write `cant-meet` in `plannerMarks` and nothing else | its own declared word | n/a |
| `worker` | yes | the ones its piece assigns | the marks | a fresh worker on those units — "part two" |
| `reviewer` | yes | **its scope's whole in-scope set**, not one piece's | the marks | a worker on those units — the rework edge |

**A reviewer is assigned everything in scope for its operation item.** It has no piece — the planner
cuts worker pieces, not review pieces — so the in-scope set IS its assignment. That is what makes the
signal gate and the in-scope gate the same check, and it is what makes a reviewer's `met` supersede
the worker's under the state rule in §1. It costs one mark per in-scope unit, written as the reviewer
settles each one, which is the reading pass it was going to do anyway.

**Both siege walkers are `role: 'reviewer'`, so both get the full scope.** Two consequences follow,
and the second needs a rule. A walker re-marks what its own fixer just changed, which is correct — a
re-walk is the only thing that proves a fix. And two walkers running at once would each see the
other's units unmarked. So **the in-scope gate counts a unit as outstanding only when nothing else
will settle it**: no plan piece claims it, and no live work item is assigned it. Without that
qualifier the happy walker derives `unmet` on an off-map family the adversarial walk is mid-way
through, and mints a happy fixer for it.

**A `kind: 'deterministic'` step is outside the gate.** `ward` and `riftcarver` run code, carry no
units and have nothing to mark; their outcome is their handler's exit code, classified into one
of the four words. They still declare a `role` so the router knows which side of the pair they sit on,
but the unit gate does not apply to them. Stating it this way avoids the trap of a
`role: 'reviewer'` step that can never satisfy a gate written for prompts.

**Routing lives ON the step, with the same four words everywhere.** A step carries what runs it, where
each outcome goes, and how many times it may be re-entered. One entry to add or remove, and a step is
portable between families.

| Outcome | Means |
|---|---|
| `done` | every assigned unit is `met` or `cant-meet` |
| `unmet` | at least one is still `unmet` |
| `empty` | **nothing was in scope to act on.** Never "there was work and I chose to cut none" |
| `wall` | an environment wall no fresh session could pass |

**`empty` has one meaning and three shapes, so state all three.** It is the word that drifted
furthest while this design grew:

| On a | `empty` means |
|---|---|
| step holding units — a planner | the scope's in-scope unit set is empty. A planner holding units and cutting no work declares `done` and marks each one `cant-meet` with a `toSettle`, per hole 15 |
| step holding no units — `recipe` | there was nothing to produce. A flow whose seeds already exist costs one cheap session that writes nothing |
| deterministic step — `ward` | the handler's scope resolved to nothing. A 0-file ward scope exits 0 without grading a line, per hole 27 |

Ordered worst first — `wall` > `unmet` > `done` > `empty` — which is how a parallel batch folds to one
outcome. **That fold is PER STEP, not per batch**, which matters the moment a step's pieces run in
several batches: every piece at that step folds to that step's outcome and takes that step's routes.

### A step's routes are its PHASES — every piece drains before the next step starts

**A step's `done` fires when every piece at that step has drained.** That is the same rule the family
graph already uses for fan-out cells — codeweaver with nine cells routes to flowrider once, on the
ninth — applied one level down. So the step chain IS the phase order, declared in config rather than
obeyed by an operator:

```
plan → happyWalk(× every path) → adversarial(× every family) → commit → ward → sweepOut
```

**Two rules fall out of it, and both are checkable:**

| Rule | Why |
|---|---|
| a plan batch holds pieces for ONE step | a batch mixing steps has no single outcome to fold to, and no single set of routes to take |
| the router mints every batch at the current step before `routes.done` is consulted | that is what makes "drained" mean what it says |

**Siege is why this is a rule rather than an accident.** The antagonist compares against a BASELINE —
the happy walk's instance id and run id for the path it is attacking — and a baseline taken after the
attack is not one. Under a phase route that id exists by the time the router mints the adversarial
piece, so **the router hands it over** and the rule needs no prompt behind it. Interleave the two and
the baseline has to be re-derived per piece, or dropped; §9e has what dropping it costs.

The same shape was already implicit everywhere else — codeweaver's workers all land before its
reviewer reads, flowrider's spec files all land before its reviewer grades. Declaring it once stops
each family inventing its own.

**`routes.done` is the FORWARD edge only. The return edge is automatic.** A piece minted by another
step's `unmet` returns to the step that minted it, and the router knows which that was — it created the
piece. Writing that back-edge into config is what produced the jank: `fixHappy: { done: 'happyWalk' }`
reads like a wired transition when it is really "go back where you came from", and the moment two
walkers shared one fixer the wiring was silently wrong.

So a step that is only ever mark-minted declares **no `done` route at all**:

```ts
fixHappy: { role: 'worker', prompt: 'siege-happy-fixer', routes: { unmet: 'fixHappy', wall: '@blocked' } }
```

Its `done` returns to whichever walker's `unmet` created it. A step reachable from the plan keeps its
`done` — that is real forward progress and it has to be declared.

**An undeclared outcome returns to the minter; it is never a stall.** `done` and `empty` on a step
with no route for them both mean "hand back to whoever caused this session to exist". That is what
lets `recipe` declare only `routes: { wall: '@blocked' }` and still be a complete step: it returns
whether it wrote something (`done`) or found the seeds already there (`empty`). The reachability
check is what stops this rule hiding a real mistake — a step the plan or a route CAN reach, with no
`done` declared, has no minter to return to and is flagged.

**Every code-changing family ends with the same close-out.** `CLOSE_OUT` below is one shared trio —
commit, ward, repair — spread into each family, so they are declared once and cannot drift:

```ts
// Committing is a deterministic step, not a session's job. Three separate holes
// collapsed into this one change — see §8. The handler also PUSHES (bare, no -u:
// riftcarver set the upstream at carve), and builds its message from the work
// item's own observations, since a handler has no prose to write.
const CLOSE_OUT = {
  commit: {
    role: 'worker', kind: 'deterministic', handler: 'commit', maxVisits: 3,
    // `empty` is a clean tree: every piece marked `cant-meet`, or a review-only pass.
    // It still wards — the branch may be red from an earlier scope.
    routes: { done: 'ward', empty: 'ward', wall: '@blocked' },
  },
  ward: {
    role: 'reviewer', kind: 'deterministic', handler: 'ward',
    args: ['--committed', '--uncommitted'], maxVisits: 3,
    // `empty` is a 0-file scope: green by exit code, but nothing was graded.
    // No `wall` — a deterministic step exits green, red or empty. Only `repair` can wall.
    routes: { done: '@done', empty: '@done', unmet: 'repair' },
  },
  repair: {
    role: 'worker', kind: 'prompt', prompt: 'spiritmender', model: 'sonnet', maxVisits: 3,
    routes: { unmet: 'repair', wall: '@blocked' },
  },
} as const;

export const agentFlowStatics = {
  codeweaver: {
    entry: 'plan',
    steps: {
      plan: {
        role: 'planner', kind: 'prompt', prompt: 'codeweaver-planner', model: 'opus', maxVisits: 5,
        routes: { done: 'work', empty: '@done', wall: '@blocked' },
      },
      work: {
        role: 'worker', kind: 'prompt', prompt: 'codeweaver-worker', model: 'sonnet', maxVisits: 40,
        routes: { done: 'review', unmet: 'work', wall: '@blocked' },
      },
      review: {
        role: 'reviewer', kind: 'prompt', prompt: 'codeweaver-reviewer', model: 'opus', maxVisits: 10,
        routes: { done: 'commit', unmet: 'work', wall: '@blocked' },
      },
      ...CLOSE_OUT,
    },
  },

  flowrider: {
    entry: 'plan',
    steps: {
      // ON REQUEST, never on a route. A planner that needs seed data for its plan asks for
      // it; so does a worker whose work item's seeds do not satisfy the job in front of it.
      // No `done` route — it returns to whichever session requested it. `empty` means the
      // seeds it was asked for already exist.
      recipe: {
        role: 'planner', kind: 'prompt', prompt: 'recipe-maker', model: 'opus', maxVisits: 5,
        mintableOnRequest: true,
        routes: { wall: '@blocked' },
      },
      plan: {
        role: 'planner', kind: 'prompt', prompt: 'flowrider-planner', model: 'opus', maxVisits: 5,
        routes: { done: 'work', empty: '@done', wall: '@blocked' },
      },
      work: {
        role: 'worker', kind: 'prompt', prompt: 'flowrider-worker', model: 'sonnet', maxVisits: 40,
        // A browser walk boots Playwright through ward — NOT a siegelense lane, so this is
        // a different budget from the siege walkers' and capacity cannot see it. Four at
        // once is a machine-load cap, not a correctness one: ward gives each run its own
        // port pair and its own report path. Counted over pieces carrying a `browser` unit.
        maxConcurrent: { limit: 4, counts: 'browser-pieces' },
        routes: { done: 'review', unmet: 'work', wall: '@blocked' },
      },
      review: {
        role: 'reviewer', kind: 'prompt', prompt: 'flowrider-reviewer', model: 'opus', maxVisits: 10,
        routes: { done: 'commit', unmet: 'work', wall: '@blocked' },
      },
      ...CLOSE_OUT,
    },
  },

  // Siege is the INVERSE of the other two — its reviewers run first and find the work,
  // its worker repairs — and the structure holds unchanged.
  siegemaster: {
    entry: 'sweepIn',
    steps: {
      // `siegelense cleanup` at both ends of the pass. The first makes the first
      // capacity reading honest; the last catches what this pass leaked. Deterministic,
      // because nothing here is a judgement — and the ROUTER owns instances now, so
      // this is the router tidying up after itself rather than a session being trusted to.
      sweepIn: {
        role: 'worker', kind: 'deterministic', handler: 'cleanup', maxVisits: 3,
        routes: { done: 'plan', empty: 'plan', wall: '@blocked' },
      },
      // The same prompt flowrider uses, requested the same way. A recipe is flow-scoped,
      // not family-scoped, so whichever family asks first authors it and the other reuses it.
      recipe: {
        role: 'planner', kind: 'prompt', prompt: 'recipe-maker', model: 'opus', maxVisits: 5,
        mintableOnRequest: true,
        routes: { wall: '@blocked' },
      },
      // Opens source files so no walker has to, and returns configured values with
      // file:line. Rules and rationale: §9c. Requested by the planner up front and by a
      // walker mid-pass — both cadences — so it is on-request. Holds no lane, so no cap.
      read: {
        role: 'worker', kind: 'prompt', prompt: 'siegemaster-reader', model: 'sonnet',
        maxVisits: 10, mintableOnRequest: true,
        routes: { wall: '@blocked' },
      },
      plan: {
        role: 'planner', kind: 'prompt', prompt: 'siege-planner', model: 'opus', maxVisits: 5,
        routes: { done: 'happyWalk', empty: 'sweepOut', wall: '@blocked' },
      },
      // Each walker has its OWN fixer, and each fixer routes back to the walker that
      // found the work. One shared fixer sent every adversarial finding back to the
      // happy walk, which never measured it.
      //
      // happyWalk → adversarial is the PHASE ORDER, and it is a route rather than a
      // rule in a prompt. Every happy piece drains before the first attack starts, so
      // an antagonist's baseline — the happy run id for the path it is attacking —
      // exists by the time the router mints it. See "A step's routes are its phases".
      happyWalk: {
        role: 'reviewer', kind: 'prompt', prompt: 'siege-happy-walker', model: 'sonnet', maxVisits: 40,
        // A lane IS a siegelense instance. How many may run at once is measured, not
        // declared, and the ROUTER starts and stops them — see "Concurrency is
        // measured" below. Both walkers draw on the one pool.
        needsLane: true,
        routes: { done: 'adversarial', unmet: 'fixHappy', wall: '@blocked' },
      },
      // No `done` route — mark-minted, so `done` returns to the walker that minted it.
      fixHappy: {
        role: 'worker', kind: 'prompt', prompt: 'siege-happy-fixer', model: 'sonnet', maxVisits: 40,
        routes: { unmet: 'fixHappy', wall: '@blocked' },
      },
      adversarial: {
        role: 'reviewer', kind: 'prompt', prompt: 'siege-adversarial-walker', model: 'sonnet',
        maxVisits: 40, needsLane: true,
        routes: { done: 'commit', unmet: 'fixAdversarial', wall: '@blocked' },
      },
      fixAdversarial: {
        role: 'worker', kind: 'prompt', prompt: 'siege-adversarial-fixer', model: 'sonnet',
        maxVisits: 40,
        routes: { unmet: 'fixAdversarial', wall: '@blocked' },
      },
      ...CLOSE_OUT,
      // Siege OVERRIDES CLOSE_OUT's ward endpoint: the pass is not over until the
      // instances are swept. Spread order matters — this entry has to come after
      // the spread, or the shared one wins.
      ward: {
        ...CLOSE_OUT.ward,
        routes: { done: 'sweepOut', empty: 'sweepOut', unmet: 'repair' },
      },
      sweepOut: {
        role: 'worker', kind: 'deterministic', handler: 'cleanup', maxVisits: 3,
        routes: { done: '@done', empty: '@done', wall: '@blocked' },
      },
    },
  },

  // The relay's FINAL gate, after every family has drained. Whole monorepo, not one branch.
  wardFull: {
    entry: 'gate',
    steps: {
      // No args — a bare ward is every check over the whole monorepo.
      // Deterministic: it exits green, red or empty. It cannot hit a wall,
      // so it declares no `wall` route. Only its repair can.
      gate: {
        role: 'reviewer', kind: 'deterministic', handler: 'ward', args: [], maxVisits: 3,
        routes: { done: '@done', empty: '@done', unmet: 'repair' },
      },
      // A repair here writes code, and this graph has no CLOSE_OUT, so it needs its own
      // commit. Without one the quest reaches @complete with the fix uncommitted, and
      // warpgate's `git merge --squash` drops it.
      repair: {
        role: 'worker', kind: 'prompt', prompt: 'spiritmender', model: 'sonnet', maxVisits: 3,
        routes: { done: 'commit', unmet: 'repair', wall: '@blocked' },
      },
      commit: {
        role: 'worker', kind: 'deterministic', handler: 'commit', maxVisits: 3,
        routes: { done: 'gate', empty: 'gate', wall: '@blocked' },
      },
    },
  },

  riftcarver: {
    entry: 'carve',
    steps: {
      // The one deterministic step that CAN wall: a git-state red or a permission
      // denial is an environment wall, not a red to repair.
      carve: {
        role: 'reviewer', kind: 'deterministic', handler: 'riftcarver', args: [], maxVisits: 3,
        routes: { done: '@done', unmet: 'repair', wall: '@blocked' },
      },
      // Same reason as wardFull's: a repair writes code and this graph has no CLOSE_OUT.
      repair: {
        role: 'worker', kind: 'prompt', prompt: 'spiritmender', model: 'sonnet', maxVisits: 3,
        routes: { done: 'commit', unmet: 'repair', wall: '@blocked' },
      },
      commit: {
        role: 'worker', kind: 'deterministic', handler: 'commit', maxVisits: 3,
        routes: { done: 'carve', empty: 'carve', wall: '@blocked' },
      },
    },
  },

  warpgate: {
    entry: 'merge',
    steps: {
      merge: {
        role: 'worker', kind: 'prompt', prompt: 'warpgate', model: 'opus', maxVisits: 3,
        routes: { done: '@done', unmet: 'merge', wall: '@blocked' },
      },
    },
  },
}
```

**Two targets are not step names:** `@done` completes the operation item; `@blocked` halts the quest
for a human. **`@next-piece`, `@rewalk` and `whenPiecesSpent` are all gone** — the unit gate does
what they were for, without per-family wiring.

### The config is the map. The ledger is the record. The UI is a projection.

This is the load-bearing statement of the whole design, and everything above only works once it is
said out loud.

**The ledger cannot be the map, because the map has cycles.** Today the ledger is a linear list minted
up front, and it doubles as the plan — the queue page reads it to show what is coming. That only works
while the run is a straight line, and the step graphs above are not one: `work ⇄ review` and
`happyWalk ⇄ fixHappy` are cycles inside a single family, and how many times either runs is not
knowable in advance. A list cannot say what is coming. It can only say what happened. The same
argument covers a family-level back-edge if one is ever declared — it is not declared here.

So the three things separate cleanly:

| | Is | Shape |
|---|---|---|
| **The config** | the map — everything that *can* happen | a graph, with cycles |
| **The ledger** | the record — what *did* happen | a list, append-only, minted as reached |
| **The UI** | a projection — what probably happens next | computed, never stored |

**The projection is a new transformer, and it is the piece that makes this usable.** Given the graph
and the quest's current state, walk forward from where the run actually is and render the likely
remainder. Overlay what really ran. As sessions land the projection is recomputed, so the view tightens
toward reality — and when the run takes a back-edge nobody predicted, the view redraws rather than
being wrong.

That is the answer to "the ledger cannot keep up". It was never supposed to. It is a record, and the
map is somewhere else.

**Three consequences worth stating, because each changes something above:**

- **Completion comes from the graph, not from the ledger.** A quest is complete when the family graph
  reaches `@complete` — not when the ledger drains. That is simpler than the extra condition I was
  about to bolt onto `workItemsToQuestStatusTransformer`, and it is correct under cycles, where a
  drained ledger is a perfectly normal mid-run state.
- **A family-level `maxVisits` is needed the day a family back-edge is declared**, for the same reason
  a step needs one, and it belongs on the family entry beside its routes. This pass declares no family
  back-edge, so it adds no such field — the reachability check is what would catch a cycle added
  later without one.
- **Lazy scope creation stops being a trade-off and becomes the only coherent option.** You cannot mint
  up front what the graph has not decided yet.

### The graph is checked before it runs — as a lint rule AND at load

A config this shape has a failure mode that a type cannot catch: **a step or family that no route
reaches, or that reaches no end.** Both graphs need a reachability check, and the reason is not
hypothetical — I left `ward` disconnected in an earlier draft of this very document and it read as
fine.

What the check asserts, at both levels:

| Rule | Catches |
|---|---|
| every step is reachable from `entry`, **or declares `mintableByPlan` or `mintableOnRequest`** | a step nothing routes to — dead prompt, never dispatched |
| every step reaches a terminal | a cycle with no exit — the quest runs forever |
| every route target names a real step, or `@done`/`@blocked` | a typo, or a step someone renamed |
| a step with no `done` route is reached ONLY by `unmet` or by a request | the "returns to its minter" contract — a plan-reachable step without a forward edge is a stall |
| every declared outcome word is one of the four | `pass`, `green`, `rework` — the old vocabularies |
| a cyclic path has `maxVisits` somewhere on it | an unbounded loop |
| every family reaches `@complete`, and every family is reachable from `entry` **unless it declares `appendedAtMerge`** | the relay version of the same thing |
| every `prompt` names a prompt that exists; every `handler` names a handler that exists | a swapped-out prompt leaving a dangling reference |

**Three steps would fail a naive version of the first rule, and all three are correct.** `adversarial`
is reached because a plan piece names it. `recipe` and `read` are reached because a running session
asks for them. `warpgate` is a family with no inbound route at all. Each needs a declared flag rather
than an exception in the checker, so the config says why and the checker stays dumb.

**Run it in two places, deliberately.** A **lint rule** loading the statics and walking the graph is
where it belongs — it fails at author time, in the editor, with the offending step named. This repo
already has custom rules that import statics at module load, so the mechanism exists. And **the same
check at server load**, because lint can be bypassed and the failure mode of a bad graph in production
is a quest that silently stalls rather than one that errors.

One check, two callers. The throw is the backstop; the lint is the one that actually saves you.

### The three layers, and when each is created

The vocabulary has drifted as this design grew. Three things exist, they are genuinely different, and
the old names do not say so. Plainly:

| | What it is | How many | Created |
|---|---|---|---|
| **Scope** — today's `operations[]` item | one family's slice of the quest: *"codeweaver, package web, flow send"* | one per fan-out cell or flow | when its family's turn arrives |
| **Session** — today's `workItems[]` item | one dispatched agent run | many per scope | one at a time, as the router decides |
| **Piece** — the plan file | what a planner intends one session to do | all of them at once | when the planner signals |

So the answer to "do scopes still spawn all at once" is **no, and that is the change.** Today
`questBuildRelayGraphBroker` mints every scope at Start — every codeweaver cell, every flowrider flow,
every siegemaster flow — before anything runs. With families routing to each other, each family's
scopes are minted when that family is routed to.

**That fixes a real bug.** An operator can add an observable mid-quest. Today flowrider's scopes were
already minted from the flows as they stood at approval, so a late observable never gets a flowrider
session. Minting later means the fan-out reads the flows as they stand then.

**And completion moves off the ledger entirely.** `workItemsToQuestStatusTransformer` derives
`complete` from a drained ledger today. Under a graph that can cycle, a drained ledger is an ordinary
mid-run state — so `complete` means *the family graph reached `@complete`*, full stop. That is REL-5,
the no-false-complete rule, restated rather than patched.

**The scope layer still earns its keep**, which is worth checking rather than assuming. It is the unit
of fan-out, the thing a plan file is keyed on, and the thing sessions group under in the execution
panel. Sessions alone could not carry any of that. What was wrong was only the naming.

### The plan drives forward; routes drive the loop-backs

Those are two different jobs and keeping them separate is what makes the config small.

| | Comes from | Example |
|---|---|---|
| **Forward progress** | the plan's batches | the planner cut six worker pieces in three batches; the router mints batch 1, waits, mints batch 2 |
| **Loop-backs** | the step's `routes` | a reviewer marked three units `unmet`; the router mints a worker on exactly those three |
| **Requests** | a session asking for a step | a walker whose seeds do not fit asks for `recipe`; the router mints it and returns to the asker |

So the router asks, in order:

1. Did this step REQUEST another step? → mint that step, carrying the request. Its `done` returns to
   the session that asked. This is how `recipe` and `read` run.
2. Does this step have `unmet` units? → mint a fresh work item at `routes.unmet`, scoped to them.
   That work item has **no piece** — it is minted from the marks, and carries an inherited payload
   instead.
3. Are there unstarted plan batches left **at the current step**? → mint the next one. A batch holds
   pieces for one step only, and every batch at this step is minted before question 4 is reached.
4. Otherwise → follow `routes.done`.

**"Piece" and "work item" are not interchangeable here.** A piece is a line in the plan file; a work
item is a session that ran. The router mints WORK ITEMS. Most carry a `pieceId`; the ones minted from
marks or from a request carry none.

That is why `plan: { done: 'happyWalk' }` works even though the plan holds pieces for two walk steps:
the route says *the happy phase starts now*, and the plan says which pieces that phase contains.
`routes.done` only decides where to go when the plan has nothing left at the current step — and then
it hands the run to `adversarial`, whose own pieces were sitting in the same plan file all along.

**Siege proves the structure generalises.** Its walkers are reviewers that find work rather than grade
it; its fixers are the workers. A walk marking three units `unmet` mints a fixer scoped to those three,
and the fixer's `done` returns it to that walker automatically — which re-walks only what it is given.
That is the re-walk, with no `@rewalk` pseudo-target, no route declared for it, no lane bookkeeping in
the router, and no "fixers run once after all rounds" special case.

### The ward gates — one per family, plus one at the end

Two different jobs, and the old relay only had one of them in the right place.

| Gate | `args` | Runs | Catches |
|---|---|---|---|
| **Family ward** — the `...CLOSE_OUT` trio | `['--committed', '--uncommitted']` — the whole quest branch | at the end of every code-changing family, so **once per cell and once per flow** | breakage attributed to the scope that caused it, while the session that caused it is still the most recent thing in git |
| **`wardFull`** — the relay's last item | `[]` — a bare ward is every check over the whole monorepo | once, after every family has drained | what a branch-scoped run cannot see: a package nobody in this quest touched that now fails |

**`ward(committed)` leaves the relay** — that gate is now inside codeweaver, flowrider and siegemaster
rather than sitting between them — and `wardFull` becomes the last family:

```
riftcarver → codeweaver(×cells) → flowrider(×flows) → siegemaster(×flows) → wardFull → @complete
              each ending in its own branch ward
```

Every arrow in that line is now a `routes.done` entry in `questFlowStatics`, not an array position.

**It is more ward runs, deliberately.** Today one `ward(committed)` runs after *all* codeweaver cells,
so a red names the branch and not the cell. Per-family gates cost N runs and buy attribution: the red
lands on the cell that produced it, and its `repair` step is scoped to that cell's own context.

**`wardMode` is deleted, not extended.** A deterministic step declares `args: string[]` — the flags its
handler is run with — and that is generic where a mode enum never was. `['--committed',
'--uncommitted']` is the branch gate, `[]` is the full one, and the difference between them stops being
a contract change.

Three things follow from `args` that a mode enum could not give:

- **A new ward scope is a config edit.** `['--only', 'lint,typecheck']` as a cheap early gate, or
  `['--onlyTests', '<regex>']`, needs no new enum member and no broker branch.
- **It generalises past ward.** `riftcarver` takes `args: []` today and can take flags tomorrow. Any
  handler added later inherits the field rather than needing its own mode.
- **`wardMode` leaves the operation item too.** The step carries the args, so the field the registry,
  the contract, the advance broker and the splices all copy around has nothing left to say.

**Deterministic steps.** `kind: 'deterministic'` names a handler, so the router runs code instead of
spawning a session. Both ward gates and `riftcarver` classify their exit code into one of the four
words and hand it to the same router. Riftcarver's failure classes map without loss:
`worktreePrepareStepStatics`' `repairable` becomes `unmet`, and both `git-state` and permission-denied
become `wall` — which is *more* correct, since a git-state red genuinely is a wall with no worktree to
send a repair into.

**`spiritmender` stops being a family and becomes the `repair` step** — one prompt appearing in five
graphs with byte-identical config, since it declares no `done` route and returns to whichever gate
minted it. Today that splice is hand-written slice arithmetic in two brokers; it becomes one route
entry each.

**Three roles deliberately have no graph.** `chaoswhisperer`, `bughunt` and `tavernkeeper` are
interactive CHAT roles — the user drives them, they spawn through `chatSpawnBroker` rather than the
dispatch scan, and none of them is a relay step. They keep their work items and prompts untouched.

**`glyphsmith` is deleted, and the design STAGE stays.** The role, its prompt and the chat path that
launches it go; `design_approved` was always set by a human rather than by that session, so the stage
loses nothing it depended on. Scope, measured: about 35 non-test source files name it, and the two
that are more than a list entry are `design-chat-start-responder` and web's `design-session-broker`.
It is independent of the step engine, so it is its own item in the order of work.

### The reviewer inherits the operator's real job

Pulling the loop out leaves one job homeless, and it is the most valuable one: **nobody is left looking
at the whole thing.** A worker sees its piece; a planner saw the scope before code existed.

That job goes to the reviewer, and it is why `codeweaver-reviewer` moves to **opus**.

| The reviewer does | Why it is the reviewer |
|---|---|
| walk every code bit the pieces added, in full — not the diff | a diff hides a false green; the file is what shows one |
| check the pieces glue together, **especially across package seams** | a seam has two halves built by two pieces, and neither worker saw the other's |
| fix what it can, itself | deferring a one-line fix downstream makes the next session re-derive it |
| mark `unmet` for what it cannot | that is the whole rework edge, and it names exactly which units |

The seam case is the specific one. Codeweaver fans out per (package, flow) cell, so a flow crossing an
HTTP boundary is built by two pieces in two packages that never see each other. Today the operator
reads both halves; under the step model the reviewer is the only session that does. "Read both sides of
every seam your pieces touched" becomes a required part of its prompt.

---

## 4. What each planner plans — three shapes, one envelope

**The common envelope**, on every piece:

**The whole file**, not an excerpt — this is the contract:

```jsonc
{
  "operationItemId": "op-7",
  "family": "codeweaver",
  "flowId": "flow-send",              // the scope, copied so the file reads alone
  "packageNames": ["web"],
  "writtenBy": "wi-planner-1",        // the work item whose planner wrote it
  "writtenAt": "2026-…",
  "batches": [
    {
      "mode": "sequential",           // sequential | parallel
      "pieces": [
        {
          "id": "pc-1",               // work items link back by this
          "step": "work",             // must exist in this family's step graph
          "assignedUnitIds": ["obs-3", "obs-7"],   // must mark. The gate counts these
          "contextUnitIds": ["obs-9"],             // must read and build against. May NOT mark
          "recipeId": "rcp-…",        // the seed this piece starts from, off the flow. Optional
          "context": "free-form brief: what this piece is and how to do it",
          "notes": ["trap: the send path double-fires under a stale token"],
          "payload": { }              // per-family, typed — see the three examples below
        }
      ]
    }
  ],
  "plannerMarks": [ ]                 // `cant-meet` only, on units no piece claims. See §1
}
```

**`assignedUnitIds` and `contextUnitIds` are two different jobs.** The first is what this session must
mark; the second is what it must read and build against but may not mark, which is how a seam's far
half stays visible to the cell that does not own it (hole 12). **The in-scope check binds
`assignedUnitIds` only** — a context unit is by definition a unit from somewhere else, and checking it
against this scope would reject exactly the case it exists for.

**`assignedUnitIds` is what the planner intends; the router decides what is assigned.** The plan is a
forecast, so the router re-filters against the record at dispatch and hands the session only what is
still unsettled. Siegemaster states the reason: *"Re-read the checklist before every round and brief
its verifier with only the units still remaining"* (`siegemaster-prompt-statics.ts:333`). Living in a
file called `planned-work` is what marks it as intent — the field name does not need to.

**`workItem.pieceId` is the link back.** It holds the piece's `id` verbatim from the plan file:

```jsonc
// in planned-work/2fde15cd-5355-4cb7-8615-6c7516de0fd9.json
{ "batches": [ { "pieces": [ { "id": "pc-scan", … } ] } ] }

// in quest.json
{ "id": "190d3d53-2564-421e-8983-2145223d67f8",
  "role": "codeweaver",
  "step": "work",
  "pieceId": "pc-scan",                                     // ← this
  "relatedDataItems": ["operations/2fde15cd-5355-4cb7-8615-6c7516de0fd9"] }
```

The pair `(operations/<id>` ref, `pieceId)` is what addresses a piece — the ref names the plan file,
the id names the piece inside it. It is optional because a mark-minted work item has no piece, and
neither do the deterministic steps or the chat roles.

**A work item with no piece still needs a brief, so it carries its own `payload`.** Hole 3 says the
router copies the originating piece's payload onto what it mints; that copy lands in
`workItem.payload`, which is a third added field alongside `step` and `observations[]`. Storing the
copy rather than a pointer is deliberate: a later amendment to the plan then cannot rewrite what a
session already ran against, which is the same reason a work item's observation set freezes at signal.

**One field needs structure before the rest do.** Flowrider's per-unit `surface` — the verbatim
`CHECK SURFACES` row saying where an assertion must read — cannot live inside free-form `context`. The
worker is forbidden to re-derive it (`flowrider-prompt-statics.ts:622`), a worker without it picks the
easiest reachable layer, and the reviewer rejects the pass on that ground alone (`:685`). Prose can
lose a verbatim string; a field cannot. So `payload` is the typed, per-family half — flowrider's
per-unit `surface` and `layer`, siege's off-map family and `baselineFor` — and `context` is everything
still loose enough to be prose.

**Codeweaver — the unit is a FILE GROUP.** Its map is already a batch structure with a hard predicate:
*"Two changes share a group only when BOTH hold: they touch DIFFERENT FILES, and NEITHER NEEDS THE
OTHER to have landed"* (`codeweaver-prompt-statics.ts:338`). One map group = one parallel batch.
*"Never write a wait into a brief"* (`:342`) becomes a contract rule: a piece may not reference another
piece in its own batch, checkable by intersecting file paths. Only 5 of the 12 brief blocks are
planner-authored — `FILES`, `FACTS`, `FENCES`, `UNITS`, `TRAPS`/`DO NOT TOUCH`. The other seven are
constant text belonging in the worker's served prompt.

**Flowrider — the unit is a TEST FILE, the decisions are per UNIT.** Coverage atom is a unit; dispatch
atom is a spec file (`:348`). `layer` (`browser | below-browser`) and `surface` are both per unit, and
a file-level layer label is explicitly a defect (`:331`). A second orthogonal axis rides alongside:
`shape` (`journey | matrix`) sets how many files exist, `surface` sets where each assertion reads, and
neither may collapse the other (`flow-evidence-contract-statics.ts:186`). `observableTarget` — which
node or edge a unit hangs on — is a promotion, not a transcription: *"the checklist does not print
which node an observable hangs on"* (`:741`), so only the session holding the flow render can resolve
it. Resolving it once into the plan beats every later session re-fetching the flow to find out.

**Siegemaster — the unit is a PATH WALK, and half the plan is policy.** The planner orders walks
cheapest-first (`:251`) and allocates the seven off-map families **one per round, never repeated**
(`:323`). More rounds than families: later rounds get the exact string `FAMILY: none for this walk`
(`:326`). Fewer: the unfitted families are marked `cant-meet` by the planner itself (`:328`) — the one
narrow exception to "a planner gets no units", justified in §1. Lane names are not planned at all; the
router starts each instance and serves its id (§9g).

Siege is where the "the plan is intent, the router decides the assignment" rule came from — see the
envelope above.

**Siege needs two fixers, not one.** A walker's `unmet` must come back to *that* walker. One shared
fixer sends every adversarial finding to the happy walk, which never measured it and cannot tell
whether the repair held. Two steps, two prompts — and the return edge is automatic, so neither declares
a `done` route. The prompts differ because the subjects differ: an adversarial finding's test lives at
a contract, a guard or a broker, **never a Playwright spec** (`siegemaster-stress-statics.ts:298`),
which is the opposite of the happy walk's rule.

### Three full planner outputs, cut from a real quest

These are not sketches. They are cut from quest `b4c31633` — *"Pasted images render like screenshots"* —
using its real flow, node, edge, observable, operation and package ids. Nothing is elided except where
a line says so, because the elided parts are where the shapes were hiding.

**Six things that quest corrected about my assumptions, before the examples make sense:**

| I assumed | The data says |
|---|---|
| a flow has `title` and `type` | it has **`name`** and **`flowType`**. `type` is a NODE field (`state`/`decision`/`action`/`terminal`) |
| `entryPoint`/`exitPoints` hold node ids | both hold **human label strings**. `exitPoints` is a `string[]` |
| a work item has `agentId` | **it does not.** `sessionId` is the handle, joining to `quest.sessions[]` |
| labelled edges are a convention | **labelled edge ⟺ signed-off edge ⟺ edge out of a `decision` node.** That holds across both flows |
| fan-out is package × flow | it is **only the pairs that appear in some node's `packages[]`**. This quest has 2 flows × 3 packages and **4** cells, not 6 |
| `packages[]` order means something | it does not — `["web","server"]` on one node, `["server","web"]` on another. **Never treat index 0 as primary** |

Also: node-level sign-offs appear **only on terminal nodes**; `toSettle` appears **only** when a
verdict is `unconfirmable`; `packageGraph` is not stored in depth order, so the orchestrator sorts it;
and `packagesAffected[].name` joins to `packageGraph[].id` — same value, two key names.

#### 1. Codeweaver — operation `2fde15cd`, `package: server · flow: screenshot-path-server-side`

Its unit set is every unit that node tags put in this cell: observables whose `package` is `server`,
the flow's three terminals, and its six labelled edges.

```jsonc
{
  "operationItemId": "2fde15cd-5355-4cb7-8615-6c7516de0fd9",
  "family": "codeweaver",
  "flowId": "screenshot-path-server-side",
  "packageNames": ["server"],
  "writtenBy": "wi-cw-server-planner",
  "writtenAt": "2026-09-14T01:06:50.000Z",
  "batches": [
    {
      "mode": "sequential",
      "pieces": [
        {
          "id": "pc-contracts",
          "step": "work",
          "assignedUnitIds": [],
          "context": "Declare the two contracts this cell owns before anything reads them. LocalImagePathMatch carries the path exactly as it appeared plus its ordinal; PastedImageOrdinal is the positive-integer brand for an image's place in one message, starting at 1 and never 0. The web side already brands its own TranscriptSegmentOrdinal and the two deliberately do not cross.",
          "notes": [
            "shared owns the path PATTERN, not this package — see the shared cell",
            "no units on this piece: contracts are proved by the code that reads them"
          ],
          "payload": {
            "files": [
              { "path": "packages/server/src/contracts/local-image-path-match/local-image-path-match-contract.ts",
                "change": "new",
                "in": "{ path: string; ordinal: number }",
                "out": "LocalImagePathMatch" },
              { "path": "packages/server/src/contracts/pasted-image-ordinal/pasted-image-ordinal-contract.ts",
                "change": "new",
                "in": "number",
                "out": "PastedImageOrdinal" }
            ],
            "facts": [
              "the token text writes the ordinal, so the first image in a message is 1",
              "shared declares localImagePathPattern; import it, never re-declare it"
            ],
            "fences": [],
            "traps": ["branded returns only — a bare number is a lint error here"],
            "doNotTouch": []
          }
        }
      ]
    },
    {
      "mode": "parallel",
      "pieces": [
        {
          "id": "pc-scan",
          "step": "work",
          "assignedUnitIds": [
            "scan-finds-every-path",
            "already-tokenised-path-not-rescanned",
            "one-extension-list"
          ],
          "context": "Scan message text for absolute image paths and return a LocalImagePathMatch per hit, ordinals continuing after any pasted bitmaps already attached rather than restarting at one. A path already inside an image token is not a hit.",
          "notes": [
            "trap: a path at the very end of the text with no trailing character is a real case and the easy regex misses it",
            "trap: a path wrapped in parentheses is a hit, and the parens stay"
          ],
          "payload": {
            "files": [
              { "path": "packages/server/src/transformers/local-image-paths-find/local-image-paths-find-transformer.ts",
                "change": "new", "in": "MessageText", "out": "LocalImagePathMatch[]" },
              { "path": "packages/server/src/transformers/local-image-paths-find/local-image-paths-find-transformer.test.ts",
                "change": "new", "proves": ["scan-finds-every-path", "already-tokenised-path-not-rescanned"] },
              { "path": "packages/server/src/transformers/image-content-type/image-content-type-transformer.ts",
                "change": "edit", "in": "FileExtension", "out": "ContentType" }
            ],
            "facts": [
              "pastedImageStatics.localImagePathPattern is the declared shape; import it",
              "pastedImageStatics.allowedExtensions is the one extension list — type CONTENT_TYPES off it so a new extension is a compile error"
            ],
            "fences": [
              "pasted-image-statics.ts — shared's, and the shared cell's to change"
            ],
            "units": [
              { "unitId": "scan-finds-every-path", "kind": "observable", "observableType": "custom",
                "text": "scanning the text finds every absolute path ending .png, .jpg, .jpeg, .gif or .webp: two on one line, one at the very end of the text with no trailing character, and one wrapped in parentheses are all found",
                "assert": "the COMPLETE four-match array, each with its own path and ordinal",
                "failsIf": "only the two paths on the first line come back" },
              { "unitId": "already-tokenised-path-not-rescanned", "kind": "observable", "observableType": "custom",
                "text": "a path already sitting inside an image token, as a pasted bitmap leaves it, is not matched a second time and the message gains no nested token",
                "assert": "the already-tokenised path is absent from the match array",
                "failsIf": "it comes back as a match and the rewrite nests a token" },
              { "unitId": "one-extension-list", "kind": "observable", "observableType": "custom",
                "verifyByReading": true,
                "text": "the server's image content-type map reads its extension list from shared's pasted-image statics rather than declaring its own map inline, so the scan and the serve route cannot drift apart",
                "assert": "CONTENT_TYPES is typed Record<AllowedExtension, …> off pastedImageStatics",
                "failsIf": "a bare {'.png': …, '.jpg': …} literal with no type tie back to shared" }
            ],
            "traps": ["one-extension-list is (read-check) — the reviewer settles it by opening the file, not by a test"],
            "doNotTouch": ["packages/server/src/transformers/local-image-token-substitute/**"]
          }
        },
        {
          "id": "pc-copy",
          "step": "work",
          "assignedUnitIds": ["copy-lands-in-quest-images"],
          "context": "Copy a found file into the quest's own images folder under a fresh uuid carrying the SOURCE file's extension. Bytes written must be the bytes read.",
          "notes": ["a source read that rejects is the leave-path-as-text branch, not an error"],
          "payload": {
            "files": [
              { "path": "packages/server/src/brokers/local-image/copy/local-image-copy-broker.ts",
                "change": "new", "in": "{ sourcePath: AbsoluteFilePath; questId: QuestId }", "out": "CopiedImagePath" },
              { "path": "packages/server/src/brokers/local-image/copy/local-image-copy-broker.test.ts",
                "change": "new", "proves": ["copy-lands-in-quest-images"] }
            ],
            "facts": ["the images folder is the quest folder's own, not a shared one"],
            "fences": [],
            "units": [
              { "unitId": "copy-lands-in-quest-images", "kind": "observable", "observableType": "file-exists",
                "text": "the copy lands in the quest's own images folder under a freshly generated uuid name carrying the source file's extension",
                "assert": "writtenDestinations() is exactly [`<imagesDir>/<uuid>.jpeg`] and the bytes match the source",
                "failsIf": "a fixed extension is used, or the bytes written are not the bytes read" }
            ],
            "traps": [],
            "doNotTouch": ["packages/server/src/transformers/local-image-paths-find/**"]
          }
        }
      ]
    },
    {
      "mode": "sequential",
      "pieces": [
        {
          "id": "pc-rewrite-and-branches",
          "step": "work",
          "assignedUnitIds": [
            "unresolved-path-verbatim",
            "forward-unchanged", "leave-path-as-text", "forwarded-to-agent",
            "found-none", "found-some", "file-missing", "file-good", "copy-ok", "copy-failed"
          ],
          "context": "Wire the branches. Rewrite a copied path to the pasted-image token shape; leave an uncopied path exactly as the user typed it. This piece owns the flow's three terminals and all six labelled edges, so every decision has to be reachable and provable.",
          "notes": [
            "forwarded-to-agent is a seam node — packages ['server','web']. server comes SECOND by tier, so this cell owns the unit",
            "the six labelled edges are the yes/no arms out of the three decision nodes"
          ],
          "payload": {
            "files": [
              { "path": "packages/server/src/transformers/local-image-token-substitute/local-image-token-substitute-transformer.ts",
                "change": "new", "in": "{ text: MessageText; copiedPathByOrdinal: Record<number, CopiedImagePath> }", "out": "MessageText" },
              { "path": "packages/server/src/transformers/local-image-token-substitute/local-image-token-substitute-transformer.test.ts",
                "change": "new", "proves": ["unresolved-path-verbatim", "found-none", "found-some"] },
              { "path": "packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.ts",
                "change": "edit", "in": "{ text: MessageText; questId: QuestId }", "out": "MessageText" },
              { "path": "packages/server/src/brokers/pasted-image/persist/pasted-image-persist-broker.test.ts",
                "change": "edit", "proves": ["leave-path-as-text", "file-missing", "copy-failed", "copy-ok", "file-good", "forward-unchanged", "forwarded-to-agent"] }
            ],
            "facts": [
              "an empty copiedPathByOrdinal means nothing copied — the text comes back byte-identical"
            ],
            "fences": [
              "local-image-copy-broker.ts — pc-copy's, already landed"
            ],
            "units": [
              { "unitId": "unresolved-path-verbatim", "kind": "observable", "observableType": "custom",
                "text": "the unresolved path reaches the agent exactly as the user typed it, character for character, with no markdown wrapper added around it",
                "assert": "the whole string is byte-identical to the input",
                "failsIf": "a markdown wrapper appears around a path nothing copied" },
              { "unitId": "forward-unchanged", "kind": "terminal",
                "text": "Message forwarded unchanged",
                "assert": "the end state AND its side-effect surface — no file written, no half-written copy",
                "failsIf": "the images folder gained a file on a message with no paths" },
              { "unitId": "leave-path-as-text", "kind": "terminal",
                "text": "Path left in the text as written",
                "assert": "the message carries the raw path and the images folder is empty",
                "failsIf": "a placeholder file was written, or the path was wrapped" },
              { "unitId": "forwarded-to-agent", "kind": "terminal",
                "text": "Agent reads the image and the transcript shows it",
                "assert": "the token is in the text and the copy is on disk",
                "failsIf": "the token points at a path that does not resolve" },
              { "unitId": "found-none", "kind": "branch", "text": "no",
                "assert": "with no path in the text, control reaches forward-unchanged",
                "failsIf": "the scan branch runs anyway" },
              { "unitId": "found-some", "kind": "branch", "text": "yes",
                "assert": "with a path present, control reaches the file check",
                "failsIf": "the message forwards unchanged" },
              { "unitId": "file-missing", "kind": "branch", "text": "no",
                "assert": "a path to a missing file reaches leave-path-as-text",
                "failsIf": "a copy is attempted" },
              { "unitId": "file-good", "kind": "branch", "text": "yes",
                "assert": "a readable image path reaches the copy step",
                "failsIf": "it falls through to leave-path-as-text" },
              { "unitId": "copy-ok", "kind": "branch", "text": "yes",
                "assert": "a successful copy reaches the rewrite",
                "failsIf": "the path is left as text despite the copy landing" },
              { "unitId": "copy-failed", "kind": "branch", "text": "no",
                "assert": "a failed copy reaches leave-path-as-text and writes nothing",
                "failsIf": "a token is written pointing at a file that does not exist" }
            ],
            "traps": ["a branch unit is not proved by a test that never forces the other arm"],
            "doNotTouch": []
          }
        }
      ]
    }
  ]
}
```

#### 2. Flowrider — operation `9e75438c`, `flow: screenshot-path-server-side`

Same flow, different job. Its units are the whole flow's, not one package's — and every unit carries a
`layer` and a `surface`, where **the orchestrator fills `surface` from the unit's own `checkSurface`
field** rather than the planner transcribing it.

**The planner writes no `surface` key at all.** The `<filled by …>` strings below are not values a
planner types — they mark where the orchestrator's value lands when the piece is read back. A planner
that writes the key is writing a transcription, which is the one hop hole 19 exists to delete.

```jsonc
{
  "operationItemId": "9e75438c-239d-42a0-86fe-954f322222fc",
  "family": "flowrider",
  "flowId": "screenshot-path-server-side",
  "packageNames": [],
  "writtenBy": "wi-fr-planner",
  "writtenAt": "2026-09-14T14:02:00.000Z",
  "batches": [
    {
      "mode": "parallel",
      "pieces": [
        {
          "id": "pc-integration-server",
          "step": "work",
          "assignedUnitIds": [
            "scan-finds-every-path", "already-tokenised-path-not-rescanned",
            "copy-lands-in-quest-images", "unresolved-path-verbatim",
            "forward-unchanged", "leave-path-as-text",
            "found-none", "found-some", "file-missing", "file-good", "copy-ok", "copy-failed"
          ],
          "context": "One integration suite driving the real server through every arm of this flow. Four real files with four distinct extensions — two on one line, one in parens, one at the very end — then the missing-file arm and the failed-copy arm.",
          "notes": [
            "one-extension-list is (read-check) and is NOT on this list — codeweaver's reviewer settled it by reading",
            "every arm out of a decision node needs its own case that forces the other arm red"
          ],
          "payload": {
            "specPath": "packages/server/src/flows/quest/quest-flow.integration.test.ts",
            "mode": "extend",
            "harnesses": [],
            "walk": {
              "shape": "journey",
              "paths": [
                { "nodeIds": ["message-reaches-server", "scan-for-local-paths", "any-paths-found", "forward-unchanged"],
                  "forceLabels": ["no"] },
                { "nodeIds": ["message-reaches-server", "scan-for-local-paths", "any-paths-found", "file-exists-and-reads", "leave-path-as-text"],
                  "forceLabels": ["yes", "no"] },
                { "nodeIds": ["message-reaches-server", "scan-for-local-paths", "any-paths-found", "file-exists-and-reads", "copy-into-quest-images", "copy-succeeded", "leave-path-as-text"],
                  "forceLabels": ["yes", "yes", "no"] },
                { "nodeIds": ["message-reaches-server", "scan-for-local-paths", "any-paths-found", "file-exists-and-reads", "copy-into-quest-images", "copy-succeeded", "rewrite-to-token", "forwarded-to-agent"],
                  "forceLabels": ["yes", "yes", "yes"] }
              ],
              "pathsTruncated": false
            },
            "units": [
              { "unitId": "scan-finds-every-path", "kind": "observable", "observableType": "custom",
                "layer": "below-browser", "surface": "<filled by the orchestrator from checkSurface>",
                "observableTarget": { "target": "observable", "nodeId": "scan-for-local-paths" },
                "assert": "the prompt the agent receives carries all four paths rewritten in order",
                "failsIf": "the raw unconverted message arrives" },
              { "unitId": "copy-lands-in-quest-images", "kind": "observable", "observableType": "file-exists",
                "layer": "below-browser", "surface": "<filled by the orchestrator>",
                "observableTarget": { "target": "observable", "nodeId": "copy-into-quest-images" },
                "assert": "the one written file name matches the uuid-plus-source-extension shape",
                "failsIf": "it keeps the source's own name" },
              { "unitId": "leave-path-as-text", "kind": "terminal",
                "layer": "below-browser", "surface": "<filled by the orchestrator, byKind.terminal>",
                "observableTarget": { "target": "node", "nodeId": "leave-path-as-text" },
                "assert": "the prompt carries the raw path AND the images folder is empty",
                "failsIf": "the token-substituted form arrives, or a placeholder file exists" },
              { "unitId": "copy-failed", "kind": "branch",
                "layer": "below-browser", "surface": "<filled by the orchestrator, byKind.branch>",
                "observableTarget": { "target": "edge", "edgeId": "copy-failed" },
                "assert": "a rejecting copy leaves the path verbatim and writes nothing",
                "failsIf": "a token is written anyway" }
              // FOUR of this piece's TWELVE units are shown, one per kind. A real piece
              // carries all twelve: `units[]` 1:1 with `assignedUnitIds` is a contract rule,
              // and the whole point of it is that a dropped unit is invisible otherwise.
            ],
            "facts": ["the integration harness already boots a real server and a real quest folder"],
            "fences": ["everything above line 1600 in this spec belongs to other flows"],
            "traps": [],
            "doNotTouch": ["packages/web/**"]
          }
        },
        {
          "id": "pc-browser-transcript",
          "step": "work",
          "assignedUnitIds": ["forwarded-to-agent", "historic-render-survives"],
          "context": "One Playwright walk. Send a message carrying an absolute screenshot path through the real server, then delete the ORIGINAL file, reload, and assert the transcript image still decodes real bytes from the copy.",
          "notes": [
            "codeweaver marked historic-render-survives cant-meet: jsdom performs no layout and never fetches an img src. naturalWidth is the measurement that settles it"
          ],
          "payload": {
            "specPath": "packages/web/src/flows/quest-chat/screenshot-path-renders-in-transcript.e2e.ts",
            "mode": "new",
            "harnesses": [
              { "path": "packages/web/src/flows/quest-chat/screenshot-path.harness.ts", "change": "new",
                "in": "{ page: Page; questId: QuestId }", "out": "ScreenshotPathHarness" }
            ],
            "walk": {
              "shape": "journey",
              "paths": [
                { "nodeIds": ["message-reaches-server", "scan-for-local-paths", "any-paths-found", "file-exists-and-reads", "copy-into-quest-images", "copy-succeeded", "rewrite-to-token", "forwarded-to-agent"],
                  "forceLabels": ["yes", "yes", "yes"] }
              ],
              "pathsTruncated": false
            },
            "units": [
              { "unitId": "forwarded-to-agent", "kind": "terminal",
                "layer": "browser", "surface": "<filled by the orchestrator, byKind.terminal>",
                "observableTarget": { "target": "node", "nodeId": "forwarded-to-agent" },
                "assert": "{ imageCount: 1, brokenCount: 0, naturalWidth: SEED_WIDTH_PX }",
                "failsIf": "{ imageCount: 0, brokenCount: 1, naturalWidth: 0 }" },
              { "unitId": "historic-render-survives", "kind": "observable", "observableType": "ui-state",
                "layer": "browser", "surface": "<filled by the orchestrator, byOutcomeType['ui-state']>",
                "observableTarget": { "target": "observable", "nodeId": "forwarded-to-agent" },
                "assert": "after removing the ORIGINAL and reloading, naturalWidth is still non-zero",
                "failsIf": "a placeholder renders, or naturalWidth is 0" }
            ],
            "facts": ["ward gives each e2e run its own port pair and its own report path"],
            "fences": [],
            "traps": ["deleting the original must happen AFTER the send completes, or the copy never lands"],
            "doNotTouch": ["packages/web/playwright.config.ts"]
          }
        }
      ]
    }
  ]
}
```

Two pieces in one parallel batch, one `below-browser` and one `browser` — which is why
flowrider's `maxConcurrent` counts **pieces with any browser unit**, not units — which is what its
`counts: 'browser-pieces'` half says.

#### 3. Siegemaster — operation `9df8a11d`, `flow: screenshot-path-server-side`

A walk piece per path, then an adversarial piece per allocated off-map family. **Batches hold pieces
for ONE step**, so every `happyWalk` piece drains before the first `adversarial` piece is minted —
that is the phase order, and it is what makes each attack's baseline a real reading. **Instance ids
are absent** — the router starts one per work item and substitutes its id into the prompt.

```jsonc
{
  "operationItemId": "9df8a11d-b5c0-46ad-b3c0-f5f605dccaaf",
  "family": "siegemaster",
  "flowId": "screenshot-path-server-side",
  "packageNames": [],
  "writtenBy": "wi-sg-planner",
  "writtenAt": "2026-09-14T16:00:00.000Z",
  "batches": [
    {
      // BATCH 1 — the happy phase, cheapest path first.
      "mode": "parallel",
      "pieces": [
        {
          "id": "pc-walk-happy-path",
          "step": "happyWalk",
          "assignedUnitIds": ["forwarded-to-agent", "copy-lands-in-quest-images", "copy-ok", "file-good", "found-some", "historic-render-survives"],
          "recipeId": "rcp-quest-with-screenshot-sent",
          "context": "Drive the full success path by hand: paste an absolute screenshot path into the composer, send, watch the transcript render the image, then reload the page and watch it render again from the copy.",
          "notes": ["cheapest walk, run it first — it is the one that has to work"],
          "payload": {
            "path": { "nodeIds": ["message-reaches-server", "scan-for-local-paths", "any-paths-found", "file-exists-and-reads", "copy-into-quest-images", "copy-succeeded", "rewrite-to-token", "forwarded-to-agent"],
                      "forceLabels": ["yes", "yes", "yes"] },
            "offMapFamily": null
          }
        },
        {
          "id": "pc-walk-missing-file",
          "step": "happyWalk",
          "assignedUnitIds": ["leave-path-as-text", "unresolved-path-verbatim", "file-missing", "found-none", "forward-unchanged"],
          "recipeId": "rcp-quest-in-progress-no-message",
          "context": "Drive the two no-op arms: a message with no path at all, then a message naming a file that does not exist. Both must reach the agent with the text untouched and leave the images folder empty.",
          "notes": [],
          "payload": {
            "path": { "nodeIds": ["message-reaches-server", "scan-for-local-paths", "any-paths-found", "file-exists-and-reads", "leave-path-as-text"],
                      "forceLabels": ["yes", "no"] },
            "offMapFamily": null
          }
        }
      ]
    },
    {
      // BATCH 2 — the adversarial phase. Nothing here is minted until BOTH pieces above
      // have recorded, because each of these reads the happy run for its own path as its
      // baseline, and the router can only hand over a run id that exists.
      "mode": "parallel",
      "pieces": [
        {
          "id": "pc-stress-happy-path",
          "step": "adversarial",
          "assignedUnitIds": ["offmap:hostile-input"],
          "recipeId": "rcp-quest-in-progress-no-message",
          "baselineFor": "pc-walk-happy-path",
          "context": "The success path, attacked. Feed the composer paths that are not what the scan expects: a path with a newline in it, a path to a 400MB file, a path with '..' segments reaching outside the home, a symlink pointing at /etc/passwd, a path whose extension lies about its bytes.",
          "notes": ["hostile-input is one of only two families carrying this quest's security coverage — do not skip it"],
          "payload": {
            "path": { "nodeIds": ["message-reaches-server", "scan-for-local-paths", "any-paths-found", "file-exists-and-reads"],
                      "forceLabels": ["yes"] },
            "offMapFamily": "hostile-input"
          }
        },
        {
          "id": "pc-stress-missing-file",
          "step": "adversarial",
          "assignedUnitIds": ["offmap:concurrency"],
          "recipeId": "rcp-quest-in-progress-no-message",
          "baselineFor": "pc-walk-missing-file",
          "context": "The no-op arms, raced. Send four messages carrying the same path at once, and send one while the file is being written. Ordinals must not collide and no copy may be half-written.",
          "notes": [],
          "payload": {
            "path": { "nodeIds": ["message-reaches-server", "scan-for-local-paths", "copy-into-quest-images", "copy-succeeded"],
                      "forceLabels": ["yes"] },
            "offMapFamily": "concurrency"
          }
        }
      ]
    }
  ],
  "plannerMarks": [
    { "unitId": "offmap:re-entry",      "mark": "cant-meet", "toSettle": "Allocate a third walk to re-entry: reload mid-send and re-send the same path." },
    { "unitId": "offmap:interruption",  "mark": "cant-meet", "toSettle": "Kill the server between copy and rewrite and confirm no orphaned file." },
    { "unitId": "offmap:staleness",     "mark": "cant-meet", "toSettle": "Overwrite the source file between scan and copy." },
    { "unitId": "offmap:configuration", "mark": "cant-meet", "toSettle": "Point the images dir at a read-only path." },
    { "unitId": "offmap:perf",          "mark": "cant-meet", "toSettle": "Measure copy time across 1, 10 and 100 images — one row proves nothing." }
  ]
}
```

**`baselineFor` names the happy piece this attack measures against**, and it is the field the two-phase
route exists to make fillable. The router resolves it to that piece's work item, takes its instance id
and run id, and serves both. A planner writing an `adversarial` piece with no `baselineFor` is writing
an absence claim with nothing behind it, so the plan contract requires it.

**`plannerMarks` is the one place a planner writes marks**, and only `cant-meet`, and only for units it
is putting on no piece — two walks means two of the seven off-map families get a round, and the other
five have to be recorded as uncovered rather than silently dropped.

**What these three examples exposed:** a codeweaver piece can legitimately carry **zero** units (the
contracts piece — contracts are proved by the code that reads them, not by themselves), which means
"every piece has units" is not a contract rule. And an off-map family needs a unit id shape of its own
— `offmap:<family>` above — because it hangs on no node and no edge.

### Recipes — the seed state a walk starts from, and they already exist

**Recipes are not new, and this plan does not invent a shape for them.** They live in
`packages/hydration-recipes`, at a path fixed by convention rather than config
(`recipe-location-statics.ts:16`). `dungeonmaster siegelense recipes` enumerates them.
`recipeSeedRunBroker({ recipe, apiBaseUrl, homePath, parameters })` RUNS one against a live instance,
with typed parameters and typed returns. Siegelense's own rule — *"A recipe touches state, never a
screen"* — is the same idea this section needs, already written down and already enforced.

**§9b is what a recipe-provisioning role does** — it was moved here out of the siegelense scrolls,
which are being deleted. The load-bearing half: that role **runs** every seed it intends to use, new
and existing alike, against a throwaway instance, as the SEQUENCE the setup submits, and records the
run id that proved it. A seed with no proving run is a path no walk may be sent down. An unproven
recipe does not fail loudly; it manufactures a defect that does not exist and sends a fixer hunting in
working code.

**What this plan adds is the ROUTING**, and it is three rules:

| Who | When | What |
|---|---|---|
| a **planner** — siege or flowrider | it needs seed data to cut a plan | requests `recipe`, which enumerates what exists, authors and proves what is missing, and records the result on the flow |
| a **worker or walker** | it picks up its work item | checks the seeds its piece names against the job in front of it. **This is required prompt text, not a courtesy** |
| the same worker or walker | the seeds do not satisfy the job | requests `recipe` for a new seed scoped to its own work item, and carries on when it returns |

**`recipe` is not an entry step and does not run on a route.** It is minted on request and returns to
whoever asked, using the same automatic return edge a mark-minted step uses. A quest whose seeds all
exist never dispatches it at all.

**The record on the flow is a forcing function, not the source of truth.** `quest.flows[].recipes[]`
holds the recipe NAMES a planner found and authored, so the quest can show that the enumeration
actually happened. The recipes themselves live in the committed recipe book, which is where a state
worth creating once gets created again. **One agent deciding these recipes are enough is not the same
as those being the recipes to use** — which is exactly why the worker-side re-check above is a rule
rather than a suggestion.

**Flow-scoped is still the point.** Flowrider and siegemaster walk the same flows and need the same
setup. Whichever family asks first pays for it and the other reuses the answer.

**Why this beats the markdown guide it replaces.** The guide was one file per operation item, written
by one family, invisible to the other, and unreadable by anything but a session. A recipe is code that
runs, named from quest data, shared across families, and re-usable by the next quest that walks the
same flow.

### What the server checks when a plan is submitted

A plan is a graph of references into `quest.json` and into the step config. Every one of them can be
wrong, and a wrong one surfaces as a session dispatched against nothing. **The `quest-work` handler
validates the whole plan before it persists a byte** — a plan is cheap to reject and expensive to run.

Now that the three examples are written out, the list is mechanical:

| Check | What a failure means |
|---|---|
| `operationItemId` matches the submitting work item's own `operations/<id>` ref | a planner writing into another scope's plan |
| every `piece.id` is unique within the file | two work items resolve the same `pieceId` |
| every `piece.step` exists in THIS family's step graph | a renamed or invented step — dispatch would fail later, with no session to blame |
| every `assignedUnitIds` and `contextUnitIds` entry resolves to a real unit on the quest — an observable id, a terminal node id, a labelled edge id, or `offmap:<family>` | the commonest typo, and the one that silently shrinks coverage |
| every **assigned** unit is **in scope** for this operation item. Context units are exempt | a planner claiming another cell's work — while the seam's far half stays legal |
| no unit is claimed by two pieces in the same batch | two sessions marking the same unit concurrently |
| every `flowId` referenced resolves in `quest.flows[]` | a stale flow id after a spec edit |
| every `packageName` resolves in `quest.packagesAffected[]` | a package nobody declared |
| every `payload.files[].path` sits under a package this scope owns | a piece reaching into a sibling cell's tree |
| no two pieces in one batch name the same file path | the batch predicate, checkable by intersection |
| `payload.units[]` is 1:1 with the piece's `assignedUnitIds` | a dropped terminal or edge — invisible otherwise |
| every `observableTarget` resolves to the node or edge that unit actually hangs on | a sign-off written onto the wrong element |
| a `browser`-layer piece count per batch is within the step's `maxConcurrent` | the load cap, warned about at plan time. **The router is what enforces it** — a mark-minted piece is not in the plan, so this check can only ever be an early warning |
| **every piece in one batch names the SAME `step`** | a batch mixing steps has no single outcome to fold to and no single set of routes to take. It is also how the phase order is enforced at write time rather than discovered at dispatch |
| **every `adversarial` piece names a `baselineFor`, resolving to a `happyWalk` piece in an EARLIER batch** | an attack is an absence claim, and an absence is only evidence against a known-good reading taken first. "Earlier batch" is the check that catches the interleaved shape a planner would otherwise write |
| `offMapFamily` is one of the seven, and no family is allocated twice | a repeated family destroys the first round's coverage |
| every `plannerMarks` entry is `cant-meet` with a `toSettle`, on a unit no piece claims | the planner's one mark authority, bounded |
| every `recipeId` a piece names is recorded on that flow AND carries the run id that proved it | a walker handed a seed that does not exist, or one that rotted while nobody was using it |
| a walk piece whose path needs a seeded system names a recipe | the silent version: a walker inventing its own setup, differently each time |

**Two of these are worth more than the rest.** The 1:1 `payload.units[]` check catches a dropped
terminal *at write time, before a session exists* — otherwise a unit silently never gets built and
nothing notices until the in-scope gate blocks at the end. And the in-scope check is what stops a
planner quietly widening its own cell.

**Reject the whole plan, never a piece.** A partially-accepted plan is a coverage hole with no owner.
The planner gets the validation error, fixes it, and resubmits inside the same session — which is the
same shape as the signal gate, and for the same reason.

### Operational flows and nodes — who gets them, who has them filtered out

A flow typed `operational` has no running system to walk. Its observables are things like a file
deleted, a config changed, a dependency removed. **Who sees one is an assertion requirement, not a
preference**, so it goes in a table and gets tested:

**Codeweaver owns operational work outright. Flowrider and siegemaster never see it.**

| Family | Operational flows, nodes and observables | Why |
|---|---|---|
| **codeweaver** | **gets all of it** | somebody does the work, and its reviewer is the only session that reads the tree and can confirm the change landed |
| **flowrider** | **filtered out** | it writes tests that walk a flow. There is nothing to walk, and a test asserting a file is absent is a change-detector that goes green the day it is written and blind thereafter |
| **siegemaster** | **filtered out** | it drives a running system by hand. An operational change has no running surface to drive |

The filtering is the **orchestrator's**, never the session's. A prompt that says "skip operational
units" is a rule an agent can misread; a scope that never contains one cannot be misread.

**Three assertions, and they are negative ones — the hardest kind to remember to write:**

1. **Fan out a quest whose flows are all operational. Assert ZERO flowrider scopes and ZERO
   siegemaster scopes exist.** Not "they complete cleanly" — that they are never minted.
2. **Hand a flowrider or siegemaster scope a runtime flow carrying an operational node. Assert that
   node's units are absent from the scope's unit set.** This is the case that will actually bite: a
   runtime flow can hold a node whose work is operational — a migration that runs once, a config
   written at deploy. **The filter is per unit, not per flow.** Filter only by `flowType` and those
   units arrive at a session that cannot settle them, and the gate then blocks forever.
3. **Assert a codeweaver reviewer marks an operational unit `met` with TREE STATE as evidence, never
   a test path.** The file really deleted, really gone from every import and every route.

And the consequence worth naming: a quest whose flows are all operational routes `empty` past both
verify families and goes riftcarver → codeweaver → `wardFull`, each code-changing family still ending
in its own commit and branch ward. That is correct, and it should have a test of its own, because it
is a whole quest shape that never enters either verify family's graph.

*Future, not this feature:* ChaosWhisperer marks operational items needing a cloud console or another
human-only surface as `reviewByUser`, so they route to a person rather than to a reviewer. Leave room
for the mark; do not assume every operational observable is machine-checkable.

---

## 5. `quest-work` — the write surface, and the routing input

One MCP tool every LLM step calls, with a discriminated payload:

| Payload | Sent by | Carries |
|---|---|---|
| `plan` | a planner | the pieces and their batches, plus `plannerMarks` |
| `observations` | any prompt step holding units | per **unit**, one of `met` / `cant-meet` / `unmet`, with evidence. `toSettle` is required on `cant-meet` |
| `amendment` | any step | a change to the plan the run has revealed |
| `outcome` | any step holding no units, and any step hitting a wall | the declared word and its reason — the channel `signal-back` no longer has |
| `invalidation` | a siege fixer, off its `REACHES:` line | a `flowId` and a reason. Every unit on that flow is re-opened and assigned to a fresh session — the bulk lever `reset-flow-signoffs` was |
| `request` | any step | the step it is blocked on — `recipe` or `read` — and why. The router mints that step and returns to the asker, so the asker names no route |

**Keyed by `unitId`, not `observableId`.** A terminal node and a labelled edge are units too, and they
sign on the node and the edge rather than on an observable. The gate's denominator is
the checklist's unit set, now served by `get-quest-work`.

**This record is what the orchestrator reads to pick the next work item.** It does not trust a claim. A
worker that says it is finished while leaving an assigned unit unmarked does not get to signal at all —
the gate refuses before routing is even consulted.

### `get-quest-work` — the plan read back as markdown

A planner that just wrote twenty pieces as JSON cannot see whether they add up, and a plan is expensive
to get wrong — every piece becomes a dispatched session.
`get-quest-work({ questId, operationItemId })` returns it as **markdown**: batches as headings, pieces
as rows, each piece's units listed with what the record already says about them.

Two things it must show that JSON does not make obvious:

- **Coverage** — every observable in scope and which piece claims it. An observable claimed by no piece
  is the defect a planner most needs to see, and in JSON an absence is invisible by construction.
- **Ordering** — the sequence as it will actually execute, not nested `mode` fields the reader has to
  simulate.

This is an existing pattern: `qa-checklist-to-text-transformer`,
`blight-checklist-to-text-transformer`, `flow-graph-to-text-transformer` and
`quest-summary-build-transformer` all already render structures to text for agents. The new
`work-plan-to-text-transformer` sits beside them.

### A prompt carries IDs. Everything else is a call.

**`mcpToolResultStatics.maxVerbatimChars` is 50,000 characters, and today's prompts already run at
43,000–48,000.**
There is no room to inject a piece's files, facts, fences, units and surfaces into a served prompt.
Over the ceiling the MCP layer spills the result to a file and hands the agent an error stub — the
session then holds a path instead of its instructions, and nothing reports a failure.

So `workItemToPromptTransformer` keeps doing exactly what it does today: **substitute the ids and
nothing else.** The agent fetches its own work, the same way it already fetches its flow and its
checklist.

| The prompt is handed | The agent calls for |
|---|---|
| Quest ID, Work Item ID, Operation Item ID, Step ID | its piece — `get-quest-work({ questId, workItemId })` |
| **Instance ID**, on a `needsLane` step only | its flow — `get-quest(…)` |

**The instance id is the fifth substituted value**, and it is there because the router starts and
stops instances now — see "Concurrency is measured" below. On every other step it is absent, and a
prompt that reads it is a prompt on the wrong step.

`get-quest-work` therefore answers two different questions depending on what it is given:

| Called with | Returns |
|---|---|
| `{ questId, operationItemId }` | the whole plan as markdown — the planner's review-before-signing read |
| `{ questId, workItemId }` | **everything this session needs to start.** See below |

**`get-qa-checklist` is deleted. `get-quest-work` is the one startup call for every role.** One call,
one shape, every family — and because it is one call, three things become possible that were not:

| It returns | Why it has to |
|---|---|
| the typed scope — `flowId`, `packageNames`, `operationItemText` | ids-only leaves no other route to them |
| **the units to cover**, with each one's current mark and the reasoning behind it | this is what `get-qa-checklist` used to give, filtered to this session's assignment |
| **the flows** the scope names, rendered | a walk needs the path, a worker needs the unit text verbatim |
| the piece — `context`, `notes`, and the typed `payload` | `surface`, `layer`, spec path, off-map family |
| **notes from previous sessions on the same work** | a re-mint can read what the session before it found instead of rediscovering it |
| **the uncommitted file list** — `git diff HEAD` unioned with untracked | no session commits now, so nobody discovers the pass by staging it |

**The notes channel is what makes a re-mint cheap.** Work item 2 is minted because work item 1 marked
two units `unmet`. Today a fresh session would re-derive everything. Handing it work item 1's notes on
exactly those units is the difference between a continuation and a restart.

**And it is what lets `signal-back` refuse usefully.** A session trying to signal with units unmarked
gets its own work definition read back at it, with the unfinished units highlighted. The refusal names
what is missing rather than just saying no — which matters, because the session has to act on it
inside the same turn.

**`get-quest-work` returns the uncommitted file list.** Every call, every role.

No session commits any more, so nobody is the one who runs `git status` and sees the whole change set.
The reviewer in particular used to discover its pass by being the session that staged it. That route
is gone, so the call has to hand it over.

**Measure it with `gitWorkingTreeFilesBroker`, which already exists and already gets this right.** It
unions `git diff HEAD --name-only` with `git ls-files --others --exclude-standard`, and the union is
the whole point: a bare diff reports TRACKED paths only, so **the net-new files a worker just wrote —
the ones most likely to carry the defect — would be invisible.** That broker is what today's
commit-before-signal gate measures with, for exactly this reason. The gate goes; the broker stays.
Reuse it rather than writing a second git call that gets it subtly wrong.

Four sessions need it, for four different reasons:

| Who | What they do with it |
|---|---|
| a **reviewer** | it IS the pass. Open every one of those files in full — that is the step that finds a false green |
| a **worker** | see what its siblings in the batch have open, which is the live `DO NOT TOUCH` set the plan could not know at plan time |
| a **fixer** | see what the walk before it left behind — a red test written as evidence is in that list |
| **any session** before signalling | to see what it is handing to the deterministic `commit` step, and to notice a file it did not mean to touch |

**One consequence worth stating:** the list is of the quest's own worktree, not the repo root, and a
quest with no worktree yet returns an empty list rather than an error. A hydrated quest is a real
state, not a violation — the same rule today's commit gate already follows.

#### No session runs git at all. One exception.

Serving the uncommitted list only half-solves this, and leaving the other half made the prompt
inventory contradict itself — several step lists still shelled out to `git log` and `git diff` after
the design had said sessions do not need git.

**So `get-quest-work` serves the git reads too**, and the rule is flat:

| Read | Who wanted it | Now |
|---|---|---|
| `git diff HEAD` + untracked — the pass | both reviewers | the uncommitted list, step 1 |
| `git log --name-only` — what earlier scopes landed | the codeweaver planner, so it does not re-brief work already committed | served: the paths committed on this branch since `baseRef`, grouped by the scope that committed them |
| `git log` — what prior sessions built | `spiritmender`, for context on a red | same field |
| `git status` — is my tree clean | anyone before signalling | the uncommitted list again |

**The exception is `warpgate`, and it is not a loose end.** Driving git IS its job — an intake merge,
a squash onto base, a commit. It is a one-step family with no `commit` step to collide with, and its
own prompt already forbids the two dangerous verbs (never probe for the default branch, never fetch).

Everyone else: **zero git commands, read or write.** That is a cleaner rule than "no git writes",
easier to state in a prompt, and easier to check — a git verb in any prompt but warpgate's is a bug.
It also removes a whole class of failure, because a session's `git log` sees the worktree it happens
to be standing in, and the serving path knows which worktree it means.

**A piece has no size ceiling; a prompt does.** This is the real reason the plan is a file rather than
prompt text, and it is worth saying plainly in the plan contract's own header so nobody later
"simplifies" it back into the prompt.

### Marking as you go — what every worker and reviewer prompt must say

The gate refuses a signal while a unit is unmarked, but a gate cannot make a mark honest or make it
timely. Both are prompt text, and both go in the shared block every non-planner prompt carries.

**Mark each unit the moment you settle it, never in one block at the end.** Two reasons, and the
second is the one that matters:

- A 40-visit step means long sessions are expected. A session that dies having marked nothing loses
  the whole piece; one that marked as it went leaves a partial record its successor can read.
- Marking at the end means transcribing from memory. Today's prompts already fight this — the operator
  is told to sign each group *before* sending the next, precisely so it is not transcribing dozens of
  returns at once (`codeweaver-prompt-statics.ts:437`). Under one session per piece there is nothing
  to transcribe *from*: the session settled the unit itself, so it should write the mark then.

**What each mark costs, stated so nobody guesses:**

| Mark | Write it when | It must carry |
|---|---|---|
| `met` | you settled it and can say how | the evidence — a test `file:line` and the wrong value that turns it red, or the value measured off the running system |
| `cant-meet` | nobody in this role could settle it at this layer | `toSettle` — the action that WOULD settle it, as an instruction |
| `unmet` | real work remains | what is left, and what you already learned. That note reaches your successor |

**Three rules no gate can enforce**, so they are prompt text:

- **`unmet` is not failure and costs nothing.** A session marking its remainder `unmet` and stopping is
  doing the right thing. Pushing on with no context left is what produces a `met` nobody can trust.
- **Never mark a unit you did not settle.** The gate forces a mark on every one; it cannot tell a real
  `met` from a hopeful one. This is the single sentence most worth getting right in every prompt.
- **`toSettle` is an instruction, not a question.** *"Drive a real send through a live quest and read
  the session JSONL for a Read call on the written path"* — never *"how should this be tested?"* A
  question hands the next session something to answer where it needed something to do.

### Sad paths: what a step does when it cannot finish

Every step needs the same three answers, and today they live scattered through five different prompt
sections. Under the step model they are one block, written once and repeated verbatim in every
non-planner prompt.

| Situation | What the agent does | Where it lands |
|---|---|---|
| **Out of scope / out of context** — real work remains that this session will not reach | mark those units `unmet` with a note on what is left, then signal | `quest-work` → `observations`. The router mints part two on exactly those |
| **Cannot be settled at this layer, by anyone in this role** | mark `cant-meet` with `toSettle` — the action that *would* settle it, as an instruction, never a question | same call. The unit is settled; nothing re-opens it |
| **Environment wall** — a denied command, a missing credential, an unreachable service | mark what is markable, then signal `wall` | the quest blocks for a human, carrying the reason |
| **The plan itself is wrong** | `quest-work` → `amendment`, then mark and signal normally | the router re-reads the plan instead of marching down it |
| **The seed is wrong or missing** — the recipes on this work item do not set up the job | request `recipe`, carry on when it returns | the router mints `recipe` and returns it here. Never invent a seed inline |

The three rules no gate can enforce — `unmet` costs nothing, never mark a unit you did not settle,
`toSettle` is an instruction — are stated once under "Marking as you go" above. They belong in the
same shared block as this table, written once and repeated verbatim in every non-planner prompt.

### `signal-back` survives, but stops deciding anything

Two jobs, both load-bearing, neither covered by the write tool:

1. **Idempotency on redelivery** — a second signal for a terminal work item is a no-op.
2. **The session-terminal marker.**

It gains a third: **refusing a signal while an assigned unit is unmarked.**

**And it LOSES the commit-before-signal gate, which the rest of this design makes impossible to
satisfy.** No session commits any more — committing is a deterministic step — so every session
reaches its signal with a dirty tree by construction. Keep the gate and a worker that just wrote four
files can never signal at all; it burns its visits against a wall nothing can move. REL-6d therefore
retires rather than surviving, and the uncommitted file list stays for its other readers: it is the
reviewer's pass, the worker's live `DO NOT TOUCH` set, and the fixer's view of what the walk left
behind. Its `operationStatus` field goes; routing reads the record.

---

## 6. Parallel dispatch is nearly free

`nextStepContract`'s `spawn-agents` already carries `agents: z.array(spawnInstructionContract)`, and
`spawnBatchLayerBroker` already spawns the whole array under `Promise.all`, pre-stamping each work item
`in_progress` first. The only thing capping dispatch at one session is
`select-batch-layer-broker.ts:17` — `const [first] = ready;`.

Parallelism is that selector returning a batch, plus a join: the route fires when the last item in the
batch has recorded. Concurrent `quest-work` calls queue behind `questWithModifyLockBroker`, which is
what that lock is for.

---

## 7. Contracts tolerate step names they do not recognise

Prompts get swapped in and out, so a `quest.json` holding a work item whose step no longer exists must
still **load**. Step ids become free branded strings, not enum members, and `agentPromptNameContract`
stops closing the set. Dispatch is where an unknown step fails — loudly, naming the step and the
family. Families keep their enum: the stable layer stays closed, the volatile layer opens.

`roleToPromptTemplateTransformer` and its `const exhaustiveCheck: never` are deleted; everything
resolves through `agentNameToPromptTransformer`. The two return byte-identical templates today and
agree only by construction.

---

## 8. The prompt map — every step, its gates, its endpoints

Each step needs a prompt, and each prompt needs to know what it is handed, what it must fetch, what it
may not skip, and how it ends. Writing those without a map is how a prompt ends up describing a tool
call that does not exist.

Each family's current prompts were read against this design and reconciled step by step — job, first
call, every endpoint, gates, writes, ending. **The maps are below rather than deferred**, because
what they broke and what they carry turn out to be the same list: a rule that has no home in the new
shape is exactly the rule a rewrite drops.

**Two rounds of this found 37 then 38 holes. Thirty-one are settled below, and the rest are
prompt-authoring detail that belongs in step 6 rather than here.**

### Every prompt in the system, at a glance

**Nineteen prompts are listed below: nine new, two adapted, four rewritten, two untouched, one
wording fix, one dead step removed.** Five more are deleted and so appear nowhere in the list — the
three operator prompts, `siegemaster-reviewer`, and `glyphsmith`. Step one is the same call for all
thirteen execution prompts, which is the point of collapsing `get-qa-checklist` into it.

**Role rules for the siege prompts are in §9, not here.** A step map below names the job, the calls
and the endpoints; §9 is what the prompt must SAY — nine rules for the happy walker, nine for the
antagonist, the five-step rule for an implementation-detail unit, and the reasoning behind
`siegemaster-reader`, `recipe-maker` and both fixers. Where a map below disagrees with §9, §9 wins and
the map is what needs correcting.

**How to read an entry.** `DOES` is the one job. `CONSUMES` is everything it is handed or fetches,
and nothing else reaches it. `WRITES` names the exact payloads — anything absent from that line it may
not write. `DONE` is the condition its ending is graded against, which for a unit-holding step is what
the signal gate already enforces. `FROM` names the part of today's prompt the step inherits, so a
rewrite has something to cut from rather than inventing one.

#### codeweaver

Today one 49,216-character operator prompt runs all nine steps. Splitting it three ways is mostly a
MOVE, and saying which part moves where is what stops a rule being dropped in the cut.

| Today's operator step | Goes to |
|---|---|
| 1 fetch the flow, read both `## Contracts` headings | planner |
| 2 standards, `get-project-map`, `discover`, then `Read` | planner |
| 2 `git log` for what earlier cells landed | planner, but **served** — it runs no git |
| 3 write the map — groups, FACTS, FENCES, PROVES, TRAPS | **the plan file.** `.quest-plans/<id>-map.md` stops existing |
| 3 the cross-package move table, `packagesAffected` | planner — the one `modify-quest` field it keeps |
| 4 the brief template's 5 authored blocks | the piece's `payload` |
| 4 the brief template's 7 constant blocks | the worker's served prompt |
| 4 sign each wave's `PROVED` lines | the worker marks its own units as it settles them |
| 5 read the diff, the four questions | reviewer — and it reads FILES, which is what it always did |
| 6–7 summon a reviewer, loop on its `NEXT:` line | gone. The reviewer is a step and the router runs the loop |
| 8 read-check sign-offs off the reviewer's report | the reviewer marks them itself, in the reading it already does |
| 8 `git status`, the SWEEP briefs | gone. The deterministic `commit` step takes the whole tree |
| 9 signal | every step signals |

```
codeweaver-planner · planner · opus · entry                                           [NEW]
  DOES      cuts this cell's work into pieces and batches, and claims every unit in scope
  CONSUMES  get-quest-work → scope (flowId, packageNames), the cell's in-scope units,
            piece:null, the paths earlier scopes committed · get-quest → the flow WHOLE
  WRITES    quest-work → plan · quest-work → outcome · modify-quest → packagesAffected only
  DONE      every in-scope unit is claimed by a piece or recorded in plannerMarks, and no
            batch holds two pieces touching one file
  FROM      today's operator steps 1-3 plus the brief template's authored blocks

  1 get-quest-work({ questId, workItemId }) — the scope, the in-scope units, `piece: null`
  2 get-quest({ questId, flowId, packageName }) — never `stage: 'spec'`, which renders the
    whole quest and blows the ceiling. The flow comes back WHOLE and unfiltered: a flow cut
    to one package comes apart into disconnected pieces and the branch conditions go with them
  3 read BOTH `## Contracts` headings. The second — "contracts you own that NO flow of yours
    anchors" — is shown to NO sibling session. Skip it and those contracts reach nobody
  4 a contract routes by FILE PATH, its own `source` or one property's. Build what each
    line's OWN path names, not the contract's source
  5 load standards: get-architecture, get-testing-patterns. Before reading any code
  6 ONE get-project-map naming every package the flow tags, then discover, then Read.
    discover first guesses a path, and a wrong glob reads exactly like an empty package
  7 read the paths earlier scopes committed — SERVED in step 1, never `git log`. Library
    packages run first, so the helper you are about to brief may already be on the branch
  8 cut one piece per FILE GROUP. Two changes share a batch only when BOTH hold: they touch
    DIFFERENT FILES, and NEITHER needs the other to have landed. Both, every time
  9 never write a wait into a piece. A file another piece is creating means a LATER batch —
    never one batch with a "re-check if it is not there yet" line, which has no bound and no
    `wall`, and a batch that wins that race by 40 seconds reads like one that lost it
 10 split assigned from context. A unit whose `{package}` is yours is assigned; a sibling's
    unit on a node you tag is CONTEXT — the other half of the contract you are building.
    Read it, build against it, never claim it
 11 a `(read-check)` unit goes in `payload.traps` as a constraint, NEVER in `payload.units`.
    No test settles it — a green test proves the value is right, never where it came from
 12 an edge line carries TWO ids: the `<edge:…>` at its head is the unit; the `[#…]` is the
    node it points at. Name the wrong one and the mark lands on nothing
 13 never a line number, in any field. Every batch that lands edits files, so a number
    recorded now is wrong by the batch that reads it. Anchor on a NAME
 14 a change needing a sibling package's behaviour: MOVE it to a package both can call, do
    not copy it and do not import across. `get-project-map` names the library package by
    KIND, since every repo names it differently. No library package at all → build it in
    your own package with a comment saying why, and write the spec change
 15 add any new package to `packagesAffected` BEFORE planning against it. That field is
    REPLACED WHOLE on write — send every existing entry back with yours
 16 write the plan, then read it back with get-quest-work({ questId, operationItemId }).
    **A unit no piece claims is the defect this read exists to catch**, and in JSON an
    absence is invisible by construction
 17 declare the outcome, signal

codeweaver-worker · worker · sonnet                                                   [NEW]
  DOES      writes one piece's implementation and the tests that settle its units
  CONSUMES  get-quest-work → the piece (files, facts, fences, units, traps, doNotTouch),
            its assigned AND context units, prior sessions' notes on those units, the
            uncommitted file list
  WRITES    quest-work → observations · quest-work → amendment
  DONE      every assigned unit marked, each `met` carrying a witnessed red — the test
            file:line, the FAILS IF value it was set to, and the ASSERT value that run
            reported as RECEIVED
  FROM      the brief template's seven constant blocks: RED FIRST, TRAPS, DO NOT TOUCH,
            DISCOVERY, BEST GUESS, PROVE, RETURN

  1 get-quest-work({ questId, workItemId })
  2 the uncommitted list is the LIVE `DO NOT TOUCH` set — what your batch-mates have open
    right now, which the planner could not know at plan time
  3 load standards + get-folder-detail for every folder type you will write into
  4 read your named files, AND your context units — they are the far half of a contract
    you are building and nobody assigned them to you
  5 implementation FIRST, then the spec written against it with every unit assertion set to
    its FAILS IF value
  6 run RED. Every one of those expects must FAIL, and each failure must report this unit's
    ASSERT value as what it RECEIVED. Expected the wrong value, received the right one —
    that pair is the only thing proving the assertion runs and reads what it claims to
  7 set only the assertions that SETTLE a unit. A precondition stays true, or the test dies
    before the assertions that matter run
  8 a suite that never RAN has produced no red. `Cannot find module`, `Test suite failed to
    run` and every `error TS` are compile failures with no assertion behind them
  9 you produce a red by editing YOUR OWN SPEC and nothing else. Banned by name: moving,
    copying or renaming a file; git stash; rewriting from git show; a `.bak`; breaking an
    implementation file. Never fabricate a red you did not watch
 10 correct each to ASSERT, run green
 11 MARK each unit the moment it settles — never one block at the end. A session that dies
    having marked nothing loses the whole piece
 12 create a file the piece did not list where the work needs one — a static, a transformer,
    a contract. Never one another piece owns or `doNotTouch` names
 13 the piece is a BEST GUESS. You have the code open and the planner did not, so hard
    evidence against a direction wins. **Every deviation comes back as a mark or an
    amendment, never as a note on a pass**
 14 ward YOUR OWN PATHS: `npm run ward -- -- <this piece's paths>`. Never `--uncommitted`,
    never bare, and never the `run-ward` MCP tool — that grades the whole branch and lands
    the red on your work item
 15 mark the remainder `unmet` with what is left and what you learned. That note reaches
    your successor
 16 signal. You commit nothing and you run no git

codeweaver-reviewer · reviewer · opus                                                 [REWRITTEN]
  DOES      reads every file this cell produced, in full, and settles every unit in scope
  CONSUMES  get-quest-work → the cell's WHOLE in-scope unit set as its assignment, every
            piece this cell ran with its notes and its marks, the flow, the uncommitted
            file list
  WRITES    quest-work → observations on every in-scope unit · modify-quest → a measured
            defect as a new observable · direct edits for what is small
  DONE      one written comment per file, both halves of every seam read, every in-scope
            unit marked, and every `met` a worker wrote either re-grounded or turned `unmet`
  FROM      today's reviewer steps 1-5 and 8, plus operator step 5's four questions

  1 get-quest-work({ questId, workItemId }) — **the whole in-scope set is yours**, not one
    piece's. You are the only session positioned to notice a unit no piece ever claimed
  2 load standards, before opening any code
  3 get-quest({ questId, flowId, packageName }) — the observables in their own words, never
    a worker's paraphrase and never a commit message's
  4 the pass IS the uncommitted list from step 1. It is tracked changes unioned with
    untracked additions, and the untracked half is most of what a cell produces
  5 open EVERY file IN FULL, one at a time. Not the diff — the file. A whole file is what
    finds the false green a diff hides: an assertion comparing a value to itself, a branch
    that reads plausibly alone and contradicts its caller
  6 emit that file's comment BEFORE opening the next — Acceptance / Evidence / Fit / Test /
    Missing. **The comment is the only durable evidence the file was read.** A verdict
    written after twenty reads describes twenty files at once and could have been written
    without opening any. A file carrying no comment has not been reviewed
  7 six questions, taken in ONE reading with the five standing concerns:
      a does the code do what the flow says — every branch an edge names should exist
      b do the pieces fit — one worker's function and another's call to it
      c is the unit test real — name the wrong value that turns it red, or it does not bite
      d what is MISSING — a node with no code behind it is what a green build never reports
      e does every cross-package import have a dependency behind it — the root
        `node_modules` resolves it either way, so lint and tsc stay green and it breaks the
        day that package is installed alone
      f does every `met` a worker wrote have a test you opened? Nobody has checked one
        until you do. **A `met` no test in this work proves is `unmet`**
  8 read BOTH SIDES of every package seam. Codeweaver fans out per cell, so a flow crossing
    an HTTP boundary is built by two pieces that never saw each other. You are the only
    session that reads both
  9 settle each `(read-check)` unit by OPENING THE FILE. Take its description verbatim from
    the flow render, never from a piece — a paraphrase you grade against is one you pass
 10 an operational unit is verified against the TREE, never against a test: the file really
    deleted, really gone from every import and every route
 11 fix what is small and clearly yours. A one-line hole closed here is a line the next
    session does not rediscover. Anything structural, anything needing a decision, is a mark
 12 mark as you go. An in-scope unit no piece claimed is `unmet`, and the router assigns it
    to the worker your `unmet` mints
 13 a measured defect is a NEW observable, added through modify-quest — an observable is a
    positive expectation, so its inverse is added rather than recorded as a verdict
 14 signal. **No ward and no commit** — both are deterministic steps after you
```

#### flowrider

Same split, from a 44,301-character operator prompt. Three of its moves are load-bearing and easy to
lose in the cut.

| Today's operator step | Goes to |
|---|---|
| 1 fetch the flow; the operational-retype escape | planner |
| 2 `get-qa-checklist` — units, `CHECK SURFACES`, `WALK PATHS` | planner, through `get-quest-work` — the checklist tool is deleted |
| 3 read the implementation for each unit's exact value; choose a layer PER UNIT | planner |
| 4 the map, with per-unit `layer` / `surface` / `assert` / `fails if` | the plan file's `payload.units[]` |
| 4 `HOW TO WRITE THESE` — the two rule sections copied into every map | **the worker's served prompt, as constant text.** They are the same words on every flow |
| 5 send, and sign each group's `PROVED` lines | the worker marks its own units |
| 6 read the diff, three questions, hunt dropped units | reviewer |
| 7–8 the reviewer loop, and the `flowriderSignoff: null` overwrite rule | gone. A set per work item means a rejected `met` needs no clearing |
| 9 the remainder, spec changes, the sweep | the reviewer marks; `commit` takes the tree |

**Two translations disappear, and both were defect sources.** Checklist ids are composite —
`<flow>:<kind>:<id>` — while `modify-quest` takes graph ids, so today's operator strips a segment and
routes each kind to a different array. Marks are keyed by `unitId` through `quest-work`, so that
translation is gone. And `observableTarget` — which node or edge a unit hangs on — is resolved ONCE by
the planner into the plan, where today every session re-derives it because *"the checklist does not
print which node an observable hangs on"*.

```
flowrider-planner · planner · opus · entry                                            [NEW]
  DOES      decides what each unit is proved BY, at what layer, in which spec file
  CONSUMES  get-quest-work → scope, in-scope units with their served `surface`, the walk
            paths with their force labels and `pathsTruncated`, piece:null · get-quest →
            the flow whole
  WRITES    quest-work → plan · quest-work → outcome · quest-work → request (recipe)
  DONE      one piece per spec file, `payload.units[]` 1:1 with `assignedUnitIds`, every
            in-scope unit claimed, every `observableTarget` resolved
  FROM      today's operator steps 1-4

  1 get-quest-work({ questId, workItemId })
  2 get-quest({ questId, flowId }) — never `stage` beside `flowId`; the two together return
    an empty answer that reads as "this flow is empty"
  3 a flow RETYPED `operational` after this scope was minted is `empty`, never `wall` and
    never `blocked`. Your step scope filters to `runtime` flows, so your in-scope set is
    empty and there is nothing to claim. Blocking there stalls a quest over a correction
    that did its job
  4 the walk paths are GIVEN — every route through the flow with the branch labels a run
    must force. Do not re-derive them from the graph. Carry `pathsTruncated` into the plan:
    a worker handed a silently capped path list writes a suite that looks complete
  5 **paths are the itinerary, units are the coverage.** Two paths can carry twenty units,
    so covering every path proves nothing on its own
  6 load standards, then ONE get-project-map naming every package the flow tags, then
    discover, then Read
  7 read the implementation until you know the EXACT value each unit claims — the string,
    the status, the count, the order, the bound. The unit's words say what must be true; the
    implementation is the only thing that says what value actually comes back
  8 choose `layer` per UNIT — `browser` or `below-browser`. Never per file. One spec file
    routinely carries units at different layers, and a file-level label throws away the
    choice at its first hop
  9 `shape` — `journey` or `matrix` — is per FILE and orthogonal. Several paths means one
    test per path; one path carrying many independent inputs means one parameterized test.
    Neither axis may collapse the other
 10 resolve `observableTarget` per unit — which node or edge it hangs on. Only the flow
    render prints it, and resolving it once here beats every later session re-fetching the
    flow to find out
 11 **write no `surface`.** It arrives on each unit from its own `checkSurface` and the
    orchestrator fills the field. A planner that types one is transcribing
 12 if you cannot state `failsIf` for a unit, the assertion is not specified yet — go back
    to step 7 rather than handing a worker a guess
 13 cut one piece per SPEC FILE. FACTS and FENCES are written HERE, keyed by path, and the
    worker reads its own. A fact authored inside a brief lives in one session and nowhere
    else
 14 fill `payload.units[]` 1:1 with `assignedUnitIds` — a dropped terminal is invisible
    otherwise, and the plan contract refuses the piece
 15 a piece whose test needs a seeded system → REQUEST `recipe`, attach the names it returns
 16 write the plan, read it back, declare the outcome, signal

flowrider-worker · worker · sonnet                                                    [NEW]
  DOES      writes one spec file and makes every unit on it bite
  CONSUMES  get-quest-work → the piece (spec path, mode, harnesses, per-unit layer and
            surface, walk paths and force labels, facts, fences, mirror, traps, recipes),
            prior sessions' notes, the uncommitted file list
  WRITES    quest-work → observations · quest-work → amendment · quest-work → request
  DONE      every assigned unit marked, each `met` naming the assertion's file:line and the
            wrong value that turns it red
  FROM      the brief template's constant blocks, PLUS both `HOW TO WRITE THESE` sections,
            which stop being copied per flow and become served text

  1 get-quest-work({ questId, workItemId })
  2 CHECK the piece's recipes against the job in front of you. They do not fit → request
    `recipe`. Never seed by hand, and never assume the planner's list is the right one
  3 load standards + get-folder-detail; read the MIRROR spec and the implementation
  4 write the spec with every unit assertion at its FAILS IF value
  5 run RED. Each expect must fail reporting this unit's ASSERT value as RECEIVED
  6 an expect that PASSES holding its FAILS IF value reads nothing; one that fails reporting
    some OTHER value reads the wrong thing. Both are the assertion's fault — fix the
    assertion, never the FAILS IF value you were handed
  7 correct to ASSERT, run green
  8 browser rules, when the piece says `browser`: one test per path, entry node to every end
    node, failure arms included — an error toast, a 4xx render and a rejection are
    first-class. Exact text, exact count, exact state, never a `toBeVisible()` stand-in.
    Assert the whole transition — request out, old state gone, new state visible. SEED TWO
    of anything an assertion must tell apart, or "the right one" and "the first one" are the
    same value. Drive state through the UI, never around it. Wait for elements, never a
    duration. `page.bringToFront()` + a screenshot + assert `visibilityState` BEFORE any
    geometry read, or a background tab reads every node invisible with a zero-ish box and it
    looks exactly like a product bug. A `.e2e.ts` declares no function — helpers go in a
    `.harness.ts`. Never edit the Playwright config or another flow's harness
  9 below-browser rules, when the piece says `below-browser`: assert on the side that MAKES
    the claim. Read the artifact back — a spy proving a write was called never proves what
    landed. A negative needs a positive beside it, or a typo'd selector passes forever. Give
    each input class a hostile member. Use the real thing wherever the claim is about the
    real thing
 10 MARK each unit as it settles
 11 a unit you cannot reach at its served surface is `unmet` with the reason. **You may not
    pick an easier layer**, and the surface is not yours to amend — it comes from the unit's
    own `checkSurface`, and changing that is the reviewer's authority
 12 ward your own paths only; signal, uncommitted

flowrider-reviewer · reviewer · opus                                                  [REWRITTEN]
  DOES      decides whether each assertion BITES, and settles every unit in scope
  CONSUMES  get-quest-work → the flow's WHOLE in-scope unit set as its assignment, every
            piece and its marks, the flow, the uncommitted file list
  WRITES    quest-work → observations on every in-scope unit · modify-quest → a measured
            defect as a new observable · direct edits where an assertion can be strengthened
  DONE      a named failing value behind every `met`, one comment per file, every in-scope
            unit marked
  FROM      today's reviewer steps 1-5, and the judging half of `flowEvidenceContract`

  1 get-quest-work({ questId, workItemId }) — the whole in-scope set is your assignment
  2 load standards; get-quest for the flow
  3 the pass IS the uncommitted list from step 1
  4 open every test file ONE AT A TIME and write its comment before opening the next:
    ACCEPTS / BITES / LAYER / OBSERVABLE / SIGNED / CONCERNS. A clean file still gets one —
    a missing comment is a file nobody can tell you opened
  5 **read the assertions, not the test names.** A name is a claim; an assertion is evidence
  6 BITES is the line this role exists to write: per assertion, the wrong value or state that
    turns it red. One you cannot name is not a test, and that file does not ACCEPT
  7 LAYER: reject on the surface disagreement ALONE. The unit's served surface beats what the
    assertion reads, whatever the test is named
  8 OBSERVABLE: where the test and the unit's words disagree, the unit wins. A test written
    against a paraphrase and graded against the same paraphrase passes while proving
    something else — that is the defect shape this whole family exists to prevent
  9 every `met` a worker wrote: find the test and name the wrong value that turns it red.
    **A `met` no test in this work proves is `unmet`** — a claim nothing backs is worse than
    an unmarked unit, because a later session reads it as settled and never looks again
 10 take the five standing concerns in the SAME reading, onto that same file's comment.
    Never a second pass over the tree
 11 subtract what the work covered from the in-scope set and mark what is left. **A green
    suite over half a flow reports nothing about the other half.** An unclaimed unit is
    `unmet`, and the router assigns it to the worker your `unmet` mints
 12 an `unmet` quotes the unit id AND your own words, so a worker can re-cut from it
 13 signal. No ward, no commit
```

#### siegemaster

Siege is the inverse of the other two — its reviewers run first and FIND the work, its workers repair
— and it is also where the most machinery retires. Six of today's mechanisms are replaced rather than
moved, and each one is a thing the new engine already does.

| Today | Replaced by |
|---|---|
| **the GUIDE** — one sub-agent writes `.quest-plans/<id>-guide.md` under eight headings, every round reads it | split four ways, below. The file stops existing |
| **rounds** — one path walk at a time, both minions back before the next | plan batches, bounded by measured lane capacity — and PHASED by the step chain, `happyWalk → adversarial` |
| the operator allocating two lane NAMES per round | the router, which starts and kills every instance and substitutes its id into the prompt |
| the operator holding the pass together — `cleanup` at both ends, `status` after a death, re-reading capacity | `sweepIn` and `sweepOut`, two deterministic steps, plus the router owning `start` and `kill` — §9g |
| "re-read the checklist before every round, brief only the units still REMAINING" | the router re-filters the assignment at dispatch |
| step 5's fixer dispatch and step 7's re-walk | an `unmet` mints a fixer; its `done` returns to the walker that found it |
| `reset-flow-signoffs` off a fixer's `REACHES:` line | the `invalidation` payload |

**Where each of the guide's eight headings goes.** This is the part most likely to be dropped
silently, because the guide is one file and its contents are not one thing:

| Guide heading | Now |
|---|---|
| `TOOLING`, `ENTRY`, `SEEDING`, `RESET` | **the recipe.** Executable, proven by a run, reusable by the next quest |
| `CONTROLS`, `FORCING` | the piece's `payload` — the path's own nodes and force labels, which the plan already carries |
| `OFF-SCREEN` — where a value lives that the page never shows | **`siegemaster-reader`**, which returns it with `file:line` |
| `TRAPS` | the piece's `notes`, written by the planner |

**`[SIGN ONCE]` is deleted from both walker prompts, with a note saying why.** It existed because a
second sign-off overwrote the first's evidence in a shared field. A re-walk now writes its own set on
its own work item and the first stays readable, so nothing is destroyed — and *"a fix is only proved
by a round that did not make it"* becomes something the engine does rather than something a prompt
asks for. Leave the rule standing and an adapted prompt carries a ban whose reason is gone.

**The deliberate-red mechanism retires with it.** Today a walker's pass-2 sub-agents write one failing
test per defect as durable evidence, and the operator then passes a `RED TESTS:` list to its reviewer
so that reviewer does not "fix" a red that is deliberate. Under the step model the FIXER writes that
red itself, watches it fail against unchanged source, and turns it green in the same session — so no
orphaned red ever reaches a ward gate, and no list is needed to protect one. A walker dispatches
nothing.

```
siege-planner · planner · opus · entry                                                [NEW]
  DOES      turns the flow's walk paths into walk pieces, and allocates the off-map families
  CONSUMES  get-quest-work → scope, in-scope units, the walk paths with their force labels,
            the seven off-map families, piece:null · get-quest → the flow whole, and its
            `flowType`
  WRITES    quest-work → plan (with plannerMarks) · quest-work → outcome · quest-work →
            request (recipe)
  DONE      one `happyWalk` piece per path, one `adversarial` piece per allocated family,
            every family this pass gives no round recorded `cant-meet` with a `toSettle`
  FROM      today's operator steps 1-3

  1 get-quest-work({ questId, workItemId })
  2 get-quest({ questId, flowId }) and read its `flowType`. `runtime` is a user-facing path
    to drive. `operational` verifies that manual code work landed — **nothing repeatable
    exists in one**, so it is filtered out of this family's scope entirely and your in-scope
    set comes back empty. That is `empty`, not work
  3 take the walk paths AS GIVEN. A path you invent is one whose branch labels nobody checked
    against the graph, and a walk sent down it measures a route the flow does not have
  4 **paths are the itinerary, units are the coverage.** Ten paths do not reach seventy-five
    units. You are done when every unit is claimed, not when every path has a piece
  5 order them cheapest-first, shared prefixes adjacent. The cheapest path surfaces a break
    before anything is spent on branches running through the same early nodes
  6 cut one `happyWalk` piece per path
  7 allocate the seven off-map families — re-entry, concurrency, interruption, staleness,
    configuration, hostile-input, perf — ONE per piece, never repeated. A repeated family
    destroys the first piece's coverage
  8 cut one `adversarial` piece per allocated family, and **none past the seventh**. Today's
    `FAMILY: none for this walk` existed because rounds were pinned to paths; pieces are not
  8a **a batch holds pieces for ONE step.** Every `happyWalk` piece drains before the first
    `adversarial` piece is minted — that is the phase order, and it is what makes each
    attack's baseline a real reading rather than a guess. Mix them in one batch and the
    plan is refused
  9 **`hostile-input` and `perf` are this quest's only security and performance coverage
    anywhere.** Where either gets no piece, nothing else in the quest catches what it would
 10 every family this pass gives no piece goes in `plannerMarks` as `cant-meet` with a
    `toSettle` naming the round a future pass should spend on it. That is your one mark
    authority, and it is the difference between recording uncovered and dropping silently
 11 need seed data these walks cannot start without → REQUEST `recipe`, then attach the names
    it returns to each walk piece. Never write a seed yourself, and never send a walk down a
    path whose recipe carries no proving run id
 12 write no lane or instance names — the router starts each instance and serves its id
 13 write the plan, read it back, declare, signal

recipe-maker · planner · opus · ON REQUEST, by flowrider and siegemaster               [NEW]
  DOES      makes sure every seed the requesting session needs exists and has been run
  CONSUMES  get-quest-work → the request that minted it, the flow · `siegelense recipes` →
            what already exists
  WRITES    recipe files in packages/hydration-recipes · the recipe names onto the flow ·
            quest-work → outcome
  DONE      every seed the request named exists, ran as a SEQUENCE, and carries the run id
            that proved it
  FROM      today's phase-zero guide-writer, inline in siegemaster-prompt-statics.ts
            RULES: §9b — the setup shape, the twice-and-compare step, and the open
            question about who writes an INGREDIENT

  1 get-quest-work({ questId, workItemId }) — the request, the scope, the flow
  2 get-quest for the flow whole — nodes, edges, entry and exit points
  3 ENUMERATE what exists: `dungeonmaster siegelense recipes`. Never assume
  4 work out which seed states the requested walks actually need
  5 author the gaps into the recipe book — `packages/hydration-recipes`, committed
  6 RUN every recipe you intend to use, new AND existing, as a SEQUENCE end to end against
    a throwaway instance. **An existing recipe is not trusted on age**: ingredients mimic a
    shape production owns and drift from it silently, and the first sign is a walk that
    cannot start
  7 testing the SEQUENCE is what testing each recipe alone does not give you. Three that
    each pass in isolation still fail composed — one leaves state the next does not expect,
    an id from the first is not what the second wants
  8 record the run id that proved each one. **A seed with no proving run is a path no walk
    may be sent down.** An unproven recipe does not fail loudly; it manufactures a defect
    that does not exist and sends a fixer hunting in working code
  9 write "NOT FOUND — the reader must work this out" rather than guessing. A wrong command
    costs a whole walk
 10 record the names on the flow; declare `empty` if you wrote nothing
 11 signal — declares NO forward route; returns to whoever asked

siegemaster-reader · worker · sonnet · ON REQUEST                                      [NEW]
  DOES      opens the source files a walker may not, and hands back configured values
  CONSUMES  get-quest-work → the request: which values, for which units
  WRITES    nothing to the quest. Its answers ride back on the return
  DONE      every requested value returned with `file:line` provenance
  FROM      inline prose in siegemaster-prompt-statics.ts. RULES: §9c is the authority

  1 get-quest-work({ questId, workItemId }) — the request
  2 open the source. **You are the only session on a siege pass that opens a source file**,
    and that is the whole reason you exist: a walker that opens one holds it for the rest of
    the walk, and the trial measured six correct verdicts reached with every expected value
    known in advance and no independent look anywhere in the pass
  3 return a LOCATION or a CONFIGURED VALUE — "the cap is 50" — **never an EXPECTED VALUE
    the unit should have carried**. "The list should show 50 rows" is a verdict, and handing
    a walker that launders the contamination through one more session
  4 every value carries `file:line`, or it cannot be told from one a session remembered
  5 a unit whose expected value exists ONLY in source is a `questNotes` open question, not a
    value to hand back. That is a spec defect — the unit is under-specified
  6 you touch no instance and hold no lane slot, so you run beside a full pool
  7 signal — declares NO forward route; returns to whoever asked

siege-happy-walker · reviewer · sonnet                                [ADAPTED from verifier]
  DOES      drives one path by hand against a live lane and settles what it measures
  CONSUMES  get-quest-work → the scope's WHOLE in-scope unit set, the piece (its path, force
            labels, recipe names, notes), each unit's served surface, and the running
            instance's id and manifest — the router started it before dispatching you
  WRITES    quest-work → observations · modify-quest → a new observable per defect ·
            quest-work → amendment · quest-work → request (recipe, read)
  DONE      every in-scope unit marked, one `unmet` per defect, the lane closed, nothing
            committed
  FROM      today's `siegemaster-verifier` pass 1, plus operator step 5's judging table.
            RULES: §9d — nine rules this map does not carry, and the five-step rule for
            an implementation-detail unit. Its `docs` scope is in §9a

  1 get-quest-work({ questId, workItemId })
  2 **Your instance is already running and its id is in your prompt.** You do not start it,
    you do not name it, and you never restart it — a restart destroys any unit measuring a
    difference from a value only that process's lifetime provides: an uptime, a monotonic
    counter, an append-only log. The router started it and the router kills it
  3 read the flow — it IS the map — and run the recipes the piece names. Those seeds do not
    set up the walk in front of you → REQUEST `recipe`. **Never invent a seed inline**
  4 learn each unit's expected value BEFORE driving. From the unit's own words, and from
    `siegemaster-reader` for anything only source holds. **Open no source file yourself.**
    Read the page first and you will talk yourself into whatever it shows you
  5 where the code and the unit disagree, **the UNIT wins, and the disagreement is itself a
    finding.** Taking your expectation from the code confirms whatever it happens to do,
    including the defect you were sent to find
  6 take `baseUrl` and every other address from the SERVED manifest in step 1. The instance
    asked the OS for free ports, so a port carried in from anywhere else belongs to some
    other walk
  7 reset, then drive the whole path. **Drive every force label FOR REAL** — landing on a
    branch is not forcing it. Submit the bad value, trigger the rejection, hit the empty
    state, exhaust the limit. "I walked the happy path" is the number one way this misses
  8 never re-seed to something smaller or better-behaved than the reset gives you. **Two of
    anything an assertion must tell apart**, or "the right one" and "the first one" are the
    same value and an off-by-index bug passes
  9 after any error branch, check for damage: no orphaned row, no half-written file, no
    silently consumed message, no stuck spinner
 10 record per unit AS YOU DRIVE — STARTED FROM / DID / SAW / BROKEN WOULD SHOW. `SAW` is a
    VALUE, never an adjective. **`BROKEN WOULD SHOW` is the whole proof**: a measurement
    that could not have come out differently proves nothing, even when what you saw was
    right. Search your own draft for "confirmed", "held", "verified", "as expected" and
    "correctly" — every one is a place where a value belongs
 11 LOOK AT EVERYTHING you pass, marked or not. **Yours is the only session that ever sees
    this path run**, so anything you wave past reaches nobody. One walk waved a stuck loader
    through as intentional; the next proved it never resolves
 12 judge what you find as a USER would: a breaking issue, something a person would notice,
    and something that merely READS wrong — an ugly transition, a misaligned control, a
    truncated label, a spinner that never resolves, a state with no feedback — are all
    defects. **"No observable claims it" is not a reason to leave something broken.** What
    is NOT yours is a redesign: fix what is wrong, do not improve what is merely plain
 13 mark each unit as it settles. **A defect that is not already a unit BECOMES one first** —
    add the observable through modify-quest, then mark it `unmet`. The set is one entry per
    unit, so two defects on one unit is two units, not two marks
 14 amend the plan where a driving field proved wrong
 15 signal. **You close nothing** — the router kills your instance when your work item
    records, so a session that dies mid-walk strands no server. Nothing is committed

siege-happy-fixer · worker · sonnet                                                   [NEW]
  DOES      fixes the cause of what a walk measured
  CONSUMES  get-quest-work → the MINTING OBSERVATION (the walker's whole measured block,
            word for word), the inherited payload (look-at, facts, fences, doNotTouch), the
            uncommitted file list
  WRITES    quest-work → observations · quest-work → invalidation
  DONE      the cause fixed rather than the symptom, every assigned unit marked, no lane
            touched, nothing committed
  FROM      today's fixer brief — SYMPTOM, LOOK AT, FACTS, FENCES, EVIDENCE WINS, FIX,
            RED FIRST, DO NOT TOUCH, PROVE. RULES: §9f — including the one rule this map
            does not carry, that a fixer writes its regression test from the SAME recipes
            the walk's setup named, and the open question about step 7

  1 get-quest-work({ questId, workItemId }) — the measured block is the brief. It lives on
    the observation that minted you, and nowhere else
  2 load standards + get-folder-detail; get-project-map before any discover
  3 watch a real test fail against UNCHANGED source, for the right reason, BEFORE fixing.
    Painted geometry → e2e, jsdom has no layout engine. A boundary between two parts →
    integration. Pure logic → unit
  4 fix the CAUSE. **Refuse all six symptom-hiding shapes by name**: do not widen a type to
    accept the bad value, swallow the error, default the missing value, raise the timeout,
    loosen an assertion, or delete the branch
  5 never weaken, skip or delete a test to reach green
  6 the brief is a BEST GUESS made from what a walk measured. Hard evidence against it wins
    — and then **say so on the record.** A deviation that shows up only in the change is a
    silent behaviour change
  7 TOUCH NO LANE — not start, not stop, not restart, not drive. The walker owns the one it
    started, and several units measure a difference only that process's lifetime provides
  8 mark each unit as it settles
  9 where the fix moved behaviour nobody can enumerate, send an `invalidation` naming the
    flow. That re-opens every unit on it onto a fresh session — nothing is edited and
    nothing is erased
 10 ward YOUR OWN PATHS only. Never `--uncommitted`, never bare, never the `run-ward` tool
 11 signal — declares NO forward route, so your `done` returns to the walk that found this

siege-adversarial-walker · reviewer · sonnet                            [ADAPTED from stress]
  DOES      attacks one path against its allocated off-map family
  CONSUMES  get-quest-work → the scope's WHOLE in-scope set, the piece (path, force labels,
            off-map family, recipe names), the running instance's manifest, and **the
            BASELINE: the happy walk's instance id and run id for this exact path**, which
            exists because happyWalk drained before this step started
  WRITES    quest-work → observations · modify-quest → a new observable per break ·
            quest-work → amendment · quest-work → request
  DONE      the numbered list written first, every point driven or recorded UNREACHED, the
            family unit marked
  FROM      today's `siegemaster-stress` pass 1. RULES: §9e — nine rules this map does not
            carry, and why it never sees an operational flow. Its `docs` scope is in §9a

  1 get-quest-work({ questId, workItemId })
  2 **Your instance is already running and yours to break**, which is why the router gave
    you one of your own rather than the happy walk's. You started nothing and you restart
    nothing
  3 **READ YOUR BASELINE FIRST**, with `results` on the happy run id served in step 1 —
    that walk of this exact path is finished and its readings are on disk, so reading them
    starts nothing. Your finding is an ABSENCE, and an absence is only evidence against a
    known-good reading taken before you attacked. Look for NO baseline you were not handed
  4 read the flow and run the recipes the piece names; REQUEST `recipe` if they do not fit
  5 **ENUMERATE every stress point this path exposes BEFORE driving anything.** That list is
    your denominator. A truncated pass 2 is VISIBLE against it; a truncated pass 1 is
    invisible, which is exactly why nothing may be driven during it
  6 add the family's own probe. Pad the list with nothing
  7 drive each numbered point, one at a time
  8 a probe that KILLS your instance: mark `unmet`, carrying the `status` output and the
    numbered points not yet driven. The router mints your continuation on a fresh instance.
    **You restart nothing** — nothing measured before a death is comparable with what is
    measured after, and a restart inside one session hides that break in a transcript
  9 mark the family unit; one `unmet` per break, each one its own unit
 10 an honest "N/A for this path because …" is `met`, and the justification is its evidence.
    The family was considered and ruled out, which is a measurement. It is NOT `cant-meet`,
    which needs a `toSettle` and an N/A leaves nobody anything to do
 11 a point you could not get real volume onto is recorded UNREACHED, never as held
 12 amend the plan where a driving field proved wrong; signal. You close nothing

siege-adversarial-fixer · worker · sonnet                                             [NEW]
  DOES      fixes the cause of what an attack measured
  CONSUMES  the same as siege-happy-fixer: the minting observation, the inherited payload
  WRITES    the same
  DONE      the same, with one inversion below
  FROM      siege-happy-fixer, plus `siegemaster-stress-statics`' own layer rule

  Every step of siege-happy-fixer, with ONE inversion at step 3:
    write the failing test at whichever layer OWNS the behaviour — a contract, a guard, a
    broker, a responder. **NEVER a Playwright spec.** That is the opposite of the happy
    fixer's rule, and it is why these are two prompts rather than one with a branch
```

#### The other six

Two of these hold no units at all, which is why hole 13 matters to them and to nothing else: they
declare their own outcome through the `outcome` payload, exactly as a planner does.

```
spiritmender · the `repair` step in FIVE graphs                            [NEEDS REWRITING]
  DOES      fixes the failures one gate named, and nothing wider
  CONSUMES  get-quest-work → the failing ward run id and its detail blob path, the failing
            CHECK TYPES and file list, OR the riftcarver `.log` path when the repair sits in
            that graph · the paths prior sessions committed, served · prior notes
  WRITES    quest-work → outcome. **It holds no units**, so `done` cannot derive from marks
  DONE      every failure in the blob fixed, or named on the outcome. `unmet` routes it back
            to itself; the gate that minted it re-runs and decides
  FROM      today's prompt, minus its git section and its commit

  1 get-quest-work({ questId, workItemId }) — the blob path and the failing check types
  2 Read the blob for the full error output: files, messages, jest diffs
  3 reproduce: `npm run ward -- --only <checks> -- <the failing files>`. **Never
    `--committed` or `--uncommitted`** — either sweeps a whole half of the branch instead of
    the failures you were sent to fix. Every path is a FILE; a bare directory pulls in the
    package and the run gets backgrounded
  4 `<checks>` comes from the blob, which names one check type per failure. Five valid
    names: lint, typecheck, unit, integration, e2e. There is nothing to guess
  5 read what prior sessions built — SERVED, not `git log`. A `pt`-style repeat means an
    earlier session already fixed part of this scope
  6 load standards; get-folder-detail per folder type you touch
  7 diagnose each error to ROOT CAUSE by kind — a type error is a missing import, a wrong
    brand, a stale interface or a real logic bug, and which it is changes the fix
  8 four root causes are common here and none is obvious: a stale `shared/dist` seen ONLY as
    a lint failure; a broken proxy chain after a contract changed; a branded-type mismatch;
    a missing companion file
  9 fix in dependency order: imports → types → tests → lint
 10 four things you never do: weaken a test to make it pass (`toStrictEqual` → `toMatchObject`
    counts, so does deleting it); `any` / `as any` / `@ts-ignore` / `@ts-expect-error`;
    delete code to avoid an error; add an `eslint-disable`
 11 fix wherever the fix actually LIVES. A failure left standing because its cause sat one
    file over is a failure you did not fix
 12 run no bare whole-repo ward. The gate that minted you re-runs after you, and that is its
    job rather than yours
 13 declare the outcome and signal. **No commit** — see the gap below
  NOTE: the six symptom-hiding shapes belong in this prompt too, per the siege decision. A
  repair that makes a red go away by loosening the thing that was red is reviewed by nobody

warpgate · single-step graph, appended at merge                            [NEEDS REWRITING]
  DOES      lands the quest branch on the local base branch as ONE commit
  CONSUMES  get-quest-work → `baseBranch` and `worktreePath`, typed
  WRITES    quest-work → outcome. Holds no units
  DONE      one commit on local base, worktree clean, nothing fetched and nothing pushed
  FROM      today's prompt, minus its commit gate

  **THE ONE EXCEPTION to "no session runs git".** Driving git IS the job. It is a one-step
  family with no `CLOSE_OUT`, so there is no deterministic `commit` step to collide with it.
  Anyone reading the universal rule and taking warpgate's git away stops the merge working.

  1 take `baseBranch` from the served scope. **Never probe for the default branch and never
    `git fetch`** — both are hard prohibitions, alongside `stash`, `reset` and `rebase`
  2 is the base tip already an ancestor of the quest branch? Yes → skip steps 3 AND 4
    entirely. You would prove nothing by merging base into a branch that contains it
  3 merge base INTO the quest branch, in the worktree, and resolve every conflict THERE.
    Base never receives an unproven merge. Leave no `<<<<<<<`, `=======` or `>>>>>>>` line
    in any tracked file — a leftover marker means the merge is not finished, whatever the
    exit code said
  4 run ONE whole-repo `npm run ward` in the worktree — no `--only`, no paths. You are
    checking that a BASE MERGE did not break something outside the quest's own files, which
    a scoped run cannot see. **Read the exit code and branch on it.** A session that runs
    ward, ignores what it returned and carries on puts a broken tree on base
  5 repair what the merge broke, at root cause, then run a FRESH whole-repo ward. **This
    loop is deliberately unbounded.** Base's tip stays exactly where it started while ward
    is red
  6 commit the intake merge and every repair, message beginning `warpgate:`
  7 move to the REPO ROOT checkout — base cannot be checked out in two worktrees at once.
    Uncommitted work there that checking out base would destroy is a `wall`, named by exact
    path. Never stash it, never reset it
  8 `git merge --squash` the quest branch, then commit it yourself. Base gets ONE commit per
    quest
  9 declare the outcome and signal. No push — the user decides whether to publish

chaoswhisperer (/dumpster-create) · CHAT, no graph                     [wording fixes only]
  DOES      runs the whole spec lifecycle with the user, up to `approved`
  WRITES    the full spec surface — flows, observables, contracts, packagesAffected. Never
            `operations`, at any status
  WORDING   two fixes and nothing else: the design stage no longer has an agent behind it,
            and `verifyByReading` is one of only two roles that may set it — it decides
            which units leave both verify families' denominators
  mint quest → title + explore_flows → map codebase → interview → classify runtime vs
  operational → author tagged nodes and labelled edges → review_flows → sweep observables →
  declare contracts + packagesAffected → gap-minion → re-check tags LAST → review_observables

bughunt (/dumpster-hunt) · CHAT, no graph                                      [untouched]
  mint bug-hunt quest → one flow PER BUG → fork at the divergence into ACTUAL:/EXPECTED:
  → observables on the EXPECTED side only → contracts → review_observables
  The prefixes are a LABEL convention, not a contract field. Nothing typechecks them, so the
  prompt that writes them and the prompts that read them must spell them identically

tavernkeeper · CHAT, no graph                                                  [untouched]
  read the question FIRST → load only what it needs → start the dev server only if needed
  → load standards → land the tweak with its colocated test → answer, go idle.
  Writes NOTHING to quest.json. No signal-back. It is also the one reader of
  `devServer.devCommand`, which is why a grep for readers missed it

chaoswhisperer-gap-minion · the ONLY surviving true minion                   [one dead step]
  fetch prompt → get-quest(stage:'spec') → map + standards → review flows semantically →
  review design decisions → review each observable → verify `existing` contract claims
  against the tree → hunt logic gaps → emit findings per step → report by severity.
  Read-only. No write, no signal-back, no sub-agent.
```

**A gap this inventory found, now fixed in the config above: nothing committed a `repair` in
`riftcarver` or `wardFull`.** `CLOSE_OUT` is spread into the three code-changing families only, so
those two graphs ran `gate ⇄ repair` with no `commit` step anywhere. A spiritmender that fixed a
whole-repo red left the fix uncommitted, the re-run graded it, and the quest then reached
`@complete` with work sitting in the working tree — which `warpgate`'s `git merge --squash` drops.
That is the same defect §8 says it fixed for the other three families, and it survived because
"every code-changing family ends with the same close-out" quietly meant "the three that run
`CLOSE_OUT`". Both graphs now declare their own `commit` step, routing back to the gate by name
rather than by the return edge, since each has exactly one gate to return to.

**A second gap, also now closed: nothing PUSHED any more.** Deleting the reviewer's git took its
bare `git push` with it, and `warpgate` is prohibited from pushing, so every commit after the carve
would have stayed local. The `commit` handler pushes — see "Committing becomes a deterministic step"
above, which also settles what its message says, since a handler writes no prose.

**`glyphsmith` is gone from this list because the role is deleted** — see §3b. The design stage and
`design_approved` stay; a human set that flag anyway.

**`bughunt` and `tavernkeeper` really are untouched in this pass.** An earlier draft claimed all three
"untouched" prompts turn out to need work and promised the detail in the gap list below. No such row
was ever written and the finding behind it is lost. Rather than keep a claim with nothing under it:
if there is work in those two, it has to be re-derived against the inventory before step 6 writes
anything, and nothing in this plan depends on the answer.

### The endpoint gaps — all three families hit the same wall

**A prompt of ids cannot make its first call.** Every step's first substantive call is
`get-quest({ questId, flowId, packageName })`, and both of those values live in the operation item's
TEXT — the line ending `— package: <name> · flow: <id>`. "IDs only" drops that text. All three families
are dead on their first tool call, and the fallback (a whole-quest render) is refused by three separate
prompts as over the 50,000-char ceiling.

**Fix: `get-quest-work({ questId, workItemId })` returns the piece's SCOPE as typed fields** —
`flowId`, `packageNames`, `operationItemText` — for every work item including a planner's. That is one
addition to a return contract rather than a fifth prompt substitution, and it is typed where the text
line never was.

**`get-quest-work` has to carry eight more things, each demanded by a named step.** This is the
complete list; anything missing here is a session that cannot do step one.

| It must return | Who dies without it |
|---|---|
| the step-scoped **in-scope** unit set, beside the **assigned** one | both reviewers and the happy walker. The in-scope gate has no denominator otherwise — and the assigned set is by definition the wrong one, since the whole point is catching a unit no piece claimed |
| the **walk paths** with their force labels and `pathsTruncated` | the siege planner takes them as given; the flowrider planner copies them into `payload.walk`. They lived in the checklist |
| the failing **ward run id and its blob path**, plus the failing check types and file list | `spiritmender`. Its step 1 reads the blob and its step 2 builds a scoped re-run command from it. Both die on "ids only" |
| the **riftcarver `.log` path** when the repair sits in the riftcarver graph | same session, different graph. A carve-only failure produces no ward blob at all |
| **`baseBranch`** and **`worktreePath`** | `warpgate`. Its prompt forbids both alternatives outright — never probe for the default branch, never `git fetch` to refresh it |
| the **minting observation** — the mark and its evidence that caused this session to exist | every fixer. A siege fixer's brief quotes the walker's measured block verbatim, and that block lives on the observation, not on the piece |
| the **uncommitted file list**, tracked changes unioned with untracked additions | both reviewers — it IS the pass. Also every worker, for the live `DO NOT TOUCH` set, and every session before it signals |
| *(covered by the line above)* the live `DO NOT TOUCH` set | falls out of the uncommitted list — a worker sees what its batch-mates have open, which the planner could not know at plan time |
| the piece's **recipes, resolved** — each name with the run id that proved it | both walkers and any browser-layer flowrider worker. A piece names recipe ids; a session needs the names to run and the proving run id to know the seed is not stale |
| the **failing CHECK TYPES**, not just the file list | `spiritmender` builds `--only <checks>` from them, and the blob names one check type per failure. Handed files alone it guesses the check set |
| the running instance's **manifest** — `baseUrl` and every other address — on a `needsLane` step | both walkers. The router started the instance, so the session has no manifest file of its own to read, and a port carried in from anywhere else belongs to some other walk |
| the **baseline**: the happy walk's instance id and run id for the path this piece attacks | the antagonist, and it is the whole reason `happyWalk` routes to `adversarial` rather than sharing a batch with it. Without it the antagonist's absence claim has nothing behind it |
| each unit's **owning node id**, on every unit it returns | the antagonist, which fetches the baseline of the node it is attacking. `qa-checklist-to-text-transformer.ts:237` renders a unit row and interpolates no node, and the walker prompt states the gap in its own words at `siegemaster-verifier-statics.ts:408`: *"Nothing tells you which node an observable hangs on except the flow you read… your brief does not carry it and the checklist does not print it."* The flowrider planner resolves `observableTarget` once into the plan (hole 19); this is the same value, served to every other step so nobody re-derives it |

**And two shape questions it forces:**

- **`surface` needs a second source.** Filling it server-side from `qaChecklistItemContract.checkSurface`
  works for observables. Terminals and labelled edges carry no type tag and appear in no
  `CHECK SURFACES` row — their sentence is in `qaCheckSurfaceStatics.byKind`. Read one source only and
  every terminal's surface fills empty.
- **"Notes from previous sessions" has no defined shape**, and two different things could be meant: the
  plan's per-piece `notes: ["trap: …"]`, or `quest.planningNotes.questNotes[]` keyed
  `{role, workItemId, flowId?, unitId?}`. Pick one, and say whether a worker may write one.

### Settled

| # | Hole | Resolution |
|---|---|---|
| 1 | No route from ids to package + flow | `get-quest-work` returns typed scope, above |
| 2 | A planner has no channel for its declared word | a fourth `quest-work` payload: `outcome`. It also carries a `wall`'s reason, which `signal-back` no longer can |
| 3 | A mark-minted work item has NO payload — no `surface`, no spec path, no off-map family, no `baselineFor` | **the router copies the originating piece's payload into `workItem.payload`**, filtering `units[]` to the units actually being re-minted and dropping nothing else. Instance ids are never carried: the router starts a fresh one per work item (hole 4), so a copy would be stale by construction. `baselineFor` IS carried — a re-minted attack measures against the same happy run the first one did. This is the single most load-bearing rule the plan was missing — the re-minted worker is exactly the session `payload` exists to protect |
| 4 | Nothing allocates a re-walk's lane name | **nobody does — the ROUTER starts the instance and serves its id.** The first answer was to derive a name from the work item id; the better one is that a session never names, starts or kills an instance at all. Every invariant still falls out free — never reused, never shared, fresh on every re-walk — and a session that dies now strands nothing, because reaping is tied to the work item recording. §9g has it |
| 5 | `observations[]` keyed by `observableId`, but terminals and labelled edges are units too | the key is **`unitId`**. The gate's denominator is the checklist unit set `get-quest-work` returns, not the flow's observables |
| 6 | `toSettle` optional in the plan, REQUIRED by contract today | required whenever `mark === 'cant-meet'`, refused at the tool boundary |
| 7 | A walk finding its setup wrong had no route back | it sends a `quest-work` **`amendment`**, and the recipe it names is flow data anyone can correct. There is no markdown to be stale and no file to be out of date |
| 8 | A walker's numbered findings have no route to becoming work | **an observable a step finds and attributes is auto-assigned to the piece its `unmet` mints.** Without this a walk's nine findings arrive as one mark's evidence blob and eight vanish |
| 9 | Additive spec authority lost with the operators | the **reviewer** holds `modify-quest` on flows — it already has the whole-cell view. A measured defect becomes a new observable there |
| 10 | Commit-before-signal deadlocks a parallel batch | **the gate is deleted.** Scoping it to the reviewer was the first answer and it is wrong too: once `commit` is a deterministic step, the reviewer does not commit either, so a reviewer-only gate refuses the reviewer. See `signal-back` above |
| 11 | The concurrent-browser-walk contradiction | **settled by ward's own doc**: `packages/ward/CLAUDE.md:430` says several e2e runs against one package do run at once, and `:436` names the report path as `.ward-playwright-report-<serverPort>.json` — per-port, which is exactly the collision `orchestrator/CLAUDE.md:634` still claims. The prompt is right; that line is stale. It is a LOAD cap, and **the ROUTER enforces it** — the plan contract cannot, because a mark-minted piece is not in the plan. See "Concurrency is measured" below |
| 12 | A seam unit assigned to the second cell disappears from the FIRST cell's view, not just its mark set. The first cell still builds half the contract | **two arrays on a piece: `assignedUnitIds` (must mark; the gate counts these) and `contextUnitIds` (must read and build against; may not mark).** That is `codeweaver-prompt-statics.ts:196` — *"You still sign only the observables whose `{package}` is yours"* — restated as data, and it costs one field |
| 13 | `repair` and `warpgate` are `kind: 'prompt'` steps with zero units, so `done` derives vacuously and their own `unmet` routes are unreachable | **any prompt step with no assigned units declares its outcome through the `outcome` payload**, exactly as a planner does. A spiritmender that fixed three of five reds can then say so |
| 14 | The router copies "the originating piece's payload", but a reviewer has no piece — the planner cuts worker pieces, not review pieces | copy from **the piece that first claimed the unit**, traceable through the plan. That piece holds the right `FILES`, `FENCES` and `DO NOT TOUCH`, which is what a re-minted worker actually needs |
| 15 | `empty → @done` walks straight past the in-scope gate — a cell with units but no work to build closes with them unmarked | **`empty` means "no units in scope", never "no work to do".** A planner holding units but no work cuts a review-only piece, or marks each `cant-meet` with a `toSettle` |
| 16 | A planner calls `get-quest-work({questId, workItemId})` for its scope and has no piece; an omitted key reads as a failed fetch and a `wall` | the tool returns an explicit **`piece: null`**, and the planner prompt says so in one line |
| 17 | An observable the reviewer adds mid-quest can hang on a node whose cell is already complete, so nothing assigns it | **an added observable is in-scope for the scope that added it**, by default. If it genuinely belongs upstream, that is the family back-edge payload below — build that once |
| 18 | A `repair`'s code is reviewed by nobody, in **every** family — the plan accepted this for siege and did not notice it generalises | **accepted, on the same trade as the siege decision** — stated in that same section below rather than routed around. A spiritmender's fixes are narrow, two ward gates follow, and routing `repair → review` costs an opus dispatch on every quest that ever went red |
| 19 | The `surface` string passes through a model, so every downstream check is only as good as a transcription | **it should not be transcribed at all.** `qaChecklistItemContract.checkSurface` is already a real per-unit field; only the text renderer drops it, printing a legend once per type instead. So the planner names the `unitId` and **the orchestrator fills `payload.units[].surface` server-side** from the unit's own field. That deletes the only hop where a verbatim string passes through a session, and the byte-equality gate becomes a redundant backstop rather than the defence |
| 20 | Three prompts tell a session a terminal or branch unit takes its `## TERMINAL SURFACE` **heading** | they mean the sentence *under* the heading. `qaCheckSurfaceStatics.byKind` holds it. Fix the wording in all three, or a planner writes the literal string `## TERMINAL SURFACE` into a surface field |
| 21 | A payload keyed by observable TYPE drops terminals and labelled edges — they carry no type tag and appear in no `CHECK SURFACES` row | `payload.units` is an **array keyed by `unitId`**, never a map keyed by type. The plan contract refuses a piece whose `units[]` is not 1:1 with its `assignedUnitIds` — which catches a dropped terminal at write time, before a session exists |
| 22 | "The router copies the originating piece's payload" is undefined when a reviewer's `unmet` set spans several pieces | **the grouping key is the ORIGINATING PIECE, not the mark set.** Partition the `unmet` units by the piece that first claimed each, and mint one work item per originating piece, as a batch. Two `unmet` units from one piece at two layers → one work item. From two pieces → two. For flowrider that comes out as one per spec file, since a flowrider piece IS a spec file — but `payload.specPath` is the instance, not the rule, and codeweaver and siege have no such field |
| 23 | `journey`/`matrix` and the branch labels a run must force have no carrier at all — the checklist settles them and the worker no longer reads it | `payload.walk = { shape, paths: [{ nodeIds, forceLabels }], pathsTruncated }`, copied verbatim. Carry `pathsTruncated` — a worker handed a silently capped path list writes a suite that looks complete |
| 24 | The four-browser-walk cap has no field to count, and the plan only puts it in the plan contract | the predicate is **per piece**: a piece is a browser walk iff any of its units has `layer: 'browser'`. It lands as `maxConcurrent: { limit, counts }` on the step, honoured by the router. The `counts` half is what stops a step's below-browser pieces eating the cap — see "Concurrency is measured" |
| 25 | Off-map is never re-walked today, but `fixAdversarial` returns to `adversarial` and the inherited payload carries the family | **re-driving is now correct, and the old ban's reason is gone.** `[SIGN ONCE]` existed only because a second sign-off overwrote the first's evidence in a shared field. A re-walk now writes its own set on its own work item and the first one stays readable, so nothing is destroyed. *"A fix is only proved by a round that did not make it"* (`siegemaster-prompt-statics.ts:425`). Delete both `[SIGN ONCE]` rules **with a note saying why**, or an adapted prompt carries a ban whose reason no longer exists. Carry the failing point ids on the inherited payload so the re-drive is scoped |
| 26 | A `reviewer` with zero assigned units — an adversarial piece carrying `FAMILY: none for this walk` — has no outcome derivation | **any step with no assigned units declares its own word**, planner or not. Better still, stop cutting adversarial pieces past the seventh family: "later rounds carry none" existed because rounds were pinned to paths, and pieces are not |
| 27 | A 0-file ward scope exits 0 and reads as green | the handler classifies it `empty`, and the ward step routes `empty: '@done'`. Same destination, honest record — *"A ward reporting that the file scope resolved to 0 source files is EMPTY, not green"* (`siegemaster-reviewer-statics.ts:254`) |
| 28 | Nothing hands a walker its setup | **a recipe, named by id on the piece and stored on the flow.** Authored once by the `recipe` step, shared by both verify families, reusable by the next quest that walks the same flow |
| 29 | The two gates' denominators are stated once and omitted once | both take the same one: the checklist unit set `get-quest-work` returns for that scope. Read "in scope" off the flow instead and every siege item blocks forever on a `(read-check)` unit codeweaver's reviewer already settled |
| 30 | This plan said "five symptom-hiding shapes"; the prompt enumerates **six** | corrected to six (`siegemaster-reviewer-statics.ts:206`). Worth noting the fixer brief at `siegemaster-prompt-statics.ts:663` already lists all six — so "move them into the fixer prompts" is moving something that is partly there already |

### Committing becomes a deterministic step — three holes collapse into one change

"The reviewer is the only committer" was the wrong rule, and two families broke it from opposite ends.

- **Siege has no committer at all.** Its reviewers are the two walkers, and both are categorically
  forbidden to commit — `[NOTHING IS COMMITTED] … You commit nothing, ever`
  (`siegemaster-verifier-statics.ts:159`) and `[NO COMMIT]` (`siegemaster-stress-statics.ts:134`). The
  session that committed siege's pass was `siegemaster-reviewer`, which this plan deletes. So the
  walker cannot signal (dirty tree, gate refuses) and burns 40 visits on the same wall; the family
  ward's `--committed` half grades an empty range; and the fixes ride into `warpgate`'s
  `git merge --squash` as uncommitted working-tree state, which is to say they are dropped.
- **Codeweaver has too many committers.** The rule fixes parallel workers *inside* one cell and says
  nothing about parallel *cells*. Nine cells means nine reviewers, one worktree, one `index.lock` —
  the exact collision measured at twelve concurrent sub-agents, three landing and nine dying.
- **And nothing commits after a `repair`**, in any family, so the next family inherits uncommitted
  work it did not write. That one is wider than the three code-changing families: `riftcarver` and
  `wardFull` run a repair too and get no `CLOSE_OUT`, so each declares its own `commit` step — see
  §8's prompt inventory, where the omission surfaced.

**So `commit` is a deterministic step**, serialized behind the per-quest lock, sitting between
`review`/the last clean walk and `ward`. That deletes the reviewer's git section, the `[GIT]` rules,
the sweep mechanic, and the whole index-lock problem in one edit — and it takes real weight off the
reviewer's prompt budget, which was over the line anyway.

**It also PUSHES, because otherwise nothing does.** Today each reviewer ends on a bare `git push`,
and deleting the reviewer's git takes that with it — leaving every commit after the carve local, and
`get-blight-checklist({ scope: 'unpushed' })` reading `@{upstream}..HEAD` as the whole branch forever.
So the handler commits and then pushes, bare, no `-u`: riftcarver already set the upstream at carve
time, which is exactly why that push is `-u` and no later one needs to be.

**A handler writes no prose, so the message is DERIVED from the work item.** The reviewer used to
write `<role>: <what this pass made true>` with its whole return block in the body, and that body was
the pass's only durable record. A deterministic step has no sentence to offer, so it builds one from
what it already holds:

```
<family>/<step>: <the scope — package and flow, or just flow>

met       <unit-id> · <unit-id> · …
cant-meet <unit-id> — <its toSettle>
unmet     <unit-id> — <what is left>
work items: <the ids whose observations this commit is covering>
```

That is strictly more checkable than the prose it replaces — every line is a value off the record
rather than a claim a session made about itself — and `git log` stays the reconstruction route a
later session already uses. Where a commit covers no marks at all (a `repair`, `warpgate`'s own
worktree commits), the subject carries the step and the body carries the work item id alone.

No session in any family runs git at all after this — not a write, not a read — **except `warpgate`,
and that is not a loose end.** Its entire job is `git merge --squash` plus a commit on the base branch at the repo root.
It is a family with one step and no `CLOSE_OUT`, so there is no deterministic `commit` step to collide
with it. The universal claim needs that carve-out written down, or someone reading the rule will take
warpgate's git away and the merge stops working.

### Concurrency is measured for lanes, and a step field for everything else

Two families hit this from different directions, and they turn out to need different answers.

Siege runs exactly one round at a time today — *"Both minions return before you brief the next round"*
(`siegemaster-prompt-statics.ts:355`). Flowrider caps browser walks at four. Both were prompt prose an
operator obeyed.

**The cap cannot live in the plan contract**, and the reason is structural: **a mark-minted piece is
by definition not in the plan.** Three walkers marking `unmet` mint three fixers outside any declared
batch, and their returns mint three concurrent re-walks. Nothing the planner wrote bounds it. Wherever
this document earlier said the plan contract enforces the browser cap, it is wrong; the plan check is
an early warning at plan time and the router is the enforcement.

**A siege lane IS a siegelense instance, and how many may run is MEASURED, not declared.**
`dungeonmaster siegelense capacity` answers exactly this question: it returns `suggested` — how many
instances this machine can run right now — alongside the `ceiling` it is never above (a policy knob,
3, at `capacity-statics.ts:26`), a `why` sentence, and the `measured` and `profile` blocks the
judgement came from. With no profile for the spec it answers 2, so the first pair runs and profiles
itself.

So a step that needs a lane declares `needsLane: true` and **no number at all**. The router asks
capacity before dispatching any batch of lane steps and uses `suggested`. Both siege walkers draw on
that one pool, which is the shared budget two per-step numbers could never express. A number in the
config is a guess about a machine; this is a reading off the machine that is actually running.

**And because the router is already reading capacity, the router STARTS AND STOPS the instance too.**
That is the change, and it is worth stating as a rule rather than as a detail:

| `needsLane: true` means the router | Instead of |
|---|---|
| calls `start` before dispatching the work item, and waits for the manifest | the session running `start` as its own step 2 |
| substitutes the **instance id** into the prompt beside the quest, work item, operation item and step ids | the session naming its own lane `<workItemId>-happy` |
| serves the manifest — `baseUrl` and every other address — through `get-quest-work` | the session reading a manifest file it started |
| calls `kill` once the work item records, whatever the outcome | the session closing the lane last, which a crashed session never reaches |

**Three things this fixes that the session-owned version could not.** A session that dies mid-walk
strands an API server, a Vite server and a browser, and nothing notices — the router always reaps,
because reaping is tied to the work item recording rather than to a prompt step running. The pool
count stops being a thing two sessions could each believe differently. And `capacity` is read by the
same code that spends it, so `suggested` and the number actually started cannot drift.

**One case needs a route rather than a rule: the antagonist deliberately breaks its instance.** Today
the prompt tells it to restart as `<workItemId>-adversarial-2`, then `-3`, and record which points ran
either side. Under router-owned instances it cannot restart anything — so **a dead instance is an
`unmet` mark carrying the `status` output and the points not yet driven**, and the router mints the
next work item on those, with a fresh instance. Same behaviour, and now the restarts are visible in
the ledger instead of buried in one session's transcript. §9e carries the prompt half.

**The `operating` docs scope describes the router now, not a session.** It addresses "the session that
opens and closes a pool of instances and assigns tasks to other agents", which is exactly this code.
It gets no prompt reader, and its rules become the router's spec — which is a better place for them
than a prompt that could ignore them.

**Flowrider's browser cap is a different budget and stays declared.** Its walks run under ward's
Playwright, not as siegelense instances, so `capacity` cannot see them in `measured.siegeInstances`
and its answer does not bound them. `maxConcurrent: { limit: 4, counts: 'browser-pieces' }` stays on
that step — the `counts` half matters, because the step also runs below-browser pieces that cost
nothing and must not consume the cap.

Fixers stay unbounded in both families. They touch no lane and no browser.

**Siegelense is not fully built.** `scrolls/seigelense/remaining-build-items.md` is the list of what is
left, and the capacity wiring here depends on the parts of it that are done. That dependency belongs in
the order of work rather than discovered at step 2.

### Retiring the sign-off tracks retires two different things, and only one should go

This is a correction, and it would have broken every flowrider run.

`signoffTrackEligibilityStatics` does two jobs that read as one:

| Job | Fate |
|---|---|
| name the three sign-off FIELDS and which track owns which | **retires** with the fields |
| SCOPE which units a track is measured over — `flowTypes: ['runtime']`, `verificationMethods: ['test']`, `unitKinds`, `packageScope` | **survives**, re-keyed from track onto STEP |

Retire both and the in-scope gate blocks on units the family structurally cannot settle.
`verificationMethods: ['test']` is the only thing keeping a `(read-check)` observable — settled by
reading a file, not by running a test — off flowrider's list, and
`qa-checklist-to-text-transformer.ts:89` applies that filter to the rows, the surfaces **and the
denominator**. Every flowrider operation would stall on a unit nobody in that family can mark.

`flowTypes: ['runtime']` is the same story: it is the only reason an operational flow yields a zero
flowrider denominator. Without it, the "flow retyped `operational` mid-quest" path — which today's
prompt explicitly says must not stall the quest (`flowrider-prompt-statics.ts:186`) — stalls on units
no flowrider session could ever settle.

**So a step declares the scope its family owns**, and the in-scope set is filtered by it. Same data,
keyed on the thing that now exists.

### The in-scope gate has to fire at the REVIEWER, not at `@done`

Also a correction, and the version in the invariants table would have deadlocked.

A unit no piece ever claimed would be assigned to nobody, and the signal gate counts *assigned* units,
so it would pass cleanly with that unit unmarked. The `@done` gate then catches it. But `@done` fires
when the ward step routes there, and at that moment **no step is minted, no unit is assigned, and the
config declares no route out of a refused terminal.** The operation stalls with nothing able to move
it.

So the check moves one step earlier, where a route still exists: **every `role: 'reviewer'` step is
assigned its scope's WHOLE in-scope unit set.** An unmarked in-scope unit is then an unmarked
*assigned* unit, so the ordinary signal gate catches it and the ordinary `unmet` route mints a worker
carrying it. There is no second gate and no special derivation — the in-scope check and the signal
gate become the same check, which is why this is stated as a property of the reviewer role in §3b
rather than as a rule of its own.

**"In scope" is filtered by the step, and "unclaimed" excludes live work.** Two qualifiers, and
without either one a reviewer blocks on something it cannot move:

| Qualifier | Without it |
|---|---|
| the in-scope set is filtered by the step's declared scope — `flowTypes`, `verificationMethods`, `unitKinds`, the surviving half of `signoffTrackEligibilityStatics` | every flowrider reviewer blocks on a `(read-check)` unit nobody in that family can settle |
| a unit is outstanding only when NO plan piece claims it and NO live work item is assigned it | two siege walkers running at once each read the other's units as unclaimed, and the happy walker mints a happy fixer for an off-map family |

`@done` keeps the invariant as a backstop that should never fire. A backstop that can only stall is
fine; a gate that can only stall is not.

This is also why `get-quest-work` returns a reviewer the whole in-scope set — the reviewer is the only
session positioned to notice a unit no piece ever took.

### The unbuilt seam — solved by the fan-out, not by a new mark

The problem: codeweaver orders cells by package kind tier, so the far side of an HTTP seam is routinely
a *later* operation item. Today the answer is a note rather than a verdict — *"If that half is not
built yet, write down what you assumed"* (`codeweaver-prompt-statics.ts:469`) — and all three marks are
wrong for it.

**The fix is upstream of the marks: a glue seam's observables go to the SECOND cell only.** The
orchestrator already computes cell order (package kind tier, then package-graph depth, then name), so
"which side comes second" is a fact it holds at fan-out time, not a judgement anyone makes later. The
later cell can see both halves; the earlier one is never assigned the unit and never has to mark it.

That replaces `packageScope: 'intersection'` for seam units — today a glue node's units go to *every*
cell that tags it, which under a gate that refuses an unmarked assignment would force two cells to mark
the same unit, or block one of them. **One owner, chosen by the ordering the orchestrator already
does.** No fourth mark, and the vocabulary stays at three.

Changed by this: `relayTailFanOutTransformer` (assign seam units to the later cell) and
`signoffTrackEligibilityStatics`' `packageScope` rule, which retires with the tracks anyway.

### Siege gets no code-review step — decided, with the cost stated

Six steps stand. `siegemaster-reviewer` is **deleted**, not rewritten.

The argument for adding one was real: a siege fixer's code is the only code in a quest that no reviewer
reads, because siege runs after codeweaver's reviewer and after flowrider's.
*"A re-drive proves the symptom gone. What nobody has checked is whether the fix was the right one"*
(`siegemaster-reviewer-statics.ts:43`).

The argument against won: by the time siege runs, the quest has been through two reviewers and two ward
gates, and siege fixes are small and narrowly scoped. A seventh step costs a dispatch on every quest
that needed any fix at all, for a failure mode the two remaining wards partly cover — siege's own
family ward, then `wardFull`.

**What is accepted, stated plainly so nobody rediscovers it as a surprise:** a siege fix that makes the
symptom go away without touching the cause — a widened type, a swallowed error, a defaulted value, a
loosened assertion — ships. The re-walk cannot catch it, because the re-walk is what the hiding was
aimed at, and a ward catches a broken build rather than a hidden one. The six symptom-hiding shapes
from the deleted reviewer's prompt should move into **both siege fixer prompts** as things not to do,
which is weaker than a reviewer and better than nothing.

**The same trade is accepted for `repair`, in every family — that is hole 18.** A `spiritmender`'s
code is read by nobody: it runs after its family's reviewer and routes straight back to the ward gate.
Routing `repair: done → review` would close it, and would cost an opus dispatch on every quest that
ever went red, for fixes that are narrow by construction — a repair is scoped to the files one ward
run named. Two ward gates still follow it: its own family's, then `wardFull`. **What ships, stated so
nobody rediscovers it:** a repair that makes a red go away by loosening the thing that was red — a
widened type, a skipped test, a relaxed assertion — is not caught by anything. The same six
symptom-hiding shapes belong in `spiritmender`'s prompt for the same reason they belong in the
fixers'.

### Bulk invalidation stays, as its own payload

`reset-flow-signoffs` cleared a whole flow — nodes, observables, edges and off-map families — off a
fixer's `REACHES:` line, precisely because nobody can enumerate what a shared-code fix moved.
A set per work item covers the single-unit case completely; it does not cover this one, because
invalidating unnamed units means writing `unmet` for each from a session that measured none of them.

So `quest-work` gains an `invalidation` payload: a `flowId` and a reason. **It re-opens every unit on
that flow — the router treats them as needing a fresh measurement and assigns them to a new session.**
Nothing is edited and nothing is erased: the existing work items keep their records, and the new
session writes its own set, exactly as a re-mint does. No session has to claim it measured something it
did not.

It keeps the three real guards the broker had: the `walk-reset` note, the siegemaster-only authority
check (`quest-reset-flow-signoffs-broker.ts:92`) and the in-scope check (`:101`), each with an error
message behind it.

It is also the only route that re-opens off-map families after a fix, which nothing else covers.

---

## 9. The siege role rulebook — what each prompt must SAY

§8 names each step's job, its calls and its endpoints. This section is the rules that go INSIDE those
prompts, and it is the half a rewrite drops when nobody wrote it down. It was moved here from
`scrolls/seigelense/remaining-build-items.md`, which keeps the siegelense tool's own remaining work
and no longer holds any prompt rule.

**The headline finding: no siege prompt knows siegelense exists.** Four prompts ship today —
`siegemaster-prompt-statics.ts` (the operator), `siegemaster-verifier-statics.ts` (the happy walker),
`siegemaster-stress-statics.ts` (the antagonist), `siegemaster-reviewer-statics.ts` (grades repairs).
A search across every orchestrator prompt for the words `siegelense`, `recipe` and `instance` returns
nothing. All four are built around a **lane** — a file-command-driven trio of headless Chromium, an
API server and Vite living in `packages/web/test/siege-driver/` — and that directory is deleted by
`remaining-build-items.md` §18. **Step 6's prompt rewrite and that delete cut over together**, or the
new prompts are written against a mechanism about to be replaced.

### 9a. Every prompt fetches its own `docs` scope rather than carrying the tool's rules inline

`siegelense-call-statics.ts:36` pins seven scopes, and `docs-statics.ts` gives each its own audience
line and its own subject. **Not one orchestrator prompt fetches any of them.** Measured: the word
`docs` appears in zero of the 55 statics files under `packages/orchestrator/src/statics/`.

Fetching buys one source for how the tool behaves, and a vocabulary bounded by the role — the
operating scope carries no browser verb at all, which is what stops a session that dispatches from
starting to drive.

| Step | Fetches | That scope's audience, in its own words |
|---|---|---|
| `recipe-maker` | `docs { for: 'planning' }` | "the session that writes the test sequence and proves that the application reaches its starting state" |
| `siege-happy-walker` | `docs { for: 'walking' }` | "the session driving a browser against one instance and recording what it reads" |
| `siege-adversarial-walker` | `docs { for: 'attacking' }` | "the session running attacks against one instance and measuring what breaks" |
| both siege fixers | `docs { for: 'fixing' }` | "the session that arrives after the walk is over and the instance is gone" |

**A prompt and its scope are one edit.** Adding a step means adding its scope, and a step fetching a
scope written for a different audience is worse than fetching none: it arrives holding verbs its own
prompt forbids, and the first thing it does with them is the thing its prompt refuses.

**Three steps in this family fetch nothing, and each absence is load-bearing:**

| Step | Why no scope |
|---|---|
| `siegemaster-reader` | it opens files. It calls no tool, starts no instance and holds no lane, so the driving vocabulary would only be a route to misuse |
| `siege-planner` | it plans. It drives nothing, and the walking scope would teach it to |
| `spiritmender` | it is not a siege step. It fixes what a ward gate named |

**Two scopes are left with no prompt reader, and each has a different answer.** `operating` addresses
"the session that opens and closes a pool of instances and assigns tasks to other agents" — which,
after §9g, is the ROUTER. It keeps the scope and loses the reader: its rules become the router's spec,
which is a better place for them than a prompt that could ignore them. `operational` addresses "a
session verifying a flow that has no screen", which §9h routes to codeweaver instead; whether it is
deleted or re-pointed at a whole-quest off-map item is the one live question, and
`scrolls/seigelense/remaining-build-items.md` §9c holds it. `driving` keeps its reader and needs no
prompt work: it addresses a session nobody dispatched, which fetches the scope itself.

**One rule the `walking` and `attacking` scopes need trimming for:** neither may teach `start` or
`kill`. The router owns both verbs now, and a walker holding them will use them the first time
something looks wrong.

### 9b. `recipe-maker` — the rules behind §8's step map

**Its deliverable is a COMPLETE seed set for the walks it was asked about, proven by running it.**
Every path the requesting session will drive gets a SETUP — the runnable batch that carries a fresh
instance to that path's entry state — every setup names only recipes that exist, and every one of
those recipes is run during this session. A path left without a proven setup is a path no walk may be
sent down, so a gap here does not degrade the pass; it removes coverage from it.

Walk by walk:

1. Read the walk paths the request names — every route through the flow.
2. For each path, work out the state that makes it reachable.
3. Match those states against existing recipes: `dungeonmaster siegelense recipes`.
4. **Make every recipe the set is missing.** Where existing ingredients compose to the state, write
   the recipe itself in a few lines. Where the state needs an entity nothing declares yet, that is an
   INGREDIENT — see the open question below. **"No recipe covers this path" is not an outcome this
   step may return.**
5. **Run every recipe the set uses — the ones it wrote and the ones it found alike — as the SEQUENCE
   the setup submits**, against a throwaway instance, and confirm it lands where it claims. Not each
   recipe alone; the sequence, end to end.
6. Record the run id that proved each one onto the flow.

**Step 5 is the one that cannot be skipped.** An unproven recipe does not fail loudly; it manufactures
false defects. A recipe that claims two rows and seeds one leaves the walker looking at a one-row
list. The walker reports a defect correctly. A fixer is briefed against a symptom that does not exist
and hunts in working code. A whole round is spent and nothing in the record says the seed was the
problem.

The quieter version is worse. A recipe seeding *one* of something an assertion must tell apart makes
"the right one" and "the first one" the same value, so an off-by-index bug passes and the clean result
means nothing.

**It runs every recipe it uses, not only the ones it wrote.** An ingredient's `write` route mimics a
shape production owns and can drift from it silently. Nothing about that drift touches the feature
under test, so nothing else catches it.

**Seeding the same thing twice and comparing is a step in this session, and it is the one check for a
randomised on-screen value that travels to a repo nobody here has seen.** Seed one recipe into two
fresh instances, read both screens, compare. Every value a recipe supplied is identical by
construction, so **whatever differs is a value the app generated and then displayed.** That is the
whole reason it works without knowing the domain. It depends on the element delta on `look` and on
`compare`'s `elements` field, both of which are `remaining-build-items.md` §13 and are not built.

**What a setup holds, and three properties it has to keep:**

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

- **The setup is a runnable batch, not prose.** It is submitted to a walk, not described and
  re-derived.
- **It mixes recipes and driving steps.** A row that must be expanded before the thing under test
  exists is not seeding, and no recipe should pretend it is.
- **Mid-walk seeds are keyed to the node they fire at**, not appended to the end. A mid-walk seed
  recorded as part of the setup silently turns a live-update test into a fresh-render test.

**Where the guide's eight headings went** — §8 has the table, and the reason each one stops being work
is the same: all three of `SEEDING`, `CONTROLS` and `TRAPS` existed because a walk had to work
something out, and all three stop being work once something durable answers. `SEEDING` becomes the
recipes this step proves. `CONTROLS` becomes the key — the text tree of the screen the tool produces.
`TRAPS` becomes the committed app-oddities file, which is `remaining-build-items.md` §3 and is not
built.

**OPEN — writing an INGREDIENT needs a home, and a sub-agent is not it.** A recipe is composition and
`recipe-maker` writes one itself in a few lines. An ingredient means reading the production writer,
declaring `links`, `routes` and `copies:`, and proving it with a colocated test — enough reading to
spend the context the remaining paths need. The scroll's answer was a `guide-recipe-writer` sub-agent,
one per missing ingredient, capped at two at a time. **That is exactly the black box this plan
exists to delete**, so under the step model it becomes a step of its own, `mintableOnRequest`, in both
graphs that carry `recipe`. The rules that come with it either way:

| Rule | Why |
|---|---|
| its first question is whether existing recipes already compose to the state | a new ingredient where two compose makes the book worse while looking productive |
| **it fills `copies:`**, because it has just read the production writer | left for later it is a guess, and a wrong `copies:` pointer makes the drift test assert against the wrong thing — worse than no pointer, because it passes |
| it is briefed in the flow's words, never from an implementation detail | handed the code to start from, it writes an ingredient for whatever the code happens to do |
| the same session that wrote an ingredient diagnoses it when `recipe-maker`'s run does not land | it already holds the production writer it read, the `routes` it declared and the `copies:` it filled. A fresh session pays to re-read all of it before it can say anything |
| the diagnosis brief carries the READINGS from the run that failed | otherwise it is "this is broken, go look" rather than a diagnosis starting from a measured symptom |
| a break that turns out to be production changing shape is a finding about the app | it becomes an observable, not an ingredient patch |
| **`recipe-maker` re-runs the setup itself on every return** | a sub-session's claim that its ingredient works is not evidence, and that is as true of a repair as of a first draft |

The diagnosis is bounded by the route that failed: a `write` failure means diffing the `copies:`
target against what the ingredient writes; an `api` failure means the real code path changed — read
the handler; a `recording` failure means the recording is of a version that no longer exists —
re-capture, do not patch. **That third row is not performable today** and must not reach a prompt
until `remaining-build-items.md` §5c gives a recording something to check. A two-route ingredient
narrows it before anyone reads anything: run both routes and compare. Agreeing routes mean the drift
is not here; disagreeing ones name the field that moved.

**Two decisions this step needs that §8 does not settle:** whether `writeIngredient` is a step or
stays a sub-agent, and how a single `request` payload mints three of them at once when three
ingredients are missing. The router's request rule mints one step per request.

### 9c. `siegemaster-reader` — the one session on a siege pass that opens a source file

*Returns values. Drives nothing. Signs nothing. Dispatches nothing.* **Decided: it ships**, as the
`read` step in §3b's siegemaster graph, requested by the planner and by a walker alike.

**The problem it solves.** A walker may not open a source file — §9d makes that absolute, and the
trial measured why. But some units name a value only source holds: "the list caps at the configured
maximum", "the default timeout". **A walk told "read no source" facing one of those either breaks the
rule or stalls, and breaking it is what actually happens.**

> Unit: *the quest list caps at the configured maximum.*
> The walker drives the app and counts 50 rows. Is 50 the right number? It lives in
> `questListStatics.ts:12`, which the walker may not open.
> The reader returns one line — `quest list cap  50  questListStatics.ts:12` — and the walker measures
> what it counted against it, having never read the list's implementation.

**The two prompts contradict each other today, and the walker's own copy wins:**

| Prompt | Says |
|---|---|
| `siegemaster-verifier-statics.ts:222` — the walker's own | "**Read the implementation only for a value a unit names indirectly** — 'the configured cap', 'the default timeout' — where the number lives in the code and the unit does not spell it out. Use `discover` to find the symbol and `Read` to open it." |
| `siegemaster-prompt-statics.ts:226` — the operator's | an observable marked `(read-check)` "is settled by opening a source file, **which no round can do**" |

The operator believes no round opens source. The walker is told how to. The walking session reads the
walker's copy, so source gets opened.

| Rule | Why |
|---|---|
| It is the ONLY session on a siege pass that opens a source file | a walker that opens one holds it for the rest of the walk. The trial measured what that produces: six correct verdicts reached with the expected values known in advance, and no independent look anywhere in the pass |
| Every value it returns carries `file:line` | a value with no provenance cannot be told from one a session remembered, and the walker citing it cannot check it without doing the reading this step exists to prevent |
| **It returns a LOCATION or a CONFIGURATION — never an EXPECTED VALUE the unit should have carried** | handing that forward launders the contamination through one more session. The walk still measures the system against what the code intends, and now it is invisible, because it arrived as a fact in a brief |
| A unit whose expected value exists only in source is a `questNotes` open question | that is a spec defect — the unit is under-specified |
| It touches no instance and holds no lane | it reads files, so it runs beside anything, including a full pool of walks |

| When it runs | Why |
|---|---|
| requested by the planner, before the first walk | its answers go into every piece's notes, which is what lets §9d's no-source rule be absolute |
| requested by a walker, mid-pass | a reading is one value for one unit, and a walk reaches that need at any point |

What it hands back:

```
OFF-SCREEN
  quest list cap          50      questListStatics.ts:12
  default guild slug      siege-1 guild-create-broker.ts:88
  outbox path             .dungeonmaster/event-outbox.jsonl   quest-persist-broker.ts:41
```

### 9d. The happy walker — nine rules, and the five-step rule for an implementation-detail unit

`siegemaster-verifier-statics.ts` exists. **None of these nine is in it.**

| Rule | Why |
|---|---|
| **A walker opens NO source file, for any reason.** What only source can answer arrives as a value in its brief | the contradiction in §9c, and the trial that measured it |
| **Selectors come from the running page, not from test files** | the trial's arm B read the e2e specs and learned the answers before driving. That removes the reason siegemaster runs at all |
| **The KEY is the default reading. `dom` is the escape hatch: last, expensive, narrow target** | the one measured cost in this design — `dom` on `body *` returned 58 nodes whose first entry carried an entire stylesheet. The prompt carries that one line; `docs { for: 'walking' }` carries the whole ladder |
| **An observable naming a className or any implementation detail is settled on what a PERSON would see** | the five steps below |
| **Every PATH walked is recorded with its instance id and run id — a CLEAN walk included** | §9l. The clean walk is the one an issue-only rule leaves unevidenced |
| A walk that sees its instance stop checks `status` BEFORE writing anything down | a dead driver leaves a blank screen, and "the page went blank" is exactly what a walker is trained to report. A fixer briefed against it hunts a rendering bug that never existed |
| A slow `start` is a QUEUE, not a hang — never a `wall` | the tool admits one boot at a time, so the third walk in a pool waits out two. `queuedMs` says so, and a session reporting a wall over it halts a quest for nothing |
| A dead instance is `unmet` with the `status` output — never self-healed, never `wall` | `wall` means no session of any role could pass. A crash is not that, and a session self-healing is one acting on a third of the picture |
| A DRIVER death is never a finding about the app; an API-SERVER death may be | a leak or an unbounded allocation that kills the server is a real defect, recorded WITH the server log as well as marked |

**The five-step rule for an implementation-detail unit.** Siegemaster handles the FLAGGED case
correctly today (`siegemaster-prompt-statics.ts:226`) and says nothing about a className observable
that reached its list unflagged. **Signing one on the class alone is the cheapest false pass in this
system** — the class is present, the stylesheet rule was deleted, the row is not red, the unit reads
`met`, and nothing in the record says the screen was never looked at.

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

### 9e. The antagonist — nine rules, and what it does with an operational flow

`siegemaster-stress-statics.ts` exists. **One principle generates almost all of these: the walker
measures against the UNIT, the antagonist measures against a BASELINE.** A walker asks whether the
screen shows the value its unit names, so its comparison is to a sentence in the spec. An antagonist
claims an ABSENCE — I attacked this and it did not fall over — and an absence is only evidence against
a known-good reading taken before the attack.

| Rule | Why |
|---|---|
| **It compares against a BASELINE, never the unit, and `health` is its fixed-shape reading** | `health` is its counterpart to the key: one shape, so two readings can be held against each other |
| **Its dispatch CARRIES the baseline** — the happy walk's instance id and run id for the path it is attacking | "inherits a verified-clean baseline" was a property with no mechanism. **It has one now**: `happyWalk` routes to `adversarial`, so every happy piece has drained and recorded before the first attack is minted, and the piece's `baselineFor` names which one. The router resolves it and serves both ids |
| It READS that baseline with `results`, which starts nothing — and looks for NO baseline it was not handed | reading a finished run needs no instance, so "touch none you did not start" does not forbid it. What it forbids is finding "some earlier walk of something similar", which is how a tainted baseline gets in |
| **On a SAD path the baseline is the ERROR rendered correctly, usually a toast** | comparing a failure branch against a happy screen reports the toast as damage. The inverse is worse: the app swallows the error, nothing paints, `pixelChange` reads `0%`, and "nothing changed" is written down as *it held* |
| A transient baseline — a toast, a flash message — is a PRESENCE question, never a pixel diff | it auto-dismisses, so a frame comparison against it reports a difference that is only timing. "Was the toast there, with that text" is a `look` at the key |
| **Three key columns are ITS columns**: `maxlength`/`pattern` in `attrs`, `live`/`alert`, and `invalid` | the declared cap is what it measures against, the live region is where a proper refusal LANDS, and `invalid` is the app stating its own verdict on the input — read, never assumed |
| Each attack declares the reset level it needs | `instance` destroys any uptime, monotonic or append-only measurement, so it cannot share a batch with a unit measuring one |
| **Every attack is recorded with the instance id and run id that ran it, held or not** | an absence with nothing behind it is the least checkable claim in this system |
| It is the role most likely to have CAUSED an instance death, which is exactly why it must not judge that itself | it corrupts and exhausts on purpose, so an OOM it triggered is a plausible finding rather than background noise |

**It never has to run on an operational flow, and §9h is why.** Its whole vocabulary is `paste`, `key`
and `click`, and the three key columns above are all properties of a rendered control. With
siegemaster restricted to runtime flows, an operational flow is never handed to it at all.

**One rule its prompt still needs:** handed an operational flow anyway, it marks `unmet` naming the
mis-route, and never improvises. It always has `request` and `file`, so it can always do SOMETHING —
and that something is an attack nobody scoped, marked against a family the whole-quest item was going
to settle properly.

**OPEN — the whole-quest off-map item.** The scroll's argument is that an all-operational quest now
has no eligible siege flow, so siegemaster keeps ONE whole-quest item, and `hostile-input` and `perf`
get settled once against the running system rather than spread across screenless flow walks. **This
plan declares no such item** — §8's siege planner returns `empty` on an all-operational quest and the
family closes. See §9g.

### 9f. The fixers — two rules built, two missing, one contradicted

| Rule | State today |
|---|---|
| `RED FIRST` — watch a real test fail against unchanged source, for the right reason | **built**, verbatim at `siegemaster-prompt-statics.ts:667` |
| Cap two fixers, only over a disjoint file set | **built**, verbatim at `siegemaster-prompt-statics.ts:374`. Under this plan the ROUTER holds the cap, not a prompt |
| A fixer touches no instance it did not start | **built**, and now stronger: a fixer starts nothing because the ROUTER starts instances, and a fixer's step does not declare `needsLane` |
| **A fixer writes the regression test using the same recipes the setup named** | missing; no recipe concept in any siege prompt |
| A fixer RE-RUNS THE SETUP on a fresh instance | **decided against.** The scroll called today's ban a contradiction; the ban stands. A fixer proves its work through ward, and the RE-WALK is the live proof — a walker's `unmet` mints the fixer, and the fixer's `done` returns to that walker, which drives the path again on a fresh instance. A fixer holding its own instance would consume a capacity slot nothing budgeted for, and would prove the symptom gone in a session nobody re-measures |

**The recipe rule is the point of the whole recipe book for a fixer. The hard part of writing a
regression e2e was always the setup.** A recipe returns a plan, an ingredient's `write` route is pure
`fs` and its `api` route is a `fetch`, so the state a walk ran against and the state its regression
test runs against come from the same plan handed two different targets. The alternative is what
happens today: the fixer re-derives the setup in the e2e's own idiom, gets it subtly different, and
the test passes against a state the walk never saw. **The plumbing is already built; only the
instruction is missing.**

**One dependency on the tool:** `results` must still answer for a killed instance, flagged as gone,
and reading it must start nothing. The walker's instance is gone by the time a fixer reads its record.
Without that, a fixer holding a run id finds it resolves to nothing, and the handoff depends on the
walker having hand-copied every reading.

### 9g. The operator's job goes to the ROUTER, not to another prompt

**Six rules were written against a session this plan deletes, and none of them becomes prompt text.**
Every one lands on code — which is the better answer, because a rule in code cannot be ignored by the
session it binds.

| The operator rule | Now |
|---|---|
| A crashed walker is answered by a FRESH walk on a fresh instance — never by reading the dead run to salvage it | **the `unmet` route.** A verdict assembled out of half a run plus a second run is not a walk. An issue the walk already wrote down keeps its own evidence and reaches a fixer regardless |
| Refuse to dispatch a walk down a path whose recipe is missing or unproven | **a plan-validation check**, already in §4: every `recipeId` a piece names is recorded on that flow AND carries the run id that proved it |
| The operator allocates two lane names per round | **the router's**, along with `start` and `kill` — see below |
| Run the pass in TWO PHASES — every happy walk, then a STAMP, then every adversarial walk, never interleaved | **the step chain.** `happyWalk` routes to `adversarial`, and a step's `done` fires only when every piece at it has drained. The STAMP is that route firing. §3b has the rule and the plan contract refuses a batch that mixes the two steps |
| Call `cleanup` at the START of the pass and again at the END | **two deterministic steps**, `sweepIn` and `sweepOut`, bookending the siegemaster graph. Two bookends make the first `capacity` reading honest and catch what this pass leaked, without a daemon watching. They are ledger rows, so a leak is visible rather than inferred |
| No phase advances while any instance is in an unknown state; after a death someone owns `status`, reaping orphans, re-reading `capacity` and re-dispatching | **the router**, because the router now starts and stops every instance |

**The router owns instances outright, and that is the load-bearing consequence.** It was already
reading `siegelense capacity` to decide how many lane steps may run at once. A reader that does not
also spend is a split the two halves drift across, so the router `start`s an instance before
dispatching a `needsLane` work item, substitutes the **instance id** into that prompt beside the quest
and work item ids, serves the manifest through `get-quest-work`, and `kill`s it when the work item
records. "Concurrency is measured" under §8 has the table.

**What that buys, stated so nobody trades it away later:** a session that dies mid-walk strands
nothing, because reaping is tied to the work item recording rather than to a prompt step running. No
two sessions can hold different beliefs about the pool count. And `suggested` cannot drift from the
number actually started, because one piece of code does both.

**The one rule it forces into a prompt anyway** is the antagonist's, and §9e carries it: a probe that
kills the instance is marked `unmet` with the `status` output and the points not yet driven, and the
router mints the continuation on a fresh instance. A session that cannot restart cannot hide a restart
in its transcript.

### 9h. Codeweaver's reviewer takes the operational units

**No `siegemaster-operational` role is built, and none should be.** §4's "Operational flows and nodes"
table is the decision; this is the reasoning and the rules that move with it.

**An operational flow has nothing to walk, and the contract already says so.**
`flow-type-contract.ts:12-14`: "An operational flow is a one-time task sequence executed by the
engineer or Codeweaver to achieve a state change — refactor sweep, infrastructure setup, lint rule
registration. It is verified by Siegemaster checking the final state, not by walking paths." A
one-time sequence has no paths, and its final state is a fact about the source tree — this file is
gone, this import is there, this rule is registered. **That is a READING, and this repo already has a
track for readings.** `verifyByReading` marks exactly this kind of criterion and is already settled by
codeweaver's reviewer opening the file.

**Also update the contract's own comment.** `flow-type-contract.ts:13-14` says an operational flow "is
verified by Siegemaster checking the final state". After this change it is not.

| Rule | Why |
|---|---|
| An operational unit is settled by codeweaver's reviewer, and no siege mark is expected on it | a unit no step can close is one an agent invents a mark for — the same reason a `verifyByHuman` unit is filtered out of every work item's view |
| A runtime flow's non-browser units stay with the BROWSER walker | reaching a log line that only exists after four clicks needs the path driven. That is one more step in a batch already there, against a whole second walk. This does NOT move to codeweaver |
| **The evidence is the TREE — a path that is gone, an import that is there, a rule that is registered** | there is no run to observe and no picture to take. Its final state is a filesystem fact, and that fact is the whole verdict |
| The repo's "the browser UI is the verdict" rule is untouched | that rule governs a flow that HAS a UI |
| **The mark names the state it read, path by path — never that the sequence was followed** | "I did the steps" is the executor grading its own work, and codeweaver IS the executor. `deleted X` and `Y imports Z at line N` are checkable by the next reader; "the refactor sweep completed" is not |
| A unit whose final state the reviewer cannot see from the tree is `cant-meet` with a `toSettle`, never `met` on the sequence having been followed | same reason, from the other end |

**The cost is INDEPENDENCE, not liveness.** There was never anything to drive. What is lost is the
separation: the flow-type contract names codeweaver as the thing that EXECUTES an operational
sequence, and this makes codeweaver's own reviewer the thing that confirms it landed. A mark that
names the state on disk is what keeps that survivable.

### 9i. The spec authors — ChaosWhisperer and BugHunt

§8 gives ChaosWhisperer "wording fixes only". These are the fixes, and one is a live drift.

| Rule | Why |
|---|---|
| **An observable naming an IMPLEMENTATION — a className, a hook, a prop — is a READ-CHECK, authored with `verifyByReading`** | a class name is the mechanism behind something a person sees, never the thing itself, and it can move to an inline style or a generated hash without the outcome changing |
| **Phrase the observable as what a PERSON would see** — "the failed row is red", not "the row has `.failed`" | an observable written in the implementation's words hands a walk the mechanism instead of the outcome, which does to it automatically what reading source did to the trial's arm B |
| The human-check category stays NARROW: motion quality and taste, nothing else | contrast, alignment and clipping are computable, and a model can judge an error message's clarity. A long list is a list nobody works |

**The declared-value enumeration is duplicated and has already drifted, in the dangerous direction —
the author's list is narrower than the reviewer's, and the author is the only role that may set the
flag:**

| Copy | Says |
|---|---|
| `dumpster-create-prompt-statics.ts:163` (the author) | "A font size, a colour token, a class name, a border, a padding, an animation duration, a typeface…" |
| `chaoswhisperer-gap-minion-statics.ts:191` (the reviewer) | "a font size, a colour **or colour token**, a class name, a typeface, a border, a padding **or margin**, an animation duration…" |

A raw colour and a margin are declared values the reviewer catches and the author never flags. Extract
one interpolated statics, add the siege consequence to its rationale, and give it to both. **And no
siege prompt has any rule for an unflagged declared-value observable** — the rule exists, and the gap
is on the walker, which meets one and has nothing telling it what to do. §9d's five steps are that
rule.

### 9j. Registering a new prompt — three places, none of which has it

`agentPromptClassificationStatics.ts:36` holds the exhaustive roster of served prompt names. Every
prompt §8 adds needs a row in three places, or `get-agent-prompt` cannot serve it:

| Place | What goes in |
|---|---|
| `agentPromptNameContract` | the name |
| `agentPromptClassificationStatics.minionNames` | the name, for anything dispatched rather than chatted with |
| `agentNameToPromptTransformer` | the name plus its model — sonnet for every worker, opus for every planner and reviewer |

**`recipe-maker` and `siegemaster-reader` are inline prose today**, briefing a generic
`Agent(subagent_type: "general-purpose")` from inside `siegemaster-prompt-statics.ts`. A generic brief
cannot carry what §9b and §9c put on these roles, so both become served prompts with all three
registration points. **§7 opens `agentPromptNameContract` to free strings**, so the contract half
becomes a lint-and-load reachability check rather than an enum edit — but the classification and
transformer rows are still required, and a missing one is a step that dispatches against nothing.

### 9k. Not a gap — the unowned session is already served

A session nobody dispatched — a developer's own, or one told to drive the app — needs its own rules:
`capacity` before starting, `start` queues, `kill` is mandatory because nothing else will do it, its
instance is filed under `unowned/` with no quest reference protecting its evidence, and `start` hands
back the id and the evidence directory because nothing lists and nothing searches.

**`docs { for: 'driving' }` is built and carries all of it.** No prompt work needed.

### 9l. Every walk records the instance and run that ran it

`questNoteKindContract` holds `walked`, and `questNoteContract` carries typed `instanceId` and `runId`
beside the prose — which is what lets `prune` and `cleanup` resolve a `WALKED` citation mechanically
instead of matching an id buried in a sentence. **Both fields are `.nullish()`, no refinement forces a
`walked` note to carry them, and nothing requires a walk to record one at all.**

**Every path walked carries the instance and run that walked it, a CLEAN walk included**, because that
id is the proof the path was driven rather than claimed — the same thing a setup's `VERIFIED` line
does one level down. And it is the only handle anything has on that walk's evidence: the tool keeps
the run for its retention window and offers no way to find it without the id. Nothing browses.

**This answers half of §8's open shape question about "notes from previous sessions".** A walked note
is `quest.planningNotes.questNotes[]` keyed `{role, workItemId, flowId?, unitId?}`, written by the
walker, and it is a different thing from the plan's per-piece `notes: ["trap: …"]`, which the planner
writes. Both are served by `get-quest-work`; only the first is written by a running session.

---

## 10. `verifyByHuman` — the settlement route for what nothing can automate

**The problem.** Some acceptance criteria cannot be automated at all — "the transition should be
smooth". With no flag, every step holding that unit pays to discover it cannot be automated, and each
either marks it `cant-meet` or invents a `met`. The user sees neither.

**The fix is one flag, set at spec time by the author, read by three parties.** ChaosWhisperer marks
an observable human-check while authoring it, exactly as it already marks one `verifyByReading`. The
author flags it; the in-scope set drops the unit so no step carries something it can never close; the
walker gathers the evidence and routes it to a list for a person.

**Do it in one pass or not at all.** Half of it leaves an unclosable unit visible to a session that
will invent a mark for it.

| | What | State today |
|---|---|---|
| **10a** | `verifyByHuman: true` on `flowObservableContract`, beside the existing `verifyByReading` | not built. `verifyByReading` exists at `flow-observable-contract.ts:76`; `verifyByHuman` appears nowhere in `packages/` |
| **10b** | A human-check route in the step's declared scope, so the in-scope set drops those units | not built. `signoffTrackEligibilityStatics.verificationMethods` lists only `['test', 'reading']` (line 138) and `['test']` for flowrider and siegemaster. **§8 keeps that data and re-keys it from track onto STEP** — this is one more value in the same field |
| **10c** | A shared prompt block holding the "can anything automate this?" decision table, interpolated into ChaosWhisperer's prompt AND both walkers' from one source | not built. The pattern to copy is `standardsReviewConcernsStatics`, already interpolated into three reviewer prompts |
| **10d** | Only ChaosWhisperer and BugHunt may set the flag | not built — see below |
| **10e** | Once a quest reaches `in_progress`, filter `verifyByHuman` units out of every work item's view: `get-quest` and `get-quest-work` | not built; no filter of any kind exists. **`get-qa-checklist` was the third reader and §5 deletes it** |
| **10f** | The end-of-quest list handed to the person, carrying the human-check units and their evidence | not built — 10h has the panel |
| **10g** | A citation kind holding a video a `verifyByHuman` item names, so it survives until the quest closes | not built. `citationKindContract` holds `verified-prelude`, `open-issue`, `walked-note` and no fourth |
| **10h** | The `(human-check)` panel — every unit with its `toSettle`, its repo-local evidence links, an outstanding count, and **a control that takes the person's verdict** | not built. A list a person can read and cannot tick is a list nobody works. It is the ONLY place such a unit reappears: 10e filters them from every work item's view, so with no panel the expectation is invisible everywhere |

**On 10d — the existing rule for `verifyByReading` is prompt text only.**
`packages/orchestrator/CLAUDE.md:851` states "Only ChaosWhisperer and BugHunt can set this", and
`dumpster-create-prompt-statics.ts:158` instructs the ChaosWhisperer session. No guard and no contract
refinement enforces it. Matching that precedent means writing prompt text; enforcing it properly means
a new mechanism. **Decide which, and if it is the second, apply it to both flags.**

**Why 10e is stronger than just dropping the unit from an in-scope set.** A session that can see a
unit it cannot close does not skip it. It reaches for the nearest thing it *can* measure — a proxy
assertion, a change-detector, a `toSettle` naming an action nobody will take — and now the quest
carries a test pinning the wrong thing plus a session that spent a pass on it. A unit nothing
downstream can act on is context that can only mislead, so it must not travel.

**The shared-block rule applies with force to 10c.** A shared block is a contract on every prompt that
interpolates it. A table that drifts between the author's copy and the walker's copy produces the
worst case available: a criterion ChaosWhisperer flagged as human-only that a walker believes is
testable, so neither settles it and neither reports it missing.

**10g cannot wait for a later pass.** A `verifyByHuman` unit hands a person a `.webm` and a question,
and that list reaches them at quest END — so a screencast deleted on the two-day video retention
window is a link that rots before the only reader it has. Whoever builds this adds the citation kind
with it.

**Motion quality is what this route exists for, and one prompt still asks for it.**
`siegemaster-verifier-statics.ts:321` lists "a transition jumps or flickers" beside truncation and
overlap, which ARE measurable. **A model cannot grade animation.** Four frames 1.5 seconds apart
cannot distinguish a clean 300ms transition from a janky one, frame drops are invisible at that
sampling rate, a two-frame flicker falls between samples, and `video` produces a file no model
watches. Every comparison capture is frozen (`animations: 'disabled'`, `caret: 'hide'`) precisely so
`pixelChange` is not noise — so the tool cannot see motion even in principle. **A rule nobody can
follow does not get ignored; it gets answered with an invented adjective**, which is exactly what that
prompt's own "search your own draft for 'confirmed', 'held', 'as expected'" discipline exists to
catch. Cut it from the walker and route it here.

---

## What else this touches

| Thing | What happens to it |
|---|---|
| `agentPromptClassificationStatics.operatorRoleNames` | **Goes.** "Which roles change code" becomes a step field — the answer is per step, not per family |
| `.minionNames` | **Nearly empties.** Reviewers and walkers become steps; `chaoswhisperer-gap-minion` is the only true minion left |
| `roleToModelStatics` | **Superseded for the six families** — the model comes off the step. Survives only for chat roles |
| `workItemToPromptTransformer` | Substitutes a fifth value — the **instance id** — on a `needsLane` step, and nothing on any other |
| `isCommandWorkItemRoleGuard` / `workItemRoleStatics.command` | **Simplifies.** `spawnerType` asks `step.kind`, not the role |
| `executionFloorConfigStatics.floors` | A floor is still per family; the panel groups steps inside one. Adding `riftcarver` matters more once the tiebreak sees more items |
| `get-qa-checklist` (the MCP tool) | **Deleted.** `get-quest-work` is the one startup call. The derivation brokers behind it survive and become that tool's internals |
| `questHydrateBroker` and the hydration recipes | Every fabricated work item needs a `step` and its units, or it is undispatchable |
| `siegelense` `start` / `kill` | **The ROUTER's**, not a session's. It starts an instance before dispatching a `needsLane` work item and kills it when that item records, so a dead session strands nothing — §9g |
| `siegelense capacity` | **Becomes a router input.** How many lanes may run at once is read off it before each lane batch, not declared in config — and the same code that reads it is the code that spends it |
| `siegelense cleanup` | **A deterministic handler**, run by `sweepIn` and `sweepOut` at both ends of the siegemaster graph |
| `glyphsmith` | **Deleted** — the role, its prompt and the chat path that launches it. The design STAGE and `design_approved` stay; a human sets that flag |
| `wardMode` | **Deleted.** A deterministic step's `args: string[]` replaces it, and the field leaves the operation item, the contract, advance and both splices |
| `questTypeRegistryStatics` | Becomes `questFlowStatics` — the ordered `startImplementationOps` + `relayTail` arrays become a routed family graph with `entry` and `routes`, the same grammar the step graphs use. `ward(committed)` leaves it; `wardFull` becomes the last family |
| `questBuildRelayGraphBroker` | Seeds the entry family rather than minting the whole ordered tail at Start. Each family's operation items are minted when the previous family's `done` routes to it |
| `subagentStopNeedsBlockGuard` (`@dungeonmaster/hooks`) | Keeps working and covers more — every step is a work item, so every step is held until it signals |
| `flowObservableContract` | Gains `verifyByHuman`, beside the existing `verifyByReading` — §10a |
| `citationKindContract` | Gains a fourth kind, for a video a human-check unit names — §10g. It is `.strict()`-adjacent work: three values today, and the video link rots on the two-day retention window without it |
| `questNoteContract` | Its `instanceId` and `runId` are `.nullish()` today and become REQUIRED on a `walked` note — §9l |
| `flow-type-contract.ts:13-14` | Its own comment says an operational flow "is verified by Siegemaster checking the final state". After §9h it is not |
| `agentPromptClassificationStatics` + `agentNameToPromptTransformer` | Every new step in §8 needs a row in both — §9j. §7 opens the name CONTRACT, not these two |
| `docs-statics.ts` + `siegelense-call-statics.ts:36` | Two of the seven `docs` scopes lose their reader — `operating` to the deleted operator, `operational` to §9h. §9a has the decision |

---

## Which invariants break

`docs/quest-role-paths.md` is written against strict 1:1 and must be rewritten before the integration
tests can assert against it. Repo policy requires that document to be the spec.

| Invariant | Fate |
|---|---|
| REL-1 strict 1:1 | **Breaks.** One operation item, many work items; at most one non-terminal unless a batch — planned or mark-minted — is running in parallel |
| REL-2 universal operations link | Survives |
| REL-3 one session at a time | **Breaks** with parallel batches. A command still dispatches alone |
| REL-4 advance atomic and idempotent | Survives, extends to the router |
| REL-5 no false complete | **Restated.** `complete` means the family graph reached `@complete`. A drained ledger is an ordinary mid-run state once the graph can cycle, so it stops being the signal |
| REL-6 duplicate-on-partial | **Retires.** `unmet` does the job, and names exactly what remains |
| REL-6a/6b/6c three-track rules | **Retire** with the sign-off tracks |
| REL-6d commit-before-signal | **Retires.** No session commits once `commit` is a deterministic step, so every session reaches its signal with a dirty tree and the gate refuses all of them — see below |
| REL-7 idempotent signal | Survives |

**Two new invariants, and the second one is easy to miss.**

- **No step signals with an unmarked ASSIGNED unit.** That is the gate at signal time.
- **A `role: 'reviewer'` step is assigned its scope's whole IN-SCOPE unit set**, filtered by the
  step's declared scope. A unit no piece ever claimed would otherwise be assigned to nobody, and the
  signal gate — which counts *assigned* units — would pass with it unmarked. Putting this check at
  `@done` instead deadlocks: at that point no step is minted and no route out of a refused terminal
  exists. `@done` keeps the same check as a backstop that should never fire.

**Commit-before-signal is deleted outright.** This is a correction, and it took two passes to get
right. The first pass scoped the gate to the reviewer, because a batch of parallel workers each gated
on a clean tree is a deadlock — measured rather than theoretical: twelve concurrent sub-agent commits
in one worktree, three landed, nine died on `Unable to create index.lock`
(`packages/orchestrator/CLAUDE.md:653`). But the deterministic `commit` step takes committing away
from the reviewer too, so a reviewer-only gate refuses the reviewer for the same reason it would have
refused the workers. Nobody commits, so nobody can be gated on having committed. The reviewer's
`git diff HEAD` plus untracked files is still the pass; it is served to it now rather than run by it.

**`questAdvanceBroker` needs less change than it looks.** Its guard is on *pending* operation items, and
a pending item still has no work items because the router only mints inside an *in-progress* one. The
guard at `:53` stays correct. It gains one job: stamping `step: <graph.entry>`. Ordering between
families is enforced by the `dependsOn` chain, not by advance.

---

## What has to change, by area

Deliberately NOT a file list. The file-level scoping happens after this plan is agreed, and a list
written now would be stale by the time anyone read it. These are the requirements.

### The engine

| Requirement | Why it is here |
|---|---|
| A **family graph** and a **step graph**, in code, sharing one grammar — `entry`, `routes`, the four outcome words | today the relay is an ordered array and the loop is inside a prompt |
| A **router** that, in this order: mints a requested step, else mints from `unmet` marks, else mints the next plan batch, else follows `routes.done` | the four-question order IS the engine |
| **The return edge** — a work item minted from a mark or a request returns to the session that caused it, with no route declared | `recipe`, `read`, both fixers and every `repair` rely on it |
| A **reachability check** over both graphs, as a lint rule and again at server load | a disconnected step reads as fine until a quest stalls |
| **Observation state** — a unit's current mark is the one on the most recent work item assigned it | replaces three overwritable sign-off fields |
| **The signal gate** — no session signals with an assigned unit unmarked | the thing that makes `done` a fact rather than a claim |
| **Lazy scope creation** — a family's scopes are minted when the family is routed to | you cannot mint what the graph has not decided |
| **Completion from the graph**, not from a drained ledger | a drained ledger is an ordinary mid-run state once cycles exist |
| **Parallel dispatch** — the selector returns a batch, with a join. Bounded by `siegelense capacity` for a `needsLane` step and by `maxConcurrent` for everything else | the spawn machinery already does this; only the selector caps it |
| **A deterministic `commit` handler**, and `args: string[]` on deterministic steps | replaces per-session git authority and `wardMode` |

### The data

| Requirement | Why |
|---|---|
| A work item gains `step`, `observations[]`, an optional `pieceId` and an optional `payload` | it is a session inside a scope now, not the scope itself — and one minted from a mark has no piece to read its brief from |
| A **planned-work file per scope**, holding the planner's forecast | plan prose would bloat `quest.json` without limit |
| `quest.flows[].recipes[]` — the recipe NAMES a planner enumerated and authored | the record that the enumeration happened. The recipes themselves live in `packages/hydration-recipes` |
| The three sign-off fields retire from observables, nodes and edges | they are per-track and tracks stop existing |
| The **scoping** half of the track eligibility data survives, re-keyed onto the step | retiring it too blocks every flowrider run on units it cannot settle |
| Step ids are free strings; families keep their enum | prompts get swapped, families do not |
| An off-map family needs a unit id shape of its own | it hangs on no node and no edge |

### The tools

| Requirement | Why |
|---|---|
| **`get-quest-work`** — one startup call for every role, carrying scope, assigned units, in-scope units, flows, the piece, prior-session notes, the uncommitted file list and the git reads, plus the extras listed in §8 | `get-qa-checklist` is deleted, the prompt carries ids only, and no session but warpgate runs git |
| **`quest-work`** — six payloads: `plan`, `observations`, `amendment`, `outcome`, `invalidation`, `request` | the write surface, and what routing reads |
| **`signal-back`** keeps the terminal marker and redelivery idempotency, **loses the commit gate** and `operationStatus`, gains the unmarked-unit refusal | it stops deciding anything, and nothing commits for it to gate on |
| `get-qa-checklist` and `reset-flow-signoffs` are deleted as MCP tools | absorbed into the two above |

### The prompts

Nineteen listed, inventoried in §8: nine new, two adapted, four rewritten, two untouched, one wording
fix, one dead step removed. Five more are deleted and appear nowhere in that list.
Every one is written against that inventory and **budgeted against the 50,000-char ceiling before it
is written**, not after.

### The UI

**The blast radius is narrower than expected and concentrated in one place.** Two whole surfaces are
safe, one is largely dead, and one has to be rebuilt.

**Safe, verified rather than assumed:** the entire chat surface — panel, entries, messages, tool rows,
sub-agent chains, the follow-up tab — reads `ChatEntry[]` off the wire and already buckets by work
item, because sibling sub-agents share a session. Parallel dispatch does not touch it. The queue page
knows nothing about ledgers or work items. **And the flow diagram and the whole SPEC tab never
rendered a sign-off at all** — no web widget reads one, so retiring the three fields costs the diagram
nothing. Comments anchor on spec data and explicitly refuse execution state. Home, sidebars, session
view, rate limits, the image pipeline: untouched.

Only three web files touch execution semantics at all.

#### The one that will be missed

**A row's identity is its OPERATION, and that identity silently stops being unique.** The execution
panel names each row from the operation its work item points at. Under strict 1:1 that is a key. Under
one scope holding many sessions it is a category label — so a codeweaver cell that ran plan, three
workers, review, commit, ward and repair renders as **eight consecutive rows with the same name**,
told apart only by a role badge.

**It will be missed because nothing fails.** No contract rejects it, no test breaks, nothing errors.
The panel keeps working and keeps looking plausible while the user loses the ability to tell which
session is which — the exact thing this redesign exists to give them. And it passes this plan's own
verification step: a panel of eight identically-named rows is neither blank nor frozen.

Grouping rows under their scope is not presentation polish. It is what restores row identity, and it
has to land in the same pass as `workItem.step`.

#### What breaks

| Feature | What a user sees |
|---|---|
| Row naming (above) | a wall of identical row names |
| **The unclaimed-operations tail** — the only forward-looking thing in the product | it goes empty and stays empty. It listed operations nothing had claimed yet, which worked only because every scope was minted at Start. Lazy creation removes the thing it reads |
| **The progress counter** | it jumps and it goes backwards. The denominator grows as families are routed to, and a back-edge raises both numbers so the ratio falls. `AWAITING PLAN` also starts firing for a healthy running quest |
| **The COVERAGE section** — the largest block in the always-visible right panel | it blanks. It is three sign-off tracks per flow, and the tracks retire |
| **The UNCONFIRMABLE debt list** | wrong vocabulary and wrong shape. Two verdicts become three, `unconfirmable` becomes `cant-meet`, and the new `unmet` — the one meaning *work is outstanding right now* — has nowhere to appear |
| **The ward-mode tag** on ledger rows and ward results | disappears with `wardMode`, exactly when it matters most: per-family gates mean many ward results per quest, all reading `exit 1` with nothing saying which scope each graded |
| **The retry badge** | reads `retry 0/1` forever. The real loop count — visits against `maxVisits` — is invisible, so a worker on its 38th pass looks like its first |
| **The DETAILS-tab ledger** | pre-Start it showed the whole forecast relay. Under lazy minting it shows the entry family or nothing, so a reviewer approving a spec loses their preview of what approving it causes |

#### What needs rework

Auto-expand and auto-scroll were written for exactly one running row; four concurrent transcripts will
fight over the scroll position. Dependency labels become ambiguous with many sessions per scope. The
role-colour map is keyed on family when the useful dimension is now step role. Command-row rendering
keys on role rather than step kind, so a `commit` step's git output would render as markdown. The
`PARTIAL` status retires with duplicate-on-partial — as does the `pt N` continuation trail, which is
asserted today as user-visible behaviour.

One thing to reuse rather than rebuild: the summary refresh chain — outbox event, refetch, re-render —
is the right shape for observations and the projection too. Both are computed server-side. Do not
build a second channel.

#### What is newly required

The projection view and the observation churn view, which we already knew. Beyond those: a per-row
**units assigned versus units marked** readout — and the slot for it **already exists and is dead**,
declared and rendered but passed by no production caller, built for exactly this. A **back-edge
badge**, because "this session exists because work item 4 marked obs-3 unmet" is the commonest way
work items will now be created and there is no way to say it. A **planned-versus-actual view**, since
this plan calls that gap the useful thing to look at and nothing reads the plan file. A **step-args
display** to replace the ward-mode tag. A **live `unmet` list** near the execution rows rather than in
the summary panel's archaeology. A **concurrency readout**, since "3 running" becomes a real state.
And a **step-name-unknown fallback**, because §7 promises unrecognised step names load — today the row
renderer indexes a closed record unguarded.

**Two more, and both belong on the SPEC tab rather than the execution one.** Recipes are flow data
now, so a flow should show the seeds a walk of it starts from. That surface does not exist, the
diagram is the natural home for it, and it is the one newly-required thing here a user would reach for
deliberately rather than just read.

**And the `(human-check)` panel — §10h.** Every `verifyByHuman` unit with its `toSettle` instruction,
its repo-local evidence links, an outstanding count, and **a control that takes the person's
verdict.** A list a person can read and cannot tick is a list nobody works. It is the only place such
a unit reappears: §10e filters them out of every work item's view once the quest is `in_progress`, so
with no panel the expectation is invisible everywhere. It cannot ship before §10 does.

### Everything else

Hydration recipes need a `step` on every fabricated work item. The smoketest harness stops fabricating
sign-offs. `session-forensics` reads a different shape. The execution floor list gains `riftcarver`.
None of these is optional and none is interesting.

## The two blast radii, measured

| Surface | Files | Mitigated? |
|---|---|---|
| `quest.workItems` | 77 non-test source files | Yes — not splitting it; the change is three added fields |
| sign-offs | 77 non-test source files | **No** |

**Both figures read 77, which is suspicious rather than impossible.** They were measured for two
different surfaces and one number may have been copied onto the other. Re-measure each before the
order of work is scheduled against them, because the sign-off figure is what makes step 7 the larger
unknown of the two.

The sign-off retirement reaches `flow-graph-to-text`, `quest-summary-build`, `qa-checklist-to-text`,
`modify-quest-input`, both save-invariant transformers, the smoketest harness
(`smoketest-flow-signoff-apply`, `smoketest-sign-outstanding-units`) and the whole `session-forensics`
package. It is roughly as much work as the step engine itself, and it is the larger unknown of the two.

---

## Defects fixed in the same pass

| Defect | Where | Fix |
|---|---|---|
| `riftcarver` missing from the floor list, so it sorts last on a depth tie | `shared/src/statics/execution-floor-config/` | add its entry — that list is also the dispatcher's sort tiebreak |
| `orchestrationPhaseContract` is dead: a stale closed role enum, no consumer | `orchestrator/src/contracts/orchestration-phase/` | delete it, its stub and its test |
| `dagTopologicalSortTransformer` + `dagReadyNodesProcessTransformer` are dead | `orchestrator/src/transformers/` | delete both; the live path is `computeWorkItemDepthsTransformer` |
| `slotManagerStatics` JSDoc names a `slotCount` key that does not exist | `orchestrator/src/statics/slot-manager/` | correct it while replacing the budgets with `maxVisits` |
| `orchestrator/CLAUDE.md:634` is stale on concurrent browser walks | vs `flowrider-prompt-statics.ts:354` | **Settled**: `packages/ward/CLAUDE.md:430` says several e2e runs against one package do run at once, and `:436` gives each its own `.ward-playwright-report-<serverPort>.json`. The collision `CLAUDE.md:634` cites no longer exists. Fix that line; four-at-a-time is a load cap the ROUTER now enforces |
| codeweaver's brief template promises a `MIRROR` block it never defines | `codeweaver-prompt-statics.ts:644`, `:647` | make it a real field or drop the references; flowrider's map has one, so this is likely an omission |

**A correction to my own defect list.** I wrote that `devServer.devCommand` is read by nothing. It is
read — by `tavernkeeper`, which starts the dev server from it when a question needs the running app
(`tavernkeeper-prompt-statics.ts:86`). A SESSION reads it, not code, which is exactly why a grep for
readers missed it. Deleting it on that line's authority would have broken a prompt.

Still apparently unread: `orchestration.timeoutMs`, `devServer.readinessPath`, `.readinessTimeoutMs` —
and each now needs a prompt-text check before anyone removes it.

---

## Order of work, and who does it

**The work is chunked into agent-session briefs in `scrolls/orcha-changes/`.** That directory holds
the waves, what runs in parallel, which files each session owns, and what each one must assert. It is
the dispatch plan; this document is the spec it is written against.

**Read `scrolls/orcha-changes/README.md` first.** The short version:

| Wave | What |
|---|---|
| 1 | the shapes — both graphs, the plan-file contract, three work-item fields, the reachability check |
| 2 | the engine — observation state, the signal gate, the router |
| 3 | the two tools — `get-quest-work`, `quest-work`, and the `signal-back` changes |
| 4 | the cutover — advance, the selector, the deterministic handlers, capacity, the deletions |
| 5 | retire the sign-off tracks, keeping the scoping half re-keyed onto the step |
| 6 | nineteen prompts, one session each, every one budgeted before it is written |
| 7 | the UI — row identity, the projection, the churn view, seven broken surfaces |
| 8 | independent: `glyphsmith`, six defects, the whole `verifyByHuman` slice |

**Waves 1 to 4 are serial and small.** They are the interesting design work and the least of the
volume. **Waves 5, 6 and 7 are where the hours are**, and all three run at once because they touch
three disjoint trees. Wave 8 starts today.

**One cutover, one PR.** Nothing in here merges on its own. The wave boundaries exist so a session can
hold its brief, not so a chunk can ship.

---

## Verification

**The per-session assertions live with the briefs**, in each wave file's `ASSERT` line, because that is
what a dispatched session reads. Four things hold across all of them:

1. **Assert BEHAVIOUR, not wiring.** A test proving a callback was PASSED is what let the missing
   output-streaming bug ship. Assert the work items minted and their order, the rendered text, the
   value measured.
2. **Tests-green is necessary, not sufficient.** Repo policy is that the browser is the verdict — a
   blank panel or a frozen spinner is a failure even if `quest.status` reads `complete`. **And that
   check alone is not enough here**: the row-identity defect in wave 7 produces a panel that is
   neither blank nor frozen and is still broken.
3. **After they pass, READ the assertions** and confirm each one asserts a real value. A test that
   passes while asserting "rendered" or "was called" is a false positive and is worse than no test.
4. **Ward**: `npm run ward -- --uncommitted` iterating to exit 0 per session, then one bare
   `npm run ward` per wave, run by whoever is coordinating rather than by a session.

