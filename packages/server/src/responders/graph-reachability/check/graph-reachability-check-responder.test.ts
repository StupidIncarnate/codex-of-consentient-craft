import { GraphReachabilityCheckResponder } from './graph-reachability-check-responder';
import { GraphReachabilityCheckResponderProxy } from './graph-reachability-check-responder.proxy';

describe('GraphReachabilityCheckResponder', () => {
  describe('a clean graph', () => {
    it('VALID: {no violations} => returns { success: true }', () => {
      const proxy = GraphReachabilityCheckResponderProxy();
      proxy.setupClean();

      const result = GraphReachabilityCheckResponder();

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('a bad graph', () => {
    it('ERROR: {one violation} => throws with that exact message, verbatim', () => {
      const proxy = GraphReachabilityCheckResponderProxy();
      const message = "Step 'orphan' in the 'test' graph is reached by no route from 'plan'.";
      proxy.setupViolation({ message });

      expect(() => GraphReachabilityCheckResponder()).toThrow(new Error(message));
    });
  });
});
