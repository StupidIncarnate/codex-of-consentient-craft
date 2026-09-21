# Wave 1 — the shapes

**Three briefs, dispatched one at a time and reviewed between.** Everything here is additive: new
contracts, new statics, one lint rule. Nothing reads any of it yet, so the tree stays green throughout.

**Model: opus.** This is where the graph grammar gets decided, and the whole epic is written against
it. The wave orchestrator makes that decision ONCE and puts it in brief 1A; 1B and 1C build to it.

**This file carries everything a worker needs.** It does not point anywhere else.

---

## The vocabulary, first — five words the briefs use as if you know them

| Word | Means |
|---|---|
| **family** | one of the six role stages a quest passes through: `riftcarver`, `codeweaver`, `flowrider`, `siegemaster`, `wardFull`, `warpgate`. This is the stable layer |
| **scope** | one family's slice of one quest — *"codeweaver, package web, flow send"*. Today's `quest.operations[]` item. One per fan-out cell or flow |
| **step** | one stage INSIDE a family — `plan`, `work`, `review`, `commit`, `ward`. Each is its own dispatched session with its own prompt. This is the volatile layer, and it is new |
| **work item** | one dispatched agent run. Today's `quest.workItems[]` entry. Many per scope |
| **unit** | the atom of verification: an observable, a terminal node, a labelled edge, or an off-map probe family. A work item is ASSIGNED units and must mark every one before it may signal |

**The whole change in one line:** today one session runs a whole family's scope and loops internally;
after this, each step is its own session and the orchestrator runs the loop off a config table.

---

## 1A — the two graphs, and the check that proves they are sound

```
OWNS      packages/shared/src/statics/quest-flow/quest-flow-statics.ts            NEW
          packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts      NEW
          packages/shared/src/statics/quest-type-registry/quest-type-registry-statics.ts
            — and its colocated test
          one new rule in packages/local-eslint, plus its registration
NO TOUCH  every CALLER of questTypeRegistryStatics. Wave 4 rewires them, and there are
          callers in orchestration-start-responder, chat-start-responder,
          quest-create-broker and four web e2e specs. Leave the old export in place
          beside the new statics
DONE      both graphs exist and both pass the reachability check; the check runs as a lint
          rule AND at server load, from ONE implementation with two callers
WARD      npm run ward -- -- <your paths>
```

### The family graph — which family runs next

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


### The step graph — what happens inside one family

`packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts`.

**Every step declares a `role`, and the role is what makes the loop generic:**

| `role` | Gets units? | Which ones | Outcome comes from | On `unmet` |
|---|---|---|---|---|
| `planner` | **no** | none. It may write `cant-meet` in `plannerMarks` and nothing else | its own declared word | n/a |
| `worker` | yes | the ones its piece assigns | the marks | a fresh worker on those units — "part two" |
| `reviewer` | yes | **its scope's whole in-scope set**, not one piece's | the marks | a worker on those units — the rework edge |

**A `kind: 'deterministic'` step is outside the unit gate.** `ward`, `riftcarver`, `commit` and
`cleanup` run code, carry no units and have nothing to mark; their outcome is their handler's exit
code, classified into one of the four words below. They still declare a `role` so the router knows
which side of the pair they sit on.

**The four outcome words, everywhere, with no synonyms:**

| Outcome | Means |
|---|---|
| `done` | every assigned unit is `met` or `cant-meet` |
| `unmet` | at least one is still `unmet` |
| `empty` | **nothing was in scope to act on.** Never "there was work and I chose to cut none" |
| `wall` | an environment wall no fresh session could pass |

Ordered worst first — `wall` > `unmet` > `done` > `empty` — which is how a parallel batch folds to one
outcome.

**`routes.done` is the FORWARD edge only. The return edge is automatic.** A piece minted by another
step's `unmet` returns to the step that minted it, and the router knows which that was — it created
the piece. So a step that is only ever mark-minted declares **no `done` route at all**, and an
undeclared outcome returns to the minter rather than stalling.

**Two targets are not step names:** `@done` completes the operation item; `@blocked` halts the quest
for a human.

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
      // file:line. Its rules are wave 6's. Requested by the planner up front and by a
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

### The reachability check
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


**One correction to the paragraph above, because the config changed after it was written:**
`adversarial` is now reached by a route — `happyWalk` routes to it — so it declares no
`mintableByPlan` and needs no exemption. Only `recipe`, `read` (both `mintableOnRequest`) and the
`warpgate` family (`appendedAtMerge`) do.

### What to assert

Every row of the reachability table, each as its own case with a deliberately broken fixture graph: a
step nothing routes to, a cycle with no exit, a route naming a step that does not exist, a
plan-reachable step with no `done` route, an outcome word outside the four, a cyclic path with no
`maxVisits`, a family that reaches no `@complete`, a `prompt` or `handler` naming something absent.

Then the three that must PASS: `recipe` and `read` reached by `mintableOnRequest`, and the `warpgate`
family by `appendedAtMerge`.

**Write the check ALONGSIDE the graphs, not after.** A bad graph cannot then be committed in the first
place, and the failure mode it catches is a quest that silently stalls rather than one that errors.

---

## 1B — the plan file: its contract, its path, its validation

