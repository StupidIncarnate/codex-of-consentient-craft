import { GraphReachabilityBootFlow } from './graph-reachability-boot-flow';

describe('GraphReachabilityBootFlow', () => {
  describe('wiring to the responder, over the real graphs', () => {
    // Real data, no mocking: agentFlowStatics currently carries the story-25-pending dangling
    // prompts pinned in graph-reachability-check-broker.test.ts. This proves the flow reaches the
    // responder and the responder reaches the real broker — not that the graph is clean, which
    // is the broker's own test's job.
    it('ERROR: {the real graphs} => throws naming a dangling prompt', () => {
      expect(() => GraphReachabilityBootFlow()).toThrow(/codeweaver-planner/u);
    });
  });
});
