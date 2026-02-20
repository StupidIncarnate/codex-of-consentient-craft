import { sessionResolveResponseContract } from './session-resolve-response-contract';
import { SessionResolveResponseStub } from './session-resolve-response.stub';

describe('sessionResolveResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {questId} => parses successfully', () => {
      const response = SessionResolveResponseStub();

      const result = sessionResolveResponseContract.parse(response);

      expect(result).toStrictEqual({
        questId: 'add-auth',
      });
    });

    it('VALID: {null questId} => parses successfully', () => {
      const response = SessionResolveResponseStub({ questId: null });

      const result = sessionResolveResponseContract.parse(response);

      expect(result).toStrictEqual({
        questId: null,
      });
    });

    it('VALID: {custom questId} => parses with override', () => {
      const response = SessionResolveResponseStub({ questId: 'feature-123' as never });

      const result = sessionResolveResponseContract.parse(response);

      expect(result).toStrictEqual({
        questId: 'feature-123',
      });
    });
  });

  describe('invalid responses', () => {
    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => {
        sessionResolveResponseContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {empty questId string} => throws validation error', () => {
      expect(() => {
        sessionResolveResponseContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
    });
  });
});
