import { flowNodeContract } from './flow-node-contract';
import { FlowObservableStub } from '../flow-observable/flow-observable.stub';
import { FlowNodeStub } from './flow-node.stub';
import { SignoffStub } from '../signoff/signoff.stub';

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

  describe('track sign-offs', () => {
    it('VALID: {flowriderSignoff only} => keeps the siegemaster field absent rather than nulled', () => {
      const node = FlowNodeStub({ flowriderSignoff: SignoffStub() });

      expect(node).toStrictEqual({
        id: 'login-page',
        label: 'Login Page',
        type: 'state',
        packages: ['auth-service'],
        observables: [],
        flowriderSignoff: {
          verdict: 'confirmed',
          evidence:
            'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          at: '2026-01-01T00:00:00.000Z',
        },
      });
    });

    it('VALID: {both sign-offs present} => parses each track onto its own top-level field', () => {
      const node = FlowNodeStub({
        flowriderSignoff: SignoffStub(),
        siegemasterSignoff: SignoffStub({
          evidence: 'the login page painted the form on the running server',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          at: '2026-01-02T00:00:00.000Z',
        }),
      });

      expect(node).toStrictEqual({
        id: 'login-page',
        label: 'Login Page',
        type: 'state',
        packages: ['auth-service'],
        observables: [],
        flowriderSignoff: {
          verdict: 'confirmed',
          evidence:
            'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          at: '2026-01-01T00:00:00.000Z',
        },
        siegemasterSignoff: {
          verdict: 'confirmed',
          evidence: 'the login page painted the form on the running server',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          at: '2026-01-02T00:00:00.000Z',
        },
      });
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
});
