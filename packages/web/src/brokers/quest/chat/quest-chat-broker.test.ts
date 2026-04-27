import { ProcessIdStub, QuestIdStub, UserInputStub } from '@dungeonmaster/shared/contracts';

import { questChatBroker } from './quest-chat-broker';
import { questChatBrokerProxy } from './quest-chat-broker.proxy';

describe('questChatBroker', () => {
  describe('successful chat', () => {
    it('VALID: {questId, message} => returns chatProcessId', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-chat-1' });
      const message = UserInputStub({ value: 'Continue' });
      const chatProcessId = ProcessIdStub({ value: 'proc-chat-1' });

      proxy.setupChat({ chatProcessId });

      const result = await questChatBroker({ questId, message });

      expect(result).toStrictEqual({ chatProcessId: 'proc-chat-1' });
    });
  });

  describe('response parsing', () => {
    it('INVALID: {chatProcessId: empty string} => throws parse error', async () => {
      const proxy = questChatBrokerProxy();
      proxy.setupInvalidResponse({ chatProcessId: '' });

      await expect(
        questChatBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
          message: UserInputStub({ value: 'Hi' }),
        }),
      ).rejects.toThrow(/too_small/u);
    });

    it('INVALID: {chatProcessId: number} => throws parse error', async () => {
      const proxy = questChatBrokerProxy();
      proxy.setupInvalidResponse({ chatProcessId: 12345 });

      await expect(
        questChatBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
          message: UserInputStub({ value: 'Hi' }),
        }),
      ).rejects.toThrow(/Expected string/u);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws network error', async () => {
      const proxy = questChatBrokerProxy();
      proxy.setupError();

      await expect(
        questChatBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
          message: UserInputStub({ value: 'Hi' }),
        }),
      ).rejects.toThrow(/fetch/iu);
    });
  });
});
