# Wave 2 — the engine

**This is the heart, and nothing else matters if it is wrong.** Three briefs, dispatched one at a time
and reviewed closely between. Everything is tested against a STUB dispatcher and wired to no live path,
so the tree stays green.

**Model: opus**, all three.

**This file carries everything a worker needs.** It does not point anywhere else.

---

## The vocabulary, if you have not read wave 1

| Word | Means |
|---|---|
| **family** | one of six role stages: `riftcarver`, `codeweaver`, `flowrider`, `siegemaster`, `wardFull`, `warpgate` |
| **scope** | one family's slice of one quest — *"codeweaver, package web, flow send"*. Today's `quest.operations[]` item |
| **step** | one stage inside a family — `plan`, `work`, `review`, `commit`, `ward`. Its own dispatched session, its own prompt |
| **work item** | one dispatched agent run. Today's `quest.workItems[]` entry. Many per scope |
| **unit** | an observable, a terminal node, a labelled edge, or an off-map probe family (`offmap:perf`) |
| **piece** | a line in the planner's forecast file, `planned-work/<operationItemId>.json`. Not the same as a work item |

**The four outcome words, everywhere, no synonyms:** `done` (every assigned unit `met` or
`cant-meet`) · `unmet` (at least one still `unmet`) · `empty` (nothing was in scope to act on) ·
`wall` (an environment wall no fresh session could pass). Ordered worst first —
`wall` > `unmet` > `done` > `empty`.

---

## 2A — observation state: what a unit's mark actually IS

```
OWNS      the transformer answering "what is this unit's current mark?"
          the transformer answering "what happened to this unit?" — the churn walk
          the invalidation apply path
NO TOUCH  the router (2B) · the signal gate (2C) · anything reading a sign-off FIELD,
          which is wave 5
DONE      a unit's current mark is the one on the MOST RECENT WORK ITEM ASSIGNED IT —
          not the most recent mark anywhere
WARD      npm run ward -- -- <your paths>
```

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


### Bulk invalidation — the one thing a per-work-item set does not cover

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

### What to assert

The state rule, with a case that fails under the naive reading: work item 1 marks `obs-3` met; work
item 2 is assigned `obs-7` only and marks it unmet; `obs-3` is still met, because work item 1 is still
the most recent work item ASSIGNED it.

Then the churn: four work items on one unit read back in order, every one intact and unedited. Then
invalidation: a `flowId` and a reason re-open every unit on that flow onto a fresh session, **editing
nothing and erasing nothing**.

---

## 2B — the router: four questions, in this order

```
OWNS      the router broker and its layer helpers
          outcome derivation from marks · the batch fold · the return edge
          lazy scope creation, and completion read off the graph
NO TOUCH  packages/orchestrator/src/brokers/quest/get-next-step/select-batch-layer-broker.ts
          and its siblings — wave 4 wires those
          packages/orchestrator/src/brokers/quest/advance/quest-advance-broker.ts — wave 4
          packages/orchestrator/src/brokers/quest/build-relay-graph/… — wave 4
DONE      every route on every step in all six graphs resolves, driven by a stub
          dispatcher, with no live dispatch path touched
WARD      npm run ward -- -- <your paths>
```

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
the baseline has to be re-derived per piece, or dropped; wave 6's antagonist rules say what dropping it costs.

The same shape was already implicit everywhere else — codeweaver's workers all land before its
reviewer reads, flowrider's spec files all land before its reviewer grades. Declaring it once stops
each family inventing its own.


### The three layers the router creates, and when
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


### The config is the map. The ledger is the record. The UI is a projection.
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


### Grouping, when a reviewer's `unmet` spans several pieces

**The key is the ORIGINATING PIECE, never the mark set.** Partition the `unmet` units by the piece
that first claimed each, and mint one work item per originating piece, as a batch. Two `unmet` units
from one piece at two layers is ONE work item; from two pieces it is two. `payload.specPath` happens to
make that one-per-spec-file for flowrider, but that is the instance, not the rule — codeweaver and
siege have no such field.

**A mark-minted work item has no piece, so the router copies the originating piece's payload onto it**,
filtering `units[]` to the units actually being re-minted and dropping nothing else. Instance ids are
never carried — the router starts a fresh one per work item, so a copy would be stale by construction.
`baselineFor` IS carried: a re-minted attack measures against the same happy run the first one did.

