import { sessionIdParamsContract } from './session-id-params-contract';
import { SessionIdParamsStub } from './session-id-params.stub';

describe('sessionIdParamsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {sessionId: "9c4d8f1c-3e38-48c9-bdec-22b61883b473"} => parses successfully', () => {
      const result = SessionIdParamsStub();

      expect(result.sessionId).toBe('9c4d8f1c-3e38-48c9-bdec-22b61883b473');
    });

    it('VALID: parsing valid params returns typed result', () => {
      const result = sessionIdParamsContract.parse({ sessionId: 'my-session-id' });

      expect(result.sessionId).toBe('my-session-id');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {sessionId: ""} => throws validation error', () => {
      expect(() => {
        sessionIdParamsContract.parse({ sessionId: '' });
      }).toThrow(/at least 1/u);
    });

    it('INVALID: {missing sessionId} => throws validation error', () => {
      expect(() => {
        sessionIdParamsContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
