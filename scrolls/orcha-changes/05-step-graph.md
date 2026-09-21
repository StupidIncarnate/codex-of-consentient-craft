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

| New file | |
|---|---|
| `packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts` | the config |
| `packages/orchestrator/src/statics/agent-flow/agent-flow-statics.test.ts` | colocated, required. `statics/` needs no proxy file |

### What `statics/` demands here, before you write a line

| Rule | Here |
|---|---|
| `statics/<domain>/<domain>-statics.ts`, one level deep, with a colocated `-statics.test.ts` | the two paths above |
| PURPOSE + USAGE JSDoc **above the imports**, never above the export | copy the voice of `signoff-track-eligibility-statics.ts:1–30` — the closest thing in the repo, a structured config whose header explains each entry as a decision rather than restating the keys |
| one export, `as const`, no conditionals, no primitives at the ROOT | every root key here is a family object, so `enforce-grouped-statics` is satisfied |
| a module-level `const` spread in but never exported is allowed | `packages/config/src/statics/framework-presets-data/framework-presets-data-statics.ts:11` declares `const FRONTEND_BASE_PRESET`, `:107` spreads it. `CLOSE_OUT` is that exact shape and passes the same lint |

**No zod contract validates this file, and none is to be added.** Every statics file in this repo is a
bare `as const` — `roleToModelStatics`, `slotManagerStatics`, `wardCommandStatics` and
`signoffTrackEligibilityStatics` all are. Three things hold the shape instead: `as const`, the
colocated pin test, and story 06's checker. A contract would be a fourth copy of the same facts and
the one most likely to drift.

**The only type this file exports is derived from the literal.**
`export type AgentFamilyName = keyof typeof agentFlowStatics;` — precedent
`packages/orchestrator/src/statics/smoketest-prompts/smoketest-prompts-statics.ts:77`,
`export type SmoketestPromptName = keyof typeof smoketestPromptsStatics;`. Do not hand-write a
`StepDefinition` interface: `statics/` forbids inline types, and `as const` already gives every
reader the exact literal type of every step.

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
    // `wall` is a CRASH — ward never reported on the code, so a spiritmender has nothing
    // to fix and the next run crashes the same way. quest-run-ward-broker.ts:249-253
    // already blocks on it today, for that reason.
    routes: { done: '@done', empty: '@done', unmet: 'repair', wall: '@blocked' },
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
      // Same four outcomes as the family gate, crash included.
      gate: {
        role: 'reviewer', kind: 'deterministic', handler: 'ward', args: [], maxVisits: 3,
        routes: { done: '@done', empty: '@done', unmet: 'repair', wall: '@blocked' },
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
} as const;