### What to assert

The four-question ORDER, with a case where all four are true at once: a request beats an `unmet`, an
`unmet` beats an unstarted batch, an unstarted batch beats `routes.done`.

Then outcome derivation from marks — `done`, `unmet`, `empty`, `wall` — and `maxVisits` exhaustion, an
unknown step id, an outcome a step does not declare.

Then the return edge: a mark-minted or request-minted work item returns to the session that caused it
**with no `done` route declared**.

Then the phase rule: a step's `done` fires only when EVERY piece at it has drained, asserted on
`happyWalk` with two pieces — and no `adversarial` work item is minted until both have recorded.

Then the one that bites if it is wrong: **a drained ledger mid-run must NOT derive `complete`.** Only
reaching `@complete` in the family graph does. A step-graph cycle is enough to produce that state.

---

## 2C — the signal gate, and the reviewer's whole in-scope set

```
OWNS      the gate itself, refused at the tool boundary
          the in-scope set derivation, filtered by the step's declared scope
          the rewrite of docs/quest-role-paths.md
NO TOUCH  the router (2B) · signal-back itself, which is wave 3
DONE      no step signals with an assigned unit unmarked, and a `role: 'reviewer'` step is
          assigned its scope's WHOLE in-scope set
WARD      npm run ward -- -- <your paths>
```

### The unit gate — the mechanism everything else hangs off

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
`reset-flow-signoffs` did too — bulk invalidation, in 2A above, is the one part it does not.

**A step's outcome is DERIVED from its marks, not declared.** The agent does not get to claim `done`
while leaving work on the floor:

```
any assigned unit marked `unmet`       → outcome is `unmet`
every one marked `met` or `cant-meet`  → outcome is `done`
no units assigned                      → the step declares its own word
an environment wall, at any point      → outcome is `wall`
```

That is what "deterministic gate" means here. `done` is a fact about the record, not a claim. The
"no units assigned" line covers a planner, a `repair` and `warpgate` alike.

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
written in the plan file's `plannerMarks` block, and **the router copies them onto the planner's own
work item as its observation set when it accepts the plan** — which makes the planner the most recent
work item assigned those units. Leave them in the plan file only and every off-map family the planner
declined reads as unmarked forever, which blocks the in-scope gate at the reviewer.


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
gate become the same check, which is why this is a property of the reviewer ROLE rather than a rule
of its own.

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


### `docs/quest-role-paths.md` is rewritten HERE, not later

It is written against strict 1:1, repo policy is that it is the spec, and this wave's own integration
tests assert against it. What changes:

| Invariant | Fate |
|---|---|
| REL-1 strict 1:1 | **Breaks.** One operation item, many work items |
| REL-2 universal operations link | Survives |
| REL-3 one session at a time | **Breaks** with parallel batches. A command still dispatches alone |
| REL-4 advance atomic and idempotent | Survives, extends to the router |
| REL-5 no false complete | **Restated.** `complete` means the family graph reached `@complete`. A drained ledger is an ordinary mid-run state once the graph can cycle |
| REL-6 duplicate-on-partial | **Retires.** `unmet` does the job, and names exactly what remains |
| REL-6a/6b/6c three-track rules | **Retire** with the sign-off tracks (wave 5) |
| REL-6d commit-before-signal | **Retires.** No session commits once `commit` is a deterministic step, so every session reaches its signal with a dirty tree and the gate would refuse all of them |
| REL-7 idempotent signal | Survives |

**Two new invariants, and the second is easy to miss:** no step signals with an unmarked ASSIGNED
unit; and a `role: 'reviewer'` step is assigned its scope's whole IN-SCOPE unit set, filtered by the
step's declared scope.

### What to assert

A step with one unmarked unit cannot signal; with all marked it can; a planner with none assigned can.
A planner writing `met` is REFUSED; writing `cant-meet` on a unit it assigned to no piece is ALLOWED,
**and that mark lands on the planner's own work item**.

Then the two qualifiers, each with the failure it prevents. Filter the in-scope set by the step's
scope, or every flowrider reviewer blocks on a `(read-check)` unit nobody in that family can settle.
Count a unit outstanding only when no piece claims it AND no live work item is assigned it, or two
siege walkers each read the other's units as unclaimed.
