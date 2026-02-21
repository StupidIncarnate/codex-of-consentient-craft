import { GuildIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import {
  AssistantTextChatEntryStub,
  UserChatEntryStub,
} from '../../../contracts/chat-entry/chat-entry.stub';
import { sessionChatHistoryBroker } from './session-chat-history-broker';
import { sessionChatHistoryBrokerProxy } from './session-chat-history-broker.proxy';

describe('sessionChatHistoryBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {sessionId, guildId} => returns entries array', async () => {
      const proxy = sessionChatHistoryBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const userEntry = UserChatEntryStub({ content: 'Add logging' });
      const assistantEntry = AssistantTextChatEntryStub({
        content: 'I will add logging to the auth flow',
      });
      const entries = [userEntry, assistantEntry];

      proxy.setupHistory({ entries });

      const result = await sessionChatHistoryBroker({ sessionId, guildId });

      expect(result).toStrictEqual([userEntry, assistantEntry]);
    });

    it('EMPTY: {sessionId, guildId} => returns empty array when no history', async () => {
      const proxy = sessionChatHistoryBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-xyz' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const entries: unknown[] = [];

      proxy.setupHistory({ entries });

      const result = await sessionChatHistoryBroker({ sessionId, guildId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = sessionChatHistoryBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupError();

      await expect(sessionChatHistoryBroker({ sessionId, guildId })).rejects.toThrow(/fetch/iu);
    });
  });
});
