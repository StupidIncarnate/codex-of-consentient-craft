import { flowObservableContract } from './flow-observable-contract';
import { FlowObservableStub } from './flow-observable.stub';

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

  describe('human verification', () => {
    it('VALID: {verifyByHuman: true} => carried through, so a reader can tell no automated check settles this one', () => {
      const observable = FlowObservableStub({ type: 'custom', verifyByHuman: true });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'custom',
        description: 'redirects to dashboard',
        package: 'auth-service',
        verifyByHuman: true,
        addedBy: 'spec',
      });
    });

    it('VALID: {verifyByHuman: false} => carried through as an explicit false', () => {
      const observable = FlowObservableStub({ type: 'custom', verifyByHuman: false });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'custom',
        description: 'redirects to dashboard',
        package: 'auth-service',
        verifyByHuman: false,
        addedBy: 'spec',
      });
    });

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

    it('INVALID: {verifyByHuman: "yes"} => throws, because the flag is a boolean and a truthy string would silently pass', () => {
      expect(() => FlowObservableStub({ verifyByHuman: 'yes' as never })).toThrow(
        /Expected boolean/u,
      );
    });

    it('INVALID: {verifyByHuman: null} => throws, because the field is optional, not nullable', () => {
      expect(() => FlowObservableStub({ verifyByHuman: null as never })).toThrow(
        /Expected boolean/u,
      );
    });

    it('VALID: {verifyByReading: true, verifyByHuman: true} => both parse together, because the two axes are independent', () => {
      const observable = FlowObservableStub({
        type: 'custom',
        verifyByReading: true,
        verifyByHuman: true,
      });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'custom',
        description: 'redirects to dashboard',
        package: 'auth-service',
        verifyByReading: true,
        verifyByHuman: true,
        addedBy: 'spec',
      });
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
