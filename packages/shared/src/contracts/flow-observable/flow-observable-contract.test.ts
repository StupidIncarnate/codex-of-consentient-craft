import { flowObservableContract } from './flow-observable-contract';
import { FlowObservableStub } from './flow-observable.stub';
import { SignoffStub } from '../signoff/signoff.stub';

describe('flowObservableContract', () => {
  describe('valid flow observables', () => {
    it('VALID: {all required fields} => parses successfully', () => {
      const observable = FlowObservableStub();

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'ui-state',
        description: 'redirects to dashboard',
        package: 'auth-service',
        addedBy: 'spec',
      });
    });

    it('VALID: {with designRef} => parses with design reference', () => {
      const observable = FlowObservableStub({
        designRef: 'DD-001: Use JWT tokens',
      });

      expect(observable.designRef).toBe('DD-001: Use JWT tokens');
    });

    it('VALID: {api-call type} => parses different outcome type', () => {
      const observable = FlowObservableStub({
        type: 'api-call',
        description: 'sends auth token to server',
      });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'api-call',
        description: 'sends auth token to server',
        package: 'auth-service',
        addedBy: 'spec',
      });
    });
  });

  describe('package attribution', () => {
    it('VALID: {package: the other side of a seam} => round-trips the explicit side rather than the node default', () => {
      const observable = FlowObservableStub({ package: 'gateway' });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'ui-state',
        description: 'redirects to dashboard',
        package: 'gateway',
        addedBy: 'spec',
      });
    });

    it('INVALID: {package omitted} => throws Required on the persisted shape, where the modify-quest input accepts the absence', () => {
      expect(() => {
        flowObservableContract.parse({
          id: 'login-redirects-to-dashboard',
          type: 'ui-state',
          description: 'redirects to dashboard',
        });
      }).toThrow(/Required/u);
    });

    it('EMPTY: {package: ""} => throws validation error', () => {
      expect(() => {
        flowObservableContract.parse({
          id: 'login-redirects-to-dashboard',
          type: 'ui-state',
          description: 'redirects to dashboard',
          package: '',
        });
      }).toThrow(/too_small/u);
    });
  });

  describe('verification method', () => {
    it('VALID: {verifyByReading: true} => carried through, so a reader can tell no test settles this one', () => {
      const observable = FlowObservableStub({ type: 'custom', verifyByReading: true });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'custom',
        description: 'redirects to dashboard',
        package: 'auth-service',
        verifyByReading: true,
        addedBy: 'spec',
      });
    });

    // `.optional()` rather than `.default(false)`: questModifyBroker re-parses the whole quest on
    // every write, so a default would materialise the key onto every observable in the file. A
    // strict-equal with no `verifyByReading` key is what fails if that regresses.
    it('VALID: {field omitted} => stays ABSENT rather than defaulting to false, so an ordinary observable costs nothing on disk', () => {
      const observable = FlowObservableStub({ type: 'custom' });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'custom',
        description: 'redirects to dashboard',
        package: 'auth-service',
        addedBy: 'spec',
      });
    });

    it('INVALID: {verifyByReading: "yes"} => throws, because the flag is a boolean and a truthy string would silently pass', () => {
      expect(() => FlowObservableStub({ verifyByReading: 'yes' as never })).toThrow(
        /Expected boolean/u,
      );
    });
  });

  describe('provenance', () => {
    it('VALID: {addedBy omitted} => defaults to spec, the origin of every observable present at approval', () => {
      const observable = flowObservableContract.parse({
        id: 'login-redirects-to-dashboard',
        type: 'ui-state',
        description: 'redirects to dashboard',
        package: 'auth-service',
      });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'ui-state',
        description: 'redirects to dashboard',
        package: 'auth-service',
        addedBy: 'spec',
      });
    });

    it('VALID: {addedBy: "siegemaster"} => round-trips the explicit origin instead of the default', () => {
      const observable = FlowObservableStub({ addedBy: 'siegemaster' });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'ui-state',
        description: 'redirects to dashboard',
        package: 'auth-service',
        addedBy: 'siegemaster',
      });
    });
  });

  describe('track sign-offs', () => {
    it('VALID: {flowriderSignoff only} => keeps the siegemaster field absent rather than nulled', () => {
      const observable = FlowObservableStub({ flowriderSignoff: SignoffStub() });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'ui-state',
        description: 'redirects to dashboard',
        package: 'auth-service',
        addedBy: 'spec',
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
      const observable = FlowObservableStub({
        flowriderSignoff: SignoffStub(),
        siegemasterSignoff: SignoffStub({
          evidence: 'the dashboard rendered 3 rows for a 3-row fixture on the running server',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          at: '2026-01-02T00:00:00.000Z',
        }),
      });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'ui-state',
        description: 'redirects to dashboard',
        package: 'auth-service',
        addedBy: 'spec',
        flowriderSignoff: {
          verdict: 'confirmed',
          evidence:
            'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          at: '2026-01-01T00:00:00.000Z',
        },
        siegemasterSignoff: {
          verdict: 'confirmed',
          evidence: 'the dashboard rendered 3 rows for a 3-row fixture on the running server',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          at: '2026-01-02T00:00:00.000Z',
        },
      });
    });
  });

  describe('invalid flow observables', () => {
    it('INVALID: {id: "Bad"} => throws validation error', () => {
      expect(() => {
        flowObservableContract.parse({
          id: 'Bad',
          type: 'ui-state',
          description: 'test',
          package: 'auth-service',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {type: "invalid"} => throws validation error', () => {
      expect(() => {
        flowObservableContract.parse({
          id: 'valid-id',
          type: 'invalid',
          description: 'test',
          package: 'auth-service',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {addedBy: "blightwarden"} => throws, because the origin list is closed to roles that add observables', () => {
      expect(() => {
        flowObservableContract.parse({
          id: 'valid-id',
          type: 'ui-state',
          description: 'test',
          package: 'auth-service',
          addedBy: 'blightwarden',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => {
        flowObservableContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
