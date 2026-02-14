import { QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import {
  AssistantTextChatEntryStub,
  UserChatEntryStub,
} from '../../../contracts/chat-entry/chat-entry.stub';
import { questChatHistoryBroker } from './quest-chat-history-broker';
import { questChatHistoryBrokerProxy } from './quest-chat-history-broker.proxy';

describe('questChatHistoryBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {questId, sessionId} => returns entries array', async () => {
      const proxy = questChatHistoryBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const userEntry = UserChatEntryStub({ content: 'Add logging' });
      const assistantEntry = AssistantTextChatEntryStub({
        content: 'I will add logging to the auth flow',
      });
      const entries = [userEntry, assistantEntry];

      proxy.setupHistory({ entries });

      const result = await questChatHistoryBroker({ questId, sessionId });

      expect(result).toStrictEqual([userEntry, assistantEntry]);
    });

    it('EMPTY: {questId, sessionId} => returns empty array when no history', async () => {
      const proxy = questChatHistoryBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const sessionId = SessionIdStub({ value: 'session-xyz' });
      const entries: unknown[] = [];

      proxy.setupHistory({ entries });

      const result = await questChatHistoryBroker({ questId, sessionId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = questChatHistoryBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const sessionId = SessionIdStub({ value: 'session-abc' });

      proxy.setupError();

      await expect(questChatHistoryBroker({ questId, sessionId })).rejects.toThrow(/fetch/iu);
    });
  });
});
