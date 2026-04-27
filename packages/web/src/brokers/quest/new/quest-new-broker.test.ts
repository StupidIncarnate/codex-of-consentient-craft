import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { questNewBroker } from './quest-new-broker';
import { questNewBrokerProxy } from './quest-new-broker.proxy';

describe('questNewBroker', () => {
  describe('successful new quest', () => {
    it('VALID: {guildId, message} => returns questId and chatProcessId', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub();
      const message = UserInputStub({ value: 'Add auth' });
      const questId = QuestIdStub({ value: 'quest-new-1' });
      const chatProcessId = ProcessIdStub({ value: 'proc-new-1' });

      proxy.setupNew({ questId, chatProcessId });

      const result = await questNewBroker({ guildId, message });

      expect(result).toStrictEqual({
        questId: 'quest-new-1',
        chatProcessId: 'proc-new-1',
      });
    });
  });

  describe('response parsing', () => {
    it('INVALID: {questId: empty string} => throws parse error', async () => {
      const proxy = questNewBrokerProxy();
      proxy.setupInvalidResponse({
        questId: '',
        chatProcessId: ProcessIdStub({ value: 'proc-1' }),
      });

      await expect(
        questNewBroker({
          guildId: GuildIdStub(),
          message: UserInputStub({ value: 'Hi' }),
        }),
      ).rejects.toThrow(/at least 1 character/u);
    });

    it('INVALID: {chatProcessId: number} => throws parse error', async () => {
      const proxy = questNewBrokerProxy();
      proxy.setupInvalidResponse({
        questId: QuestIdStub({ value: 'quest-1' }),
        chatProcessId: 42,
      });

      await expect(
        questNewBroker({
          guildId: GuildIdStub(),
          message: UserInputStub({ value: 'Hi' }),
        }),
      ).rejects.toThrow(/Expected string/u);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => throws network error', async () => {
      const proxy = questNewBrokerProxy();
      proxy.setupError();

      await expect(
        questNewBroker({
          guildId: GuildIdStub(),
          message: UserInputStub({ value: 'Hi' }),
        }),
      ).rejects.toThrow(/fetch/iu);
    });
  });
});
