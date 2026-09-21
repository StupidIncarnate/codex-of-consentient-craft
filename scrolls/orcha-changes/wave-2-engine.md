# Wave 2 — the engine

**This is the heart, and nothing else matters if it is wrong.** Three sessions, tested against a stub
dispatcher, wired to no live path. The tree stays green because nothing calls any of it yet.

**Model: opus**, all three.

**Spec:** plan §1, §3b ("A step's routes are its PHASES", "The plan drives forward"), §"The in-scope
gate has to fire at the REVIEWER", §"Bulk invalidation stays".

---

### 2A — observation state: what a unit's mark actually IS

```
READ      plan §1, the whole section — especially "Where the marks live"
OWNS      the transformer answering "what is this unit's current mark?"
          the transformer answering "what happened to this unit?" — the churn walk
          the invalidation apply path
NO TOUCH  the router (2B) · the signal gate (2C) · anything reading a sign-off FIELD,
          which is wave 5
DONE      a unit's current mark is the one on the MOST RECENT WORK ITEM ASSIGNED IT —
          not the most recent mark anywhere
ASSERT    the distinction above, with a case that fails under the naive reading: work item
          1 marks obs-3 `met`; work item 2 is assigned obs-7 only and marks it `unmet`;
          obs-3 is still `met`. Then the churn: four work items on one unit read back in
          order, every one of them intact and unedited. Then invalidation: a `flowId` and
          a reason re-open every unit on that flow onto a fresh session, **editing
          nothing and erasing nothing**
```

**The rule this session exists to make true.** Nothing overwrites. A reviewer rejecting a worker's
`met` does not clear it — the reviewer's own work item is the most recent one assigned that unit, so
its `unmet` IS the state, and the rejected `met` stays readable where it was made. That is what
deletes `reset-flow-signoffs`' per-unit lever and flowrider's `flowriderSignoff: null` overwrite rule
in one go.

---

### 2B — the router: four questions, in this order

```
READ      plan §3b ("The plan drives forward; routes drive the loop-backs", "A step's
          routes are its PHASES") · §"Concurrency is measured"
OWNS      the router broker and its layer helpers
          outcome derivation from marks
          the batch fold
          the return edge
          lazy scope creation, and completion read off the graph
NO TOUCH  select-batch-layer-broker.ts and its siblings under
          packages/orchestrator/src/brokers/quest/get-next-step/ — wave 4 wires those
          quest-advance-broker.ts · quest-build-relay-graph-broker.ts — also wave 4
DONE      every route on every step in all six graphs resolves, driven by a stub
          dispatcher, with no live dispatch path touched
ASSERT    the four-question ORDER, with a case where all four are true at once: a request
          beats an `unmet`, an `unmet` beats an unstarted batch, an unstarted batch beats
          `routes.done`. Then outcome derivation from marks — `done`, `unmet`, `empty`,
          `wall` — and `maxVisits` exhaustion, an unknown step id, an outcome a step does
          not declare. Then the return edge: a mark-minted or request-minted work item
          returns to the session that caused it **with no `done` route declared**. Then
          the phase rule: a step's `done` fires only when EVERY piece at it has drained,
          asserted on `happyWalk` with two pieces. Then the one that bites if it is wrong:
          **a drained ledger mid-run must NOT derive `complete`** — only reaching
          `@complete` in the family graph does
```

**Grouping, when a reviewer's `unmet` spans several pieces.** The key is the ORIGINATING PIECE, never
the mark set — partition the `unmet` units by the piece that first claimed each, and mint one work
item per originating piece as a batch. Two `unmet` units from one piece at two layers is ONE work
item; from two pieces it is two. `payload.specPath` happens to make that one-per-spec-file for
flowrider, but that is the instance, not the rule.

---

### 2C — the signal gate, and the reviewer's whole in-scope set

```
READ      plan §1 (the gate, and the derivation table) · §"The in-scope gate has to fire
          at the REVIEWER" · §"Which invariants break"
OWNS      the gate itself, refused at the tool boundary
          the in-scope set derivation, filtered by the step's declared scope
          the rewrite of docs/quest-role-paths.md
NO TOUCH  the router (2B) · signal-back itself, which is session 3C
DONE      no step signals with an assigned unit unmarked, and a `role: 'reviewer'` step is
          assigned its scope's WHOLE in-scope set
ASSERT    a step with one unmarked unit cannot signal; with all marked it can; a planner
          with none assigned can. A planner writing `met` is REFUSED; writing `cant-meet`
          on a unit it assigned to no piece is ALLOWED, **and that mark lands on the
          planner's own work item**. Then the two qualifiers, each with the failure it
          prevents: filter the in-scope set by the step's scope, or every flowrider
          reviewer blocks on a `(read-check)` unit nobody in that family can settle; count
          a unit outstanding only when no piece claims it AND no live work item is
          assigned it, or two siege walkers each read the other's units as unclaimed
```

**Why this check is at the reviewer and not at `@done`.** `@done` fires when the ward step routes
there, and at that moment no step is minted, no unit is assigned, and the config declares no route out
of a refused terminal. The operation stalls with nothing able to move it. One step earlier a route
still exists, so the in-scope check and the ordinary signal gate become the SAME check. `@done` keeps
it as a backstop that should never fire.

**`docs/quest-role-paths.md` is rewritten here, not later.** It is written against strict 1:1, repo
policy is that it is the spec, and wave 2's own integration tests assert against it. REL-1, REL-3,
REL-6, REL-6a/b/c and REL-6d all break; REL-5 is restated. §"Which invariants break" has the table.
