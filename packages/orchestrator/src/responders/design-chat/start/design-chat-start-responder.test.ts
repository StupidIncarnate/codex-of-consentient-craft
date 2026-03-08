import { GuildIdStub, QuestIdStub, QuestStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { DesignChatStartResponderProxy } from './design-chat-start-responder.proxy';

describe('DesignChatStartResponder', () => {
  describe('valid design chat start', () => {
    it('VALID: {guildId + questId + message with explore_design quest} => returns chatProcessId', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });

      proxy.setupDesignSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const result = await proxy.callResponder({
        guildId,
        questId,
        message: 'Create login page prototype',
      });

      expect(result.chatProcessId).toMatch(/^design-/u);
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest not found} => throws quest not found error', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'nonexistent' });

      proxy.setupQuestNotFound();

      await expect(
        proxy.callResponder({ guildId, questId, message: 'Create prototype' }),
      ).rejects.toThrow(/Quest not found/u);
    });

    it('ERROR: {quest in wrong status} => throws design status error', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'created' });

      proxy.setupInvalidStatus({ quest });

      await expect(
        proxy.callResponder({ guildId, questId, message: 'Create prototype' }),
      ).rejects.toThrow(/Quest must be in a design status/u);
    });
  });
});
