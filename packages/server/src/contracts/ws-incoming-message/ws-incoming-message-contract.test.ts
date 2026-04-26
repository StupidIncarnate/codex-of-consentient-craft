import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { wsIncomingMessageContract } from './ws-incoming-message-contract';
import {
  WsReplayHistoryMessageStub,
  WsWardDetailRequestMessageStub,
} from './ws-incoming-message.stub';

describe('wsIncomingMessageContract', () => {
  describe('valid inputs', () => {
    it('VALID: replay-history shape => parses successfully', () => {
      const result = WsReplayHistoryMessageStub();

      expect(result.type).toBe('replay-history');
    });

    it('VALID: ward-detail-request shape => parses successfully', () => {
      const result = WsWardDetailRequestMessageStub();

      expect(result.type).toBe('ward-detail-request');
    });

    it('VALID: quest-by-session-request shape => parses successfully', () => {
      const result = wsIncomingMessageContract.parse({
        type: 'quest-by-session-request',
        sessionId: 'sess-1',
        guildId: GuildIdStub(),
      });

      expect(result.type).toBe('quest-by-session-request');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: replay-history without sessionId => throws validation error', () => {
      expect(() => {
        wsIncomingMessageContract.parse({
          type: 'replay-history',
          guildId: GuildIdStub(),
          chatProcessId: 'proc-1',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: ward-detail-request without questId => throws validation error', () => {
      expect(() => {
        wsIncomingMessageContract.parse({
          type: 'ward-detail-request',
          wardResultId: 'ward-result-1',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: bogus type => throws validation error', () => {
      expect(() => {
        wsIncomingMessageContract.parse({
          type: 'bogus-type',
          questId: QuestIdStub(),
        });
      }).toThrow(/Invalid discriminator/u);
    });
  });
});
