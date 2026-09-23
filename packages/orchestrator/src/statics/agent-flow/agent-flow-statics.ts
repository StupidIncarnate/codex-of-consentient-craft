/**
 * PURPOSE: The step graph inside each agent family — every step a family can run, which dispatcher
 * runs it, and where each of the four outcome words sends the operation next. Reach for this when
 * the question is what happens INSIDE one family; the family graph answers what happens between
 * them, and `roleToModelStatics` answers only which model a relay ROLE spawns at.
 *
 * USAGE:
 * agentFlowStatics.codeweaver.entry;
 * // Returns 'plan' — the step a freshly minted codeweaver scope starts at
 * agentFlowStatics.siegemaster.steps.happyWalk.routes.done;
 * // Returns 'adversarial' — the phase edge an antagonist's baseline depends on
 * agentFlowStatics.flowrider.steps.work.maxConcurrent;
 * // Returns the browser-walk cap; no other step declares one
 * agentFlowStatics.wardFull.steps.gate.args;
 * // Returns [] — a bare ward over the whole monorepo, not one branch
 *
 * EVERY STEP DECLARES A `role`, so the router never needs to know it is looking at codeweaver
 * rather than siegemaster. A `planner` is assigned no units; a `worker` gets the ones its piece
 * assigns; a `reviewer` gets its scope's WHOLE in-scope set. A reviewer has no piece — a planner
 * cuts worker pieces, not review pieces — so the in-scope set IS its assignment, which is what
 * makes the signal gate and the in-scope gate the same check and what makes a reviewer's `met`
 * supersede a worker's. A `kind: 'deterministic'` step sits outside the unit gate entirely: it runs
 * code, carries no units and has nothing to mark, and its outcome is its handler's exit code
 * classified into one of the four words. It still declares a `role` so the router knows which side
 * of the pair it sits on.
 *
 * `routes.done` IS THE FORWARD EDGE ONLY, AND THE RETURN EDGE IS AUTOMATIC. A work item minted by
 * another step's `unmet` returns to the step that minted it, because the router created it and
 * knows which that was. So a step that is only ever mark-minted declares no `done` route at all,
 * and an undeclared outcome returns to its minter rather than stalling — which is what lets
 * `recipe` declare `{ wall: '@blocked' }` alone and still be complete, whether it wrote something
 * (`done`) or found the seeds already there (`empty`). Two targets are not step names: `@done`
 * completes the operation item, `@blocked` halts the quest for a human.
 *
 * A STEP'S `done` FIRES ONCE EVERY PIECE AT THAT STEP HAS DRAINED, so the step chain IS the phase
 * order. Siege is why that is a rule rather than an accident: an antagonist compares against a
 * BASELINE — the happy walk's instance id and run id for the path it is attacking — and a baseline
 * taken after the attack is not one. Under a phase route that id exists by the time the router
 * mints the adversarial piece, so the rule needs no prompt behind it.
 *
 * THE FOUR OUTCOME WORDS ORDER WORST FIRST — `wall` > `unmet` > `done` > `empty` — which is how a
 * parallel batch folds to one outcome, per step. `empty` means nothing was in scope to act on,
 * never "there was work and I chose to cut none": a planner holding units and cutting no work
 * declares `done` and marks each one `cant-meet` with a `toSettle`.
 *
 * `maxVisits` IS A CEILING ON A COUNT NOTHING STORES. It is derived where the router is about to
 * mint — the work items on this scope whose `step` equals this step's key — so no visit counter
 * field exists on the work item and none is to be added. Every other budget here is counted the
 * same way; `slotManagerStatics` says so at `riftcarver.maxRetries`. This file declares the ceiling
 * and nothing else: enforcement is the router's.
 *
 * `mintableOnRequest`, `needsLane` AND `maxConcurrent` EACH HAVE EXACTLY ONE READER, and a field
 * nobody reads silently means nothing. The first tells the reachability check that a step nothing
 * routes to is still reachable, because a running session asks for it. The second means the ROUTER
 * starts a siegelense instance before dispatching that work item and kills it when the item
 * records; the step declares no number, because how many may run at once is measured off
 * `siegelense capacity` rather than guessed. The third is a machine-load cap, counted over pieces
 * carrying a `browser` unit.
 *
 * NO ZOD CONTRACT VALIDATES THIS FILE, AND NONE IS TO BE ADDED. Three things hold the shape: the
 * `as const`, the colocated pin test, and the graph checker that walks these routes. A contract
 * would be a fourth copy of the same facts and the one most likely to drift. The only type exported
 * is `keyof typeof agentFlowStatics`; `as const` already gives every reader the exact literal type
 * of every step.
 *
 * SPREAD ORDER IS LOAD-BEARING WHERE `CLOSE_OUT` IS OVERRIDDEN. `{ ...CLOSE_OUT, ward: {…} }` and
 * `{ ward: {…}, ...CLOSE_OUT }` are both legal TypeScript, and neither the compiler nor
 * `no-dupe-keys` reports the wrong one — a spread beside an explicit key is not a duplicate key.
 * The later entry wins, and siegemaster depends on it.
 */

