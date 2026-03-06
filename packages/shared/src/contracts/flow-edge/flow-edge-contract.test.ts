import { flowEdgeContract } from './flow-edge-contract';
import { FlowEdgeStub } from './flow-edge.stub';

describe('flowEdgeContract', () => {
  describe('valid edges', () => {
    it('VALID: {id, from, to} => parses successfully', () => {
      const edge = FlowEdgeStub();

      expect(edge).toStrictEqual({
        id: 'login-to-dashboard',
        from: 'login-page',
        to: 'dashboard',
      });
    });

    it('VALID: {with label} => parses with label', () => {
      const edge = FlowEdgeStub({ label: 'on success' });

      expect(edge).toStrictEqual({
        id: 'login-to-dashboard',
        from: 'login-page',
        to: 'dashboard',
        label: 'on success',
      });
    });

    it('VALID: {cross-flow refs} => parses cross-flow edge', () => {
      const edge = FlowEdgeStub({
        id: 'cross-flow-edge',
        from: 'login-flow:end',
        to: 'dashboard-flow:start',
      });

      expect(edge.from).toBe('login-flow:end');
      expect(edge.to).toBe('dashboard-flow:start');
    });
  });

  describe('invalid edges', () => {
    it('INVALID_FROM: {from: ""} => throws validation error', () => {
      expect(() => {
        flowEdgeContract.parse({
          id: 'test-edge',
          from: '',
          to: 'dashboard',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_TO: {to: ""} => throws validation error', () => {
      expect(() => {
        flowEdgeContract.parse({
          id: 'test-edge',
          from: 'login-page',
          to: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => {
        flowEdgeContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
