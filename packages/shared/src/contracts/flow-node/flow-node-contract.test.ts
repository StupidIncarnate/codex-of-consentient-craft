import { flowNodeContract } from './flow-node-contract';
import { FlowObservableStub } from '../flow-observable/flow-observable.stub';
import { FlowNodeStub } from './flow-node.stub';

describe('flowNodeContract', () => {
  describe('valid flow nodes', () => {
    it('VALID: {all fields with defaults} => parses successfully', () => {
      const node = FlowNodeStub();

      expect(node).toStrictEqual({
        id: 'login-page',
        label: 'Login Page',
        type: 'state',
        observables: [],
      });
    });

    it('VALID: {with observables} => parses with observables array', () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });

      expect(node.observables).toStrictEqual([observable]);
    });

    it('VALID: {type: decision} => parses decision type', () => {
      const node = FlowNodeStub({ type: 'decision' });

      expect(node.type).toBe('decision');
    });

    it('VALID: {type: action} => parses action type', () => {
      const node = FlowNodeStub({ type: 'action' });

      expect(node.type).toBe('action');
    });

    it('VALID: {type: terminal} => parses terminal type', () => {
      const node = FlowNodeStub({ type: 'terminal' });

      expect(node.type).toBe('terminal');
    });

    it('VALID: {without observables field} => backward compat defaults to empty array', () => {
      const result = flowNodeContract.parse({
        id: 'start',
        label: 'Start',
        type: 'state',
      });

      expect(result.observables).toStrictEqual([]);
    });
  });

  describe('invalid flow nodes', () => {
    it('INVALID_ID: {id: "Bad-Id"} => throws validation error', () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'Bad-Id',
          label: 'Bad Node',
          type: 'state',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID_LABEL: {label: ""} => throws validation error', () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'start',
          label: '',
          type: 'state',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_TYPE: {type: "invalid"} => throws validation error', () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'start',
          label: 'Start',
          type: 'invalid',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => {
        flowNodeContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