const CLOSE_OUT = {
  commit: {
    role: 'worker',
    kind: 'deterministic',
    handler: 'commit',
    maxVisits: 3,
    // `empty` is a clean tree: every piece marked `cant-meet`, or a review-only pass.
    // It still wards — the branch may be red from an earlier scope.
    routes: { done: 'ward', empty: 'ward', wall: '@blocked' },
  },
  ward: {
    role: 'reviewer',
    kind: 'deterministic',
    handler: 'ward',
    args: ['--committed', '--uncommitted'],
    maxVisits: 3,
    // `empty` is a 0-file scope: green by exit code, but nothing was graded.
    // `wall` is a CRASH — ward never reported on the code, so a spiritmender has nothing
    // to fix and the next run crashes the same way. step-handler-ward-broker.ts classifies
    // ward's exit code 2 as `wall` for exactly that reason, and the `@blocked` route here is
    // what keeps a repair step from ever being dispatched into it.
    routes: { done: '@done', empty: '@done', unmet: 'repair', wall: '@blocked' },
  },
  repair: {
    role: 'worker',
    kind: 'prompt',
    prompt: 'spiritmender',
    model: 'sonnet',
    maxVisits: 3,
    routes: { unmet: 'repair', wall: '@blocked' },
  },
} as const;

