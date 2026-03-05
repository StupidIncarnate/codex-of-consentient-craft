import { flowEdgeContract } from './flow-edge-contract';
import { FlowEdgeStub } from './flow-edge.stub';

describe('flowEdgeContract', () => {
  describe('valid edges', () => {
    it('VALID: {from, to} => parses successfully', () => {
      const edge = FlowEdgeStub();

      expect(edge).toStrictEqual({
        from: 'login-page',
        to: 'dashboard',
      });
    });

    it('VALID: {with label} => parses with label', () => {
      const edge = FlowEdgeStub({ label: 'on success' });

      expect(edge).toStrictEqual({
        from: 'login-page',
        to: 'dashboard',
        label: 'on success',
      });
    });

    it('VALID: {cross-flow refs} => parses cross-flow edge', () => {
      const edge = FlowEdgeStub({
        from: 'c23bd10b-58cc-4372-a567-0e02b2c3d479:end',
        to: 'd34ce21c-69dd-5483-b678-1f13c3d4e590:start',
      });

      expect(edge.from).toBe('c23bd10b-58cc-4372-a567-0e02b2c3d479:end');
      expect(edge.to).toBe('d34ce21c-69dd-5483-b678-1f13c3d4e590:start');
    });
  });

  describe('invalid edges', () => {
    it('INVALID_FROM: {from: ""} => throws validation error', () => {
      expect(() => {
        flowEdgeContract.parse({
          from: '',
          to: 'dashboard',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_TO: {to: ""} => throws validation error', () => {
      expect(() => {
        flowEdgeContract.parse({
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
