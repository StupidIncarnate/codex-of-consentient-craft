import { flowObservableContract } from './flow-observable-contract';
import { FlowObservableStub } from './flow-observable.stub';

describe('flowObservableContract', () => {
  describe('valid flow observables', () => {
    it('VALID: {all required fields} => parses successfully', () => {
      const observable = FlowObservableStub();

      expect(observable).toStrictEqual({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        given: 'user is on the login page',
        when: 'user submits valid credentials',
        then: [
          {
            type: 'ui-state',
            description: 'redirects to dashboard',
          },
        ],
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

      expect(observable.verificationStatus).toBe('verified');
      expect(observable.verifiedAt).toBe('2024-01-15T10:00:00.000Z');
      expect(observable.verificationNotes).toBe('Verified via integration test');
    });

    it('VALID: {multiple then outcomes} => parses with multiple outcomes', () => {
      const observable = FlowObservableStub({
        then: [
          { type: 'ui-state', description: 'shows success message' },
          { type: 'api-call', description: 'sends auth token to server' },
        ],
      });

      expect(observable.then).toStrictEqual([
        { type: 'ui-state', description: 'shows success message' },
        { type: 'api-call', description: 'sends auth token to server' },
      ]);
    });
  });

  describe('invalid flow observables', () => {
    it('INVALID_ID: {id: "bad"} => throws validation error', () => {
      expect(() => {
        flowObservableContract.parse({
          id: 'bad',
          given: 'user is logged in',
          when: 'clicks button',
          then: [],
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_GIVEN: {given: ""} => throws validation error', () => {
      expect(() => {
        flowObservableContract.parse({
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          given: '',
          when: 'clicks button',
          then: [],
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_WHEN: {when: ""} => throws validation error', () => {
      expect(() => {
        flowObservableContract.parse({
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          given: 'user is logged in',
          when: '',
          then: [],
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_THEN_TYPE: {then: [{type: "invalid"}]} => throws validation error', () => {
      expect(() => {
        flowObservableContract.parse({
          id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          given: 'user is logged in',
          when: 'clicks button',
          then: [{ type: 'invalid', description: 'test' }],
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
