import { flowEdgeRefContract } from './flow-edge-ref-contract';
import { FlowEdgeRefStub } from './flow-edge-ref.stub';

describe('flowEdgeRefContract', () => {
  describe('valid refs', () => {
    it('VALID: {value: "login-page"} => parses local node ref', () => {
      const ref = FlowEdgeRefStub({ value: 'login-page' });

      expect(ref).toBe('login-page');
    });

    it('VALID: {default value} => uses default ref', () => {
      const ref = FlowEdgeRefStub();

      expect(ref).toBe('login-page');
    });

    it('VALID: {value: "login-flow:start"} => parses cross-flow ref', () => {
      const ref = FlowEdgeRefStub({
        value: 'login-flow:start',
      });

      expect(ref).toBe('login-flow:start');
    });
  });

  describe('invalid refs', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        flowEdgeRefContract.parse('');
      }).toThrow(/too_small/u);
    });
  });
});
