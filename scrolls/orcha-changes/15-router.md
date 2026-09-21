# 15 — the router

```
GOAL      Given a quest, decide what runs next. This is the engine, and nothing else
          matters if it is wrong.
AFTER     04 · 05 · 07 · 09 · 10 · 12 · 13
BEFORE    16 · 21 · 22
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus
```

**Tested against a STUB dispatcher. It is wired to no live path in this story** — story 22 does that —
so the tree stays green and a mistake here costs a test, not a quest.

---

## The four questions, in this order

The order IS the engine. Get it wrong and the symptoms are subtle: work that should have been re-cut
gets skipped, or a phase advances with pieces still unstarted.

1. **Did this step REQUEST another step?** → mint that step, carrying the request. Its `done` returns
   to the session that asked. This is how `recipe` and `read` run.
2. **Does this step have `unmet` units?** → mint a fresh work item at `routes.unmet`, scoped to exactly
   those. That work item has **no piece** — it is minted from the marks — and carries an inherited
   payload instead.
3. **Are there unstarted plan batches left AT THE CURRENT STEP?** → mint the next one. A batch holds
   pieces for one step only, and every batch at this step is minted before question 4 is reached.
4. **Otherwise** → follow `routes.done`.

**Write a test where all four are true at once.** A request beats an `unmet`; an `unmet` beats an
unstarted batch; an unstarted batch beats `routes.done`. That single test is worth more than the four
separate ones.

---

## Three mechanisms the questions depend on

### The return edge

A work item minted from a mark (question 2) or a request (question 1) **returns to the session that
caused it**, and the router knows which that was because it created it. So a step that is only ever
mark-minted declares **no `done` route at all**, and an undeclared outcome returns to its minter rather
than stalling.

Writing that back-edge into config is what produced the jank: `fixHappy: { done: 'happyWalk' }` reads
like a wired transition when it means "go back where you came from", and the moment two walkers shared
one fixer the wiring was silently wrong.

### The phase rule

**A step's `done` fires only when every piece at that step has DRAINED.** That is question 3 doing its
job: every batch at the current step is minted and recorded before question 4 is consulted.

For siege this is what makes `happyWalk → adversarial` mean something. Every happy piece has recorded
before the first attack is minted, so the router can resolve each adversarial piece's `baselineFor` to
a real work item and serve its instance id and run id.

### Grouping, when a reviewer's `unmet` spans several pieces

**The key is the ORIGINATING PIECE, never the mark set.** Partition the `unmet` units by the piece that
FIRST claimed each, and mint one work item per originating piece, as a batch.

Two `unmet` units from one piece at two layers → ONE work item. From two pieces → two.
`payload.specPath` happens to make that one-per-spec-file for flowrider, but that is the instance, not
the rule; codeweaver and siege have no such field.

**A mark-minted work item has no piece, so copy the originating piece's payload onto it**, filtering
`payload.units[]` to the units actually being re-minted and dropping nothing else.

| Field | Carried? |
|---|---|
| `payload.files`, `facts`, `fences`, `doNotTouch` | **yes** — it is the same work |
| `baselineFor` | **yes** — a re-minted attack measures against the same happy run the first one did |
| an instance id | **never** — the router starts a fresh one per work item (story 23), so a copy is stale by construction |

**A reviewer has no piece of its own**, so when a reviewer's `unmet` mints a worker, copy from the piece
that first claimed each unit — traceable through the plan. That piece holds the right files, fences and
doNotTouch, which is what a re-minted worker actually needs.

---

## Enforcement the router owns, that nothing else can

**`maxConcurrent` is the router's**, not the plan contract's, and the reason is structural: **a
mark-minted piece is by definition not in the plan.** Three walkers marking `unmet` mint three fixers
outside any declared batch, and their returns mint three concurrent re-walks. Nothing a planner wrote
bounds that. Story 08's check is an early warning at plan time; this is the enforcement.

`maxConcurrent: { limit: 4, counts: 'browser-pieces' }` on flowrider's `work` step. **The `counts` half
matters**: that step also runs below-browser pieces that cost nothing and must not eat the cap. A piece
is a browser walk iff any of its units has `layer: 'browser'`.

Siege lanes are a different budget and are NOT a number in config — story 23.

---

## Also here: `invalidation`

A `flowId` and a reason re-open every unit on that flow. The router treats them as needing a fresh
measurement and assigns them to a new session. **Nothing is edited and nothing is erased**: existing
work items keep their records, and the new session writes its own set, exactly as a re-mint does.

It is the only lever that re-opens off-map families after a fix, and it exists because nobody can
enumerate what a shared-code fix moved. Story 17 builds the payload; this acts on it.

---

## BUILD

```
{ quest, plan, agentFlowStatics, questFlowStatics } → NextAction
```

`NextAction` is one of: mint these work items, follow a route, complete the operation item, or block.
It **returns a decision; it does not perform one.** Story 21 wires it to the selector and story 22 to
advance. Keeping it pure is what lets its tests be cheap and exhaustive.

---

## DONE WHEN

| Assert | |
|---|---|
| **the four-question order, with one fixture where all four are true** | the single highest-value test in this story |
| every route on every step in all six graphs resolves | a table-driven sweep |
| the return edge: a mark-minted work item returns to its minter **with no `done` route declared** | |
| the phase rule: two `happyWalk` pieces, and **no `adversarial` work item is minted until BOTH have recorded** | |
| an adversarial work item carries the instance id and run id of the piece its `baselineFor` names | |
| grouping: two `unmet` units from one piece → one work item; from two pieces → two | |
| an inherited payload carries `baselineFor` and carries NO instance id | |
| `maxVisits` exhaustion blocks, naming the step | |
| an unknown step id fails LOUDLY, naming the step and the family | story 03 opened the contract so it loads; this is where it must not load silently |
| an outcome a step does not declare returns to the minter | not a stall |
| `invalidation` re-opens a flow's units onto a fresh session, **editing nothing** | assert the prior work items are byte-identical afterwards |
| `maxConcurrent` counts browser pieces only | a batch of six below-browser pieces plus one browser piece is within a limit of 4 |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| touch `select-batch-layer-broker.ts` or its siblings | story 21 |
| touch `quest-advance-broker.ts` or `quest-build-relay-graph-broker.ts` | story 22 |
| mint a SCOPE | story 16 |
| start an instance | story 23 |
