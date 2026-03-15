import { activeSessionResultContract } from './active-session-result-contract';
import { ActiveSessionResultStub } from './active-session-result.stub';

describe('activeSessionResultContract', () => {
  describe('valid results', () => {
    it('VALID: {both undefined} => parses successfully', () => {
      const result = ActiveSessionResultStub();

      expect(result).toStrictEqual({});
    });

    it('VALID: {sessionId, role} => parses successfully', () => {
      const result = activeSessionResultContract.parse({
        sessionId: 'session-abc',
        role: 'chaoswhisperer',
      });

      expect(result).toStrictEqual({
        sessionId: 'session-abc',
        role: 'chaoswhisperer',
      });
    });
  });
});
