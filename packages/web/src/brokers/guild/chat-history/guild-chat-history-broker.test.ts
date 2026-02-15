import { GuildIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import {
  AssistantTextChatEntryStub,
  UserChatEntryStub,
} from '../../../contracts/chat-entry/chat-entry.stub';
import { guildChatHistoryBroker } from './guild-chat-history-broker';
import { guildChatHistoryBrokerProxy } from './guild-chat-history-broker.proxy';

describe('guildChatHistoryBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {guildId, sessionId} => returns entries array', async () => {
      const proxy = guildChatHistoryBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const userEntry = UserChatEntryStub({ content: 'Set up CI' });
      const assistantEntry = AssistantTextChatEntryStub({
        content: 'I will configure the CI pipeline',
      });
      const entries = [userEntry, assistantEntry];

      proxy.setupHistory({ entries });

      const result = await guildChatHistoryBroker({ guildId, sessionId });

      expect(result).toStrictEqual([userEntry, assistantEntry]);
    });

    it('EMPTY: {guildId, sessionId} => returns empty array when no history', async () => {
      const proxy = guildChatHistoryBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-xyz' });
      const entries: unknown[] = [];

      proxy.setupHistory({ entries });

      const result = await guildChatHistoryBroker({ guildId, sessionId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = guildChatHistoryBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-abc' });

      proxy.setupError();

      await expect(guildChatHistoryBroker({ guildId, sessionId })).rejects.toThrow(/fetch/iu);
    });
  });
});
