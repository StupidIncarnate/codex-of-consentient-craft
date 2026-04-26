import { sessionIdParamsContract } from './session-id-params-contract';
import { SessionIdParamsStub } from './session-id-params.stub';

describe('sessionIdParamsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {sessionId: "abc"} => parses successfully', () => {
      const result = SessionIdParamsStub({ sessionId: 'abc' });

      expect(result.sessionId).toBe('abc');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing sessionId} => throws validation error', () => {
      expect(() => {
        sessionIdParamsContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
