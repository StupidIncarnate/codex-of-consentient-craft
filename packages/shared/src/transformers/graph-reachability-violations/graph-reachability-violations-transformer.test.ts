import { graphReachabilityViolationsTransformer } from './graph-reachability-violations-transformer';
import { RoutedGraphStub } from '../../contracts/routed-graph/routed-graph.stub';
import { questFlowStatics } from '@dungeonmaster/shared/statics';

const STEP_TERMINALS = ['@done', '@blocked'];
const FAMILY_TERMINALS = ['@complete', '@blocked'];

describe('graphReachabilityViolationsTransformer', () => {
  describe('rule 1: reachability from entry', () => {
    it('INVALID: {a step nothing routes to} => names the orphan step', () => {
      const graph = RoutedGraphStub({
        graphName: 'reach-graph',
        entry: 'plan',
        nodes: {
          plan: { routes: { done: '@done' } },
          orphan: { routes: { done: '@done' } },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: STEP_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([
        "Step 'orphan' in the 'reach-graph' graph is reached by no route from 'plan'. Route something to it, or declare mintableOnRequest: true if a running session asks for it. A step nothing reaches is a prompt that is never dispatched, and the quest that needed it stalls with no error.",
      ]);
    });
  });

  describe('rule 2: every step reaches a terminal', () => {
    it('INVALID: {a cycle with no route to a terminal} => names every step on it', () => {
      const graph = RoutedGraphStub({
        graphName: 'stall-graph',
        entry: 'alpha',
        nodes: {
          alpha: { routes: { unmet: 'beta' }, maxVisits: 1 },
          beta: { routes: { unmet: 'alpha' }, maxVisits: 1 },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: STEP_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([
        "Step 'alpha' in the 'stall-graph' graph reaches no terminal — every path out of it returns to a step already on the path. Give some step on that cycle a route to '@done' or '@blocked', or the quest runs forever.",
        "Step 'beta' in the 'stall-graph' graph reaches no terminal — every path out of it returns to a step already on the path. Give some step on that cycle a route to '@done' or '@blocked', or the quest runs forever.",
      ]);
    });
  });

  describe('rule 3: every route target names a real step or a terminal', () => {
    it('INVALID: {routes: {done: "revieww"}} => the message contains the typo', () => {
      const graph = RoutedGraphStub({
        graphName: 'typo-graph',
        entry: 'plan',
        nodes: {
          plan: { routes: { done: 'revieww', wall: '@blocked' } },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: STEP_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([
        "Route `done: 'revieww'` on step 'plan' in the 'typo-graph' graph names nothing. A target is a step key in the same graph, or '@done' or '@blocked'. This is the typo case, and in production it is a silent stall rather than an error.",
      ]);
    });
  });

  describe('rule 4: a step with no `done` route is reached only by `unmet` or by a request', () => {
    it('INVALID: {a done-less step reached by a `done` route} => names the inbound outcome', () => {
      const graph = RoutedGraphStub({
        graphName: 'minter-graph',
        entry: 'plan',
        nodes: {
          plan: { routes: { done: 'repair', wall: '@blocked' } },
          repair: { routes: { unmet: 'repair', wall: '@blocked' }, maxVisits: 3 },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: STEP_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([
        "Step 'repair' in the 'minter-graph' graph declares no `done` route but is reached by `done` from 'plan'. A step with no forward edge returns to whoever minted it, and only an `unmet` route or a request has a minter to return to. Declare a `done` route, or drop that inbound one.",
      ]);
    });
  });

  describe('rule 5: every declared outcome word is one of the four', () => {
    it('INVALID: {routes: {pass: "x"}} => names the old vocabulary word', () => {
      const graph = RoutedGraphStub({
        graphName: 'vocabulary-graph',
        entry: 'plan',
        nodes: {
          plan: { routes: { pass: '@blocked' } },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: STEP_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([
        "`pass` is not an outcome word. Step 'plan' in the 'vocabulary-graph' graph may route `done`, `unmet`, `empty` or `wall`, and nothing else. `pass`, `green`, `rework` and `confirmed` are the vocabularies this replaced.",
      ]);
    });
  });

  describe('rule 6: a cyclic path has `maxVisits` somewhere on it', () => {
    it('INVALID: {a work <-> review cycle with maxVisits on NEITHER} => names the cycle path', () => {
      const graph = RoutedGraphStub({
        graphName: 'cycle-graph',
        entry: 'work',
        nodes: {
          work: { routes: { done: 'review' } },
          review: { routes: { unmet: 'work', done: '@done' } },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: STEP_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([
        "The cycle <work → review → work> in the 'cycle-graph' graph declares `maxVisits` on no step on it. Put one on any step in that cycle; without it nothing stops the quest re-entering it forever.",
      ]);
    });

    it('VALID: {the same cycle with maxVisits on ONE step} => passes', () => {
      const graph = RoutedGraphStub({
        graphName: 'cycle-graph',
        entry: 'work',
        nodes: {
          work: { routes: { done: 'review' }, maxVisits: 3 },
          review: { routes: { unmet: 'work', done: '@done' } },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: STEP_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('rule 8: every declared prompt or handler names something that exists', () => {
    it('INVALID: {prompt names nothing knownPrompts serves} => names the dangling prompt', () => {
      const graph = RoutedGraphStub({
        graphName: 'prompt-graph',
        entry: 'plan',
        nodes: {
          plan: { routes: { done: '@done' }, prompt: 'phantom-prompt' },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: STEP_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: ['codeweaver-planner'],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([
        "Step 'plan' in the 'prompt-graph' graph names prompt 'phantom-prompt', which nothing serves. Add it to agentPromptClassificationStatics.promptNames and to agentNameToPromptTransformer, or fix the name. A dangling prompt is a session dispatched against nothing.",
      ]);
    });

    it('INVALID: {handler names nothing knownHandlers serves} => names the dangling handler', () => {
      const graph = RoutedGraphStub({
        graphName: 'handler-graph',
        entry: 'gate',
        nodes: {
          gate: { routes: { done: '@done' }, handler: 'phantom-handler' },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: STEP_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: [],
        knownHandlers: ['commit', 'ward', 'riftcarver', 'cleanup'],
      });

      expect(result).toStrictEqual([
        "Step 'gate' in the 'handler-graph' graph names handler 'phantom-handler', which nothing serves. It must be one of commit, ward, riftcarver, cleanup, or fix the name. A dangling handler is a session dispatched against nothing.",
      ]);
    });
  });

  describe('exemptFlag is a parameter, not "either flag exempts"', () => {
    it('VALID: {node declares appendedAtMerge, checked under exemptFlag: appendedAtMerge} => exempt', () => {
      const graph = RoutedGraphStub({
        graphName: 'exempt-graph',
        entry: 'plan',
        nodes: {
          plan: { routes: { done: '@complete' } },
          warpish: { routes: { done: '@complete' }, appendedAtMerge: true },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: FAMILY_TERMINALS,
        exemptFlag: 'appendedAtMerge',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('INVALID: {the same node, checked under exemptFlag: mintableOnRequest} => not exempt', () => {
      const graph = RoutedGraphStub({
        graphName: 'exempt-graph',
        entry: 'plan',
        nodes: {
          plan: { routes: { done: '@complete' } },
          warpish: { routes: { done: '@complete' }, appendedAtMerge: true },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: FAMILY_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([
        "Step 'warpish' in the 'exempt-graph' graph is reached by no route from 'plan'. Route something to it, or declare mintableOnRequest: true if a running session asks for it. A step nothing reaches is a prompt that is never dispatched, and the quest that needed it stalls with no error.",
      ]);
    });
  });

  describe('the three legitimate exemptions', () => {
    it('VALID: {recipe and read, both mintableOnRequest with no inbound route} => pass', () => {
      const graph = RoutedGraphStub({
        graphName: 'siegemaster',
        entry: 'plan',
        nodes: {
          plan: { routes: { done: '@done' } },
          recipe: { routes: { wall: '@blocked' }, mintableOnRequest: true },
          read: { routes: { wall: '@blocked' }, mintableOnRequest: true },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: STEP_TERMINALS,
        exemptFlag: 'mintableOnRequest',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {the warpgate family, appendedAtMerge with no inbound route} => passes', () => {
      const graph = RoutedGraphStub({
        graphName: 'feature',
        entry: 'riftcarver',
        nodes: {
          riftcarver: { routes: { done: '@complete' } },
          warpgate: { routes: { done: '@complete' }, appendedAtMerge: true },
        },
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: FAMILY_TERMINALS,
        exemptFlag: 'appendedAtMerge',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('the real questFlowStatics (story 04)', () => {
    it('VALID: {the feature family graph} => zero violations', () => {
      const graph = RoutedGraphStub({
        graphName: 'feature',
        entry: questFlowStatics.feature.entry,
        nodes: questFlowStatics.feature.families,
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: FAMILY_TERMINALS,
        exemptFlag: 'appendedAtMerge',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {the bug-hunt family graph} => zero violations', () => {
      const graph = RoutedGraphStub({
        graphName: 'bug-hunt',
        entry: questFlowStatics['bug-hunt'].entry,
        nodes: questFlowStatics['bug-hunt'].families,
      });

      const result = graphReachabilityViolationsTransformer({
        graph,
        terminals: FAMILY_TERMINALS,
        exemptFlag: 'appendedAtMerge',
        knownPrompts: [],
        knownHandlers: [],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
