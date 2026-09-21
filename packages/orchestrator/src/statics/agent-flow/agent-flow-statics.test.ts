import { agentPromptClassificationStatics } from '../agent-prompt-classification/agent-prompt-classification-statics';
import { agentFlowStatics } from './agent-flow-statics';

// Each family's DETERMINISTIC steps are peeled off BY NAME, so what remains is provably
// `kind: 'prompt'` and `.prompt` reads off it with no narrowing branch. A step that changes kind
// breaks this file at COMPILE time, which is stronger than anything asserted below it.
const {
  commit: codeweaverCommit,
  ward: codeweaverWard,
  ...codeweaverPromptSteps
} = agentFlowStatics.codeweaver.steps;

const {
  commit: flowriderCommit,
  ward: flowriderWard,
  ...flowriderPromptSteps
} = agentFlowStatics.flowrider.steps;

const {
  sweepIn: siegeSweepIn,
  sweepOut: siegeSweepOut,
  commit: siegeCommit,
  ward: siegeWard,
  ...siegePromptSteps
} = agentFlowStatics.siegemaster.steps;

const {
  gate: wardFullGate,
  commit: wardFullCommit,
  ...wardFullPromptSteps
} = agentFlowStatics.wardFull.steps;

const {
  carve: riftcarverCarve,
  commit: riftcarverCommit,
  ...riftcarverPromptSteps
} = agentFlowStatics.riftcarver.steps;

const CONFIG_PROMPT_NAMES = [
  ...new Set(
    [
      ...Object.values(codeweaverPromptSteps),
      ...Object.values(flowriderPromptSteps),
      ...Object.values(siegePromptSteps),
      ...Object.values(wardFullPromptSteps),
      ...Object.values(riftcarverPromptSteps),
      ...Object.values(agentFlowStatics.warpgate.steps),
    ].map((step) => step.prompt),
  ),
].sort();

const CONFIG_HANDLER_NAMES = [
  ...new Set(
    [
      codeweaverCommit,
      codeweaverWard,
      flowriderCommit,
      flowriderWard,
      siegeSweepIn,
      siegeSweepOut,
      siegeCommit,
      siegeWard,
      wardFullGate,
      wardFullCommit,
      riftcarverCarve,
      riftcarverCommit,
    ].map((step) => step.handler),
  ),
].sort();

// Every step, FAMILY-QUALIFIED, because step names repeat across families — `work` exists in two
// graphs and only one of them carries `maxConcurrent`.
const ALL_STEP_PATHS = [
  ...Object.entries(agentFlowStatics.codeweaver.steps).map(
    ([step, definition]) => [`codeweaver.${step}`, definition] as const,
  ),
  ...Object.entries(agentFlowStatics.flowrider.steps).map(
    ([step, definition]) => [`flowrider.${step}`, definition] as const,
  ),
  ...Object.entries(agentFlowStatics.siegemaster.steps).map(
    ([step, definition]) => [`siegemaster.${step}`, definition] as const,
  ),
  ...Object.entries(agentFlowStatics.wardFull.steps).map(
    ([step, definition]) => [`wardFull.${step}`, definition] as const,
  ),
  ...Object.entries(agentFlowStatics.riftcarver.steps).map(
    ([step, definition]) => [`riftcarver.${step}`, definition] as const,
  ),
  ...Object.entries(agentFlowStatics.warpgate.steps).map(
    ([step, definition]) => [`warpgate.${step}`, definition] as const,
  ),
];