export type AgentFamilyName = keyof typeof agentFlowStatics;
```

---

## Every field, and who reads it

Nothing outside this table may appear on a step. Each field has exactly one reader, and a field
nobody reads is a field that silently means nothing.

| Field | Shape | Declared on | Read by |
|---|---|---|---|
| `entry` | a key of the same family's `steps` | every family | story 22, when a scope is first minted |
| `steps` | a record keyed by STEP NAME — free-form, since `stepNameContract` (story 02) is a branded string and not an enum | every family | all of them |
| `role` | `'planner' \| 'worker' \| 'reviewer'` | every step, deterministic ones included | story 12 (which units the step is assigned), story 13 (how its outcome derives) |
| `kind` | `'prompt' \| 'deterministic'` | every step | story 13 — a deterministic step is outside the unit gate; story 22 — which dispatcher runs it |
| `prompt` | a name `agentPromptNameContract` accepts. Story 03 opened that to any non-empty string, so a typo PARSES and only story 06 catches it | `kind: 'prompt'` only | story 22, through `agentNameToPromptTransformer` |
| `handler` | one of `commit` · `ward` · `riftcarver` · `cleanup` | `kind: 'deterministic'` only | story 20 |
| `model` | `'opus' \| 'sonnet'` | `kind: 'prompt'` only | story 22 → the CLI `--model` flag |
| `args` | `string[]`, passed VERBATIM | `ward` and `riftcarver` steps. `commit` and `cleanup` declare none | story 20 |
| `routes` | a PARTIAL map of the four outcome words to a step key, `@done`, or `@blocked`. A step may declare none of `done` / `empty` | every step | story 15 |
| `maxVisits` | positive integer | every step | story 15 — see below |
| `mintableOnRequest` | `true`, or absent | `recipe`, `read` | story 06 (reachability), story 17 (which steps a `request` payload may name) |
| `needsLane` | `true`, or absent | `happyWalk`, `adversarial` | story 23 |
| `maxConcurrent` | `{ limit: number, counts: 'browser-pieces' }` | flowrider's `work`, and nothing else | story 15. A piece is a browser walk iff any of its units has `layer: 'browser'` |

**`mintableOnRequest` and `needsLane` carry weight that is easy to miss.** The first tells story 06's
reachability check that a step nothing routes to is still reachable — a running session asks for it.
The second means the ROUTER starts a siegelense instance before dispatching that work item and kills
it when the item records; the step declares no number, because how many may run at once is measured
off `siegelense capacity` rather than guessed (story 23).

---

## `maxVisits` is a ceiling on a count NOTHING STORES — settled here

This is the one field in the config that names state, and that state is not a field anywhere in the
chain. Story 02 adds four work-item fields — `step`, `observations`, `pieceId`, `payload` — and no
counter. **That is correct. Do not add one, and do not ask story 02 to.**

**The count is DERIVED, at the moment the router is about to mint:**

> the number of work items on this SCOPE — the ones whose `relatedDataItems` holds this operation
> item's `operations/<id>` ref — whose `step` equals this step's key.

Both halves already exist. `relatedDataItems` is how a work item names its scope today
(`packages/shared/src/contracts/work-item/work-item-contract.ts:35–40` states the ref and the
strict-1:1 invariant story 22 retires), and `step` is exactly what story 02 puts beside it. So a
visit count is a filter over a ledger the router is reading anyway.

**Every other budget in this repo is counted the same way**, which is why deriving is the convention
rather than a shortcut. `packages/orchestrator/src/statics/slot-manager/slot-manager-statics.ts` says
so at `riftcarver.maxRetries`: *"the chain is counted from the ledger's own role-filtered history
rather than from one item's pt continuations."*

**This story declares the ceiling and nothing else.** Enforcement is story 15's — its `DONE WHEN`
already carries *"`maxVisits` exhaustion blocks, naming the step"*.

---

## Every `prompt:` above, checked against the tree

`agentNameToPromptTransformer`
(`packages/orchestrator/src/transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.ts:46–95`)
is the table that resolves a name, and `agentPromptClassificationStatics.promptNames` is the roster
behind it. **Four of the fifteen names in this config resolve today. Eleven are story 25's.**

| `prompt:` | Today | Story 25 |
|---|---|---|
| `codeweaver-planner` | — | 25a, NEW |
| `codeweaver-worker` | — | 25b, NEW |
| `codeweaver-reviewer` | **exists** — `statics/codeweaver-reviewer/`, served at sonnet | 25c, REWRITTEN |
| `flowrider-planner` | — | 25d, NEW |
| `flowrider-worker` | — | 25e, NEW |
| `flowrider-reviewer` | **exists** — `statics/flowrider-reviewer/`, served at sonnet | 25f, REWRITTEN |
| `siege-planner` | — | 25g, NEW |
| `siege-happy-walker` | — | 25h, ADAPTED from `statics/siegemaster-verifier/` |
| `siege-adversarial-walker` | — | 25i, ADAPTED from `statics/siegemaster-stress/` |
| `siege-happy-fixer` | — | 25j, NEW |
| `siege-adversarial-fixer` | — | 25k, NEW |
| `recipe-maker` | — | 25l, NEW |
| `siegemaster-reader` | — | 25m, NEW |
| `spiritmender` | **exists** — `statics/spiritmender-prompt/`, served at sonnet | 25n, REWRITTEN |
| `warpgate` | **exists** — `statics/warpgate-prompt/`, served at opus | 25o, REWRITTEN |

**A name story 25 has not written yet is not a failure of THIS story**, because nothing here
dispatches. Story 06's rule 8 is what turns a dangling name into a red, and it lands after this one.
Registering a name in `agentPromptClassificationStatics` is story 25q's and not yours.

**The `model:` values above deliberately disagree with what two of those four are served at today.**
`codeweaver-reviewer` and `flowrider-reviewer` are sonnet MINIONS today
(`agent-name-to-prompt-transformer.ts:56–59` and `:65–68`) and are `model: 'opus'` reviewer STEPS
here. A reviewer is now a dispatched session assigned its scope's whole in-scope set, which is the
same reasoning `roleToModelStatics` gives for the operator roles — *"it plans what it hands out,
judges what comes back against the files it opened, and decides whether its scope is done"*. Do not
"correct" them back to sonnet.

`OPEN` — **`warpgate`'s model.** This config says `opus`, matching `roleToModelStatics.warpgate`
today; story 25's own table row 25o says `sonnet`. They cannot both stand. This story holds `opus`
until the epic author rules otherwise; whoever writes 25o must not silently pick the other.

---

## Every `handler:` above — story 20 builds these four and no others

| `handler:` | Steps declaring it | `args` |
|---|---|---|
| `commit` | `CLOSE_OUT.commit`, `wardFull.commit`, `riftcarver.commit` | none |
| `ward` | `CLOSE_OUT.ward` (and siegemaster's override of it), `wardFull.gate` | `['--committed', '--uncommitted']` on the family gates; `[]` on `wardFull.gate` |
| `riftcarver` | `riftcarver.carve` | `[]` |
| `cleanup` | `siegemaster.sweepIn`, `siegemaster.sweepOut` | none |

That is exactly story 20's set. **A fifth handler name in this config is a bug in this config**, not
a request to story 20.

---

## The spread override, and the two ways to get it wrong

`{ ...CLOSE_OUT, ward: { … } }` is legal TypeScript. So is `{ ward: { … }, ...CLOSE_OUT }`.
**Neither the compiler nor `no-dupe-keys` reports either** — a spread beside an explicit key is not a
duplicate key. The later entry wins, and that is the whole mechanism.

The pattern already lives in a statics file here and passes lint today:
`packages/config/src/statics/framework-presets-data/framework-presets-data-statics.ts:162–168`
spreads `FRONTEND_BASE_PRESET` and then overrides four of its keys.

| Mistake | What ships |
|---|---|
| the `ward` entry placed BEFORE `...CLOSE_OUT` | the shared `ward` wins, siegemaster routes `done: '@done'`, `sweepOut` never runs, and every siege pass leaks siegelense instances |
| the override written as a whole fresh entry instead of `...CLOSE_OUT.ward` plus `routes` | `handler`, `args` and `maxVisits` drift from the shared trio — the exact thing `CLOSE_OUT` exists to prevent |

So assert the RESOLVED value, and assert the shared one in the SAME test. A single assertion on
siegemaster's `ward` passes just as happily when `CLOSE_OUT` was never spread at all:

```ts
expect(agentFlowStatics.siegemaster.steps.ward.routes.done).toBe('sweepOut');
expect(agentFlowStatics.codeweaver.steps.ward.routes.done).toBe('@done');
expect(agentFlowStatics.siegemaster.steps.ward.args).toStrictEqual(['--committed', '--uncommitted']);
expect(agentFlowStatics.siegemaster.steps.repair.prompt).toBe('spiritmender');
```

---

## How every step is reached — the answer story 06 must find

Story 06 walks these graphs and flags a step nothing reaches. Stating the expected answer here is
what makes a failure there a finding about the CONFIG rather than about the checker.

**Reachability.** Every step in all six graphs is reached by some route from its family's `entry` —
`unmet` and `wall` routes count, not just `done`. The only exceptions are `recipe` (flowrider and
siegemaster) and `read` (siegemaster), both of which declare `mintableOnRequest`. **There is no
other exemption and none is to be added.** `adversarial` in particular needs no flag: `happyWalk`
routes to it.

**Steps that declare no `done` route.** Five, and each must be reached only by an `unmet` route or by
a request, because an undeclared outcome returns to the minter and only those two have one:

| Step | Its only inbound |
|---|---|
| `CLOSE_OUT.repair` (all three code-changing families) | `ward`'s `unmet` |
| `siegemaster.fixHappy` | `happyWalk`'s `unmet` |
| `siegemaster.fixAdversarial` | `adversarial`'s `unmet` |
| `recipe` (flowrider, siegemaster) | a request |
| `read` (siegemaster) | a request |

**`wardFull.repair` and `riftcarver.repair` DO declare `done: 'commit'`, and must keep it.** Those
two graphs get no `CLOSE_OUT`, so nothing else commits the fix — and the commit routes back to the
gate that sent the repair, so the fix is re-graded rather than assumed.

---

## DONE WHEN

`npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts packages/orchestrator/src/statics/agent-flow/agent-flow-statics.test.ts`
exits 0, and:

| Assert | |
|---|---|
| `agent-flow-statics.test.ts` pins the WHOLE object with one `toStrictEqual` | a change to a graph should be a visible diff on a test, not a silent edit. `role-to-model-statics.test.ts` is the shape: one whole-object pin, then one `VALID:`-prefixed test per property worth stating in its own right |
| the family keys are exactly `codeweaver`, `flowrider`, `siegemaster`, `wardFull`, `riftcarver`, `warpgate` | |
| **`CLOSE_OUT` resolves into exactly `codeweaver`, `flowrider` and `siegemaster`** — assert each holds a `repair` step whose `prompt` is `spiritmender` and that `wardFull`, `riftcarver` and `warpgate` do not | this is the gap that produced two of the config's comments |
| `agentFlowStatics.wardFull.steps.commit.routes.done === 'gate'` and `agentFlowStatics.riftcarver.steps.commit.routes.done === 'carve'` | `riftcarver` and `wardFull` run a `repair` and get no `CLOSE_OUT`, so each needs its OWN `commit`, routed back to its own gate — otherwise a spiritmender's fix reaches `@complete` uncommitted and `warpgate`'s `git merge --squash` drops it |
| **the four assertions in "The spread override" above, in ONE test** | any one of them alone passes when `CLOSE_OUT` was never spread |
| `agentFlowStatics.siegemaster.steps.happyWalk.routes.done === 'adversarial'` | that route IS the two-phase rule. Point it at `commit` and the antagonist has no baseline |
| every `prompt:` value appears in the story-25 table above, and the four marked **exists** resolve through `agentNameToPromptTransformer` today | a dangling prompt is a step that dispatches against nothing |
| every `handler:` value is one of `commit` / `ward` / `riftcarver` / `cleanup` | |
| exactly `recipe` and `read` carry `mintableOnRequest`; exactly `happyWalk` and `adversarial` carry `needsLane`; exactly `flowrider.work` carries `maxConcurrent` | each of the three has a reader in a later story, and a fourth step carrying one silently changes that story's behaviour |
| every step carries `maxVisits`, and every value is a positive integer | story 06's rule 6 needs one on every cycle; declaring it on every step is cheaper than proving which steps sit on one |
| no step carries a key outside "Every field, and who reads it" | |
| the exported type is `keyof typeof agentFlowStatics` and nothing hand-written | `statics/` forbids inline types |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| write the reachability check | story 06 |
| write any prompt | story 25 |
| register a prompt name in `agentPromptClassificationStatics` or `agentNameToPromptTransformer` | story 25q, and it goes last |
| write any handler | story 20 |
| wire this to dispatch | story 22 |
| add a zod contract for a step | nothing. Statics here are `as const` plus a colocated pin test — see the convention table under BUILD |
| add a visit COUNTER to the work item | nothing. The count is derived; story 02's four fields are complete |
| add a `"./statics"` export subpath to `packages/orchestrator/package.json` | story 06. It is the caller that needs to reach this file from another package, and its `OPEN` carries the decision |
| touch `roleToModelStatics` or delete `questTypeRegistryStatics` | story 24 |
