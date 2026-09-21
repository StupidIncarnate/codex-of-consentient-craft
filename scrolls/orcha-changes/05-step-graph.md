# 05 — the step graph

```
GOAL      What happens INSIDE one family is data with routes, so swapping a prompt in or
          out is a config edit rather than a prompt rewrite.
AFTER     03 (it names prompts that no longer have to exist as enum members)
BEFORE    06 · 13 · 15 · 20 · 25
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus — every prompt in story 25 is written against this
```

**This is the centre of the design.** Read the whole story before writing a line.

---

## What a step is, and why every one of them declares a `role`

Today one session runs a whole family's scope and loops inside itself. After this, each STEP is its
own dispatched session with its own prompt, and the orchestrator decides what runs next from the
record. A step's `role` is what makes that loop generic — the router never needs to know it is looking
at codeweaver rather than siegemaster:

| `role` | Gets units? | Which ones | Outcome comes from | On `unmet` |
|---|---|---|---|---|
| `planner` | **no** | none. It may write `cant-meet` in `plannerMarks` and nothing else | its own declared word | n/a |
| `worker` | yes | the ones its piece assigns | the marks | a fresh worker on those units — "part two" |
| `reviewer` | yes | **its scope's whole in-scope set**, not one piece's | the marks | a worker on those units — the rework edge |

**A reviewer is assigned everything in scope**, and that is not an oversight. It has no piece — a
planner cuts worker pieces, not review pieces — so the in-scope set IS its assignment. That is what
makes the signal gate and the in-scope gate the same check, and what makes a reviewer's `met` supersede
a worker's. It costs one mark per in-scope unit, written as the reviewer settles each one, which is
the reading pass it was going to do anyway.

**A `kind: 'deterministic'` step is outside the unit gate.** `ward`, `riftcarver`, `commit` and
`cleanup` run code, carry no units and have nothing to mark; their outcome is their handler's exit
code, classified into one of the four words. They still declare a `role` so the router knows which
side of the pair they sit on. Saying it this way avoids the trap of a `role: 'reviewer'` step that can
never satisfy a gate written for prompts.

---

## Routing, and the three rules that keep the config small

**1. `routes.done` is the FORWARD edge only. The return edge is automatic.** A work item minted by
another step's `unmet` returns to the step that minted it — the router knows which that was, because it
created it. Writing that back-edge into config is what produced the jank: `fixHappy: { done: 'happyWalk' }`
reads like a wired transition when it really means "go back where you came from", and the moment two
walkers shared one fixer the wiring was silently wrong.

So **a step that is only ever mark-minted declares no `done` route at all**, and an undeclared outcome
returns to its minter rather than stalling. That is what lets `recipe` declare only
`routes: { wall: '@blocked' }` and still be complete: it returns whether it wrote something (`done`) or
found the seeds already there (`empty`).

**2. A step's `done` fires when every piece at that step has DRAINED.** Same rule the family graph uses
for fan-out cells, one level down. So the step chain IS the phase order:

```
plan → happyWalk(× every path) → adversarial(× every family) → commit → ward → sweepOut
```

Two things fall out, and both are checked at plan-write time in story 08: a plan batch holds pieces for
ONE step; and every batch at the current step is minted before `routes.done` is consulted.

**Siege is why this is a rule rather than an accident.** The antagonist compares against a BASELINE —
the happy walk's instance id and run id for the path it is attacking — and a baseline taken after the
attack is not one. Under a phase route that id exists by the time the router mints the adversarial
piece, so the router hands it over and the rule needs no prompt behind it.

**3. Two targets are not step names.** `@done` completes the operation item; `@blocked` halts the quest
for a human.

---

## The four outcome words, and the three shapes of `empty`

| Outcome | Means |
|---|---|
| `done` | every assigned unit is `met` or `cant-meet` |
| `unmet` | at least one is still `unmet` |
| `empty` | **nothing was in scope to act on.** Never "there was work and I chose to cut none" |
| `wall` | an environment wall no fresh session could pass |

`empty` is the word that drifts furthest, so all three of its shapes are stated:

| On a | `empty` means |
|---|---|
| step holding units — a planner | the scope's in-scope unit set is empty. A planner holding units and cutting no work declares `done` and marks each one `cant-meet` with a `toSettle` |
| step holding no units — `recipe` | there was nothing to produce. A flow whose seeds already exist costs one cheap session that writes nothing |
| deterministic step — `ward` | the handler's scope resolved to nothing. A 0-file ward scope exits 0 without grading a line |

Ordered worst first — `wall` > `unmet` > `done` > `empty` — which is how a parallel batch folds to one
outcome. **The fold is PER STEP**, which matters once a step's pieces run in several batches.

---

## BUILD

New: `packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts`

```ts
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
```

**Two field names carry weight that is easy to miss.** `mintableOnRequest` tells story 06's
reachability check that a step nothing routes to is still reachable — a running session asks for it.
`needsLane: true` means the ROUTER starts a siegelense instance before dispatching that work item and
kills it when the item records; the step declares no number, because how many may run at once is
measured off `siegelense capacity` rather than guessed (story 23).

---

## DONE WHEN

| Assert | |
|---|---|
| the statics pins | a change to a graph should be a visible diff on a test, not a silent edit |
| **`CLOSE_OUT` is spread into exactly the three code-changing families**, and `riftcarver`, `wardFull` and `warpgate` each declare their own steps | this is the gap that produced two of the config's comments. `riftcarver` and `wardFull` run a `repair` and get no `CLOSE_OUT`, so each needs its OWN `commit` step, or a spiritmender's fix reaches `@complete` uncommitted and `warpgate`'s `git merge --squash` drops it |
| siegemaster's `ward` entry OVERRIDES the spread one, and the override comes AFTER the spread | spread order is the whole mechanism. Get it backwards and the shared `ward` wins, `sweepOut` never runs, and every siege pass leaks instances |
| every `prompt:` value is a name `agentNameToPromptTransformer` can resolve, OR is listed in story 25 as one to be written | a dangling prompt is a step that dispatches against nothing |
| `happyWalk` routes to `adversarial`, not to `commit` | that route IS the two-phase rule. If it points at `commit`, the antagonist has no baseline |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| write the reachability check | story 06 |
| write any prompt | story 25 |
| write any handler | story 20 |
| wire this to dispatch | story 22 |
