import { GraphReachabilityCheckResponder } from './graph-reachability-check-responder';
import { GraphReachabilityCheckResponderProxy } from './graph-reachability-check-responder.proxy';

describe('GraphReachabilityCheckResponder', () => {
  describe('a clean graph', () => {
    it('VALID: {no violations} => returns undefined', () => {
      const proxy = GraphReachabilityCheckResponderProxy();
      proxy.setupClean();

      const check: () => unknown = GraphReachabilityCheckResponder;

      expect(check()).toBe(undefined);
    });
  });

  describe('a bad graph', () => {
    it('ERROR: {one violation} => throws with that exact message, verbatim', () => {
      const proxy = GraphReachabilityCheckResponderProxy();
      const message = "Step 'orphan' in the 'test' graph is reached by no route from 'plan'.";
      proxy.setupViolation({ message });

      expect(() => {
        GraphReachabilityCheckResponder();
      }).toThrow(new Error(message));
    });
  });
});