describe('agentFlowStatics', () => {
  it('VALID: exports the exact step graph of every family', () => {
    expect(agentFlowStatics).toStrictEqual({
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
          commit: {
            role: 'worker',
            kind: 'deterministic',
            handler: 'commit',
            maxVisits: 3,
            routes: { done: 'ward', empty: 'ward', wall: '@blocked' },
          },
          ward: {
            role: 'reviewer',
            kind: 'deterministic',
            handler: 'ward',
            args: ['--committed', '--uncommitted'],
            maxVisits: 3,
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
        },
      },
      flowrider: {
        entry: 'plan',
        steps: {
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
          commit: {
            role: 'worker',
            kind: 'deterministic',
            handler: 'commit',
            maxVisits: 3,
            routes: { done: 'ward', empty: 'ward', wall: '@blocked' },
          },
          ward: {
            role: 'reviewer',
            kind: 'deterministic',
            handler: 'ward',
            args: ['--committed', '--uncommitted'],
            maxVisits: 3,
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
        },
      },
      siegemaster: {
        entry: 'sweepIn',
        steps: {
          sweepIn: {
            role: 'worker',
            kind: 'deterministic',
            handler: 'cleanup',
            maxVisits: 3,
            routes: { done: 'plan', empty: 'plan', wall: '@blocked' },
          },
          recipe: {
            role: 'planner',
            kind: 'prompt',
            prompt: 'recipe-maker',
            model: 'opus',
            maxVisits: 5,
            mintableOnRequest: true,
            routes: { wall: '@blocked' },
          },
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
          happyWalk: {
            role: 'reviewer',
            kind: 'prompt',
            prompt: 'siege-happy-walker',
            model: 'sonnet',
            maxVisits: 40,
            needsLane: true,
            routes: { done: 'adversarial', unmet: 'fixHappy', wall: '@blocked' },
          },
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
            routes: { done: 'commit', unmet: 'fixAdversarial', wall: '@blocked' },
          },
          fixAdversarial: {
            role: 'worker',
            kind: 'prompt',
            prompt: 'siege-adversarial-fixer',
            model: 'sonnet',
            maxVisits: 40,
            routes: { unmet: 'fixAdversarial', wall: '@blocked' },
          },
          commit: {
            role: 'worker',
            kind: 'deterministic',
            handler: 'commit',
            maxVisits: 3,
            routes: { done: 'ward', empty: 'ward', wall: '@blocked' },
          },
          ward: {
            role: 'reviewer',
            kind: 'deterministic',
            handler: 'ward',
            args: ['--committed', '--uncommitted'],
            maxVisits: 3,
            routes: { done: 'sweepOut', empty: 'sweepOut', unmet: 'repair', wall: '@blocked' },
          },
          repair: {
            role: 'worker',
            kind: 'prompt',
            prompt: 'spiritmender',
            model: 'sonnet',
            maxVisits: 3,
            routes: { unmet: 'repair', wall: '@blocked' },
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
      wardFull: {
        entry: 'gate',
        steps: {
          gate: {
            role: 'reviewer',
            kind: 'deterministic',
            handler: 'ward',
            args: [],
            maxVisits: 3,
            routes: { done: '@done', empty: '@done', unmet: 'repair', wall: '@blocked' },
          },
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
          carve: {
            role: 'reviewer',
            kind: 'deterministic',
            handler: 'riftcarver',
            args: [],
            maxVisits: 3,
            routes: { done: '@done', unmet: 'repair', wall: '@blocked' },
          },
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
    });
  });

  it('VALID: {every family} => mints a fresh scope at its own entry step', () => {
    expect(
      Object.fromEntries(
        Object.entries(agentFlowStatics).map(([family, { entry }]) => [family, entry]),
      ),
    ).toStrictEqual({
      codeweaver: 'plan',
      flowrider: 'plan',
      siegemaster: 'sweepIn',
      wardFull: 'gate',
      riftcarver: 'carve',
      warpgate: 'merge',
    });
  });

  // CLOSE_OUT is the commit → ward → repair trio, and a family either takes the whole thing or
  // none of it. `wardFull` and `riftcarver` get none, which is exactly why each declares its OWN
  // `repair` and its OWN `commit` routed back to its own gate.
  it('VALID: {CLOSE_OUT} => reaches the three code-changing families and no others', () => {
    expect(
      Object.fromEntries(
        Object.entries(agentFlowStatics).map(([family, { steps }]) => [family, 'ward' in steps]),
      ),
    ).toStrictEqual({
      codeweaver: true,
      flowrider: true,
      siegemaster: true,
      wardFull: false,
      riftcarver: false,
      warpgate: false,
    });
  });

  // Without these two the quest reaches @complete with a spiritmender's fix uncommitted, and
  // warpgate's `git merge --squash` drops it.
  it('VALID: {the graphs with no CLOSE_OUT} => each commit routes back to its own gate', () => {
    expect({
      wardFull: agentFlowStatics.wardFull.steps.commit.routes.done,
      riftcarver: agentFlowStatics.riftcarver.steps.commit.routes.done,
    }).toStrictEqual({ wardFull: 'gate', riftcarver: 'carve' });
  });

  // FOUR FACTS IN ONE ASSERTION, deliberately. Siegemaster's `ward` alone passes just as happily
  // when CLOSE_OUT was never spread at all, and the shared `ward` alone passes when siegemaster's
  // override was placed BEFORE the spread and lost. Only the four together pin the override order
  // AND prove the override kept the shared trio's `handler`, `args` and `maxVisits`.
  it('VALID: {siegemaster ward override} => wins over the spread and keeps the shared trio', () => {
    expect({
      siegeWardDone: agentFlowStatics.siegemaster.steps.ward.routes.done,
      sharedWardDone: agentFlowStatics.codeweaver.steps.ward.routes.done,
      siegeWardArgs: agentFlowStatics.siegemaster.steps.ward.args,
      siegeRepairPrompt: agentFlowStatics.siegemaster.steps.repair.prompt,
    }).toStrictEqual({
      siegeWardDone: 'sweepOut',
      sharedWardDone: '@done',
      siegeWardArgs: ['--committed', '--uncommitted'],
      siegeRepairPrompt: 'spiritmender',
    });
  });

  // That route IS the two-phase rule. Point it at `commit` and the antagonist has no baseline.
  it('VALID: {every happy piece drained} => siegemaster routes to the adversarial phase', () => {
    expect(agentFlowStatics.siegemaster.steps.happyWalk.routes.done).toBe('adversarial');
  });

  // A dangling prompt name is a step that dispatches against nothing. Four of these resolve
  // through the served roster today; the rest are written by the prompt story, and the graph
  // checker is what turns one that never arrives into a red.
  it('VALID: {every prompt step} => names a roster prompt, four of which are served today', () => {
    expect({
      all: CONFIG_PROMPT_NAMES,
      servedToday: CONFIG_PROMPT_NAMES.filter((name) =>
        agentPromptClassificationStatics.promptNames.some((served) => served === name),
      ),
    }).toStrictEqual({
      all: [
        'codeweaver-planner',
        'codeweaver-reviewer',
        'codeweaver-worker',
        'flowrider-planner',
        'flowrider-reviewer',
        'flowrider-worker',
        'recipe-maker',
        'siege-adversarial-fixer',
        'siege-adversarial-walker',
        'siege-happy-fixer',
        'siege-happy-walker',
        'siege-planner',
        'siegemaster-reader',
        'spiritmender',
        'warpgate',
      ],
      servedToday: ['codeweaver-reviewer', 'flowrider-reviewer', 'spiritmender', 'warpgate'],
    });
  });

  // A fifth handler name here is a bug in this file, not a request to whoever builds them.
  it('VALID: {every deterministic step} => names one of the four handlers', () => {
    expect(CONFIG_HANDLER_NAMES).toStrictEqual(['cleanup', 'commit', 'riftcarver', 'ward']);
  });

  // Each of the three has exactly one reader, and a fourth step carrying one silently changes
  // that reader's behaviour.
  it('VALID: {the single-reader flags} => each is declared by exactly its own steps', () => {
    expect({
      mintableOnRequest: ALL_STEP_PATHS.filter(([, step]) => 'mintableOnRequest' in step).map(
        ([path]) => path,
      ),
      needsLane: ALL_STEP_PATHS.filter(([, step]) => 'needsLane' in step).map(([path]) => path),
      maxConcurrent: ALL_STEP_PATHS.filter(([, step]) => 'maxConcurrent' in step).map(
        ([path]) => path,
      ),
    }).toStrictEqual({
      mintableOnRequest: ['flowrider.recipe', 'siegemaster.recipe', 'siegemaster.read'],
      needsLane: ['siegemaster.happyWalk', 'siegemaster.adversarial'],
      maxConcurrent: ['flowrider.work'],
    });
  });

  // `maxVisits` is on EVERY step, which the reads above enforce at compile time — a step missing
  // it drops out of the union and `step.maxVisits` stops typechecking. What is asserted here is
  // the ladder itself: four rungs, every one a positive integer.
  it('VALID: {every step} => its maxVisits is one rung of the budget ladder', () => {
    expect(
      [...new Set(ALL_STEP_PATHS.map(([, step]) => step.maxVisits))].sort((a, b) => a - b),
    ).toStrictEqual([3, 5, 10, 40]);
  });
});
