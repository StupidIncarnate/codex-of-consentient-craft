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
      });
    });

    it('VALID: {with designRef} => parses with design reference', () => {
      const observable = FlowObservableStub({
        designRef: 'DD-001: Use JWT tokens',
      });

      expect(observable.designRef).toBe('DD-001: Use JWT tokens');
    });

    it('VALID: {with verificationStatus} => parses with verification fields', () => {
      const observable = FlowObservableStub({
        verificationStatus: 'verified',
        verifiedAt: '2024-01-15T10:00:00.000Z',
        verificationNotes: 'Verified via integration test',
      });

      expect(observable).toStrictEqual({
        id: 'login-redirects-to-dashboard',
        type: 'ui-state',
        description: 'redirects to dashboard',
        verificationStatus: 'verified',
        verifiedAt: '2024-01-15T10:00:00.000Z',
        verificationNotes: 'Verified via integration test',
      });
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
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {type: "invalid"} => throws validation error', () => {
      expect(() => {
        flowObservableContract.parse({
          id: 'valid-id',
          type: 'invalid',
          description: 'test',
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
