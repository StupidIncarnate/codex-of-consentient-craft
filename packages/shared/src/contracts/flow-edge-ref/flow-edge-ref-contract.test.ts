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

    it('VALID: {value: "c23bd10b-58cc-4372-a567-0e02b2c3d479:start"} => parses cross-flow ref', () => {
      const ref = FlowEdgeRefStub({
        value: 'c23bd10b-58cc-4372-a567-0e02b2c3d479:start',
      });

      expect(ref).toBe('c23bd10b-58cc-4372-a567-0e02b2c3d479:start');
    });
  });

  describe('invalid refs', () => {
    it('INVALID_REF: {value: ""} => throws validation error', () => {
      expect(() => {
        flowEdgeRefContract.parse('');
      }).toThrow(/too_small/u);
    });
  });
});
