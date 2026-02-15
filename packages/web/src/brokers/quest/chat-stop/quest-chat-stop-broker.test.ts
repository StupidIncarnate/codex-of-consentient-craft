import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questChatStopBroker } from './quest-chat-stop-broker';
import { questChatStopBrokerProxy } from './quest-chat-stop-broker.proxy';

describe('questChatStopBroker', () => {
  describe('successful stop', () => {
    it('VALID: {questId, chatProcessId} => returns stopped true', async () => {
      const proxy = questChatStopBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-1' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });

      proxy.setupStop();

      const result = await questChatStopBroker({ questId, chatProcessId });

      expect(result).toStrictEqual({ stopped: true });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = questChatStopBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-1' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });

      proxy.setupError();

      await expect(questChatStopBroker({ questId, chatProcessId })).rejects.toThrow(/fetch/iu);
    });
  });
});
