import { replayHistoryMessageContract } from './replay-history-message-contract';
import { ReplayHistoryMessageStub } from './replay-history-message.stub';

describe('replayHistoryMessageContract', () => {
  describe('valid messages', () => {
    it('VALID: {full replay-history message} => parses successfully', () => {
      const message = ReplayHistoryMessageStub();

      const result = replayHistoryMessageContract.parse(message);

      expect(result).toStrictEqual({
        type: 'replay-history',
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        chatProcessId: 'proc-12345',
      });
    });
  });

  describe('invalid messages', () => {
    it('INVALID: {wrong type} => throws validation error', () => {
      expect(() => {
        replayHistoryMessageContract.parse({
          type: 'other',
          sessionId: 'sess-1',
          guildId: 'guild-1',
          chatProcessId: 'proc-1',
        });
      }).toThrow(/invalid_literal/u);
    });
  });
});
