import {
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { questChatBroker } from './quest-chat-broker';
import { questChatBrokerProxy } from './quest-chat-broker.proxy';

describe('questChatBroker', () => {
  describe('successful chat', () => {
    it('VALID: {questId, message} => returns chatProcessId', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'Add logging to the auth flow' });
      const processId = ProcessIdStub({ value: 'chat-proc-123' });

      proxy.setupChat({ chatProcessId: processId });

      const result = await questChatBroker({ questId, message });

      expect(result).toStrictEqual({ chatProcessId: processId });
    });

    it('VALID: {questId, message, sessionId} => returns chatProcessId', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'Continue from last message' });
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const processId = ProcessIdStub({ value: 'chat-proc-456' });

      proxy.setupChat({ chatProcessId: processId });

      const result = await questChatBroker({ questId, message, sessionId });

      expect(result).toStrictEqual({ chatProcessId: processId });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'Add logging' });

      proxy.setupError();

      await expect(questChatBroker({ questId, message })).rejects.toThrow(/fetch/iu);
    });
  });
});