export const agentFlowStatics = {
  codeweaver: {
    entry: 'plan',
    steps: {
      plan: {
        role: 'planner',
        kind: 'prompt',
        prompt: 'codeweaver-planner',
        model: 'opus',
        maxVisits: 5,
        routes: { done: 'work', empty: '@done', wall: '@blocked' },
      },
      work: {
        role: 'worker',
        kind: 'prompt',
        prompt: 'codeweaver-worker',
        model: 'sonnet',
        maxVisits: 40,
        routes: { done: 'review', unmet: 'work', wall: '@blocked' },
      },
      review: {
        role: 'reviewer',
        kind: 'prompt',
        prompt: 'codeweaver-reviewer',
        model: 'opus',
        maxVisits: 10,
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
        role: 'planner',
        kind: 'prompt',
        prompt: 'recipe-maker',
        model: 'opus',
        maxVisits: 5,
        mintableOnRequest: true,
        routes: { wall: '@blocked' },
      },
      plan: {
        role: 'planner',
        kind: 'prompt',
        prompt: 'flowrider-planner',
        model: 'opus',
        maxVisits: 5,
        routes: { done: 'work', empty: '@done', wall: '@blocked' },
      },
      work: {
        role: 'worker',
        kind: 'prompt',
        prompt: 'flowrider-worker',
        model: 'sonnet',
        maxVisits: 40,
        // A browser walk boots Playwright through ward — NOT a siegelense lane, so this is
        // a different budget from the siege walkers' and capacity cannot see it. Four at
        // once is a machine-load cap, not a correctness one: ward gives each run its own
        // port pair and its own report path. Counted over pieces carrying a `browser` unit.
        maxConcurrent: { limit: 4, counts: 'browser-pieces' },
        routes: { done: 'review', unmet: 'work', wall: '@blocked' },
      },
      review: {
        role: 'reviewer',
        kind: 'prompt',
        prompt: 'flowrider-reviewer',
        model: 'opus',
        maxVisits: 10,
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
        role: 'worker',
        kind: 'deterministic',
        handler: 'cleanup',
        maxVisits: 3,
        routes: { done: 'plan', empty: 'plan', wall: '@blocked' },
      },
      // The same prompt flowrider uses, requested the same way. A recipe is flow-scoped,
      // not family-scoped, so whichever family asks first authors it and the other reuses it.
      recipe: {
        role: 'planner',
        kind: 'prompt',
        prompt: 'recipe-maker',
        model: 'opus',
        maxVisits: 5,
        mintableOnRequest: true,
        routes: { wall: '@blocked' },
      },
      // Opens source files so no walker has to, and returns configured values with
      // file:line. Requested by the planner up front and by a walker mid-pass — both
      // cadences — so it is on-request. Holds no lane, so no cap.
      read: {
        role: 'worker',
        kind: 'prompt',
        prompt: 'siegemaster-reader',
        model: 'sonnet',
        maxVisits: 10,
        mintableOnRequest: true,
        routes: { wall: '@blocked' },
      },
      plan: {
        role: 'planner',
        kind: 'prompt',
        prompt: 'siege-planner',
        model: 'opus',
        maxVisits: 5,
        routes: { done: 'happyWalk', empty: 'sweepOut', wall: '@blocked' },
      },
      // Each walker has its OWN fixer, and each fixer routes back to the walker that
      // found the work. One shared fixer sent every adversarial finding back to the
      // happy walk, which never measured it.
      //
      // happyWalk → adversarial is the PHASE ORDER, and it is a route rather than a
      // rule in a prompt. Every happy piece drains before the first attack starts, so
      // an antagonist's baseline — the happy run id for the path it is attacking —
      // exists by the time the router mints it.
      happyWalk: {
        role: 'reviewer',
        kind: 'prompt',
        prompt: 'siege-happy-walker',
        model: 'sonnet',
        maxVisits: 40,
        // A lane IS a siegelense instance. How many may run at once is measured, not
        // declared, and the ROUTER starts and stops them. Both walkers draw on the one pool.
        needsLane: true,
        routes: { done: 'adversarial', empty: 'adversarial', unmet: 'fixHappy', wall: '@blocked' },
      },
      // No `done` route — mark-minted, so `done` returns to the walker that minted it.
      fixHappy: {
        role: 'worker',
        kind: 'prompt',
        prompt: 'siege-happy-fixer',
        model: 'sonnet',
        maxVisits: 40,
        routes: { unmet: 'fixHappy', wall: '@blocked' },
      },
      adversarial: {
        role: 'reviewer',
        kind: 'prompt',
        prompt: 'siege-adversarial-walker',
        model: 'sonnet',
        maxVisits: 40,
        needsLane: true,
        routes: { done: 'commit', empty: 'commit', unmet: 'fixAdversarial', wall: '@blocked' },
      },
      fixAdversarial: {
        role: 'worker',
        kind: 'prompt',
        prompt: 'siege-adversarial-fixer',
        model: 'sonnet',
        maxVisits: 40,
        routes: { unmet: 'fixAdversarial', wall: '@blocked' },
      },
      ...CLOSE_OUT,
      // Siege OVERRIDES CLOSE_OUT's ward endpoint: the pass is not over until the
      // instances are swept. Spread order matters — this entry has to come after
      // the spread, or the shared one wins.
      ward: {
        ...CLOSE_OUT.ward,
        routes: { done: 'sweepOut', empty: 'sweepOut', unmet: 'repair', wall: '@blocked' },
      },
      sweepOut: {
        role: 'worker',
        kind: 'deterministic',
        handler: 'cleanup',
        maxVisits: 3,
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
        role: 'reviewer',
        kind: 'deterministic',
        handler: 'ward',
        args: [],
        maxVisits: 3,
        routes: { done: '@done', empty: '@done', unmet: 'repair', wall: '@blocked' },
      },
      // A repair here writes code, and this graph has no CLOSE_OUT, so it needs its own
      // commit. Without one the quest reaches @complete with the fix uncommitted, and
      // warpgate's `git merge --squash` drops it.
      repair: {
        role: 'worker',
        kind: 'prompt',
        prompt: 'spiritmender',
        model: 'sonnet',
        maxVisits: 3,
        routes: { done: 'commit', unmet: 'repair', wall: '@blocked' },
      },
      commit: {
        role: 'worker',
        kind: 'deterministic',
        handler: 'commit',
        maxVisits: 3,
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
        role: 'reviewer',
        kind: 'deterministic',
        handler: 'riftcarver',
        args: [],
        maxVisits: 3,
        routes: { done: '@done', unmet: 'repair', wall: '@blocked' },
      },
      // Same reason as wardFull's: a repair writes code and this graph has no CLOSE_OUT.
      repair: {
        role: 'worker',
        kind: 'prompt',
        prompt: 'spiritmender',
        model: 'sonnet',
        maxVisits: 3,
        routes: { done: 'commit', unmet: 'repair', wall: '@blocked' },
      },
      commit: {
        role: 'worker',
        kind: 'deterministic',
        handler: 'commit',
        maxVisits: 3,
        routes: { done: 'carve', empty: 'carve', wall: '@blocked' },
      },
    },
  },

  warpgate: {
    entry: 'merge',
    steps: {
      merge: {
        role: 'worker',
        kind: 'prompt',
        prompt: 'warpgate',
        model: 'opus',
        maxVisits: 3,
        routes: { done: '@done', unmet: 'merge', wall: '@blocked' },
      },
    },
  },
} as const;

export type AgentFamilyName = keyof typeof agentFlowStatics;
