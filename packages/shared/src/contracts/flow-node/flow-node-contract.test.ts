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
        packages: ['auth-service'],
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
        packages: ['auth-service'],
      });

      expect(result.observables).toStrictEqual([]);
    });
  });

  describe('package tags', () => {
    it('VALID: {packages: one name} => parses a node whose landing site is a single package', () => {
      const node = FlowNodeStub({ packages: ['gateway'] });

      expect(node.packages).toStrictEqual(['gateway']);
    });

    it('VALID: {packages: two names} => parses a seam node, which is what a glue node looks like', () => {
      const node = FlowNodeStub({ packages: ['auth-service', 'gateway'] });

      expect(node).toStrictEqual({
        id: 'login-page',
        label: 'Login Page',
        type: 'state',
        packages: ['auth-service', 'gateway'],
        observables: [],
      });
    });

    it('VALID: {type: decision, no observables} => still carries a tag, because a branch unit has no observable to route by', () => {
      const node = FlowNodeStub({ type: 'decision', packages: ['gateway'], observables: [] });

      expect(node).toStrictEqual({
        id: 'login-page',
        label: 'Login Page',
        type: 'decision',
        packages: ['gateway'],
        observables: [],
      });
    });

    it('INVALID: {packages omitted} => throws Required, an untagged node has no landing site', () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'start',
          label: 'Start',
          type: 'state',
        });
      }).toThrow(/Required/u);
    });

    it('EMPTY: {packages: []} => throws, the field is min(1) rather than a defaulted empty array', () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'start',
          label: 'Start',
          type: 'state',
          packages: [],
        });
      }).toThrow(/Array must contain at least 1 element/u);
    });

    it('EMPTY: {packages: [""]} => throws validation error', () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'start',
          label: 'Start',
          type: 'state',
          packages: [''],
        });
      }).toThrow(/too_small/u);
    });
  });

  describe('invalid flow nodes', () => {
    it('INVALID: {id: "Bad-Id"} => throws validation error', () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'Bad-Id',
          label: 'Bad Node',
          type: 'state',
          packages: ['auth-service'],
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {label: ""} => throws validation error', () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'start',
          label: '',
          type: 'state',
          packages: ['auth-service'],
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {type: "invalid"} => throws validation error', () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'start',
          label: 'Start',
          type: 'invalid',
          packages: ['auth-service'],
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => {
        flowNodeContract.parse({});
      }).toThrow(/Required/u);
    });
  });

  // THE SHAPE THAT COST TWO SIGN-OFFS. A session nested an `edges` array inside the node object —
  // `edges` is a sibling of `nodes` on the FLOW, one level up — and used each edge's LABEL where
  // its id belongs. Without `.strict()` zod drops the unknown key, `modify-quest` answers
  // `{"success": true}`, and the session reports units it never wrote. The refusal has to name the
  // key, because that is the whole of what tells the caller where the array actually goes.
  describe('unknown keys', () => {
    it("INVALID: {node carrying a nested edges array} => throws naming 'edges', instead of dropping it and reporting success", () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'clipboard-has-image',
          label: 'Clipboard has image',
          type: 'decision',
          packages: ['auth-service'],
          observables: [],
          edges: [
            {
              id: 'no image',
            },
          ],
        });
      }).toThrow(/Unrecognized key\(s\) in object: 'edges'/u);
    });

    it('INVALID: {node carrying an unrecognized field} => throws naming the unrecognized key, so extra keys are not silently dropped', () => {
      expect(() => {
        flowNodeContract.parse({
          id: 'clipboard-has-image',
          label: 'Clipboard has image',
          type: 'decision',
          packages: ['auth-service'],
          extraField: 'unexpected',
        });
      }).toThrow(/Unrecognized key\(s\) in object: 'extraField'/u);
    });
  });
});