```
OWNS      a new contract for the planned-work file and its pieces, batches and plannerMarks
          the `planned-work/<{operationItemId}>.json` path constant, in the same
            locations statics every other quest path lives in
          the validation this contract enforces at parse time
NO TOUCH  the `quest-work` MCP tool — wave 3 owns it and CALLS this contract
          quest.json's own contract — brief 1C owns that
DONE      a plan parses or is refused WHOLE, and every check in the table below has a case
WARD      npm run ward -- -- <your paths>
```

### Two files, two different things — "work item" was doing two jobs

| | **PIECE** | **WORK ITEM** |
|---|---|---|
| Lives in | `<questFolder>/planned-work/<operationItemId>.json` | `quest.json` → `quest.workItems[]` |
| Is | the planner's forecast — what it intends | the record — a session that ran |
| Written by | one planner, once, then amended | the orchestrator, as the router decides |
| Count | all of them, up front | only what has been reached |

They are deliberately not 1:1. A piece whose units come back `unmet` produces a second work item. A
piece the run never reaches produces none.

**Why the split.** `quest.workItems` has 77 readers and 17 writers that each depend on one atomic
rename — moving it is expensive and buys nothing. Plan prose is what would bloat `quest.json` without
limit, and only the router and the planner read it.

### The envelope — the whole file, not an excerpt. This IS the contract

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
  "plannerMarks": [ ]                 // `cant-meet` only, on units no piece claims. See 1C
}
```

**`assignedUnitIds` and `contextUnitIds` are two different jobs.** The first is what this session must
mark; the second is what it must read and build against but may not mark, which is how a seam's far
half stays visible to the cell that does not own it (hole 12). **The in-scope check binds
`assignedUnitIds` only** — a context unit is by definition a unit from somewhere else, and checking it
against this scope would reject exactly the case it exists for.


### What the server checks when a plan is submitted
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


### What to assert

The two the list singles out, first: `payload.units[]` 1:1 with `assignedUnitIds` catches a dropped
terminal AT WRITE TIME; and an assigned unit out of scope is refused while a CONTEXT unit out of scope
is allowed. Then the two the phase order added: a batch whose pieces name two different `step` values
is refused, and an `adversarial` piece whose `baselineFor` names a piece in the same batch or a later
one is refused.

---

## 1C — three fields on a work item, and what an observation is

```
OWNS      the quest work-item contract: `step`, `observations[]`, optional `pieceId`,
          optional `payload`
          the observation contract — { unitId, mark, evidence, toSettle?, at }
          the unit-id contract, including the `offmap:<family>` shape
          every stub these need
NO TOUCH  the three sign-off fields on observables, nodes and edges. Wave 5 retires them,
          and they must keep working until it does
          any of the 77 readers of quest.workItems — this is three ADDED fields, and
          nothing existing changes shape
DONE      a quest.json holding the new fields round-trips, and one holding none still
          parses. `toSettle` is REQUIRED when the mark is `cant-meet` and refused otherwise
WARD      npm run ward -- -- <your paths>
```

### The three marks, which replace a two-verdict model

| Mark | Means | What the orchestrator does |
|---|---|---|
| `met` | proved, with evidence | nothing — settled |
| `cant-meet` | genuinely unsettleable at this layer, with what would settle it | nothing — settled as unsettleable |
| `unmet` | not done | mint a fresh session scoped to exactly these units |

**`unmet` is the whole loop.** A worker running low on context marks its remainder `unmet` and signals;
the orchestrator mints part two carrying only those units. A reviewer that rejects three units marks
those three `unmet`; the orchestrator mints a worker carrying only those three. Same mechanism,
opposite directions, no special case for either.

**"Unit", not "observable", throughout.** A unit is an observable, a terminal node, a labelled edge, or
an off-map probe family. Terminals sign on the node and branches on the edge, so a record keyed by
observable would lose two whole kinds silently. An off-map family hangs on no node and no edge, which
is why it needs the id shape `offmap:<family>` — `offmap:hostile-input`, `offmap:perf`.

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


### What to assert

The key is `unitId`, never `observableId`. Then the freeze rule: a work item's observation set is its
own, one entry per assigned unit, and no write to one work item's set ever touches another's. Then the
state rule, with a case that fails under the naive reading: work item 1 marks `obs-3` met; work item 2
is assigned `obs-7` only and marks it unmet; `obs-3` is still met, because work item 1 is still the
most recent work item ASSIGNED it.

---

## Why the work-item contract opens rather than closing

Prompts get swapped in and out, so a `quest.json` holding a work item whose step no longer exists must
still **load**. Step ids become free branded strings, not enum members, and `agentPromptNameContract`
stops closing the set. Dispatch is where an unknown step fails — loudly, naming the step and the
family. Families keep their enum: the stable layer stays closed, the volatile layer opens.

`roleToPromptTemplateTransformer` and its `const exhaustiveCheck: never` are deleted; everything
resolves through `agentNameToPromptTransformer`. The two return byte-identical templates today and
agree only by construction.

---


---

## What wave 1 must NOT do

| | Why |
|---|---|
| wire anything | wave 4's job. A wave-1 worker that rewires a caller breaks the tree for waves 2 and 3 |
| delete `questTypeRegistryStatics` | its callers are still live. The new statics sits beside it |
| write a prompt | wave 6, and not before wave 3 settles what a session's first call returns |
| touch `signoffTrackEligibilityStatics` | wave 5 — and the SCOPING half of it survives, so it is not a simple delete |
