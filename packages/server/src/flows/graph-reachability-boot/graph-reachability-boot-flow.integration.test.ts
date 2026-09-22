import { GraphReachabilityBootFlow } from './graph-reachability-boot-flow';

describe('GraphReachabilityBootFlow', () => {
  describe('wiring to the responder, over the real graphs', () => {
    // Real data, no mocking: with Story 25 complete, all step prompts are registered and the
    // real graphs carry zero reachability violations. This proves the flow reaches the responder,
    // which reaches the real broker and completes cleanly.
    it('VALID: {the real graphs} => completes successfully with { success: true }', () => {
      const result = GraphReachabilityBootFlow();

      expect(result).toStrictEqual({ success: true });
    });
  });
});
