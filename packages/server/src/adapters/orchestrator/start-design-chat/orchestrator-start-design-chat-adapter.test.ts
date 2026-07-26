import { GuildIdStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { orchestratorStartDesignChatAdapter } from './orchestrator-start-design-chat-adapter';
import { orchestratorStartDesignChatAdapterProxy } from './orchestrator-start-design-chat-adapter.proxy';

describe('orchestratorStartDesignChatAdapter', () => {
  describe('successful call', () => {
    it('VALID: {questId, guildId, message} => returns chatProcessId', async () => {
      const proxy = orchestratorStartDesignChatAdapterProxy();
      const questId = QuestIdStub();
      const chatProcessId = ProcessIdStub();
      proxy.returns({ questId, chatProcessId });

      const result = await orchestratorStartDesignChatAdapter({
        questId,
        guildId: GuildIdStub(),
        message: 'Update the button color',
      });

      expect(result).toStrictEqual({ chatProcessId });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorStartDesignChatAdapterProxy();
      const questId = QuestIdStub();
      proxy.throws({ questId, error: new Error('Design chat failed') });

      await expect(
        orchestratorStartDesignChatAdapter({
          questId,
          guildId: GuildIdStub(),
          message: 'Update the button color',
        }),
      ).rejects.toThrow(/Design chat failed/u);
    });
  });
});
